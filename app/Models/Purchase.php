<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Purchase extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'user_id',
        'purchase_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'notes',
        'payment_terms',
        'invoice_number',
        'invoice_date',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'invoice_date' => 'date',
        'payment_terms' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'reference_id')
                    ->where('reference_type', 'purchase');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOrdered($query)
    {
        return $query->where('status', 'ordered');
    }

    public function scopeReceived($query)
    {
        return $query->where('status', 'received');
    }

    public function scopeOverdue($query)
    {
        return $query->where('expected_delivery_date', '<', now())
                    ->whereNotIn('status', ['received', 'cancelled']);
    }

    // Helper methods
    public function getTotalItemsAttribute()
    {
        return $this->items->sum('quantity_ordered');
    }

    public function getTotalReceivedAttribute()
    {
        return $this->items->sum('quantity_received');
    }

    public function getIsOverdueAttribute()
    {
        return $this->expected_delivery_date && 
               $this->expected_delivery_date->isPast() && 
               !in_array($this->status, ['received', 'cancelled']);
    }

    public function getCompletionPercentageAttribute()
    {
        $totalOrdered = $this->total_items;
        $totalReceived = $this->total_received;
        
        if ($totalOrdered == 0) return 0;
        
        return round(($totalReceived / $totalOrdered) * 100, 2);
    }

    public function calculateTotals()
    {
        $subtotal = $this->items->sum('total_cost');
        $total = $subtotal + $this->tax_amount + $this->shipping_cost - $this->discount_amount;
        
        $this->update([
            'subtotal' => $subtotal,
            'total_amount' => $total,
        ]);
    }

    public static function generatePurchaseNumber()
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $lastPurchase = static::whereDate('created_at', now())
                             ->orderBy('id', 'desc')
                             ->first();
        
        $sequence = $lastPurchase ? (int)substr($lastPurchase->purchase_number, -3) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    public function markAsReceived()
    {
        $this->update([
            'status' => 'received',
            'actual_delivery_date' => now(),
        ]);
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'ordered' => 'blue',
            'partially_received' => 'orange',
            'received' => 'green',
            'cancelled' => 'red',
            default => 'gray'
        };
    }
}