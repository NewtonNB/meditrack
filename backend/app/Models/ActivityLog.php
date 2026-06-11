<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Builder;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'pharmacy_id',
        'subject_type',
        'subject_id',
        'event',
        'description',
        'properties',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'url',
        'method',
    ];

    protected $casts = [
        'properties' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that performed the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the pharmacy context for the activity.
     */
    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    /**
     * Get the subject model that was acted upon.
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by pharmacy.
     */
    public function scopeByPharmacy(Builder $query, int $pharmacyId): Builder
    {
        return $query->where('pharmacy_id', $pharmacyId);
    }

    /**
     * Scope to filter by event type.
     */
    public function scopeByEvent(Builder $query, string $event): Builder
    {
        return $query->where('event', $event);
    }

    /**
     * Scope to filter by subject type.
     */
    public function scopeBySubjectType(Builder $query, string $subjectType): Builder
    {
        return $query->where('subject_type', $subjectType);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeByDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Get a human-readable description of the activity.
     */
    public function getFormattedDescriptionAttribute(): string
    {
        if ($this->description) {
            return $this->description;
        }

        $userName = $this->user ? $this->user->name : 'System';
        $subjectName = $this->getSubjectName();
        
        return match($this->event) {
            'created' => "{$userName} created {$subjectName}",
            'updated' => "{$userName} updated {$subjectName}",
            'deleted' => "{$userName} deleted {$subjectName}",
            'login' => "{$userName} logged in",
            'logout' => "{$userName} logged out",
            'failed_login' => "Failed login attempt for {$userName}",
            'role_assigned' => "{$userName} was assigned a new role",
            'role_removed' => "{$userName} had a role removed",
            default => "{$userName} performed {$this->event} on {$subjectName}",
        };
    }

    /**
     * Get a human-readable subject name.
     */
    protected function getSubjectName(): string
    {
        if (!$this->subject_type) {
            return 'unknown';
        }

        $modelName = class_basename($this->subject_type);
        
        if ($this->subject && method_exists($this->subject, 'name')) {
            return strtolower($modelName) . ' "' . $this->subject->name . '"';
        }
        
        if ($this->subject && method_exists($this->subject, 'title')) {
            return strtolower($modelName) . ' "' . $this->subject->title . '"';
        }
        
        return strtolower($modelName) . ' #' . $this->subject_id;
    }

    /**
     * Get changes made to the subject.
     */
    public function getChangesAttribute(): array
    {
        if (!$this->old_values || !$this->new_values) {
            return [];
        }

        $changes = [];
        foreach ($this->new_values as $key => $newValue) {
            $oldValue = $this->old_values[$key] ?? null;
            if ($oldValue !== $newValue) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }

        return $changes;
    }

    /**
     * Create an activity log entry.
     */
    public static function createLog(array $attributes): self
    {
        // Add request context if available
        if (request()) {
            $attributes = array_merge([
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
            ], $attributes);
        }

        // Add user context if authenticated
        if (auth()->check() && !isset($attributes['user_id'])) {
            $attributes['user_id'] = auth()->id();
            
            // Add pharmacy context if user has one
            if (auth()->user()->pharmacy_id && !isset($attributes['pharmacy_id'])) {
                $attributes['pharmacy_id'] = auth()->user()->pharmacy_id;
            }
        }

        return static::create($attributes);
    }
}