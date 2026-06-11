<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnomalyDetection extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_type',
        'transaction_id',
        'anomaly_type',
        'risk_score',
        'description',
        'detected_at',
        'status',
        'reviewed_by',
        'resolution_notes'
    ];

    protected $casts = [
        'risk_score' => 'decimal:4',
        'detected_at' => 'datetime'
    ];

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeHighRisk($query, $threshold = 0.7)
    {
        return $query->where('risk_score', '>=', $threshold);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('anomaly_type', $type);
    }

    public function scopeByTransactionType($query, $transactionType)
    {
        return $query->where('transaction_type', $transactionType);
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

    public function markAsInvestigating(User $user)
    {
        $this->update([
            'status' => 'investigating',
            'reviewed_by' => $user->id
        ]);
    }

    public function resolve(User $user, string $notes)
    {
        $this->update([
            'status' => 'resolved',
            'reviewed_by' => $user->id,
            'resolution_notes' => $notes
        ]);
    }

    public function markAsFalsePositive(User $user, string $notes)
    {
        $this->update([
            'status' => 'false_positive',
            'reviewed_by' => $user->id,
            'resolution_notes' => $notes
        ]);
    }
}