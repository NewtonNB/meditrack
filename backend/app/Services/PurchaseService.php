<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Medicine;
use App\Models\StockMovement;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchaseService
{
    public function createPurchase(array $data)
    {
        return DB::transaction(function () use ($data) {
            $purchase = Purchase::create([
                'purchase_number' => Purchase::generatePurchaseNumber(),
                'supplier_id' => $data['supplier_id'],
                'user_id' => Auth::id(),
                'purchase_date' => $data['purchase_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'status' => 'pending',
                'tax_amount' => $data['tax_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'shipping_cost' => $data['shipping_cost'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'payment_terms' => $data['payment_terms'] ?? null,
            ]);

            if (isset($data['items'])) {
                foreach ($data['items'] as $item) {
                    $purchaseItem = $purchase->items()->create([
                        'medicine_id' => $item['medicine_id'],
                        'quantity_ordered' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                        'total_cost' => $item['quantity'] * $item['unit_cost'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }

            $purchase->calculateTotals();
            
            return $purchase->load(['supplier', 'items.medicine', 'user']);
        });
    }

    public function updatePurchase(Purchase $purchase, array $data)
    {
        return DB::transaction(function () use ($purchase, $data) {
            $purchase->update([
                'supplier_id' => $data['supplier_id'] ?? $purchase->supplier_id,
                'purchase_date' => $data['purchase_date'] ?? $purchase->purchase_date,
                'expected_delivery_date' => $data['expected_delivery_date'] ?? $purchase->expected_delivery_date,
                'tax_amount' => $data['tax_amount'] ?? $purchase->tax_amount,
                'discount_amount' => $data['discount_amount'] ?? $purchase->discount_amount,
                'shipping_cost' => $data['shipping_cost'] ?? $purchase->shipping_cost,
                'notes' => $data['notes'] ?? $purchase->notes,
                'payment_terms' => $data['payment_terms'] ?? $purchase->payment_terms,
            ]);

            if (isset($data['items'])) {
                // Remove existing items
                $purchase->items()->delete();
                
                // Add new items
                foreach ($data['items'] as $item) {
                    $purchase->items()->create([
                        'medicine_id' => $item['medicine_id'],
                        'quantity_ordered' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                        'total_cost' => $item['quantity'] * $item['unit_cost'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }

            $purchase->calculateTotals();
            
            return $purchase->load(['supplier', 'items.medicine', 'user']);
        });
    }

    public function receivePurchase(Purchase $purchase, array $receivedItems)
    {
        return DB::transaction(function () use ($purchase, $receivedItems) {
            $allItemsReceived = true;
            
            foreach ($receivedItems as $itemData) {
                $purchaseItem = $purchase->items()->find($itemData['purchase_item_id']);
                
                if (!$purchaseItem) continue;
                
                $quantityToReceive = min(
                    $itemData['quantity_received'],
                    $purchaseItem->remaining_quantity
                );
                
                if ($quantityToReceive > 0) {
                    // Update purchase item
                    $purchaseItem->receiveQuantity(
                        $quantityToReceive,
                        $itemData['batch_number'] ?? null,
                        $itemData['expiry_date'] ?? null
                    );
                    
                    // Update medicine stock
                    $medicine = $purchaseItem->medicine;
                    $medicine->increment('stock', $quantityToReceive);
                    
                    // Create batch if batch number provided
                    if (!empty($itemData['batch_number'])) {
                        Batch::create([
                            'medicine_id' => $medicine->id,
                            'batch_number' => $itemData['batch_number'],
                            'quantity' => $quantityToReceive,
                            'expiry_date' => $itemData['expiry_date'] ?? null,
                            'manufacturing_date' => $itemData['manufacturing_date'] ?? null,
                            'supplier_id' => $purchase->supplier_id,
                            'purchase_id' => $purchase->id,
                            'status' => 'active',
                        ]);
                    }
                    
                    // Create stock movement
                    StockMovement::create([
                        'medicine_id' => $medicine->id,
                        'warehouse_id' => 1,
                        'pharmacy_id' => Auth::user()->pharmacy_id ?? 1,
                        // New fields
                        'movement_type' => 'in',
                        'quantity' => $quantityToReceive,
                        'reference' => 'PO-' . $purchase->id,
                        'notes' => "Received from purchase {$purchase->purchase_number}",
                        'created_by' => Auth::id(),
                        // Legacy fields for backward compatibility
                        'type' => 'in',
                        'reference_id' => $purchase->id,
                        'reference_type' => 'purchase',
                        'note' => "Received from purchase {$purchase->purchase_number}",
                    ]);
                }
                
                if (!$purchaseItem->is_fully_received) {
                    $allItemsReceived = false;
                }
            }
            
            // Update purchase status
            if ($allItemsReceived) {
                $purchase->markAsReceived();
            } else {
                $purchase->update(['status' => 'partially_received']);
            }
            
            return $purchase->load(['supplier', 'items.medicine', 'user']);
        });
    }

    public function cancelPurchase(Purchase $purchase, string $reason = null)
    {
        return DB::transaction(function () use ($purchase, $reason) {
            $purchase->update([
                'status' => 'cancelled',
                'notes' => $purchase->notes . "\n\nCancelled: " . ($reason ?? 'No reason provided'),
            ]);
            
            return $purchase;
        });
    }

    public function getPurchaseStatistics()
    {
        return [
            'total_purchases' => Purchase::count(),
            'pending_purchases' => Purchase::pending()->count(),
            'overdue_purchases' => Purchase::overdue()->count(),
            'total_amount_this_month' => Purchase::whereMonth('purchase_date', now()->month)
                                              ->whereYear('purchase_date', now()->year)
                                              ->sum('total_amount'),
            'average_delivery_time' => $this->getAverageDeliveryTime(),
            'top_suppliers' => $this->getTopSuppliers(),
        ];
    }

    private function getAverageDeliveryTime()
    {
        $completedPurchases = Purchase::whereNotNull('actual_delivery_date')
                                    ->whereNotNull('expected_delivery_date')
                                    ->get();
        
        if ($completedPurchases->isEmpty()) {
            return 0;
        }
        
        $totalDays = $completedPurchases->sum(function ($purchase) {
            return $purchase->expected_delivery_date->diffInDays($purchase->actual_delivery_date);
        });
        
        return round($totalDays / $completedPurchases->count(), 1);
    }

    private function getTopSuppliers()
    {
        return Purchase::with('supplier')
                      ->selectRaw('supplier_id, COUNT(*) as purchase_count, SUM(total_amount) as total_amount')
                      ->groupBy('supplier_id')
                      ->orderByDesc('total_amount')
                      ->limit(5)
                      ->get()
                      ->map(function ($purchase) {
                          return [
                              'supplier' => $purchase->supplier,
                              'purchase_count' => $purchase->purchase_count,
                              'total_amount' => $purchase->total_amount,
                          ];
                      });
    }

    public function generatePurchaseReport(array $filters = [])
    {
        $query = Purchase::with(['supplier', 'items.medicine', 'user']);
        
        if (isset($filters['date_from'])) {
            $query->where('purchase_date', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->where('purchase_date', '<=', $filters['date_to']);
        }
        
        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        return $query->orderBy('purchase_date', 'desc')->get();
    }
}