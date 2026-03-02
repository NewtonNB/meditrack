<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Promotion extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'description',
        'type',
        'value',
        'conditions',
        'applicable_items',
        'customer_tiers',
        'start_date',
        'end_date',
        'usage_limit',
        'usage_count',
        'is_active'
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'conditions' => 'array',
        'applicable_items' => 'array',
        'customer_tiers' => 'array',
        'is_active' => 'boolean'
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Methods
    public function isActive()
    {
        return $this->is_active && 
               $this->start_date <= now() && 
               $this->end_date >= now();
    }

    public function isExpired()
    {
        return $this->end_date < now();
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

    public function getTypeLabel()
    {
        $labels = [
            'percentage' => 'Percentage Discount',
            'fixed_amount' => 'Fixed Amount Discount',
            'buy_x_get_y' => 'Buy X Get Y',
            'bulk_discount' => 'Bulk Discount'
        ];

        return $labels[$this->type] ?? ucfirst($this->type);
    }

    public function getFormattedDiscount()
    {
        switch ($this->type) {
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
        
        return now()->diffInDays($this->end_date);
    }
}