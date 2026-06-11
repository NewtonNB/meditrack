<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PaymentTransaction extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'sale_id',
        'payment_method',
        'amount',
        'currency',
        'reference_number',
        'gateway_response',
        'status',
        'processed_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'processed_at' => 'datetime'
    ];

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    // Methods
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function markAsCompleted($referenceNumber = null, $gatewayResponse = null)
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now(),
            'reference_number' => $referenceNumber ?? $this->reference_number,
            'gateway_response' => $gatewayResponse ?? $this->gateway_response
        ]);
    }

    public function markAsFailed($errorMessage = null)
    {
        $this->update([
            'status' => 'failed',
            'processed_at' => now(),
            'gateway_response' => array_merge($this->gateway_response ?? [], [
                'error' => $errorMessage,
                'failed_at' => now()->toISOString()
            ])
        ]);
    }

    public function getFormattedAmount()
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }

    public function getPaymentMethodLabel()
    {
        $labels = [
            'cash' => 'Cash',
            'card' => 'Card Payment',
            'mobile_money' => 'Mobile Money',
            'insurance' => 'Insurance',
            'loyalty_points' => 'Loyalty Points'
        ];

        return $labels[$this->payment_method] ?? ucfirst($this->payment_method);
    }
}
