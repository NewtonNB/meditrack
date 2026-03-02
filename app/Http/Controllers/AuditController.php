<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Services\AuditTrailService;
use App\Services\PermissionService;
use App\Models\User;
use Carbon\Carbon;

class AuditController extends Controller
{
    protected AuditTrailService $auditService;
    protected PermissionService $permissionService;

    public function __construct(AuditTrailService $auditService, PermissionService $permissionService)
    {
        $this->auditService = $auditService;
        $this->permissionService = $permissionService;
    }

    /**
     * Display audit logs dashboard.
     */
    public function index(Request $request): InertiaResponse
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'user_id' => ['nullable', 'exists:users,id'],
            'event' => ['nullable', 'string'],
            'subject_type' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        // Apply pharmacy filter for non-super admins
        $filters = $validated;
        if (!$user->isSuperAdmin()) {
            $filters['pharmacy_id'] = $user->pharmacy_id;
        }

        $auditLogs = $this->auditService->getAuditLogs($filters, $validated['per_page'] ?? 25);
        $statistics = $this->auditService->getAuditStatistics($filters);

        // Get filter options
        $users = $user->isSuperAdmin() 
            ? User::select('id', 'name', 'email')->get()
            : User::where('pharmacy_id', $user->pharmacy_id)->select('id', 'name', 'email')->get();

        $eventTypes = [
            'login', 'logout', 'failed_login', 'created', 'updated', 'deleted',
            'medicine_created', 'sale_processed', 'customer_created', 'supplier_created',
            'user_created', 'role_assigned', 'password_reset'
        ];

        $subjectTypes = [
            'App\\Models\\User' => 'User',
            'App\\Models\\Medicine' => 'Medicine',
            'App\\Models\\Sale' => 'Sale',
            'App\\Models\\Customer' => 'Customer',
            'App\\Models\\Supplier' => 'Supplier',
        ];

        return Inertia::render('AuditLogs', [
            'auditLogs' => $auditLogs,
            'statistics' => $statistics,
            'filters' => $validated,
            'users' => $users,
            'eventTypes' => $eventTypes,
            'subjectTypes' => $subjectTypes,
        ]);
    }

    /**
     * Export audit logs to CSV.
     */
    public function export(Request $request): Response
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'user_id' => ['nullable', 'exists:users,id'],
            'event' => ['nullable', 'string'],
            'subject_type' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        // Apply pharmacy filter for non-super admins
        $filters = $validated;
        if (!$user->isSuperAdmin()) {
            $filters['pharmacy_id'] = $user->pharmacy_id;
        }

        $csvData = $this->auditService->exportAuditData($filters);
        
        // Log the export activity
        $this->auditService->logCustomActivity(
            'audit_export',
            'Exported audit trail data',
            [
                'filters' => $filters,
                'export_format' => 'csv',
            ]
        );

        $filename = 'audit_trail_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Get security events dashboard.
     */
    public function security(Request $request): InertiaResponse
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        // Apply pharmacy filter for non-super admins
        $filters = $validated;
        if (!$user->isSuperAdmin()) {
            $filters['pharmacy_id'] = $user->pharmacy_id;
        }

        $securityEvents = $this->auditService->getSecurityEvents($filters);
        $suspiciousActivities = $this->auditService->detectSuspiciousActivities();

        return Inertia::render('SecurityDashboard', [
            'securityEvents' => $securityEvents,
            'suspiciousActivities' => $suspiciousActivities,
            'filters' => $validated,
        ]);
    }

    /**
     * Generate compliance report.
     */
    public function complianceReport(Request $request): InertiaResponse
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date'],
            'report_type' => ['required', 'in:user_activity,data_changes,security_events,full'],
        ]);

        // Apply pharmacy filter for non-super admins
        $filters = $validated;
        if (!$user->isSuperAdmin()) {
            $filters['pharmacy_id'] = $user->pharmacy_id;
        }

        $reportData = $this->generateComplianceReportData($filters);
        
        // Log report generation
        $this->auditService->logCustomActivity(
            'compliance_report_generated',
            "Generated {$validated['report_type']} compliance report",
            [
                'report_type' => $validated['report_type'],
                'date_range' => [
                    'start' => $validated['start_date'],
                    'end' => $validated['end_date'],
                ],
            ]
        );

        return Inertia::render('ComplianceReport', [
            'reportData' => $reportData,
            'filters' => $validated,
        ]);
    }

    /**
     * Get real-time activity feed.
     */
    public function activityFeed(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();
        
        $filters = ['limit' => 20];
        if (!$user->isSuperAdmin()) {
            $filters['pharmacy_id'] = $user->pharmacy_id;
        }

        $recentActivities = $this->auditService->getAuditLogs($filters, 20);

        return response()->json([
            'activities' => $recentActivities->items(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Clean up old audit logs.
     */
    public function cleanup(Request $request): \Illuminate\Http\RedirectResponse
    {
        // Only super admins can perform cleanup
        if (!auth()->user()->isSuperAdmin()) {
            abort(403, 'Only super administrators can perform audit log cleanup.');
        }

        $validated = $request->validate([
            'days_to_keep' => ['required', 'integer', 'min:30', 'max:2555'], // Max ~7 years
        ]);

        $deletedCount = $this->auditService->cleanupOldLogs($validated['days_to_keep']);
        
        // Log the cleanup activity
        $this->auditService->logCustomActivity(
            'audit_cleanup',
            "Cleaned up old audit logs (deleted {$deletedCount} records)",
            [
                'days_kept' => $validated['days_to_keep'],
                'records_deleted' => $deletedCount,
            ]
        );

        return back()->with('success', "Cleaned up {$deletedCount} old audit log records.");
    }

    /**
     * Generate compliance report data based on type.
     */
    protected function generateComplianceReportData(array $filters): array
    {
        $reportType = $filters['report_type'];
        $startDate = Carbon::parse($filters['start_date']);
        $endDate = Carbon::parse($filters['end_date']);

        $data = [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'days' => $startDate->diffInDays($endDate) + 1,
            ],
            'generated_at' => now()->toISOString(),
            'generated_by' => auth()->user()->name,
        ];

        switch ($reportType) {
            case 'user_activity':
                $data['user_activities'] = $this->getUserActivityReport($filters);
                break;
                
            case 'data_changes':
                $data['data_changes'] = $this->getDataChangesReport($filters);
                break;
                
            case 'security_events':
                $data['security_events'] = $this->getSecurityEventsReport($filters);
                break;
                
            case 'full':
                $data['user_activities'] = $this->getUserActivityReport($filters);
                $data['data_changes'] = $this->getDataChangesReport($filters);
                $data['security_events'] = $this->getSecurityEventsReport($filters);
                break;
        }

        return $data;
    }

    /**
     * Get user activity report data.
     */
    protected function getUserActivityReport(array $filters): array
    {
        $activities = $this->auditService->getAuditLogs($filters, 1000);
        
        return [
            'total_activities' => $activities->total(),
            'activities_by_user' => $activities->groupBy('user.name')->map->count(),
            'activities_by_day' => $activities->groupBy(function ($item) {
                return $item->created_at->format('Y-m-d');
            })->map->count(),
        ];
    }

    /**
     * Get data changes report data.
     */
    protected function getDataChangesReport(array $filters): array
    {
        $changeEvents = ['created', 'updated', 'deleted'];
        $filters['event'] = $changeEvents;
        
        $changes = $this->auditService->getAuditLogs($filters, 1000);
        
        return [
            'total_changes' => $changes->total(),
            'changes_by_type' => $changes->groupBy('event')->map->count(),
            'changes_by_model' => $changes->groupBy('subject_type')->map->count(),
        ];
    }

    /**
     * Get security events report data.
     */
    protected function getSecurityEventsReport(array $filters): array
    {
        $securityEvents = $this->auditService->getSecurityEvents($filters);
        $suspiciousActivities = $this->auditService->detectSuspiciousActivities();
        
        return [
            'total_security_events' => $securityEvents->count(),
            'events_by_type' => $securityEvents->groupBy('event')->map->count(),
            'suspicious_activities' => $suspiciousActivities->count(),
            'failed_logins' => $securityEvents->where('event', 'failed_login')->count(),
        ];
    }
}