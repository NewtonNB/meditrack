<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpiryAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'batch_number',
        'expiry_date',
        'alert_date',
        'risk_score',
        'recommended_action',
        'status',
        'resolved_at'
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'alert_date' => 'date',
        'risk_score' => 'decimal:4',
        'resolved_at' => 'datetime'
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeHighRisk($query, $threshold = 0.7)
    {
        return $query->where('risk_score', '>=', $threshold);
    }

    public function scopeExpiringWithin($query, $days)
    {
        return $query->where('expiry_date', '<=', now()->addDays($days));
    }

    public function getDaysToExpiryAttribute()
    {
        return now()->diffInDays($this->expiry_date, false);
    }

    public function getRiskPercentageAttribute()
    {
        return round($this->risk_score * 100, 2);
    }

    public function getRiskLevelAttribute()
    {
        if ($this->risk_score >= 0.8) return 'Critical';
        if ($this->risk_score >= 0.6) return 'High';
        if ($this->risk_score >= 0.4) return 'Medium';
        return 'Low';
    }

    public function acknowledge()
    {
        $this->update(['status' => 'acknowledged']);
    }

    public function resolve($notes = null)
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'recommended_action' => $notes ?? $this->recommended_action
        ]);
    }
}