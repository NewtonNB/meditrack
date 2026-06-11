<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\TenantScope;
use App\Traits\Auditable;

class StockMovement extends Model
{
    use HasFactory, TenantScope, Auditable;

    protected $fillable = [
        'medicine_id',
        'warehouse_id',
        'pharmacy_id',
        'batch_id',
        'movement_type',
        'quantity',
        'unit_cost',
        'reference',
        'unit_type',
        'reference_type',
        'reference_id',
        'notes',
        'created_by',
        // Legacy fields for backward compatibility
        'quantity_change',
        'type',
        'note',
    ];

    // Relationships
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Alias for creator (for backward compatibility)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pharmacy()
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'reference_id')->where('reference_type', 'sale');
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('movement_type', $type);
    }

    public function scopeByWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeByMedicine($query, $medicineId)
    {
        return $query->where('medicine_id', $medicineId);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Accessors for backward compatibility
    public function getQuantityChangeAttribute()
    {
        return $this->quantity;
    }

    public function getTypeAttribute()
    {
        return $this->movement_type;
    }

    public function getNoteAttribute()
    {
        return $this->notes;
    }

    // Methods
    public function getFormattedQuantity()
    {
        $sign = in_array($this->movement_type, ['in', 'transfer']) ? '+' : '-';
        return $sign . $this->quantity . ' ' . $this->unit_type;
    }

    public function getMovementDescription()
    {
        $descriptions = [
            'in' => 'Stock Added',
            'out' => 'Stock Removed',
            'transfer' => 'Stock Transfer',
            'adjustment' => 'Stock Adjustment',
            'expired' => 'Stock Expired',
            'damaged' => 'Stock Damaged'
        ];

        return $descriptions[$this->movement_type] ?? 'Unknown Movement';
    }
}







