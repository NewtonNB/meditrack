<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'max_users',
        'max_medicines',
        'max_customers',
        'reports_enabled',
        'api_access',
        'custom_branding',
        'features',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'reports_enabled' => 'boolean',
        'api_access' => 'boolean',
        'custom_branding' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function pharmacyClients(): HasMany
    {
        return $this->hasMany(PharmacyClient::class, 'subscription_plan', 'slug');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
