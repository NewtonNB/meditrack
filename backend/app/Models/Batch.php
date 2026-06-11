<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Carbon\Carbon;

class Batch extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'medicine_id',
        'batch_number',
        'lot_number',
        'expiry_date',
        'manufacture_date',
        'supplier_id',
        'purchase_price',
        'selling_price',
        'quantity_received',
        'quantity_remaining',
        'status',
        'notes'
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'manufacture_date' => 'date',
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2'
    ];

    // Relationships
    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockLevels()
    {
        return $this->hasMany(StockLevel::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function barcodes()
    {
        return $this->hasMany(Barcode::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpiring($query, $days = 30)
    {
        return $query->where('expiry_date', '<=', now()->addDays($days))
                    ->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())
                    ->where('status', 'active');
    }

    // Methods
    public function isExpired()
    {
        return $this->expiry_date < now();
    }

    public function isExpiring($days = 30)
    {
        return $this->expiry_date <= now()->addDays($days);
    }

    public function getDaysToExpiry()
    {
        return now()->diffInDays($this->expiry_date, false);
    }

    public function getExpiryRisk()
    {
        $days = $this->getDaysToExpiry();
        
        if ($days < 0) return 'expired';
        if ($days <= 7) return 'critical';
        if ($days <= 30) return 'high';
        if ($days <= 90) return 'medium';
        
        return 'low';
    }

    public function getTotalStockValue()
    {
        return $this->quantity_remaining * $this->selling_price;
    }

    public function getProfitMargin()
    {
        if ($this->purchase_price == 0) return 0;
        
        return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
    }

    public function updateQuantity($quantity, $operation = 'subtract')
    {
        if ($operation === 'subtract') {
            $this->quantity_remaining = max(0, $this->quantity_remaining - $quantity);
        } else {
            $this->quantity_remaining += $quantity;
        }

        if ($this->quantity_remaining == 0) {
            $this->status = 'depleted';
        }

        $this->save();
    }
}