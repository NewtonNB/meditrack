<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class CustomerLoyalty extends Model
{
    use HasFactory, Auditable;

    protected $table = 'customer_loyalty';

    protected $fillable = [
        'customer_id',
        'points_balance',
        'tier',
        'tier_progress',
        'lifetime_points',
        'lifetime_spent',
        'last_activity_date'
    ];

    protected $casts = [
        'lifetime_spent' => 'decimal:2',
        'last_activity_date' => 'date'
    ];

    // Tier thresholds
    const TIER_THRESHOLDS = [
        'bronze' => 0,
        'silver' => 1000,
        'gold' => 5000,
        'platinum' => 15000
    ];

    // Points earning rates by tier
    const TIER_MULTIPLIERS = [
        'bronze' => 1.0,
        'silver' => 1.2,
        'gold' => 1.5,
        'platinum' => 2.0
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function loyaltyTransactions()
    {
        return $this->hasMany(LoyaltyTransaction::class, 'customer_id', 'customer_id');
    }

    // Scopes
    public function scopeByTier($query, $tier)
    {
        return $query->where('tier', $tier);
    }

    public function scopeActive($query)
    {
        return $query->where('last_activity_date', '>=', now()->subMonths(6));
    }

    // Methods
    public function addPoints($points, $description = 'Points earned', $saleId = null)
    {
        $this->increment('points_balance', $points);
        $this->increment('lifetime_points', $points);
        $this->update(['last_activity_date' => now()]);

        // Create loyalty transaction record
        LoyaltyTransaction::create([
            'customer_id' => $this->customer_id,
            'sale_id' => $saleId,
            'transaction_type' => 'earned',
            'points' => $points,
            'description' => $description
        ]);

        // Check for tier upgrade
        $this->checkTierUpgrade();

        return $this;
    }

    public function redeemPoints($points, $description = 'Points redeemed', $saleId = null)
    {
        if ($this->points_balance < $points) {
            throw new \Exception('Insufficient points balance');
        }

        $this->decrement('points_balance', $points);
        $this->update(['last_activity_date' => now()]);

        // Create loyalty transaction record
        LoyaltyTransaction::create([
            'customer_id' => $this->customer_id,
            'sale_id' => $saleId,
            'transaction_type' => 'redeemed',
            'points' => -$points,
            'description' => $description
        ]);

        return $this;
    }

    public function calculatePointsForAmount($amount)
    {
        $basePoints = floor($amount / 1000); // 1 point per UGX 1000
        $tierMultiplier = self::TIER_MULTIPLIERS[$this->tier] ?? 1.0;
        
        return (int) ($basePoints * $tierMultiplier);
    }

    public function checkTierUpgrade()
    {
        $currentTier = $this->tier;
        $newTier = $this->calculateTier();

        if ($newTier !== $currentTier) {
            $this->update(['tier' => $newTier]);
            
            // Award tier upgrade bonus
            $bonusPoints = $this->getTierUpgradeBonus($newTier);
            if ($bonusPoints > 0) {
                $this->addPoints($bonusPoints, "Tier upgrade bonus to {$newTier}");
            }
        }

        return $newTier;
    }

    protected function calculateTier()
    {
        $spent = $this->lifetime_spent;
        
        if ($spent >= self::TIER_THRESHOLDS['platinum']) return 'platinum';
        if ($spent >= self::TIER_THRESHOLDS['gold']) return 'gold';
        if ($spent >= self::TIER_THRESHOLDS['silver']) return 'silver';
        
        return 'bronze';
    }

    protected function getTierUpgradeBonus($tier)
    {
        $bonuses = [
            'silver' => 100,
            'gold' => 250,
            'platinum' => 500
        ];

        return $bonuses[$tier] ?? 0;
    }

    public function getTierBenefits()
    {
        $benefits = [
            'bronze' => [
                'discount_percentage' => 0,
                'birthday_bonus' => 50,
                'free_delivery' => false
            ],
            'silver' => [
                'discount_percentage' => 5,
                'birthday_bonus' => 100,
                'free_delivery' => false
            ],
            'gold' => [
                'discount_percentage' => 10,
                'birthday_bonus' => 200,
                'free_delivery' => true
            ],
            'platinum' => [
                'discount_percentage' => 15,
                'birthday_bonus' => 500,
                'free_delivery' => true
            ]
        ];

        return $benefits[$this->tier] ?? $benefits['bronze'];
    }

    public function getPointsValue($points = null)
    {
        $points = $points ?? $this->points_balance;
        return $points * 100; // 1 point = UGX 100
    }

    public function getNextTierInfo()
    {
        $tiers = ['bronze', 'silver', 'gold', 'platinum'];
        $currentIndex = array_search($this->tier, $tiers);
        
        if ($currentIndex === false || $currentIndex >= count($tiers) - 1) {
            return null; // Already at highest tier
        }

        $nextTier = $tiers[$currentIndex + 1];
        $nextThreshold = self::TIER_THRESHOLDS[$nextTier];
        $remaining = $nextThreshold - $this->lifetime_spent;

        return [
            'tier' => $nextTier,
            'threshold' => $nextThreshold,
            'remaining' => max(0, $remaining),
            'progress_percentage' => min(100, ($this->lifetime_spent / $nextThreshold) * 100)
        ];
    }
}
