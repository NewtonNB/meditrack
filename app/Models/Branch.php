<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Branch extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'warehouse_id',
        'name',
        'code',
        'manager_id',
        'address',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Relationships
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
