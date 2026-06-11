<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AutomationService
{
    /**
     * Get automatic reorder suggestions based on stock levels and sales patterns
     */
    public function getReorderSuggestions(): Collection
    {
        return Cache::remember('reorder_suggestions', 300, function () {
            $suggestions = collect();

            // Get medicines below reorder level
            $lowStockMedicines = Medicine::where('stock', '<=', DB::raw('reorder_level'))
                ->where('reorder_level', '>', 0)
                ->with(['supplier', 'stockMovements' => function ($query) {
                    $query->where('type', 'sale')
                          ->where('created_at', '>=', Carbon::now()->subDays(30))
                          ->orderBy('created_at', 'desc');
                }])
                ->get();

            foreach ($lowStockMedicines as $medicine) {
                $suggestion = $this->generateReorderSuggestion($medicine);
                if ($suggestion) {
                    $suggestions->push($suggestion);
                }
            }

            // Sort by priority (urgency score)
            return $suggestions->sortByDesc('urgency_score')->values();
        });
    }

    /**
     * Generate a smart reorder suggestion for a medicine
     */
    private function generateReorderSuggestion(Medicine $medicine): ?array
    {
        // Calculate sales velocity (average daily sales over last 30 days)
        $salesVelocity = $this->calculateSalesVelocity($medicine);
        
        // Calculate days until stockout
        $daysUntilStockout = $salesVelocity > 0 ? $medicine->stock / $salesVelocity : 999;
        
        // Calculate suggested quantity based on sales patterns
        $suggestedQuantity = $this->calculateSuggestedQuantity($medicine, $salesVelocity);
        
        // Calculate urgency score (0-100)
        $urgencyScore = $this->calculateUrgencyScore($medicine, $daysUntilStockout, $salesVelocity);
        
        // Get preferred supplier
        $preferredSupplier = $this->getPreferredSupplier($medicine);
        
        return [
            'id' => $medicine->id,
            'medicine_name' => $medicine->name,
            'medicine_code' => $medicine->code,
            'current_stock' => $medicine->stock,
            'reorder_level' => $medicine->reorder_level,
            'suggested_quantity' => $suggestedQuantity,
            'preferred_supplier' => $preferredSupplier,
            'sales_velocity' => round($salesVelocity, 2),
            'days_until_stockout' => round($daysUntilStockout, 1),
            'urgency_score' => $urgencyScore,
            'urgency_level' => $this->getUrgencyLevel($urgencyScore),
            'estimated_cost' => $suggestedQuantity * ($medicine->purchase_price ?? $medicine->cost_price ?? 0),
            'reason' => $this->generateReorderReason($medicine, $daysUntilStockout, $salesVelocity),
            'last_purchase_date' => $this->getLastPurchaseDate($medicine),
            'average_lead_time' => $this->getAverageLeadTime($medicine),
        ];
    }

    /**
     * Calculate sales velocity (units per day)
     */
    private function calculateSalesVelocity(Medicine $medicine): float
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        
        $totalSold = Sale::where('medicine_id', $medicine->id)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->sum('quantity');

        return $totalSold / 30; // Average per day
    }

    /**
     * Calculate suggested reorder quantity
     */
    private function calculateSuggestedQuantity(Medicine $medicine, float $salesVelocity): int
    {
        // Base calculation: 30 days of stock + safety buffer
        $baseQuantity = ceil($salesVelocity * 30);
        
        // Add safety stock (20% buffer)
        $safetyStock = ceil($baseQuantity * 0.2);
        
        // Consider minimum order quantity if available
        $minOrderQty = $medicine->min_order_quantity ?? 1;
        
        // Calculate total needed to reach optimal stock level
        $optimalStock = max($medicine->reorder_level * 3, $baseQuantity + $safetyStock);
        $quantityNeeded = $optimalStock - $medicine->stock;
        
        // Ensure we meet minimum order quantity
        $suggestedQuantity = max($quantityNeeded, $minOrderQty);
        
        // Round up to nearest 10 for practical ordering
        return ceil($suggestedQuantity / 10) * 10;
    }

    /**
     * Calculate urgency score (0-100)
     */
    private function calculateUrgencyScore(Medicine $medicine, float $daysUntilStockout, float $salesVelocity): int
    {
        $score = 0;

        // Stock level factor (0-40 points)
        $stockRatio = $medicine->stock / max($medicine->reorder_level, 1);
        if ($stockRatio <= 0.5) $score += 40;
        elseif ($stockRatio <= 0.8) $score += 30;
        elseif ($stockRatio <= 1.0) $score += 20;

        // Days until stockout factor (0-30 points)
        if ($daysUntilStockout <= 3) $score += 30;
        elseif ($daysUntilStockout <= 7) $score += 20;
        elseif ($daysUntilStockout <= 14) $score += 10;

        // Sales velocity factor (0-20 points)
        if ($salesVelocity > 5) $score += 20;
        elseif ($salesVelocity > 2) $score += 15;
        elseif ($salesVelocity > 1) $score += 10;

        // Medicine importance factor (0-10 points)
        if ($medicine->is_prescription) $score += 5;
        if ($medicine->category === 'essential') $score += 5;

        return min($score, 100);
    }

    /**
     * Get urgency level based on score
     */
    private function getUrgencyLevel(int $score): string
    {
        if ($score >= 80) return 'critical';
        if ($score >= 60) return 'high';
        if ($score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Get preferred supplier for a medicine
     */
    private function getPreferredSupplier(Medicine $medicine): ?array
    {
        // First, try the medicine's assigned supplier
        if ($medicine->supplier) {
            return [
                'id' => $medicine->supplier->id,
                'name' => $medicine->supplier->name,
                'contact' => $medicine->supplier->phone,
                'email' => $medicine->supplier->email,
                'reliability_score' => $this->calculateSupplierReliability($medicine->supplier),
            ];
        }

        // Otherwise, find the best supplier based on past purchases
        $bestSupplier = $this->findBestSupplierForMedicine($medicine);
        
        return $bestSupplier ? [
            'id' => $bestSupplier->id,
            'name' => $bestSupplier->name,
            'contact' => $bestSupplier->phone,
            'email' => $bestSupplier->email,
            'reliability_score' => $this->calculateSupplierReliability($bestSupplier),
        ] : null;
    }

    /**
     * Calculate supplier reliability score
     */
    private function calculateSupplierReliability(Supplier $supplier): int
    {
        // This is a simplified calculation - you can enhance it based on your needs
        $totalOrders = $supplier->medicines()->count();
        $recentOrders = $supplier->medicines()
            ->wherePivot('created_at', '>=', Carbon::now()->subMonths(6))
            ->count();

        if ($totalOrders === 0) return 50; // Neutral score for new suppliers

        $reliabilityScore = min(50 + ($recentOrders / $totalOrders) * 50, 100);
        
        return (int) $reliabilityScore;
    }

    /**
     * Find best supplier for a medicine
     */
    private function findBestSupplierForMedicine(Medicine $medicine): ?Supplier
    {
        return Supplier::whereHas('medicines', function ($query) use ($medicine) {
            $query->where('medicine_id', $medicine->id);
        })->first();
    }

    /**
     * Generate human-readable reorder reason
     */
    private function generateReorderReason(Medicine $medicine, float $daysUntilStockout, float $salesVelocity): string
    {
        $reasons = [];

        if ($medicine->stock <= $medicine->reorder_level) {
            $reasons[] = "Stock below reorder level ({$medicine->reorder_level} units)";
        }

        if ($daysUntilStockout <= 7) {
            $reasons[] = "Will run out in " . round($daysUntilStockout, 1) . " days at current sales rate";
        }

        if ($salesVelocity > 2) {
            $reasons[] = "High demand (" . round($salesVelocity, 1) . " units/day average)";
        }

        return implode('. ', $reasons) ?: "Preventive reorder to maintain optimal stock levels";
    }

    /**
     * Get last purchase date for a medicine
     */
    private function getLastPurchaseDate(Medicine $medicine): ?string
    {
        $lastPurchase = StockMovement::where('medicine_id', $medicine->id)
            ->where('type', 'purchase')
            ->orderBy('created_at', 'desc')
            ->first();

        return $lastPurchase ? $lastPurchase->created_at->format('Y-m-d') : null;
    }

    /**
     * Get average lead time for a medicine
     */
    private function getAverageLeadTime(Medicine $medicine): int
    {
        // Simplified calculation - you can enhance this based on actual purchase orders
        return $medicine->supplier ? 7 : 14; // 7 days for known suppliers, 14 for unknown
    }

    /**
     * Get expiry reminders for medicines expiring soon
     */
    public function getExpiryReminders(): Collection
    {
        return Cache::remember('expiry_reminders', 300, function () {
            $reminders = collect();
            
            // Get medicines expiring in the next 90 days
            $expiringMedicines = Medicine::where('expiry_date', '<=', Carbon::now()->addDays(90))
                ->where('expiry_date', '>', Carbon::now())
                ->where('stock', '>', 0)
                ->orderBy('expiry_date')
                ->get();

            foreach ($expiringMedicines as $medicine) {
                $daysUntilExpiry = Carbon::now()->diffInDays($medicine->expiry_date);
                $urgencyLevel = $this->getExpiryUrgencyLevel($daysUntilExpiry);
                
                $reminders->push([
                    'id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'medicine_code' => $medicine->code,
                    'batch_number' => $medicine->batch_number,
                    'current_stock' => $medicine->stock,
                    'expiry_date' => $medicine->expiry_date->format('Y-m-d'),
                    'days_until_expiry' => $daysUntilExpiry,
                    'urgency_level' => $urgencyLevel,
                    'estimated_loss' => $medicine->stock * ($medicine->selling_price ?? 0),
                    'suggested_action' => $this->getSuggestedExpiryAction($daysUntilExpiry, $medicine->stock),
                    'discount_percentage' => $this->getSuggestedDiscount($daysUntilExpiry),
                ]);
            }

            return $reminders->sortBy('days_until_expiry')->values();
        });
    }

    /**
     * Get expiry urgency level
     */
    private function getExpiryUrgencyLevel(int $daysUntilExpiry): string
    {
        if ($daysUntilExpiry <= 7) return 'critical';
        if ($daysUntilExpiry <= 30) return 'high';
        if ($daysUntilExpiry <= 60) return 'medium';
        return 'low';
    }

    /**
     * Get suggested action for expiring medicine
     */
    private function getSuggestedExpiryAction(int $daysUntilExpiry, int $stock): string
    {
        if ($daysUntilExpiry <= 7) {
            return "URGENT: Apply heavy discount or return to supplier if possible";
        } elseif ($daysUntilExpiry <= 30) {
            return "Apply discount to move stock quickly";
        } elseif ($daysUntilExpiry <= 60) {
            return "Monitor closely and consider promotional pricing";
        }
        
        return "Plan promotional activities to move stock";
    }

    /**
     * Get suggested discount percentage
     */
    private function getSuggestedDiscount(int $daysUntilExpiry): int
    {
        if ($daysUntilExpiry <= 7) return 50;
        if ($daysUntilExpiry <= 30) return 25;
        if ($daysUntilExpiry <= 60) return 15;
        return 10;
    }

    /**
     * Get automation dashboard summary
     */
    public function getDashboardSummary(): array
    {
        $reorderSuggestions = $this->getReorderSuggestions();
        $expiryReminders = $this->getExpiryReminders();

        return [
            'reorder_suggestions' => [
                'total' => $reorderSuggestions->count(),
                'critical' => $reorderSuggestions->where('urgency_level', 'critical')->count(),
                'high' => $reorderSuggestions->where('urgency_level', 'high')->count(),
                'estimated_cost' => $reorderSuggestions->sum('estimated_cost'),
            ],
            'expiry_reminders' => [
                'total' => $expiryReminders->count(),
                'critical' => $expiryReminders->where('urgency_level', 'critical')->count(),
                'high' => $expiryReminders->where('urgency_level', 'high')->count(),
                'potential_loss' => $expiryReminders->sum('estimated_loss'),
            ],
            'quick_actions' => $this->getQuickActions($reorderSuggestions, $expiryReminders),
        ];
    }

    /**
     * Get suggested quick actions
     */
    private function getQuickActions(Collection $reorderSuggestions, Collection $expiryReminders = null): array
    {
        $actions = [];

        // Critical expiry alerts (highest priority)
        if ($expiryReminders) {
            $criticalExpiry = $expiryReminders->where('urgency_level', 'critical');
            if ($criticalExpiry->count() > 0) {
                $actions[] = [
                    'type' => 'expiry',
                    'priority' => 'critical',
                    'title' => "URGENT: {$criticalExpiry->count()} medicines expiring within 7 days",
                    'action' => 'View Expiry Alerts',
                    'route' => 'medicines.index',
                ];
            }
        }

        // Critical reorders
        $criticalReorders = $reorderSuggestions->where('urgency_level', 'critical');
        if ($criticalReorders->count() > 0) {
            $actions[] = [
                'type' => 'reorder',
                'priority' => 'critical',
                'title' => "Urgent: {$criticalReorders->count()} medicines need immediate reordering",
                'action' => 'View Reorder Suggestions',
                'route' => 'automation.reorder-suggestions',
            ];
        }

        // High priority expiry alerts
        if ($expiryReminders) {
            $highExpiry = $expiryReminders->where('urgency_level', 'high');
            if ($highExpiry->count() > 0) {
                $actions[] = [
                    'type' => 'expiry',
                    'priority' => 'high',
                    'title' => "{$highExpiry->count()} medicines expiring within 30 days",
                    'action' => 'Review Expiry Alerts',
                    'route' => 'medicines.index',
                ];
            }
        }

        // High priority reorders
        $highReorders = $reorderSuggestions->where('urgency_level', 'high');
        if ($highReorders->count() > 0) {
            $actions[] = [
                'type' => 'reorder',
                'priority' => 'high',
                'title' => "{$highReorders->count()} medicines recommended for reordering",
                'action' => 'Review Suggestions',
                'route' => 'automation.reorder-suggestions',
            ];
        }

        return $actions;
    }

    /**
     * Mark a reorder suggestion as actioned
     */
    public function markReorderActioned(int $medicineId, string $action = 'ordered'): bool
    {
        // Clear cache to refresh suggestions
        Cache::forget('reorder_suggestions');
        
        // You can log this action or update medicine records as needed
        // For now, we'll just clear the cache
        
        return true;
    }

    /**
     * Mark an expiry reminder as handled
     */
    public function markExpiryHandled(int $medicineId, string $action = 'discounted'): bool
    {
        // Clear cache to refresh reminders
        Cache::forget('expiry_reminders');
        
        // You can log this action or update medicine records as needed
        
        return true;
    }
}