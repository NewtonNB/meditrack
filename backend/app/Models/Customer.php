<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\TenantScope;
use App\Traits\Auditable;
use App\Traits\TracksActivity;

class Customer extends Model
{
    use HasFactory, SoftDeletes, TenantScope, Auditable, TracksActivity;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'pharmacy_id',
        'created_by',
        'updated_by',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
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
}



