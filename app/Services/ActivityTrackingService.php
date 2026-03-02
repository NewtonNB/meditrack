<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ActivityTrackingService
{
    /**
     * Get formatted recent activities for dashboard
     */
    public function getRecentActivities(int $limit = 20): array
    {
        return Cache::remember('dashboard_recent_activities', 300, function () use ($limit) {
            $activities = collect();

            // Get recent sales with enhanced information
            $recentSales = Sale::with(['medicine', 'customer'])
                ->latest()
                ->take(8)
                ->get()
                ->map(function ($sale) {
                    return $this->formatSaleActivity($sale);
                });

            // Get recent medicine activities
            $recentMedicines = Medicine::with('supplier')
                ->latest()
                ->take(6)
                ->get()
                ->map(function ($medicine) {
                    return $this->formatMedicineActivity($medicine);
                });

            // Get recent customer activities
            $recentCustomers = Customer::latest()
                ->take(4)
                ->get()
                ->map(function ($customer) {
                    return $this->formatCustomerActivity($customer);
                });

            // Get recent supplier activities
            $recentSuppliers = Supplier::latest()
                ->take(3)
                ->get()
                ->map(function ($supplier) {
                    return $this->formatSupplierActivity($supplier);
                });

            // Get recent purchase activities
            $recentPurchases = collect();
            if (class_exists('App\Models\Purchase')) {
                try {
                    $recentPurchases = \App\Models\Purchase::with(['supplier'])
                        ->latest()
                        ->take(4)
                        ->get()
                        ->map(function ($purchase) {
                            return $this->formatPurchaseActivity($purchase);
                        });
                } catch (\Exception $e) {
                    // Silently handle if Purchase model doesn't exist or has issues
                }
            }

            // Get recent stock movements
            $recentStockMovements = collect();
            if (class_exists('App\Models\StockMovement')) {
                try {
                    $recentStockMovements = \App\Models\StockMovement::with(['medicine', 'creator'])
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function ($movement) {
                            return $this->formatStockMovementActivity($movement);
                        });
                } catch (\Exception $e) {
                    // Silently handle if StockMovement model doesn't exist or has issues
                }
            }

            // Get system alerts
            $systemAlerts = $this->getSystemAlerts();

            // Merge all activities
            $activities = $activities
                ->merge($recentSales)
                ->merge($recentMedicines)
                ->merge($recentCustomers)
                ->merge($recentSuppliers)
                ->merge($recentPurchases)
                ->merge($recentStockMovements)
                ->merge($systemAlerts);

            // Sort by timestamp and limit
            return $activities
                ->sortByDesc('timestamp')
                ->take($limit)
                ->values()
                ->toArray();
        });
    }

    /**
     * Format sale activity
     */
    private function formatSaleActivity(Sale $sale): array
    {
        $customerName = $sale->customer ? $sale->customer->name : 'Walk-in Customer';
        
        return [
            'id' => 'sale-' . $sale->id,
            'type' => 'sale',
            'title' => 'Sale Completed',
            'description' => "{$sale->medicine->name} sold to {$customerName}",
            'details' => "Qty: {$sale->quantity} • Invoice: #{$sale->id} • Payment: " . ucfirst($sale->payment_method ?? 'cash'),
            'amount' => $sale->total_price,
            'time' => $sale->created_at->diffForHumans(),
            'timestamp' => $sale->created_at->timestamp,
            'icon' => 'bi-receipt',
            'bg_color' => 'bg-green-100',
            'text_color' => 'text-green-700',
            'route' => route('sales.index'), // Fixed route to sales page
            'priority' => 'normal',
            'metadata' => [
                'medicine_id' => $sale->medicine_id,
                'customer_id' => $sale->customer_id,
                'quantity' => $sale->quantity,
                'unit_price' => $sale->unit_price,
                'payment_method' => $sale->payment_method,
            ],
        ];
    }

    /**
     * Format medicine activity
     */
    private function formatMedicineActivity(Medicine $medicine): array
    {
        $supplierName = $medicine->supplier ? $medicine->supplier->name : 'Unknown Supplier';
        $isLowStock = $medicine->stock < 10;
        
        return [
            'id' => 'medicine-' . $medicine->id,
            'type' => 'medicine',
            'title' => $isLowStock ? 'Medicine Low Stock' : 'Medicine Updated',
            'description' => "{$medicine->name} from {$supplierName}",
            'details' => "Stock: {$medicine->stock} units • Batch: " . ($medicine->batch_number ?? 'N/A') . 
                        " • Expires: " . ($medicine->expiry_date ? $medicine->expiry_date->format('M Y') : 'N/A'),
            'amount' => null,
            'time' => $medicine->updated_at->diffForHumans(),
            'timestamp' => $medicine->updated_at->timestamp,
            'icon' => $isLowStock ? 'bi-exclamation-triangle' : 'bi-capsule',
            'bg_color' => $isLowStock ? 'bg-yellow-100' : 'bg-blue-100',
            'text_color' => $isLowStock ? 'text-yellow-700' : 'text-blue-700',
            'route' => route('medicines.index'), // Fixed route to medicines page
            'priority' => $isLowStock ? 'high' : 'normal',
            'metadata' => [
                'medicine_id' => $medicine->id,
                'stock_level' => $medicine->stock,
                'is_low_stock' => $isLowStock,
                'expiry_date' => $medicine->expiry_date,
                'supplier_id' => $medicine->supplier_id,
            ],
        ];
    }

    /**
     * Format customer activity
     */
    private function formatCustomerActivity(Customer $customer): array
    {
        $totalPurchases = Sale::where('customer_id', $customer->id)->sum('total_price');
        $purchaseCount = Sale::where('customer_id', $customer->id)->count();
        
        return [
            'id' => 'customer-' . $customer->id,
            'type' => 'customer',
            'title' => 'New Customer Registered',
            'description' => "{$customer->name} joined",
            'details' => "Email: " . ($customer->email ?? 'N/A') . 
                        " • Phone: " . ($customer->phone ?? 'N/A') . 
                        " • Purchases: {$purchaseCount}",
            'amount' => $totalPurchases > 0 ? $totalPurchases : null,
            'time' => $customer->created_at->diffForHumans(),
            'timestamp' => $customer->created_at->timestamp,
            'icon' => 'bi-person-plus',
            'bg_color' => 'bg-purple-100',
            'text_color' => 'text-purple-700',
            'route' => route('customers.index'), // Fixed route to customers page
            'priority' => 'normal',
            'metadata' => [
                'customer_id' => $customer->id,
                'total_purchases' => $totalPurchases,
                'purchase_count' => $purchaseCount,
                'registration_date' => $customer->created_at,
            ],
        ];
    }

    /**
     * Format supplier activity
     */
    private function formatSupplierActivity(Supplier $supplier): array
    {
        $medicineCount = Medicine::where('supplier_id', $supplier->id)->count();
        
        return [
            'id' => 'supplier-' . $supplier->id,
            'type' => 'supplier',
            'title' => 'Supplier Added',
            'description' => "{$supplier->name} registered",
            'details' => "Contact: " . ($supplier->phone ?? $supplier->email ?? 'N/A') . 
                        " • Medicines: {$medicineCount}",
            'amount' => null,
            'time' => $supplier->created_at->diffForHumans(),
            'timestamp' => $supplier->created_at->timestamp,
            'icon' => 'bi-building',
            'bg_color' => 'bg-orange-100',
            'text_color' => 'text-orange-700',
            'route' => route('suppliers.index'), // Fixed route to suppliers page
            'priority' => 'normal',
            'metadata' => [
                'supplier_id' => $supplier->id,
                'medicine_count' => $medicineCount,
                'registration_date' => $supplier->created_at,
            ],
        ];
    }

    /**
     * Format purchase activity
     */
    private function formatPurchaseActivity($purchase): array
    {
        $supplierName = $purchase->supplier ? $purchase->supplier->name : 'Unknown Supplier';
        $statusColor = match($purchase->status ?? 'pending') {
            'completed' => ['bg-green-100', 'text-green-700'],
            'pending' => ['bg-yellow-100', 'text-yellow-700'],
            'cancelled' => ['bg-red-100', 'text-red-700'],
            default => ['bg-blue-100', 'text-blue-700']
        };
        
        return [
            'id' => 'purchase-' . $purchase->id,
            'type' => 'purchase',
            'title' => 'Purchase Order',
            'description' => "Order from {$supplierName}",
            'details' => "PO: #{$purchase->id} • Status: " . ucfirst($purchase->status ?? 'pending') . 
                        " • Total: UGX " . number_format($purchase->total_amount ?? 0),
            'amount' => $purchase->total_amount ?? null,
            'time' => $purchase->created_at->diffForHumans(),
            'timestamp' => $purchase->created_at->timestamp,
            'icon' => 'bi-cart3',
            'bg_color' => $statusColor[0],
            'text_color' => $statusColor[1],
            'route' => route('purchases.index'),
            'priority' => 'normal',
            'metadata' => [
                'purchase_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id ?? null,
                'status' => $purchase->status ?? 'pending',
                'total_amount' => $purchase->total_amount ?? 0,
            ],
        ];
    }

    /**
     * Format stock movement activity
     */
    private function formatStockMovementActivity($movement): array
    {
        $medicineName = $movement->medicine ? $movement->medicine->name : 'Unknown Medicine';
        $movementType = $movement->movement_type ?? 'unknown';
        $isIncoming = in_array($movementType, ['in', 'purchase', 'adjustment']) && $movement->quantity > 0;
        
        $typeConfig = match($movementType) {
            'in', 'purchase' => ['Stock In', 'bi-arrow-down-circle', 'bg-green-100', 'text-green-700'],
            'out', 'sale' => ['Stock Out', 'bi-arrow-up-circle', 'bg-red-100', 'text-red-700'],
            'adjustment' => ['Adjustment', 'bi-sliders', 'bg-orange-100', 'text-orange-700'],
            'expired' => ['Expired', 'bi-clock-history', 'bg-gray-100', 'text-gray-700'],
            default => ['Movement', 'bi-arrow-left-right', 'bg-blue-100', 'text-blue-700']
        };
        
        return [
            'id' => 'stock-movement-' . $movement->id,
            'type' => 'stock_movement',
            'title' => $typeConfig[0],
            'description' => "{$medicineName} stock updated",
            'details' => "Qty: " . ($isIncoming ? '+' : '') . $movement->quantity . 
                        " • Ref: " . ($movement->reference ?? 'N/A') . 
                        " • User: " . ($movement->creator->name ?? 'System'),
            'amount' => null,
            'time' => $movement->created_at->diffForHumans(),
            'timestamp' => $movement->created_at->timestamp,
            'icon' => $typeConfig[1],
            'bg_color' => $typeConfig[2],
            'text_color' => $typeConfig[3],
            'route' => route('stock-movements.index'),
            'priority' => 'normal',
            'metadata' => [
                'movement_id' => $movement->id,
                'medicine_id' => $movement->medicine_id,
                'movement_type' => $movementType,
                'quantity' => $movement->quantity,
                'reference' => $movement->reference,
            ],
        ];
    }

    /**
     * Get system alerts and warnings
     */
    private function getSystemAlerts(): Collection
    {
        $alerts = collect();

        // Low stock alerts
        $lowStockMedicines = Medicine::where('stock', '<', 10)
            ->latest('updated_at')
            ->take(5)
            ->get();

        foreach ($lowStockMedicines as $medicine) {
            $alerts->push([
                'id' => 'low-stock-' . $medicine->id,
                'type' => 'alert',
                'title' => 'Critical Stock Alert',
                'description' => "{$medicine->name} is critically low",
                'details' => "Current stock: {$medicine->stock} units • Reorder level: 10 units",
                'amount' => null,
                'time' => $medicine->updated_at->diffForHumans(),
                'timestamp' => $medicine->updated_at->timestamp,
                'icon' => 'bi-exclamation-triangle',
                'bg_color' => 'bg-red-100',
                'text_color' => 'text-red-700',
                'route' => route('medicines.index'), // Fixed route to medicines page
                'priority' => 'critical',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'stock_level' => $medicine->stock,
                    'alert_type' => 'low_stock',
                ],
            ]);
        }

        // Expiry warnings
        $expiringMedicines = Medicine::where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->where('expiry_date', '>', Carbon::now())
            ->latest('expiry_date')
            ->take(3)
            ->get();

        foreach ($expiringMedicines as $medicine) {
            $daysToExpiry = Carbon::now()->diffInDays($medicine->expiry_date);
            $alerts->push([
                'id' => 'expiry-' . $medicine->id,
                'type' => 'warning',
                'title' => 'Expiry Warning',
                'description' => "{$medicine->name} expires soon",
                'details' => "Expires in {$daysToExpiry} days • Stock: {$medicine->stock} units",
                'amount' => null,
                'time' => "Expires " . $medicine->expiry_date->diffForHumans(),
                'timestamp' => $medicine->expiry_date->timestamp,
                'icon' => 'bi-clock',
                'bg_color' => 'bg-yellow-100',
                'text_color' => 'text-yellow-700',
                'route' => route('medicines.index'), // Link to medicines page for expiry management
                'priority' => $daysToExpiry <= 7 ? 'high' : 'medium',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'expiry_date' => $medicine->expiry_date,
                    'days_to_expiry' => $daysToExpiry,
                    'alert_type' => 'expiry_warning',
                ],
            ]);
        }

        return $alerts;
    }

    /**
     * Log a custom activity
     */
    public function logActivity(array $data): ActivityLog
    {
        return ActivityLog::createLog($data);
    }

    /**
     * Get activity statistics
     */
    public function getActivityStats(): array
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();

        return [
            'today' => [
                'total' => ActivityLog::whereDate('created_at', $today)->count(),
                'sales' => Sale::whereDate('created_at', $today)->count(),
                'alerts' => $this->getSystemAlerts()->count(),
            ],
            'this_week' => [
                'total' => ActivityLog::where('created_at', '>=', $thisWeek)->count(),
                'sales' => Sale::where('created_at', '>=', $thisWeek)->count(),
                'new_customers' => Customer::where('created_at', '>=', $thisWeek)->count(),
            ],
            'this_month' => [
                'total' => ActivityLog::where('created_at', '>=', $thisMonth)->count(),
                'sales' => Sale::where('created_at', '>=', $thisMonth)->count(),
                'new_medicines' => Medicine::where('created_at', '>=', $thisMonth)->count(),
            ],
        ];
    }

    /**
     * Clear activity cache
     */
    public function clearCache(): void
    {
        Cache::forget('dashboard_recent_activities');
    }
}