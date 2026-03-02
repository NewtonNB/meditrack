<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'event',
        'event_type',
        'user_id',
        'user_type',
        'subject_id',
        'subject_type',
        'description',
        'properties',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'location',
        'session_id',
        'patient_id',
        'prescription_number',
        'medication_name',
        'controlled_substance',
        'risk_level',
        'severity',
        'requires_review',
        'compliance_flag',
    ];

    protected $casts = [
        'properties' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'requires_review' => 'boolean',
        'compliance_flag' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    // Scopes for filtering
    public function scopeByEvent($query, $event)
    {
        return $query->where('event', $event);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeByDateRange($query, $range)
    {
        $now = now();
        
        switch ($range) {
            case 'today':
                return $query->whereDate('created_at', $now->toDateString());
            case 'yesterday':
                return $query->whereDate('created_at', $now->subDay()->toDateString());
            case 'week':
                return $query->where('created_at', '>=', $now->startOfWeek());
            case 'month':
                return $query->where('created_at', '>=', $now->startOfMonth());
            case 'quarter':
                return $query->where('created_at', '>=', $now->startOfQuarter());
            case 'year':
                return $query->where('created_at', '>=', $now->startOfYear());
            default:
                return $query;
        }
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('description', 'like', "%{$search}%")
              ->orWhere('event', 'like', "%{$search}%")
              ->orWhere('ip_address', 'like', "%{$search}%")
              ->orWhere('medication_name', 'like', "%{$search}%")
              ->orWhere('prescription_number', 'like', "%{$search}%")
              ->orWhereHas('user', function ($userQuery) use ($search) {
                  $userQuery->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
              });
        });
    }

    // Security and compliance methods
    public function isCritical(): bool
    {
        return $this->severity === 'critical' || 
               in_array($this->event, [
                   'failed_login', 
                   'unauthorized_access_attempt', 
                   'security_breach_detected',
                   'hipaa_violation'
               ]);
    }

    public function isControlledSubstance(): bool
    {
        return !empty($this->controlled_substance) || 
               in_array($this->event, [
                   'controlled_substance_access',
                   'narcotic_dispensed'
               ]);
    }

    public function requiresComplianceReview(): bool
    {
        return $this->compliance_flag || 
               $this->isControlledSubstance() || 
               $this->patient_id !== null;
    }

    // Automatic risk assessment
    public function assessRisk(): string
    {
        if ($this->isCritical()) {
            return 'high';
        }
        
        if ($this->isControlledSubstance() || $this->patient_id) {
            return 'medium';
        }
        
        return 'low';
    }

    // Get location from IP address (placeholder for actual geolocation service)
    public function getLocationFromIP(): ?string
    {
        if (!$this->ip_address) {
            return null;
        }
        
        // In production, integrate with a geolocation service
        // For now, return a placeholder
        return "Location for {$this->ip_address}";
    }
}