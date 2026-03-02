<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'medicine_id',
        'quantity_ordered',
        'quantity_received',
        'unit_cost',
        'total_cost',
        'batch_number',
        'expiry_date',
        'manufacturing_date',
        'notes',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'manufacturing_date' => 'date',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    // Helper methods
    public function getRemainingQuantityAttribute()
    {
        return $this->quantity_ordered - $this->quantity_received;
    }

    public function getIsFullyReceivedAttribute()
    {
        return $this->quantity_received >= $this->quantity_ordered;
    }

    public function getReceivePercentageAttribute()
    {
        if ($this->quantity_ordered == 0) return 0;
        return round(($this->quantity_received / $this->quantity_ordered) * 100, 2);
    }

    public function receiveQuantity($quantity, $batchNumber = null, $expiryDate = null)
    {
        $maxReceivable = $this->remaining_quantity;
        $actualQuantity = min($quantity, $maxReceivable);
        
        $this->increment('quantity_received', $actualQuantity);
        
        if ($batchNumber) {
            $this->batch_number = $batchNumber;
        }
        
        if ($expiryDate) {
            $this->expiry_date = $expiryDate;
        }
        
        $this->save();
        
        return $actualQuantity;
    }
}