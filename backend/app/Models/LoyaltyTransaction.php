<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class LoyaltyTransaction extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'customer_id',
        'sale_id',
        'transaction_type',
        'points',
        'description',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'date'
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function customerLoyalty()
    {
        return $this->belongsTo(CustomerLoyalty::class, 'customer_id', 'customer_id');
    }

    // Scopes
    public function scopeEarned($query)
    {
        return $query->where('transaction_type', 'earned');
    }

    public function scopeRedeemed($query)
    {
        return $query->where('transaction_type', 'redeemed');
    }

    public function scopeExpired($query)
    {
        return $query->where('transaction_type', 'expired');
    }

    public function scopeExpiring($query, $days = 30)
    {
        return $query->where('expires_at', '<=', now()->addDays($days))
                    ->where('expires_at', '>', now())
                    ->where('transaction_type', 'earned');
    }

    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    // Methods
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at < now();
    }

    public function isExpiring($days = 30)
    {
        return $this->expires_at && 
               $this->expires_at <= now()->addDays($days) && 
               $this->expires_at > now();
    }

    public function getDaysToExpiry()
    {
        if (!$this->expires_at) {
            return null;
        }

        return now()->diffInDays($this->expires_at, false);
    }

    public function getFormattedPoints()
    {
        $sign = $this->points >= 0 ? '+' : '';
        return $sign . number_format($this->points);
    }

    public function getTransactionTypeLabel()
    {
        $labels = [
            'earned' => 'Points Earned',
            'redeemed' => 'Points Redeemed',
            'expired' => 'Points Expired',
            'bonus' => 'Bonus Points',
            'adjustment' => 'Points Adjustment'
        ];

        return $labels[$this->transaction_type] ?? ucfirst($this->transaction_type);
    }

    public function getTransactionIcon()
    {
        $icons = [
            'earned' => '⬆️',
            'redeemed' => '⬇️',
            'expired' => '⏰',
            'bonus' => '🎁',
            'adjustment' => '⚖️'
        ];

        return $icons[$this->transaction_type] ?? '📝';
    }

    public function getTransactionColor()
    {
        $colors = [
            'earned' => 'success',
            'redeemed' => 'warning',
            'expired' => 'destructive',
            'bonus' => 'success',
            'adjustment' => 'secondary'
        ];

        return $colors[$this->transaction_type] ?? 'secondary';
    }
}
