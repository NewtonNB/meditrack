<?php

namespace App\Services\Inventory;

use App\Models\Batch;
use App\Models\Medicine;
use App\Models\StockLevel;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BatchTrackingService
{
    /**
     * Create a new batch
     */
    public function createBatch($data)
    {
        DB::beginTransaction();
        
        try {
            $batch = Batch::create([
                'medicine_id' => $data['medicine_id'],
                'batch_number' => $data['batch_number'],
                'lot_number' => $data['lot_number'] ?? null,
                'expiry_date' => $data['expiry_date'],
                'manufacture_date' => $data['manufacture_date'] ?? null,
                'supplier_id' => $data['supplier_id'],
                'purchase_price' => $data['purchase_price'],
                'selling_price' => $data['selling_price'],
                'quantity_received' => $data['quantity_received'],
                'quantity_remaining' => $data['quantity_received'],
                'status' => 'active',
                'notes' => $data['notes'] ?? null
            ]);

            // Create initial stock level entry if warehouse is specified
            if (isset($data['warehouse_id'])) {
                StockLevel::create([
                    'medicine_id' => $data['medicine_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'batch_id' => $batch->id,
                    'quantity' => $data['quantity_received'],
                    'reserved_quantity' => 0,
                    'unit_type' => $data['unit_type'] ?? 'tablet',
                    'last_updated' => now(),
                    'audit_status' => 'pending'
                ]);

                // Record stock movement
                StockMovement::create([
                    'medicine_id' => $data['medicine_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'batch_id' => $batch->id,
                    'movement_type' => 'in',
                    'quantity' => $data['quantity_received'],
                    'unit_type' => $data['unit_type'] ?? 'tablet',
                    'reference_type' => 'batch_creation',
                    'reference_id' => $batch->id,
                    'notes' => "New batch received: {$data['batch_number']}",
                    'created_by' => auth()->id()
                ]);
            }

            DB::commit();
            
            Log::info("Batch created: {$batch->batch_number} for medicine {$data['medicine_id']}");
            
            return $batch;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to create batch: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get batches for a medicine using FIFO/FEFO
     */
    public function getBatchesForSale($medicineId, $warehouseId, $quantity, $method = 'FEFO')
    {
        $query = Batch::where('medicine_id', $medicineId)
                     ->where('status', 'active')
                     ->where('quantity_remaining', '>', 0)
                     ->whereHas('stockLevels', function ($q) use ($warehouseId) {
                         $q->where('warehouse_id', $warehouseId)
                           ->where('quantity', '>', 0);
                     });

        // Apply sorting based on method
        if ($method === 'FEFO') {
            // First Expired, First Out
            $query->orderBy('expiry_date', 'asc');
        } else {
            // FIFO - First In, First Out
            $query->orderBy('created_at', 'asc');
        }

        $batches = $query->get();
        $selectedBatches = [];
        $remainingQuantity = $quantity;

        foreach ($batches as $batch) {
            if ($remainingQuantity <= 0) break;

            $availableQuantity = min($batch->quantity_remaining, $remainingQuantity);
            
            if ($availableQuantity > 0) {
                $selectedBatches[] = [
                    'batch' => $batch,
                    'quantity' => $availableQuantity
                ];
                
                $remainingQuantity -= $availableQuantity;
            }
        }

        return [
            'batches' => $selectedBatches,
            'total_available' => $quantity - $remainingQuantity,
            'shortage' => $remainingQuantity > 0 ? $remainingQuantity : 0
        ];
    }

    /**
     * Process batch consumption for sales
     */
    public function consumeBatches($medicineId, $warehouseId, $quantity, $options = [])
    {
        DB::beginTransaction();
        
        try {
            $method = $options['method'] ?? 'FEFO';
            $referenceType = $options['reference_type'] ?? 'sale';
            $referenceId = $options['reference_id'] ?? null;

            $batchSelection = $this->getBatchesForSale($medicineId, $warehouseId, $quantity, $method);
            
            if ($batchSelection['shortage'] > 0) {
                throw new \Exception("Insufficient stock. Available: {$batchSelection['total_available']}, Required: {$quantity}");
            }

            $consumedBatches = [];

            foreach ($batchSelection['batches'] as $batchInfo) {
                $batch = $batchInfo['batch'];
                $consumeQuantity = $batchInfo['quantity'];

                // Update batch quantity
                $batch->updateQuantity($consumeQuantity, 'subtract');

                // Update stock level
                $stockLevel = StockLevel::where('medicine_id', $medicineId)
                                      ->where('warehouse_id', $warehouseId)
                                      ->where('batch_id', $batch->id)
                                      ->first();

                if ($stockLevel) {
                    $stockLevel->updateQuantity($consumeQuantity, 'subtract');
                }

                // Record movement
                StockMovement::create([
                    'medicine_id' => $medicineId,
                    'warehouse_id' => $warehouseId,
                    'batch_id' => $batch->id,
                    'movement_type' => 'out',
                    'quantity' => $consumeQuantity,
                    'unit_type' => $options['unit_type'] ?? 'tablet',
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'notes' => "Batch consumption: {$batch->batch_number}",
                    'created_by' => auth()->id()
                ]);

                $consumedBatches[] = [
                    'batch_id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'quantity' => $consumeQuantity,
                    'expiry_date' => $batch->expiry_date,
                    'cost_price' => $batch->purchase_price
                ];
            }

            DB::commit();
            
            Log::info("Batches consumed for medicine {$medicineId}: " . json_encode($consumedBatches));
            
            return $consumedBatches;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to consume batches: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get expiring batches
     */
    public function getExpiringBatches($days = 30, $warehouseId = null)
    {
        $query = Batch::expiring($days)
                     ->with(['medicine', 'supplier'])
                     ->whereHas('stockLevels', function ($q) use ($warehouseId) {
                         $q->where('quantity', '>', 0);
                         if ($warehouseId) {
                             $q->where('warehouse_id', $warehouseId);
                         }
                     });

        return $query->get()->map(function ($batch) {
            $totalStock = $batch->stockLevels->sum('quantity');
            $totalValue = $totalStock * $batch->selling_price;
            
            return [
                'batch' => $batch,
                'total_stock' => $totalStock,
                'total_value' => $totalValue,
                'days_to_expiry' => $batch->getDaysToExpiry(),
                'risk_level' => $batch->getExpiryRisk(),
                'recommended_action' => $this->getRecommendedAction($batch)
            ];
        });
    }

    /**
     * Get recommended action for expiring batch
     */
    protected function getRecommendedAction($batch)
    {
        $days = $batch->getDaysToExpiry();
        
        if ($days < 0) {
            return 'Remove from inventory - Expired';
        } elseif ($days <= 7) {
            return 'Urgent sale or return to supplier';
        } elseif ($days <= 30) {
            return 'Promote with discount';
        } elseif ($days <= 90) {
            return 'Monitor closely';
        }
        
        return 'Normal operations';
    }

    /**
     * Mark batch as expired
     */
    public function markAsExpired($batchId, $warehouseId = null)
    {
        DB::beginTransaction();
        
        try {
            $batch = Batch::findOrFail($batchId);
            $batch->status = 'expired';
            $batch->save();

            // Move remaining stock to expired
            $stockLevels = $batch->stockLevels();
            
            if ($warehouseId) {
                $stockLevels->where('warehouse_id', $warehouseId);
            }
            
            $stockLevels = $stockLevels->where('quantity', '>', 0)->get();

            foreach ($stockLevels as $stockLevel) {
                if ($stockLevel->quantity > 0) {
                    // Record expiry movement
                    StockMovement::create([
                        'medicine_id' => $batch->medicine_id,
                        'warehouse_id' => $stockLevel->warehouse_id,
                        'batch_id' => $batch->id,
                        'movement_type' => 'expired',
                        'quantity' => $stockLevel->quantity,
                        'unit_type' => $stockLevel->unit_type,
                        'reference_type' => 'expiry',
                        'reference_id' => $batch->id,
                        'notes' => "Batch expired: {$batch->batch_number}",
                        'created_by' => auth()->id()
                    ]);

                    // Zero out the stock
                    $stockLevel->quantity = 0;
                    $stockLevel->save();
                }
            }

            DB::commit();
            
            Log::info("Batch marked as expired: {$batch->batch_number}");
            
            return true;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to mark batch as expired: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Initiate batch recall
     */
    public function recallBatch($batchId, $reason, $warehouseId = null)
    {
        DB::beginTransaction();
        
        try {
            $batch = Batch::findOrFail($batchId);
            $batch->status = 'recalled';
            $batch->notes = ($batch->notes ? $batch->notes . "\n" : '') . "RECALLED: {$reason}";
            $batch->save();

            // Get all stock levels for this batch
            $stockLevels = $batch->stockLevels();
            
            if ($warehouseId) {
                $stockLevels->where('warehouse_id', $warehouseId);
            }
            
            $stockLevels = $stockLevels->where('quantity', '>', 0)->get();
            $recallDetails = [];

            foreach ($stockLevels as $stockLevel) {
                if ($stockLevel->quantity > 0) {
                    // Record recall movement
                    StockMovement::create([
                        'medicine_id' => $batch->medicine_id,
                        'warehouse_id' => $stockLevel->warehouse_id,
                        'batch_id' => $batch->id,
                        'movement_type' => 'out',
                        'quantity' => $stockLevel->quantity,
                        'unit_type' => $stockLevel->unit_type,
                        'reference_type' => 'recall',
                        'reference_id' => $batch->id,
                        'notes' => "Batch recall: {$reason}",
                        'created_by' => auth()->id()
                    ]);

                    $recallDetails[] = [
                        'warehouse_id' => $stockLevel->warehouse_id,
                        'quantity' => $stockLevel->quantity,
                        'unit_type' => $stockLevel->unit_type
                    ];

                    // Zero out the stock
                    $stockLevel->quantity = 0;
                    $stockLevel->save();
                }
            }

            DB::commit();
            
            Log::warning("Batch recalled: {$batch->batch_number}, Reason: {$reason}");
            
            return [
                'batch' => $batch,
                'recall_details' => $recallDetails,
                'total_recalled' => collect($recallDetails)->sum('quantity')
            ];

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to recall batch: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get batch profitability analysis
     */
    public function getBatchProfitability($batchId)
    {
        $batch = Batch::with(['stockMovements' => function ($q) {
            $q->where('movement_type', 'out')
              ->where('reference_type', 'sale');
        }])->findOrFail($batchId);

        $soldQuantity = $batch->stockMovements->sum('quantity');
        $remainingQuantity = $batch->quantity_remaining;
        $totalRevenue = $soldQuantity * $batch->selling_price;
        $totalCost = $batch->quantity_received * $batch->purchase_price;
        $remainingValue = $remainingQuantity * $batch->selling_price;

        return [
            'batch' => $batch,
            'quantity_received' => $batch->quantity_received,
            'quantity_sold' => $soldQuantity,
            'quantity_remaining' => $remainingQuantity,
            'total_cost' => $totalCost,
            'total_revenue' => $totalRevenue,
            'remaining_value' => $remainingValue,
            'realized_profit' => $totalRevenue - ($soldQuantity * $batch->purchase_price),
            'potential_profit' => ($soldQuantity + $remainingQuantity) * ($batch->selling_price - $batch->purchase_price),
            'profit_margin' => $batch->getProfitMargin(),
            'turnover_rate' => $batch->quantity_received > 0 ? ($soldQuantity / $batch->quantity_received) * 100 : 0
        ];
    }
}