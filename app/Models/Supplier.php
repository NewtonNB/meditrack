<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\TenantScope;
use App\Traits\Auditable;
use App\Traits\TracksActivity;

class Supplier extends Model
{
    use HasFactory, TenantScope, Auditable, TracksActivity;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'created_by',
        'updated_by',
    ];

    public function medicines(): HasMany
    {
        return $this->hasMany(Medicine::class);
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



