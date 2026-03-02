<?php

namespace App\Services\POS;

use App\Models\Customer;
use App\Models\CustomerLoyalty;
use App\Models\LoyaltyTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoyaltyService
{
    /**
     * Award points to a customer
     */
    public function awardPoints($customerId, $points, $description = 'Points earned', $saleId = null)
    {
        DB::beginTransaction();
        
        try {
            $customerLoyalty = $this->getOrCreateCustomerLoyalty($customerId);
            $customerLoyalty->addPoints($points, $description, $saleId);
            
            DB::commit();
            
            Log::info("Points awarded", [
                'customer_id' => $customerId,
                'points' => $points,
                'description' => $description
            ]);
            
            return $customerLoyalty->fresh();
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to award points: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Redeem points for a customer
     */
    public function redeemPoints($customerId, $points, $description = 'Points redeemed', $saleId = null)
    {
        DB::beginTransaction();
        
        try {
            $customerLoyalty = $this->getOrCreateCustomerLoyalty($customerId);
            $customerLoyalty->redeemPoints($points, $description, $saleId);
            
            DB::commit();
            
            Log::info("Points redeemed", [
                'customer_id' => $customerId,
                'points' => $points,
                'description' => $description
            ]);
            
            return $customerLoyalty->fresh();
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to redeem points: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Adjust points (can be positive or negative)
     */
    public function adjustPoints($customerId, $points, $description = 'Points adjustment')
    {
        if ($points > 0) {
            return $this->awardPoints($customerId, $points, $description);
        } else {
            return $this->redeemPoints($customerId, abs($points), $description);
        }
    }

    /**
     * Get or create customer loyalty record
     */
    public function getOrCreateCustomerLoyalty($customerId)
    {
        return CustomerLoyalty::firstOrCreate(
            ['customer_id' => $customerId],
            [
                'points_balance' => 0,
                'tier' => 'bronze',
                'tier_progress' => 0,
                'lifetime_points' => 0,
                'lifetime_spent' => 0,
                'last_activity_date' => now()
            ]
        );
    }

    /**
     * Update customer spending and recalculate tier
     */
    public function updateCustomerSpending($customerId, $amount)
    {
        $customerLoyalty = $this->getOrCreateCustomerLoyalty($customerId);
        
        $customerLoyalty->increment('lifetime_spent', $amount);
        $customerLoyalty->update(['last_activity_date' => now()]);
        
        // Check for tier upgrade
        $newTier = $customerLoyalty->checkTierUpgrade();
        
        return $customerLoyalty->fresh();
    }

    /**
     * Get customer loyalty summary
     */
    public function getCustomerLoyaltySummary($customerId)
    {
        $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
        
        if (!$customerLoyalty) {
            return [
                'points_balance' => 0,
                'tier' => 'bronze',
                'lifetime_points' => 0,
                'lifetime_spent' => 0,
                'tier_benefits' => CustomerLoyalty::getTierBenefits()['bronze'] ?? [],
                'next_tier_info' => null,
                'recent_transactions' => []
            ];
        }

        return [
            'points_balance' => $customerLoyalty->points_balance,
            'tier' => $customerLoyalty->tier,
            'lifetime_points' => $customerLoyalty->lifetime_points,
            'lifetime_spent' => $customerLoyalty->lifetime_spent,
            'points_value' => $customerLoyalty->getPointsValue(),
            'tier_benefits' => $customerLoyalty->getTierBenefits(),
            'next_tier_info' => $customerLoyalty->getNextTierInfo(),
            'recent_transactions' => $this->getRecentLoyaltyTransactions($customerId, 10)
        ];
    }

    /**
     * Get recent loyalty transactions for a customer
     */
    public function getRecentLoyaltyTransactions($customerId, $limit = 20)
    {
        return LoyaltyTransaction::where('customer_id', $customerId)
            ->with('sale')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->transaction_type,
                    'points' => $transaction->points,
                    'description' => $transaction->description,
                    'date' => $transaction->created_at,
                    'sale_id' => $transaction->sale_id,
                    'expires_at' => $transaction->expires_at,
                    'formatted_points' => $transaction->getFormattedPoints(),
                    'type_label' => $transaction->getTransactionTypeLabel(),
                    'icon' => $transaction->getTransactionIcon(),
                    'color' => $transaction->getTransactionColor()
                ];
            });
    }

    /**
     * Calculate points for purchase amount
     */
    public function calculatePointsForPurchase($customerId, $amount)
    {
        $customerLoyalty = $this->getOrCreateCustomerLoyalty($customerId);
        return $customerLoyalty->calculatePointsForAmount($amount);
    }

    /**
     * Check if customer can redeem points
     */
    public function canRedeemPoints($customerId, $points)
    {
        $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
        
        if (!$customerLoyalty) {
            return false;
        }
        
        return $customerLoyalty->points_balance >= $points;
    }

    /**
     * Get points value in currency
     */
    public function getPointsValue($points)
    {
        return $points * 100; // 1 point = UGX 100
    }

    /**
     * Get points needed for amount
     */
    public function getPointsNeededForAmount($amount)
    {
        return ceil($amount / 100); // UGX 100 per point
    }

    /**
     * Process birthday bonus
     */
    public function processBirthdayBonus($customerId)
    {
        $customer = Customer::find($customerId);
        
        if (!$customer || !$customer->date_of_birth) {
            return false;
        }
        
        // Check if today is customer's birthday
        if (!$customer->date_of_birth->isBirthday()) {
            return false;
        }
        
        // Check if birthday bonus already given this year
        $existingBonus = LoyaltyTransaction::where('customer_id', $customerId)
            ->where('transaction_type', 'bonus')
            ->where('description', 'like', '%birthday%')
            ->whereYear('created_at', now()->year)
            ->exists();
            
        if ($existingBonus) {
            return false;
        }
        
        $customerLoyalty = $this->getOrCreateCustomerLoyalty($customerId);
        $tierBenefits = $customerLoyalty->getTierBenefits();
        $birthdayBonus = $tierBenefits['birthday_bonus'] ?? 50;
        
        $this->awardPoints(
            $customerId,
            $birthdayBonus,
            "Happy Birthday! {$birthdayBonus} bonus points"
        );
        
        Log::info("Birthday bonus awarded", [
            'customer_id' => $customerId,
            'points' => $birthdayBonus
        ]);
        
        return true;
    }

    /**
     * Expire old points
     */
    public function expireOldPoints($days = 365)
    {
        $expiredTransactions = LoyaltyTransaction::where('transaction_type', 'earned')
            ->where('expires_at', '<', now())
            ->whereNull('expired_at')
            ->get();
            
        $totalExpired = 0;
        
        foreach ($expiredTransactions as $transaction) {
            // Create expiry transaction
            LoyaltyTransaction::create([
                'customer_id' => $transaction->customer_id,
                'transaction_type' => 'expired',
                'points' => -$transaction->points,
                'description' => "Points expired from transaction #{$transaction->id}",
                'expires_at' => null
            ]);
            
            // Update customer balance
            $customerLoyalty = CustomerLoyalty::where('customer_id', $transaction->customer_id)->first();
            if ($customerLoyalty) {
                $customerLoyalty->decrement('points_balance', $transaction->points);
            }
            
            // Mark transaction as expired
            $transaction->update(['expired_at' => now()]);
            
            $totalExpired += $transaction->points;
        }
        
        Log::info("Points expiry processed", [
            'transactions_expired' => $expiredTransactions->count(),
            'total_points_expired' => $totalExpired
        ]);
        
        return [
            'transactions_expired' => $expiredTransactions->count(),
            'total_points_expired' => $totalExpired
        ];
    }

    /**
     * Get customers with expiring points
     */
    public function getCustomersWithExpiringPoints($days = 30)
    {
        return LoyaltyTransaction::expiring($days)
            ->with('customer')
            ->get()
            ->groupBy('customer_id')
            ->map(function ($transactions, $customerId) {
                $customer = $transactions->first()->customer;
                $totalExpiring = $transactions->sum('points');
                $earliestExpiry = $transactions->min('expires_at');
                
                return [
                    'customer_id' => $customerId,
                    'customer_name' => $customer->name,
                    'customer_email' => $customer->email,
                    'customer_phone' => $customer->phone,
                    'total_expiring_points' => $totalExpiring,
                    'expiring_value' => $this->getPointsValue($totalExpiring),
                    'earliest_expiry_date' => $earliestExpiry,
                    'days_to_expiry' => now()->diffInDays($earliestExpiry)
                ];
            })
            ->values();
    }

    /**
     * Get loyalty program statistics
     */
    public function getLoyaltyStatistics()
    {
        $totalCustomers = CustomerLoyalty::count();
        $activeCustomers = CustomerLoyalty::active()->count();
        $totalPointsIssued = LoyaltyTransaction::earned()->sum('points');
        $totalPointsRedeemed = abs(LoyaltyTransaction::redeemed()->sum('points'));
        $totalPointsExpired = abs(LoyaltyTransaction::expired()->sum('points'));
        
        $tierBreakdown = CustomerLoyalty::select('tier', DB::raw('count(*) as count'))
            ->groupBy('tier')
            ->pluck('count', 'tier')
            ->toArray();
            
        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'total_points_issued' => $totalPointsIssued,
            'total_points_redeemed' => $totalPointsRedeemed,
            'total_points_expired' => $totalPointsExpired,
            'points_outstanding' => $totalPointsIssued - $totalPointsRedeemed - $totalPointsExpired,
            'tier_breakdown' => $tierBreakdown,
            'redemption_rate' => $totalPointsIssued > 0 ? ($totalPointsRedeemed / $totalPointsIssued) * 100 : 0
        ];
    }
}