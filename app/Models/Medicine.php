<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\TenantScope;
use App\Traits\Auditable;
use App\Traits\TracksActivity;

class Medicine extends Model
{
    use HasFactory, TenantScope, Auditable, TracksActivity;

    protected $fillable = [
        'name',
        'code',
        'brand',
        'batch_number',
        'expiry_date',
        'cost_price',
        'purchase_price',
        'selling_price',
        'stock',
        'current_stock',
        'supplier_id',
        'reorder_level',
        'min_order_quantity',
        'category',
        'is_prescription',
        'base_unit',
        'base_unit_quantity',
        'package_type',
        'units_per_package',
        'price_per_piece',
        'price_per_package',
        'allow_fractional',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'price_per_piece' => 'decimal:2',
        'price_per_package' => 'decimal:2',
        'allow_fractional' => 'boolean',
    ];

    /**
     * Get profit margin percentage
     */
    public function getProfitMarginAttribute(): float
    {
        if (!$this->cost_price || $this->cost_price <= 0) {
            return 0;
        }
        
        return round((($this->selling_price - $this->cost_price) / $this->cost_price) * 100, 2);
    }

    /**
     * Get profit amount per unit
     */
    public function getProfitAmountAttribute(): float
    {
        return round($this->selling_price - $this->cost_price, 2);
    }

    /**
     * Check if pricing is within acceptable range
     */
    public function hasValidPricing(): bool
    {
        $pricingService = app(\App\Services\PricingService::class);
        $validation = $pricingService->validatePrice(
            $this->cost_price,
            $this->selling_price,
            $this->category
        );
        
        return $validation['valid'];
    }

    /**
     * Get pricing validation details
     */
    public function getPricingValidation(): array
    {
        $pricingService = app(\App\Services\PricingService::class);
        return $pricingService->validatePrice(
            $this->cost_price,
            $this->selling_price,
            $this->category
        );
    }

    /**
     * Get recommended pricing
     */
    public function getRecommendedPricing(): array
    {
        $pricingService = app(\App\Services\PricingService::class);
        return $pricingService->calculateRecommendedPrice(
            $this->cost_price,
            $this->category
        );
    }

    /**
     * Fields to exclude from audit logs.
     */
    protected $auditExcluded = [
        'cost_price', // Sensitive pricing information
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function pharmacy()
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }
}

