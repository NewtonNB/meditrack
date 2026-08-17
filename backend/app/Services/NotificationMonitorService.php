<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Purchase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class NotificationMonitorService
{
    /**
     * Get all active notifications for the pharmacy.
     * Results are cached for 2 minutes to avoid repeated heavy queries.
     */
    public function getAllNotifications($pharmacyId = null): array
    {
        $cacheKey = "notifications_all_" . ($pharmacyId ?? 'global');

        $notifications = Cache::remember($cacheKey, 120, function () use ($pharmacyId) {
            $all = [];
            $all = array_merge($all, $this->getLowStockNotifications($pharmacyId));
            $all = array_merge($all, $this->getOutOfStockNotifications($pharmacyId));
            $all = array_merge($all, $this->getCriticalStockNotifications($pharmacyId));
            $all = array_merge($all, $this->getExpiryNotifications($pharmacyId));
            $all = array_merge($all, $this->getExpiredMedicinesNotifications($pharmacyId));
            $all = array_merge($all, $this->getPendingPurchaseNotifications($pharmacyId));
            return $all;
        });

        // Apply per-user read/dismissed status (not cached — user-specific)
        $userId = auth()->id();
        if (!$userId) {
            return $notifications;
        }

        $filtered = [];
        foreach ($notifications as $notification) {
            $dismissedKey = "notification_dismissed_{$userId}_{$notification['id']}";
            if (Cache::get($dismissedKey)) {
                continue;
            }
            $readKey = "notification_read_{$userId}_{$notification['id']}";
            $notification['read'] = (bool) Cache::get($readKey, false);
            $filtered[] = $notification;
        }

        // Sort by priority then time
        usort($filtered, function ($a, $b) {
            $order = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];
            $aPri = $order[$a['priority']] ?? 4;
            $bPri = $order[$b['priority']] ?? 4;
            if ($aPri !== $bPri) {
                return $aPri - $bPri;
            }
            return strtotime($b['time']) - strtotime($a['time']);
        });

        return array_values($filtered);
    }

    /**
     * Get notification summary — reuses getAllNotifications (which is cached).
     */
    public function getNotificationSummary($pharmacyId = null): array
    {
        $notifications = $this->getAllNotifications($pharmacyId);

        $summary = [
            'total'    => count($notifications),
            'critical' => 0,
            'high'     => 0,
            'medium'   => 0,
            'low'      => 0,
            'unread'   => 0,
            'by_category' => ['stock' => 0, 'expiry' => 0, 'purchase' => 0],
        ];

        foreach ($notifications as $n) {
            if (isset($summary[$n['priority']])) {
                $summary[$n['priority']]++;
            }
            if (isset($summary['by_category'][$n['type']])) {
                $summary['by_category'][$n['type']]++;
            }
            if (empty($n['read'])) {
                $summary['unread']++;
            }
        }

        return $summary;
    }

    /**
     * Clear notification cache for a pharmacy.
     */
    public function clearNotificationCache($pharmacyId = null): void
    {
        Cache::forget("notifications_all_" . ($pharmacyId ?? 'global'));
    }

    // ── Private query methods ─────────────────────────────────────────────────

    public function getLowStockNotifications($pharmacyId = null): array
    {
        $query = Medicine::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'reorder_level')
            ->whereRaw('stock > reorder_level * 0.5');

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->get() as $medicine) {
            $pct = ($medicine->stock / max($medicine->reorder_level, 1)) * 100;
            $notifications[] = [
                'id'         => 'low_stock_' . $medicine->id,
                'type'       => 'stock',
                'category'   => 'low_stock',
                'title'      => 'Low Stock Alert',
                'message'    => "{$medicine->name} is running low",
                'description'=> "Current stock: {$medicine->stock} units (Reorder level: {$medicine->reorder_level})",
                'details'    => "Stock at " . round($pct) . "% of reorder level.",
                'priority'   => 'high',
                'icon'       => 'bi-exclamation-triangle',
                'customIcon' => '📦',
                'time'       => now()->toISOString(),
                'read'       => false,
                'route'      => '/medicines',
                'actionText' => 'Reorder Now',
                'metadata'   => [
                    'medicine_id'   => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => $medicine->stock,
                    'reorder_level' => $medicine->reorder_level,
                ],
            ];
        }
        return $notifications;
    }

    public function getOutOfStockNotifications($pharmacyId = null): array
    {
        $query = Medicine::where('stock', '=', 0);
        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->get() as $medicine) {
            $notifications[] = [
                'id'         => 'out_of_stock_' . $medicine->id,
                'type'       => 'stock',
                'category'   => 'out_of_stock',
                'title'      => 'Out of Stock',
                'message'    => "{$medicine->name} is out of stock",
                'description'=> "No units available. Immediate action required!",
                'details'    => "This medicine is completely out of stock.",
                'priority'   => 'critical',
                'icon'       => 'bi-x-circle',
                'customIcon' => '🚫',
                'time'       => now()->toISOString(),
                'read'       => false,
                'route'      => '/medicines',
                'actionText' => 'Order Immediately',
                'metadata'   => [
                    'medicine_id'   => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => 0,
                    'reorder_level' => $medicine->reorder_level,
                ],
            ];
        }
        return $notifications;
    }

    public function getCriticalStockNotifications($pharmacyId = null): array
    {
        $query = Medicine::where('stock', '>', 0)
            ->whereRaw('stock <= reorder_level * 0.5');

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->get() as $medicine) {
            $pct = ($medicine->stock / max($medicine->reorder_level, 1)) * 100;
            $notifications[] = [
                'id'         => 'critical_stock_' . $medicine->id,
                'type'       => 'stock',
                'category'   => 'critical_stock',
                'title'      => 'Critical Stock Level',
                'message'    => "{$medicine->name} at critical level",
                'description'=> "Only {$medicine->stock} units remaining!",
                'details'    => "Stock critically low at " . round($pct) . "% of reorder level.",
                'priority'   => 'critical',
                'icon'       => 'bi-exclamation-triangle-fill',
                'customIcon' => '🔥',
                'time'       => now()->toISOString(),
                'read'       => false,
                'route'      => '/medicines',
                'actionText' => 'Emergency Order',
                'metadata'   => [
                    'medicine_id'   => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => $medicine->stock,
                    'reorder_level' => $medicine->reorder_level,
                ],
            ];
        }
        return $notifications;
    }

    public function getExpiryNotifications($pharmacyId = null): array
    {
        $now   = Carbon::now();
        $query = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(90))
            ->where('stock', '>', 0);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->get() as $medicine) {
            $expiryDate      = Carbon::parse($medicine->expiry_date);
            $daysUntilExpiry = (int) $now->diffInDays($expiryDate);

            if ($daysUntilExpiry <= 7) {
                $priority = 'critical'; $icon = '❌'; $title = 'Expires This Week';
            } elseif ($daysUntilExpiry <= 30) {
                $priority = 'high';     $icon = '⚠️'; $title = 'Expires This Month';
            } elseif ($daysUntilExpiry <= 60) {
                $priority = 'medium';   $icon = '⏰'; $title = 'Expiring Soon';
            } else {
                $priority = 'low';      $icon = '📅'; $title = 'Upcoming Expiry';
            }

            $notifications[] = [
                'id'         => 'expiry_' . $medicine->id,
                'type'       => 'expiry',
                'category'   => 'medicine_expiry',
                'title'      => $title,
                'message'    => "{$medicine->name} expires in {$daysUntilExpiry} days",
                'description'=> "Expiry: {$expiryDate->format('M d, Y')} ({$medicine->stock} units)",
                'details'    => "Consider offering a discount to clear stock.",
                'priority'   => $priority,
                'icon'       => 'bi-calendar-x',
                'customIcon' => $icon,
                'time'       => now()->toISOString(),
                'read'       => false,
                'route'      => '/medicines',
                'actionText' => 'Apply Discount',
                'metadata'   => [
                    'medicine_id'      => $medicine->id,
                    'medicine_name'    => $medicine->name,
                    'expiry_date'      => $medicine->expiry_date,
                    'days_until_expiry'=> $daysUntilExpiry,
                    'current_stock'    => $medicine->stock,
                ],
            ];
        }
        return $notifications;
    }

    public function getExpiredMedicinesNotifications($pharmacyId = null): array
    {
        $now   = Carbon::now();
        $query = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $now)
            ->where('stock', '>', 0);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->get() as $medicine) {
            $expiryDate  = Carbon::parse($medicine->expiry_date);
            $daysExpired = (int) $now->diffInDays($expiryDate);
            $totalLoss   = $medicine->stock * ($medicine->cost_price ?? 0);

            $notifications[] = [
                'id'         => 'expired_' . $medicine->id,
                'type'       => 'expiry',
                'category'   => 'expired_medicine',
                'title'      => 'Expired Medicine',
                'message'    => "{$medicine->name} has expired",
                'description'=> "Expired {$daysExpired} days ago ({$medicine->stock} units)",
                'details'    => "Total loss: UGX " . number_format($totalLoss) . ". Remove from inventory.",
                'priority'   => 'critical',
                'icon'       => 'bi-x-octagon-fill',
                'customIcon' => '☠️',
                'time'       => now()->toISOString(),
                'read'       => false,
                'route'      => '/medicines',
                'actionText' => 'Remove from Stock',
                'metadata'   => [
                    'medicine_id'  => $medicine->id,
                    'medicine_name'=> $medicine->name,
                    'expiry_date'  => $medicine->expiry_date,
                    'days_expired' => $daysExpired,
                    'current_stock'=> $medicine->stock,
                ],
            ];
        }
        return $notifications;
    }

    public function getPendingPurchaseNotifications($pharmacyId = null): array
    {
        $query = Purchase::whereIn('status', ['pending', 'ordered']);

        if ($pharmacyId) {
            $query->where('pharmacy_id', $pharmacyId);
        }

        $notifications = [];
        foreach ($query->with(['supplier', 'items.medicine'])->get() as $purchase) {
            $daysWaiting = (int) Carbon::parse($purchase->created_at)->diffInDays(now());
            $priority    = $daysWaiting >= 7 ? 'high' : ($daysWaiting >= 3 ? 'medium' : 'low');
            $statusText  = $purchase->status === 'pending' ? 'Pending Approval' : 'Awaiting Delivery';

            $medicineNames = $purchase->items->pluck('medicine.name')->filter()->take(3)->implode(', ') ?: 'Multiple Items';
            $supplierName  = $purchase->supplier?->name ?? 'Supplier';
            $totalCost     = $purchase->total_cost ?? 0;

            $notifications[] = [
                'id'         => 'purchase_' . $purchase->id,
                'type'       => 'purchase',
                'category'   => 'pending_purchase',
                'title'      => 'Pending Purchase',
                'message'    => "{$statusText}: {$medicineNames}",
                'description'=> "Order from {$supplierName} ({$daysWaiting} days waiting)",
                'details'    => "Items: {$purchase->items->count()} types. Total: UGX " . number_format($totalCost),
                'priority'   => $priority,
                'icon'       => 'bi-cart3',
                'customIcon' => '📦',
                'time'       => $purchase->created_at,
                'read'       => false,
                'route'      => '/purchases',
                'actionText' => $purchase->status === 'pending' ? 'Approve Order' : 'Mark as Received',
                'metadata'   => [
                    'purchase_id'   => $purchase->id,
                    'supplier_name' => $supplierName,
                    'items_count'   => $purchase->items->count(),
                    'total_cost'    => $totalCost,
                    'status'        => $purchase->status,
                    'days_waiting'  => $daysWaiting,
                ],
            ];
        }
        return $notifications;
    }

    // ── Legacy aliases (kept for backward compatibility) ──────────────────────

    public function getPurchaseOrderNotifications($pharmacyId = null): array
    {
        return [];
    }

    public function getSupplierNotifications($pharmacyId = null): array
    {
        return [];
    }

    public function getCachedNotifications($pharmacyId = null, int $ttl = 300): array
    {
        return $this->getAllNotifications($pharmacyId);
    }
}
