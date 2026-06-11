<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class POSTerminal extends Model
{
    use HasFactory, Auditable;

    protected $table = 'pos_terminals';

    protected $fillable = [
        'terminal_id',
        'name',
        'location',
        'warehouse_id',
        'ip_address',
        'printer_config',
        'cash_drawer_config',
        'scanner_config',
        'is_active',
        'last_sync'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_sync' => 'datetime',
        'printer_config' => 'array',
        'cash_drawer_config' => 'array',
        'scanner_config' => 'array'
    ];

    // Relationships
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOnline($query)
    {
        return $query->where('last_sync', '>=', now()->subMinutes(5));
    }

    // Methods
    public function isOnline()
    {
        return $this->last_sync && $this->last_sync >= now()->subMinutes(5);
    }

    public function updateSync()
    {
        $this->update(['last_sync' => now()]);
    }

    public function getStatusLabel()
    {
        if (!$this->is_active) {
            return 'Inactive';
        }
        
        return $this->isOnline() ? 'Online' : 'Offline';
    }

    public function getStatusColor()
    {
        if (!$this->is_active) {
            return 'secondary';
        }
        
        return $this->isOnline() ? 'success' : 'destructive';
    }
}