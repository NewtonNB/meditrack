<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'license_number',
        'subscription_plan',
        'status',
        'subscription_expires_at',
        'monthly_fee',
        'settings',
    ];

    protected $casts = [
        'subscription_expires_at' => 'datetime',
        'settings' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'pharmacy_id');
    }

    public function medicines(): HasMany
    {
        return $this->hasMany(Medicine::class, 'pharmacy_id');
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'pharmacy_id');
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class, 'pharmacy_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'pharmacy_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'pharmacy_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'pharmacy_id');
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan', 'slug');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function getTotalSalesAttribute(): float
    {
        return $this->sales()->sum('total_price');
    }

    public function getTotalUsersAttribute(): int
    {
        return $this->users()->count();
    }

    public function getTotalMedicinesAttribute(): int
    {
        return $this->medicines()->count();
    }

    public function getTotalCustomersAttribute(): int
    {
        return $this->customers()->count();
    }
}
