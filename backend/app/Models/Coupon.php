<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Coupon extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'code',
        'promotion_id',
        'customer_id',
        'usage_limit',
        'usage_count',
        'expires_at',
        'is_active'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sales()
    {
        return $this->belongsToMany(Sale::class, 'coupon_usage')
                    ->withPivot('discount_amount')
                    ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('valid_from', '<=', now())
                    ->where('valid_until', '>=', now());
    }

    public function scopeByCustomer($query, $customerId)
    {
        return $query->where(function ($q) use ($customerId) {
            $q->whereNull('customer_id')
              ->orWhere('customer_id', $customerId);
        });
    }

    public function scopeExpiring($query, $days = 7)
    {
        return $query->where('valid_until', '<=', now()->addDays($days))
                    ->where('valid_until', '>', now());
    }

    // Methods
    public function isValid()
    {
        return $this->is_active && 
               $this->valid_from <= now() && 
               $this->valid_until >= now() &&
               !$this->isUsageLimitReached();
    }

    public function isExpired()
    {
        return $this->valid_until < now();
    }

    public function isExpiring($days = 7)
    {
        return $this->valid_until <= now()->addDays($days) && 
               $this->valid_until > now();
    }

    public function hasUsageLimit()
    {
        return $this->usage_limit !== null;
    }

    public function isUsageLimitReached()
    {
        return $this->hasUsageLimit() && $this->usage_count >= $this->usage_limit;
    }

    public function getRemainingUsage()
    {
        if (!$this->hasUsageLimit()) {
            return null;
        }
        
        return max(0, $this->usage_limit - $this->usage_count);
    }

    public function isCustomerSpecific()
    {
        return $this->customer_id !== null;
    }

    public function canBeUsedBy($customerId)
    {
        return !$this->isCustomerSpecific() || $this->customer_id == $customerId;
    }

    public function getTypeLabel()
    {
        $labels = [
            'percentage' => 'Percentage Discount',
            'fixed_amount' => 'Fixed Amount Discount'
        ];

        return $labels[$this->discount_type] ?? ucfirst($this->discount_type);
    }

    public function getFormattedDiscount()
    {
        switch ($this->discount_type) {
            case 'percentage':
                return $this->discount_value . '%';
            case 'fixed_amount':
                return '$' . number_format($this->discount_value, 2);
            default:
                return $this->discount_value;
        }
    }

    public function getDaysRemaining()
    {
        if ($this->isExpired()) {
            return 0;
        }
        
        return now()->diffInDays($this->valid_until);
    }

    public function calculateDiscount($amount)
    {
        if (!$this->isValid()) {
            return 0;
        }

        if ($this->minimum_amount && $amount < $this->minimum_amount) {
            return 0;
        }

        switch ($this->discount_type) {
            case 'percentage':
                $discount = $amount * ($this->discount_value / 100);
                break;
            case 'fixed_amount':
                $discount = $this->discount_value;
                break;
            default:
                $discount = 0;
        }

        // Apply maximum discount limit
        if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
            $discount = $this->max_discount_amount;
        }

        return $discount;
    }

    public function markAsUsed($saleId = null, $discountAmount = null)
    {
        $this->increment('usage_count');
        
        if ($saleId && $discountAmount) {
            $this->sales()->attach($saleId, ['discount_amount' => $discountAmount]);
        }
    }
}