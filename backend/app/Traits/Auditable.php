<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Auditable
{
    /**
     * Boot the auditable trait for a model.
     */
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->auditCreated();
        });

        static::updated(function ($model) {
            $model->auditUpdated();
        });

        static::deleted(function ($model) {
            $model->auditDeleted();
        });
    }

    /**
     * Get all activity logs for this model.
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    /**
     * Log the creation of the model.
     */
    protected function auditCreated(): void
    {
        $this->createActivityLog('created', [
            'new_values' => $this->getAuditableAttributes(),
            'description' => $this->getCreatedDescription(),
        ]);
    }

    /**
     * Log the update of the model.
     */
    protected function auditUpdated(): void
    {
        $changes = $this->getChanges();
        $original = $this->getOriginal();

        if (empty($changes)) {
            return; // No actual changes to log
        }

        // Filter out timestamps and audit fields from changes
        $filteredChanges = $this->filterAuditableChanges($changes);
        $filteredOriginal = array_intersect_key($original, $filteredChanges);

        if (empty($filteredChanges)) {
            return; // No meaningful changes to log
        }

        $this->createActivityLog('updated', [
            'old_values' => $filteredOriginal,
            'new_values' => $filteredChanges,
            'description' => $this->getUpdatedDescription($filteredChanges),
        ]);
    }

    /**
     * Log the deletion of the model.
     */
    protected function auditDeleted(): void
    {
        $this->createActivityLog('deleted', [
            'old_values' => $this->getAuditableAttributes(),
            'description' => $this->getDeletedDescription(),
        ]);
    }

    /**
     * Create an activity log entry for this model.
     */
    protected function createActivityLog(string $event, array $properties = []): void
    {
        try {
            // Set created_by/updated_by fields if user is authenticated
            if (auth()->check()) {
                if ($event === 'created' && $this->isFillable('created_by')) {
                    $this->setAttribute('created_by', auth()->id());
                } elseif ($event === 'updated' && $this->isFillable('updated_by')) {
                    $this->setAttribute('updated_by', auth()->id());
                }
            }

            ActivityLog::createLog(array_merge([
                'subject_type' => get_class($this),
                'subject_id' => $this->getKey(),
                'event' => $event,
            ], $properties));
        } catch (\Exception $e) {
            // Log the error but don't break the application
            \Log::error('Failed to create activity log', [
                'model' => get_class($this),
                'model_id' => $this->getKey(),
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get auditable attributes (excluding sensitive and system fields).
     */
    protected function getAuditableAttributes(): array
    {
        $attributes = $this->getAttributes();
        
        // Remove sensitive and system fields
        $excludedFields = array_merge(
            $this->getHidden(),
            $this->getAuditExcluded(),
            ['password', 'remember_token', 'created_at', 'updated_at']
        );

        return array_diff_key($attributes, array_flip($excludedFields));
    }

    /**
     * Filter changes to only include auditable fields.
     */
    protected function filterAuditableChanges(array $changes): array
    {
        $excludedFields = array_merge(
            $this->getAuditExcluded(),
            ['created_at', 'updated_at', 'created_by', 'updated_by']
        );

        return array_diff_key($changes, array_flip($excludedFields));
    }

    /**
     * Get fields that should be excluded from audit logs.
     */
    protected function getAuditExcluded(): array
    {
        return property_exists($this, 'auditExcluded') ? $this->auditExcluded : [];
    }

    /**
     * Get description for created event.
     */
    protected function getCreatedDescription(): string
    {
        $modelName = class_basename($this);
        $identifier = $this->getAuditIdentifier();
        
        return "Created {$modelName}" . ($identifier ? " '{$identifier}'" : '');
    }

    /**
     * Get description for updated event.
     */
    protected function getUpdatedDescription(array $changes): string
    {
        $modelName = class_basename($this);
        $identifier = $this->getAuditIdentifier();
        $changedFields = implode(', ', array_keys($changes));
        
        return "Updated {$modelName}" . ($identifier ? " '{$identifier}'" : '') . " - Changed: {$changedFields}";
    }

    /**
     * Get description for deleted event.
     */
    protected function getDeletedDescription(): string
    {
        $modelName = class_basename($this);
        $identifier = $this->getAuditIdentifier();
        
        return "Deleted {$modelName}" . ($identifier ? " '{$identifier}'" : '');
    }

    /**
     * Get a human-readable identifier for this model.
     */
    protected function getAuditIdentifier(): ?string
    {
        // Try common identifier fields
        foreach (['name', 'title', 'email', 'code', 'sku'] as $field) {
            if (isset($this->attributes[$field])) {
                return $this->attributes[$field];
            }
        }

        return null;
    }

    /**
     * Log a custom activity for this model.
     */
    public function logActivity(string $event, string $description = null, array $properties = []): void
    {
        $this->createActivityLog($event, array_merge([
            'description' => $description,
        ], $properties));
    }

    /**
     * Get recent activities for this model.
     */
    public function getRecentActivities(int $limit = 10)
    {
        return $this->activities()
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }
}