<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class SaleItem extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'sale_id',
        'medicine_id',
        'batch_id',
        'quantity',
        'unit_price',
        'total_price',
        'discount_amount',
        'tax_amount'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2'
    ];

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    // Methods
    public function getSubtotal()
    {
        return $this->quantity * $this->unit_price;
    }

    public function getDiscountPercentage()
    {
        $subtotal = $this->getSubtotal();
        return $subtotal > 0 ? ($this->discount_amount / $subtotal) * 100 : 0;
    }

    public function getFinalPrice()
    {
        return $this->total_price - $this->discount_amount + $this->tax_amount;
    }

    public function getFormattedQuantity()
    {
        return number_format($this->quantity, 2) . ' ' . ($this->medicine->unit ?? 'units');
    }

    public function getFormattedPrice()
    {
        return '$' . number_format($this->unit_price, 2);
    }

    public function getFormattedTotal()
    {
        return '$' . number_format($this->total_price, 2);
    }
}