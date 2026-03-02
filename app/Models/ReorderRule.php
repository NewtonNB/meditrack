<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ReorderRule extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'medicine_id',
        'warehouse_id',
        'min_stock',
        'max_stock',
        'reorder_point',
        'reorder_quantity',
        'supplier_id',
        'lead_time_days',
        'is_active',
        'seasonal_adjustments'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'seasonal_adjustments' => 'array'
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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    // Methods
    public function getAdjustedReorderQuantity($month = null)
    {
        $month = $month ?: strtolower(now()->format('F'));
        $adjustments = $this->seasonal_adjustments ?? [];
        
        $multiplier = $adjustments[$month] ?? 1.0;
        
        return round($this->reorder_quantity * $multiplier);
    }

    public function shouldReorder($currentStock)
    {
        return $this->is_active && $currentStock <= $this->reorder_point;
    }

    public function getReorderUrgency($currentStock)
    {
        if (!$this->shouldReorder($currentStock)) {
            return 'normal';
        }

        $percentage = ($currentStock / $this->reorder_point) * 100;

        if ($percentage <= 25) return 'critical';
        if ($percentage <= 50) return 'high';
        if ($percentage <= 75) return 'medium';
        
        return 'low';
    }
}