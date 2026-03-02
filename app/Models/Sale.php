<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\TenantScope;
use App\Traits\Auditable;
use App\Traits\TracksActivity;

class Sale extends Model
{
    use HasFactory, TenantScope, Auditable, TracksActivity;

    protected $fillable = [
        'medicine_id',
        'customer_id',
        'customer',
        'customer_phone',
        'quantity',
        'unit_price',
        'total_price',
        'payment_method',
        'notes',
        'invoice',
        'date',
        'sold_at',
        'refund_amount',
        'refund_reason',
        'refund_notes',
        'refunded_at',
        'refunded_by',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sold_at' => 'datetime',
        'refunded_at' => 'datetime',
        'refund_amount' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function pharmacy()
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function refundedBy()
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}



