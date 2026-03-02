<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'subscription_plan_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'transaction_id',
        'paid_at',
        'due_date',
        'notes',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'due_date' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'completed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isOverdue(): bool
    {
        return $this->isPending() && $this->due_date->isPast();
    }
}
