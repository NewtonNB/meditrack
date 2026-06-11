<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

trait TracksActivity
{
    /**
     * Boot the trait
     */
    protected static function bootTracksActivity()
    {
        // Track when models are created
        static::created(function (Model $model) {
            $model->logModelActivity('created', "Created {$model->getActivityDescription()}");
        });

        // Track when models are updated
        static::updated(function (Model $model) {
            $model->logModelActivity('updated', "Updated {$model->getActivityDescription()}", [
                'old_values' => $model->getOriginal(),
                'new_values' => $model->getAttributes(),
            ]);
        });

        // Track when models are deleted
        static::deleted(function (Model $model) {
            $model->logModelActivity('deleted', "Deleted {$model->getActivityDescription()}");
        });
    }

    /**
     * Log an activity for this model
     */
    public function logModelActivity(string $event, string $description = null, array $properties = []): ActivityLog
    {
        $attributes = [
            'subject_type' => get_class($this),
            'subject_id' => $this->getKey(),
            'event' => $event,
            'description' => $description ?: $this->getDefaultActivityDescription($event),
            'properties' => $properties,
        ];

        // Add old and new values for update events
        if ($event === 'updated' && isset($properties['old_values']) && isset($properties['new_values'])) {
            $attributes['old_values'] = $properties['old_values'];
            $attributes['new_values'] = $properties['new_values'];
            unset($attributes['properties']['old_values'], $attributes['properties']['new_values']);
        }

        return ActivityLog::createLog($attributes);
    }

    /**
     * Get a description for the activity
     */
    public function getActivityDescription(): string
    {
        // Try to get a name or title
        if (isset($this->name)) {
            return "\"{$this->name}\"";
        }
        
        if (isset($this->title)) {
            return "\"{$this->title}\"";
        }

        // Fall back to model name and ID
        $modelName = class_basename(get_class($this));
        return "{$modelName} #{$this->getKey()}";
    }

    /**
     * Get default activity description for an event
     */
    protected function getDefaultActivityDescription(string $event): string
    {
        $modelName = class_basename(get_class($this));
        $description = $this->getActivityDescription();
        
        return match($event) {
            'created' => "Created {$modelName} {$description}",
            'updated' => "Updated {$modelName} {$description}",
            'deleted' => "Deleted {$modelName} {$description}",
            default => "Performed {$event} on {$modelName} {$description}",
        };
    }

    /**
     * Get all activities for this model
     */
    public function modelActivities()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    /**
     * Get recent activities for this model
     */
    public function recentModelActivities(int $limit = 10)
    {
        return $this->modelActivities()
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Log a custom activity
     */
    public function logCustomActivity(string $event, string $description, array $properties = []): ActivityLog
    {
        return $this->logModelActivity($event, $description, $properties);
    }

    /**
     * Log a sale activity
     */
    public function logSaleActivity(float $amount, int $quantity, string $customerName = null): ActivityLog
    {
        $description = "Sale completed";
        if ($customerName) {
            $description .= " for {$customerName}";
        }
        
        return $this->logModelActivity('sale_completed', $description, [
            'amount' => $amount,
            'quantity' => $quantity,
            'customer_name' => $customerName,
        ]);
    }

    /**
     * Log a stock activity
     */
    public function logStockActivity(string $type, int $quantity, int $oldStock, int $newStock): ActivityLog
    {
        $description = match($type) {
            'restock' => "Restocked {$quantity} units",
            'sale' => "Sold {$quantity} units",
            'adjustment' => "Stock adjusted by {$quantity} units",
            'expired' => "Removed {$quantity} expired units",
            default => "Stock {$type}: {$quantity} units",
        };

        return $this->logModelActivity('stock_' . $type, $description, [
            'quantity_changed' => $quantity,
            'old_stock' => $oldStock,
            'new_stock' => $newStock,
            'stock_type' => $type,
        ]);
    }

    /**
     * Log an alert activity
     */
    public function logAlertActivity(string $alertType, string $message, string $severity = 'warning'): ActivityLog
    {
        return $this->logModelActivity('alert_' . $alertType, $message, [
            'alert_type' => $alertType,
            'severity' => $severity,
        ]);
    }
}