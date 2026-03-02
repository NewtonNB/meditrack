<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class NotificationMonitorService
{
    /**
     * Get all active notifications for the pharmacy
     */
    public function getAllNotifications($pharmacyId = null): array
    {
        // Use caching to improve performance - cache for 2 minutes
        $cacheKey = "notifications_all_" . ($pharmacyId ?? 'global');
        
        return Cache::remember($cacheKey, 120, function() use ($pharmacyId) {
            $notifications = [];

            // Get low stock notifications
            $notifications = array_merge($notifications, $this->getLowStockNotifications($pharmacyId));

            // Get out of stock notifications
            $notifications = array_merge($notifications, $this->getOutOfStockNotifications($pharmacyId));

            // Get expiry notifications
            $notifications = array_merge($notifications, $this->getExpiryNotifications($pharmacyId));

            // Get expired medicines notifications
            $notifications = array_merge($notifications, $this->getExpiredMedicinesNotifications($pharmacyId));

            // Get pending purchase notifications
            $notifications = array_merge($notifications, $this->getPendingPurchaseNotifications($pharmacyId));

            // Get purchase order notifications
            $notifications = array_merge($notifications, $this->getPurchaseOrderNotifications($pharmacyId));

            // Get supplier notifications
            $notifications = array_merge($notifications, $this->getSupplierNotifications($pharmacyId));

            // Get critical stock notifications
            $notifications = array_merge($notifications, $this->getCriticalStockNotifications($pharmacyId));
            
            return $notifications;
        });

        // Clean up stale notifications (auto-remove resolved issues)
        $this->cleanupStaleNotifications($notifications, $pharmacyId);

        // Filter out dismissed notifications and set read status
        $userId = auth()->id();
        $filteredNotifications = [];
        
        foreach ($notifications as $notification) {
            // Check if notification is dismissed
            $dismissedKey = "notification_dismissed_{$userId}_{$notification['id']}";
            if (Cache::get($dismissedKey)) {
                continue; // Skip dismissed notifications
            }
            
            // Set read status
            $readKey = "notification_read_{$userId}_{$notification['id']}";
            $notification['read'] = Cache::get($readKey, false);
            
            $filteredNotifications[] = $notification;
        }
        
        $notifications = $filteredNotifications;

        // Sort by priority and date
        usort($notifications, function($a, $b) {
            $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];
            $aPriority = $priorityOrder[$a['priority']] ?? 4;
            $bPriority = $priorityOrder[$b['priority']] ?? 4;
            
            if ($aPriority === $bPriority) {
                return strtotime($b['time']) - strtotime($a['time']);
            }
            return $aPriority - $bPriority;
        });

        return array_values($notifications); // Re-index array after filtering
    }

    /**
     * Clean up stale notifications when conditions are resolved
     * This automatically removes notifications that are no longer relevant
     */
    private function cleanupStaleNotifications(array $currentNotifications, $pharmacyId = null): void
    {
        $userId = auth()->id();
        if (!$userId) return;

        // Get all cached notification IDs for this user
        $cachePrefix = "notification_";
        $currentNotificationIds = array_column($currentNotifications, 'id');
        
        // Get all medicines to check for resolved conditions
        $query = Medicine::query();
        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }
        $medicines = $query->get();
        
        // Check for resolved stock issues
        foreach ($medicines as $medicine) {
            // If medicine is now well-stocked, clear all stock-related notifications
            if ($medicine->stock > $medicine->reorder_level) {
                $this->clearUserNotificationCache($userId, "out_of_stock_{$medicine->id}");
                $this->clearUserNotificationCache($userId, "low_stock_{$medicine->id}");
                $this->clearUserNotificationCache($userId, "critical_stock_{$medicine->id}");
            }
            
            // If medicine stock is 0, clear low stock notifications (out of stock takes priority)
            if ($medicine->stock == 0) {
                $this->clearUserNotificationCache($userId, "low_stock_{$medicine->id}");
                $this->clearUserNotificationCache($userId, "critical_stock_{$medicine->id}");
            }
            
            // If medicine has no expiry date or expiry is far away, clear expiry notifications
            if (!$medicine->expiry_date || Carbon::parse($medicine->expiry_date)->diffInDays(now()) > 90) {
                $this->clearUserNotificationCache($userId, "expiry_{$medicine->id}");
            }
            
            // If medicine is no longer expired (stock removed or date updated), clear expired notification
            if (!$medicine->expiry_date || Carbon::parse($medicine->expiry_date)->isFuture() || $medicine->stock == 0) {
                $this->clearUserNotificationCache($userId, "expired_{$medicine->id}");
            }
        }
        
        // Check for resolved purchase notifications
        $completedPurchases = Purchase::whereIn('status', ['received', 'completed', 'cancelled']);
        if ($pharmacyId) {
            $completedPurchases->where('pharmacy_id', $pharmacyId);
        }
        
        foreach ($completedPurchases->get() as $purchase) {
            $this->clearUserNotificationCache($userId, "purchase_{$purchase->id}");
        }
        
        Log::info('Notification cleanup completed', [
            'user_id' => $userId,
            'pharmacy_id' => $pharmacyId,
            'current_notifications' => count($currentNotificationIds)
        ]);
    }

    /**
     * Clear specific notification cache entries for a user
     */
    private function clearUserNotificationCache($userId, $notificationId): void
    {
        Cache::forget("notification_dismissed_{$userId}_{$notificationId}");
        Cache::forget("notification_read_{$userId}_{$notificationId}");
    }

    /**
     * Get low stock notifications
     */
    public function getLowStockNotifications($pharmacyId = null): array
    {
        $notifications = [];
        
        $query = Medicine::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'reorder_level')
            ->whereColumn('stock', '>', \DB::raw('reorder_level * 0.5'));

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $medicines = $query->get();

        foreach ($medicines as $medicine) {
            $stockPercentage = ($medicine->stock / max($medicine->reorder_level, 1)) * 100;
            
            $notifications[] = [
                'id' => 'low_stock_' . $medicine->id,
                'type' => 'stock',
                'category' => 'low_stock',
                'title' => 'Low Stock Alert',
                'message' => "{$medicine->name} is running low",
                'description' => "Current stock: {$medicine->stock} units (Reorder level: {$medicine->reorder_level})",
                'details' => "Stock at " . round($stockPercentage) . "% of reorder level. Consider restocking soon.",
                'priority' => 'high',
                'icon' => 'bi-exclamation-triangle',
                'customIcon' => '📦',
                'time' => now()->toISOString(),
                'read' => false,
                'route' => '/medicines',
                'actionText' => 'Reorder Now',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => $medicine->stock,
                    'reorder_level' => $medicine->reorder_level,
                    'stock_percentage' => round($stockPercentage, 2),
                    'suggested_order_quantity' => max($medicine->reorder_level * 2 - $medicine->stock, 0)
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get out of stock notifications
     */
    public function getOutOfStockNotifications($pharmacyId = null): array
    {
        $notifications = [];
        
        $query = Medicine::where('stock', '=', 0);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $medicines = $query->get();

        foreach ($medicines as $medicine) {
            $notifications[] = [
                'id' => 'out_of_stock_' . $medicine->id,
                'type' => 'stock',
                'category' => 'out_of_stock',
                'title' => 'Out of Stock',
                'message' => "{$medicine->name} is out of stock",
                'description' => "No units available. Immediate action required!",
                'details' => "This medicine is completely out of stock. Order immediately to avoid lost sales.",
                'priority' => 'critical',
                'icon' => 'bi-x-circle',
                'customIcon' => '🚫',
                'time' => now()->toISOString(),
                'read' => false,
                'route' => '/medicines',
                'actionText' => 'Order Immediately',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => 0,
                    'reorder_level' => $medicine->reorder_level,
                    'suggested_order_quantity' => $medicine->reorder_level * 3
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get critical stock notifications (below 50% of reorder level)
     */
    public function getCriticalStockNotifications($pharmacyId = null): array
    {
        $notifications = [];
        
        $query = Medicine::where('stock', '>', 0)
            ->whereRaw('stock <= reorder_level * 0.5')
            ->whereRaw('stock > 0');

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $medicines = $query->get();

        foreach ($medicines as $medicine) {
            $stockPercentage = ($medicine->stock / max($medicine->reorder_level, 1)) * 100;
            
            $notifications[] = [
                'id' => 'critical_stock_' . $medicine->id,
                'type' => 'stock',
                'category' => 'critical_stock',
                'title' => 'Critical Stock Level',
                'message' => "{$medicine->name} at critical level",
                'description' => "Only {$medicine->stock} units remaining!",
                'details' => "Stock critically low at " . round($stockPercentage) . "% of reorder level. Urgent restocking needed.",
                'priority' => 'critical',
                'icon' => 'bi-exclamation-triangle-fill',
                'customIcon' => '🔥',
                'time' => now()->toISOString(),
                'read' => false,
                'route' => '/medicines',
                'actionText' => 'Emergency Order',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => $medicine->stock,
                    'reorder_level' => $medicine->reorder_level,
                    'stock_percentage' => round($stockPercentage, 2),
                    'urgency' => 'critical',
                    'suggested_order_quantity' => $medicine->reorder_level * 3
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get expiry notifications
     */
    public function getExpiryNotifications($pharmacyId = null): array
    {
        $notifications = [];
        $now = Carbon::now();
        
        // Medicines expiring in next 90 days
        $query = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(90))
            ->where('stock', '>', 0);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $medicines = $query->get();

        foreach ($medicines as $medicine) {
            $expiryDate = Carbon::parse($medicine->expiry_date);
            $daysUntilExpiry = $now->diffInDays($expiryDate);
            
            // Determine priority based on days until expiry
            if ($daysUntilExpiry <= 7) {
                $priority = 'critical';
                $icon = '❌';
                $title = 'Expires This Week';
            } elseif ($daysUntilExpiry <= 30) {
                $priority = 'high';
                $icon = '⚠️';
                $title = 'Expires This Month';
            } elseif ($daysUntilExpiry <= 60) {
                $priority = 'medium';
                $icon = '⏰';
                $title = 'Expiring Soon';
            } else {
                $priority = 'low';
                $icon = '📅';
                $title = 'Upcoming Expiry';
            }

            $potentialLoss = $medicine->stock * $medicine->selling_price;
            $suggestedDiscount = $this->getSuggestedDiscount($daysUntilExpiry);

            $notifications[] = [
                'id' => 'expiry_' . $medicine->id,
                'type' => 'expiry',
                'category' => 'medicine_expiry',
                'title' => $title,
                'message' => "{$medicine->name} expires in {$daysUntilExpiry} days",
                'description' => "Expiry date: {$expiryDate->format('M d, Y')} ({$medicine->stock} units)",
                'details' => "Potential loss: UGX " . number_format($potentialLoss) . ". Consider {$suggestedDiscount}% discount.",
                'priority' => $priority,
                'icon' => 'bi-calendar-x',
                'customIcon' => $icon,
                'time' => now()->toISOString(),
                'read' => false,
                'route' => '/medicines',
                'actionText' => 'Apply Discount',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'expiry_date' => $medicine->expiry_date,
                    'days_until_expiry' => $daysUntilExpiry,
                    'current_stock' => $medicine->stock,
                    'potential_loss' => $potentialLoss,
                    'suggested_discount' => $suggestedDiscount,
                    'discounted_price' => $medicine->selling_price * (1 - $suggestedDiscount / 100)
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get expired medicines notifications
     */
    public function getExpiredMedicinesNotifications($pharmacyId = null): array
    {
        $notifications = [];
        $now = Carbon::now();
        
        $query = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $now)
            ->where('stock', '>', 0);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $medicines = $query->get();

        foreach ($medicines as $medicine) {
            $expiryDate = Carbon::parse($medicine->expiry_date);
            $daysExpired = $now->diffInDays($expiryDate);
            $totalLoss = $medicine->stock * $medicine->cost_price;

            $notifications[] = [
                'id' => 'expired_' . $medicine->id,
                'type' => 'expiry',
                'category' => 'expired_medicine',
                'title' => 'Expired Medicine',
                'message' => "{$medicine->name} has expired",
                'description' => "Expired {$daysExpired} days ago ({$medicine->stock} units)",
                'details' => "Total loss: UGX " . number_format($totalLoss) . ". Remove from inventory immediately.",
                'priority' => 'critical',
                'icon' => 'bi-x-octagon-fill',
                'customIcon' => '☠️',
                'time' => now()->toISOString(),
                'read' => false,
                'route' => '/medicines',
                'actionText' => 'Remove from Stock',
                'metadata' => [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'expiry_date' => $medicine->expiry_date,
                    'days_expired' => $daysExpired,
                    'current_stock' => $medicine->stock,
                    'total_loss' => $totalLoss
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get pending purchase notifications
     */
    public function getPendingPurchaseNotifications($pharmacyId = null): array
    {
        $notifications = [];
        
        $query = Purchase::where('status', 'pending')
            ->orWhere('status', 'ordered');

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $purchases = $query->with(['supplier', 'items.medicine'])->get();

        foreach ($purchases as $purchase) {
            $createdDate = Carbon::parse($purchase->created_at);
            $daysWaiting = $createdDate->diffInDays(now());
            
            // Determine priority based on waiting time
            if ($daysWaiting >= 7) {
                $priority = 'high';
                $icon = '⏳';
            } elseif ($daysWaiting >= 3) {
                $priority = 'medium';
                $icon = '📦';
            } else {
                $priority = 'low';
                $icon = '📋';
            }

            $statusText = $purchase->status === 'pending' ? 'Pending Approval' : 'Awaiting Delivery';

            // Get medicine names from purchase items
            $medicineNames = $purchase->items->pluck('medicine.name')->filter()->take(3)->implode(', ');
            $medicineName = $medicineNames ?: 'Multiple Items';
            if ($purchase->items->count() > 3) {
                $medicineName .= ' (+' . ($purchase->items->count() - 3) . ' more)';
            }
            
            $supplierName = $purchase->supplier ? $purchase->supplier->name : 'Supplier';
            $totalCost = $purchase->total_cost ? $purchase->total_cost : 0;
            
            $notifications[] = [
                'id' => 'purchase_' . $purchase->id,
                'type' => 'purchase',
                'category' => 'pending_purchase',
                'title' => 'Pending Purchase',
                'message' => "{$statusText}: {$medicineName}",
                'description' => "Order from {$supplierName} ({$daysWaiting} days waiting)",
                'details' => "Items: {$purchase->items->count()} types. Total: UGX " . number_format($totalCost),
                'priority' => $priority,
                'icon' => 'bi-cart3',
                'customIcon' => $icon,
                'time' => $purchase->created_at,
                'read' => false,
                'route' => '/purchases',
                'actionText' => $purchase->status === 'pending' ? 'Approve Order' : 'Mark as Received',
                'metadata' => [
                    'purchase_id' => $purchase->id,
                    'medicine_names' => $medicineName,
                    'supplier_name' => $supplierName,
                    'items_count' => $purchase->items->count(),
                    'total_cost' => $totalCost,
                    'status' => $purchase->status,
                    'days_waiting' => $daysWaiting,
                    'created_at' => $purchase->created_at
                ]
            ];
        }

        return $notifications;
    }

    /**
     * Get suggested discount based on days until expiry
     */
    private function getSuggestedDiscount(int $daysUntilExpiry): int
    {
        if ($daysUntilExpiry <= 7) return 50;
        if ($daysUntilExpiry <= 14) return 40;
        if ($daysUntilExpiry <= 30) return 25;
        if ($daysUntilExpiry <= 60) return 15;
        return 10;
    }

    /**
     * Get notification summary statistics
     */
    public function getNotificationSummary($pharmacyId = null): array
    {
        // Cache summary for 2 minutes to improve performance
        $cacheKey = "notifications_summary_" . ($pharmacyId ?? 'global');
        
        return Cache::remember($cacheKey, 120, function() use ($pharmacyId) {
            $notifications = $this->getAllNotifications($pharmacyId);

            $summary = [
                'total' => count($notifications),
                'critical' => 0,
                'high' => 0,
                'medium' => 0,
                'low' => 0,
                'by_category' => [
                    'stock' => 0,
                    'expiry' => 0,
                    'purchase' => 0,
                ],
                'unread' => count($notifications), // All are unread by default
            ];

            foreach ($notifications as $notification) {
                // Count by priority
                $summary[$notification['priority']]++;
                
                // Count by category
                if (isset($summary['by_category'][$notification['type']])) {
                    $summary['by_category'][$notification['type']]++;
                }
            }

            return $summary;
        });
    }

    /**
     * Cache notifications for performance
     */
    public function getCachedNotifications($pharmacyId = null, int $ttl = 300): array
    {
        $cacheKey = 'notifications_' . ($pharmacyId ?? 'all');
        
        return Cache::remember($cacheKey, $ttl, function() use ($pharmacyId) {
            return $this->getAllNotifications($pharmacyId);
        });
    }

    /**
     * Get purchase order notifications from cache
     */
    public function getPurchaseOrderNotifications($pharmacyId = null): array
    {
        $cacheKey = 'notifications_' . ($pharmacyId ?? 'global');
        $cachedNotifications = Cache::get($cacheKey, []);
        
        // Filter for purchase order notifications
        return array_filter($cachedNotifications, function($notification) {
            return $notification['type'] === 'purchase_order';
        });
    }

    /**
     * Get supplier notifications from cache
     */
    public function getSupplierNotifications($pharmacyId = null): array
    {
        $cacheKey = 'notifications_' . ($pharmacyId ?? 'global');
        $cachedNotifications = Cache::get($cacheKey, []);
        
        // Filter for supplier notifications
        return array_filter($cachedNotifications, function($notification) {
            return $notification['type'] === 'supplier';
        });
    }

    /**
     * Clear notification cache
     */
    public function clearNotificationCache($pharmacyId = null): void
    {
        $cacheKey = "notifications_all_" . ($pharmacyId ?? 'global');
        Cache::forget($cacheKey);
        
        // Also clear related caches
        Cache::forget("notifications_summary_" . ($pharmacyId ?? 'global'));
    }
}
