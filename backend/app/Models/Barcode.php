<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Barcode extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'code',
        'type',
        'medicine_id',
        'batch_id',
        'unit_type',
        'quantity_per_scan',
        'is_active',
        'metadata'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array'
    ];

    // Relationships
    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
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
    public function generateQRCode()
    {
        // Generate QR code data
        $data = [
            'medicine_id' => $this->medicine_id,
            'batch_id' => $this->batch_id,
            'code' => $this->code,
            'unit_type' => $this->unit_type,
            'quantity' => $this->quantity_per_scan
        ];

        return json_encode($data);
    }

    public function isExpired()
    {
        if ($this->batch) {
            return $this->batch->isExpired();
        }
        return false;
    }
}