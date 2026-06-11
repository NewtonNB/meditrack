<?php

namespace App\Services\Inventory;

use App\Models\Medicine;
use App\Models\Warehouse;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    protected $unitConversionService;
    protected $batchTrackingService;

    public function __construct(
        UnitConversionService $unitConversionService,
        BatchTrackingService $batchTrackingService
    ) {
        $this->unitConversionService = $unitConversionService;
        $this->batchTrackingService = $batchTrackingService;
    }

    /**
     * Get current stock level for a medicine in a warehouse
     */
    public function getStockLevel($medicineId, $warehouseId, $unitType = null)
    {
        $query = StockLevel::where('medicine_id', $medicineId)
                          ->where('warehouse_id', $warehouseId);

        if ($unitType) {
            $query->where('unit_type', $unitType);
        }

        return $query->sum('quantity');
    }

    /**
     * Get available stock (excluding reserved)
     */
    public function getAvailableStock($medicineId, $warehouseId, $unitType = null)
    {
        $query = StockLevel::where('medicine_id', $medicineId)
                          ->where('warehouse_id', $warehouseId);

        if ($unitType) {
            $query->where('unit_type', $unitType);
        }

        $stockLevels = $query->get();
        
        return $stockLevels->sum(function ($stock) {
            return $stock->getAvailableQuantity();
        });
    }

    /**
     * Add stock to inventory
     */
    public function addStock($medicineId, $warehouseId, $quantity, $options = [])
    {
        DB::beginTransaction();
        
        try {
            $batchId = $options['batch_id'] ?? null;
            $unitType = $options['unit_type'] ?? 'tablet';
            $referenceType = $options['reference_type'] ?? 'adjustment';
            $referenceId = $options['reference_id'] ?? null;
            $notes = $options['notes'] ?? null;

            // Find or create stock level record
            $stockLevel = StockLevel::firstOrCreate([
                'medicine_id' => $medicineId,
                'warehouse_id' => $warehouseId,
                'batch_id' => $batchId,
                'unit_type' => $unitType
            ], [
                'quantity' => 0,
                'reserved_quantity' => 0,
                'audit_status' => 'pending'
            ]);

            // Update quantity
            $stockLevel->updateQuantity($quantity, 'add');

            // Record stock movement
            $this->recordStockMovement([
                'medicine_id' => $medicineId,
                'warehouse_id' => $warehouseId,
                'batch_id' => $batchId,
                'movement_type' => 'in',
                'quantity' => $quantity,
                'unit_type' => $unitType,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'created_by' => auth()->id()
            ]);

            DB::commit();
            
            Log::info("Stock added: Medicine {$medicineId}, Warehouse {$warehouseId}, Quantity {$quantity}");
            
            return $stockLevel;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to add stock: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Remove stock from inventory
     */
    public function removeStock($medicineId, $warehouseId, $quantity, $options = [])
    {
        DB::beginTransaction();
        
        try {
            $unitType = $options['unit_type'] ?? 'tablet';
            $useFIFO = $options['use_fifo'] ?? true;
            $referenceType = $options['reference_type'] ?? 'sale';
            $referenceId = $options['reference_id'] ?? null;
            $notes = $options['notes'] ?? null;

            // Get available stock levels
            $stockLevels = StockLevel::where('medicine_id', $medicineId)
                                   ->where('warehouse_id', $warehouseId)
                                   ->where('unit_type', $unitType)
                                   ->where('quantity', '>', 0);

            if ($useFIFO) {
                // Use FIFO - oldest batches first
                $stockLevels = $stockLevels->join('batches', 'stock_levels.batch_id', '=', 'batches.id')
                                         ->orderBy('batches.expiry_date', 'asc')
                                         ->select('stock_levels.*');
            }

            $stockLevels = $stockLevels->get();
            
            $remainingQuantity = $quantity;
            $removedFromBatches = [];

            foreach ($stockLevels as $stockLevel) {
                if ($remainingQuantity <= 0) break;

                $availableQuantity = $stockLevel->getAvailableQuantity();
                $quantityToRemove = min($remainingQuantity, $availableQuantity);

                if ($quantityToRemove > 0) {
                    $stockLevel->updateQuantity($quantityToRemove, 'subtract');
                    
                    // Update batch quantity if applicable
                    if ($stockLevel->batch_id && $stockLevel->batch) {
                        $stockLevel->batch->updateQuantity($quantityToRemove, 'subtract');
                    }

                    $removedFromBatches[] = [
                        'batch_id' => $stockLevel->batch_id,
                        'quantity' => $quantityToRemove
                    ];

                    $remainingQuantity -= $quantityToRemove;
                }
            }

            if ($remainingQuantity > 0) {
                throw new \Exception("Insufficient stock available. Requested: {$quantity}, Available: " . ($quantity - $remainingQuantity));
            }

            // Record stock movement
            $this->recordStockMovement([
                'medicine_id' => $medicineId,
                'warehouse_id' => $warehouseId,
                'batch_id' => null, // Multiple batches involved
                'movement_type' => 'out',
                'quantity' => $quantity,
                'unit_type' => $unitType,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes . ' | Batches: ' . json_encode($removedFromBatches),
                'created_by' => auth()->id()
            ]);

            DB::commit();
            
            Log::info("Stock removed: Medicine {$medicineId}, Warehouse {$warehouseId}, Quantity {$quantity}");
            
            return true;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to remove stock: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Transfer stock between warehouses
     */
    public function transferStock($medicineId, $fromWarehouseId, $toWarehouseId, $quantity, $options = [])
    {
        DB::beginTransaction();
        
        try {
            $unitType = $options['unit_type'] ?? 'tablet';
            $notes = $options['notes'] ?? "Transfer from warehouse {$fromWarehouseId} to {$toWarehouseId}";

            // Remove from source warehouse
            $this->removeStock($medicineId, $fromWarehouseId, $quantity, [
                'unit_type' => $unitType,
                'reference_type' => 'transfer',
                'reference_id' => $toWarehouseId,
                'notes' => $notes
            ]);

            // Add to destination warehouse
            $this->addStock($medicineId, $toWarehouseId, $quantity, [
                'unit_type' => $unitType,
                'reference_type' => 'transfer',
                'reference_id' => $fromWarehouseId,
                'notes' => $notes
            ]);

            DB::commit();
            
            Log::info("Stock transferred: Medicine {$medicineId}, From {$fromWarehouseId} to {$toWarehouseId}, Quantity {$quantity}");
            
            return true;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to transfer stock: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get low stock items across all warehouses
     */
    public function getLowStockItems($warehouseId = null)
    {
        $query = StockLevel::lowStock()
                          ->with(['medicine', 'warehouse', 'batch'])
                          ->select('stock_levels.*', 'medicines.name', 'medicines.reorder_level');

        if ($warehouseId) {
            $query->where('stock_levels.warehouse_id', $warehouseId);
        }

        return $query->get();
    }

    /**
     * Get expiring batches
     */
    public function getExpiringBatches($days = 30, $warehouseId = null)
    {
        $query = Batch::expiring($days)
                     ->with(['medicine', 'stockLevels.warehouse'])
                     ->whereHas('stockLevels', function ($q) {
                         $q->where('quantity', '>', 0);
                     });

        if ($warehouseId) {
            $query->whereHas('stockLevels', function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            });
        }

        return $query->get();
    }

    /**
     * Record stock movement
     */
    protected function recordStockMovement($data)
    {
        return StockMovement::create($data);
    }

    /**
     * Get stock movement history
     */
    public function getStockMovements($medicineId = null, $warehouseId = null, $limit = 100)
    {
        $query = StockMovement::with(['medicine', 'warehouse', 'batch', 'creator'])
                             ->orderBy('created_at', 'desc');

        if ($medicineId) {
            $query->where('medicine_id', $medicineId);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->limit($limit)->get();
    }

    /**
     * Get inventory summary
     */
    public function getInventorySummary($warehouseId = null)
    {
        $query = StockLevel::with(['medicine', 'warehouse', 'batch']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $stockLevels = $query->get();

        return [
            'total_items' => $stockLevels->count(),
            'total_value' => $stockLevels->sum(function ($stock) {
                return $stock->medicine ? ($stock->quantity * $stock->medicine->selling_price) : 0;
            }),
            'low_stock_items' => $stockLevels->filter(function ($stock) {
                return $stock->isLowStock();
            })->count(),
            'out_of_stock_items' => $stockLevels->where('quantity', 0)->count(),
            'expiring_batches' => $this->getExpiringBatches(30, $warehouseId)->count()
        ];
    }
}