<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class StockLevel extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'medicine_id',
        'warehouse_id',
        'batch_id',
        'quantity',
        'reserved_quantity',
        'unit_type',
        'last_updated',
        'audit_status'
    ];

    protected $casts = [
        'last_updated' => 'datetime'
    ];

    // Relationships
    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    // Scopes
    public function scopeLowStock($query)
    {
        return $query->join('medicines', 'stock_levels.medicine_id', '=', 'medicines.id')
                    ->where('stock_levels.quantity', '<=', \DB::raw('medicines.reorder_level'));
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeByMedicine($query, $medicineId)
    {
        return $query->where('medicine_id', $medicineId);
    }

    public function scopeAvailable($query)
    {
        return $query->where('quantity', '>', 0);
    }

    // Methods
    public function getAvailableQuantity()
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function isLowStock()
    {
        return $this->medicine && $this->quantity <= ($this->medicine->reorder_level ?? 10);
    }

    public function reserveStock($quantity)
    {
        if ($this->getAvailableQuantity() >= $quantity) {
            $this->reserved_quantity += $quantity;
            $this->save();
            return true;
        }
        return false;
    }

    public function releaseReservedStock($quantity)
    {
        $this->reserved_quantity = max(0, $this->reserved_quantity - $quantity);
        $this->save();
    }

    public function updateQuantity($quantity, $operation = 'add')
    {
        if ($operation === 'add') {
            $this->quantity += $quantity;
        } else {
            $this->quantity = max(0, $this->quantity - $quantity);
        }
        
        $this->last_updated = now();
        $this->save();
    }

    public function convertToUnit($targetUnit)
    {
        if (!$this->medicine) {
            return $this->quantity; // No medicine, return original quantity
        }
        
        $conversions = $this->medicine->unit_conversions ?? [];
        
        if (!isset($conversions[$targetUnit])) {
            return $this->quantity; // No conversion available
        }
        
        $conversionFactor = $conversions[$targetUnit];
        return $this->quantity / $conversionFactor;
    }
}