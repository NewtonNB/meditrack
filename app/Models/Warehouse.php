<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Warehouse extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'code',
        'address',
        'type',
        'is_active',
        'settings'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array'
    ];

    // Relationships
    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function stockLevels()
    {
        return $this->hasMany(StockLevel::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function reorderRules()
    {
        return $this->hasMany(ReorderRule::class);
    }

    public function stockAudits()
    {
        return $this->hasMany(StockAudit::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Methods
    public function getTotalStockValue()
    {
        return $this->stockLevels()
            ->join('medicines', 'stock_levels.medicine_id', '=', 'medicines.id')
            ->sum(\DB::raw('stock_levels.quantity * medicines.price'));
    }

    public function getLowStockItems($threshold = null)
    {
        $query = $this->stockLevels()
            ->join('medicines', 'stock_levels.medicine_id', '=', 'medicines.id')
            ->where('stock_levels.quantity', '<=', \DB::raw('medicines.reorder_level'));
            
        if ($threshold) {
            $query->where('stock_levels.quantity', '<=', $threshold);
        }
        
        return $query->get();
    }

    public function getExpiringBatches($days = 30)
    {
        return $this->stockLevels()
            ->join('batches', 'stock_levels.batch_id', '=', 'batches.id')
            ->where('batches.expiry_date', '<=', now()->addDays($days))
            ->where('batches.status', 'active')
            ->get();
    }
}