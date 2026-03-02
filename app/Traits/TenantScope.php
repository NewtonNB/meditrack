<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait TenantScope
{
    /**
     * Boot the tenant scope trait.
     */
    protected static function bootTenantScope()
    {
        static::creating(function ($model) {
            if (auth()->check() && auth()->user()->pharmacy_id) {
                $model->pharmacy_id = auth()->user()->pharmacy_id;
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if (auth()->check() && auth()->user()->pharmacy_id && !auth()->user()->isSuperAdmin()) {
                $builder->where('pharmacy_id', auth()->user()->pharmacy_id);
            }
        });
    }

    /**
     * Get the pharmacy that owns the model.
     */
    public function pharmacy()
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }
}
