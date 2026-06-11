<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class AuditTrailService
{
    /**
     * Log an activity for a model.
     */
    public function logActivity(string $event, Model $model, array $properties = []): ActivityLog
    {
        return ActivityLog::createLog(array_merge([
            'subject_type' => get_class($model),
            'subject_id' => $model->getKey(),
            'event' => $event,
        ], $properties));
    }

    /**
     * Log a custom activity.
     */
    public function logCustomActivity(string $event, string $description, array $properties = []): ActivityLog
    {
        return ActivityLog::createLog(array_merge([
            'event' => $event,
            'description' => $description,
        ], $properties));
    }

    /**
     * Log user authentication events.
     */
    public function logAuthEvent(string $event, User $user = null, array $properties = []): ActivityLog
    {
        $description = match($event) {
            'login' => 'User logged in successfully',
            'logout' => 'User logged out',
            'failed_login' => 'Failed login attempt',
            'password_reset' => 'Password reset requested',
            'password_changed' => 'Password changed successfully',
            default => "Authentication event: {$event}",
        };

        return ActivityLog::createLog(array_merge([
            'user_id' => $user?->id,
            'pharmacy_id' => $user?->pharmacy_id,
            'event' => $event,
            'description' => $description,
        ], $properties));
    }

    /**
     * Get activity history for a specific model.
     */
    public function getModelHistory(Model $model, int $limit = 50): Collection
    {
        return ActivityLog::where('subject_type', get_class($model))
            ->where('subject_id', $model->getKey())
            ->with(['user', 'pharmacy'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activities for a specific user.
     */
    public function getUserActivities(User $user, array $filters = []): Collection
    {
        $query = ActivityLog::byUser($user->id)->with(['subject', 'pharmacy']);

        // Apply filters
        if (isset($filters['event'])) {
            $query->byEvent($filters['event']);
        }

        if (isset($filters['subject_type'])) {
            $query->bySubjectType($filters['subject_type']);
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->byDateRange($filters['start_date'], $filters['end_date']);
        }

        if (isset($filters['limit'])) {
            $query->limit($filters['limit']);
        }

        return $query->latest()->get();
    }

    /**
     * Get activities for a specific pharmacy.
     */
    public function getPharmacyActivities(int $pharmacyId, array $filters = []): Collection
    {
        $query = ActivityLog::byPharmacy($pharmacyId)->with(['user', 'subject']);

        // Apply filters
        $this->applyFilters($query, $filters);

        return $query->latest()->get();
    }

    /**
     * Get paginated audit logs with filters.
     */
    public function getAuditLogs(array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        $query = ActivityLog::with(['user', 'pharmacy', 'subject']);

        // Apply filters
        $this->applyFilters($query, $filters);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Apply filters to audit log query.
     */
    protected function applyFilters($query, array $filters): void
    {
        if (isset($filters['user_id'])) {
            $query->byUser($filters['user_id']);
        }

        if (isset($filters['pharmacy_id'])) {
            $query->byPharmacy($filters['pharmacy_id']);
        }

        if (isset($filters['event'])) {
            if (is_array($filters['event'])) {
                $query->whereIn('event', $filters['event']);
            } else {
                $query->byEvent($filters['event']);
            }
        }

        if (isset($filters['subject_type'])) {
            $query->bySubjectType($filters['subject_type']);
        }

        if (isset($filters['start_date'])) {
            $startDate = Carbon::parse($filters['start_date'])->startOfDay();
            $query->where('created_at', '>=', $startDate);
        }

        if (isset($filters['end_date'])) {
            $endDate = Carbon::parse($filters['end_date'])->endOfDay();
            $query->where('created_at', '<=', $endDate);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (isset($filters['limit'])) {
            $query->limit($filters['limit']);
        }
    }

    /**
     * Export audit data to CSV format.
     */
    public function exportAuditData(array $filters = []): string
    {
        $activities = $this->getAuditLogs($filters, 10000)->items(); // Large limit for export
        
        $csvData = [];
        $csvData[] = [
            'Date/Time',
            'User',
            'Event',
            'Description',
            'Subject Type',
            'Subject ID',
            'IP Address',
            'Changes'
        ];

        foreach ($activities as $activity) {
            $changes = '';
            if ($activity->changes) {
                $changeStrings = [];
                foreach ($activity->changes as $field => $change) {
                    $changeStrings[] = "{$field}: '{$change['old']}' → '{$change['new']}'";
                }
                $changes = implode('; ', $changeStrings);
            }

            $csvData[] = [
                $activity->created_at->format('Y-m-d H:i:s'),
                $activity->user ? $activity->user->name : 'System',
                $activity->event,
                $activity->formatted_description,
                $activity->subject_type ? class_basename($activity->subject_type) : '',
                $activity->subject_id ?? '',
                $activity->ip_address ?? '',
                $changes,
            ];
        }

        return $this->arrayToCsv($csvData);
    }

    /**
     * Get audit statistics.
     */
    public function getAuditStatistics(array $filters = []): array
    {
        $query = ActivityLog::query();
        $this->applyFilters($query, $filters);

        $totalActivities = $query->count();
        
        // Get activity counts by event type
        $eventCounts = $query->selectRaw('event, COUNT(*) as count')
            ->groupBy('event')
            ->pluck('count', 'event')
            ->toArray();

        // Get activity counts by user
        $userCounts = $query->selectRaw('user_id, COUNT(*) as count')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->user->name ?? 'Unknown' => $item->count];
            })
            ->toArray();

        // Get daily activity counts for the last 30 days
        $dailyCounts = ActivityLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        return [
            'total_activities' => $totalActivities,
            'event_counts' => $eventCounts,
            'user_counts' => $userCounts,
            'daily_counts' => $dailyCounts,
        ];
    }

    /**
     * Clean up old audit logs.
     */
    public function cleanupOldLogs(int $daysToKeep = 365): int
    {
        $cutoffDate = Carbon::now()->subDays($daysToKeep);
        
        return ActivityLog::where('created_at', '<', $cutoffDate)->delete();
    }

    /**
     * Get security events (login attempts, role changes, etc.).
     */
    public function getSecurityEvents(array $filters = []): Collection
    {
        $securityEvents = [
            'login', 'logout', 'failed_login', 'password_reset', 
            'password_changed', 'role_assigned', 'role_removed', 'roles_synced'
        ];

        $filters['event'] = $securityEvents;
        
        return collect($this->getAuditLogs($filters, 1000)->items());
    }

    /**
     * Detect suspicious activities.
     */
    public function detectSuspiciousActivities(): Collection
    {
        $suspiciousActivities = collect();

        // Multiple failed login attempts from same IP
        $failedLogins = ActivityLog::where('event', 'failed_login')
            ->where('created_at', '>=', Carbon::now()->subHours(1))
            ->selectRaw('ip_address, COUNT(*) as attempts')
            ->groupBy('ip_address')
            ->having('attempts', '>=', 5)
            ->get();

        foreach ($failedLogins as $login) {
            $suspiciousActivities->push([
                'type' => 'multiple_failed_logins',
                'description' => "Multiple failed login attempts from IP: {$login->ip_address}",
                'severity' => 'high',
                'count' => $login->attempts,
            ]);
        }

        // Unusual activity hours (outside 6 AM - 10 PM) - SQLite compatible
        $unusualHours = ActivityLog::whereRaw("CAST(strftime('%H', created_at) AS INTEGER) < 6 OR CAST(strftime('%H', created_at) AS INTEGER) > 22")
            ->where('created_at', '>=', Carbon::now()->subDays(1))
            ->with('user')
            ->get();

        foreach ($unusualHours as $activity) {
            $suspiciousActivities->push([
                'type' => 'unusual_hours',
                'description' => "Activity outside normal hours by " . ($activity->user->name ?? 'Unknown'),
                'severity' => 'medium',
                'activity' => $activity,
            ]);
        }

        return $suspiciousActivities;
    }

    /**
     * Convert array to CSV string.
     */
    protected function arrayToCsv(array $data): string
    {
        $output = fopen('php://temp', 'r+');
        
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
}