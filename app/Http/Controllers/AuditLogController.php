<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('search'))     $query->search($request->search);
        if ($request->filled('event'))      $query->byEvent($request->event);
        if ($request->filled('user_id'))    $query->byUser($request->user_id);
        if ($request->filled('severity'))   $query->bySeverity($request->severity);
        if ($request->filled('date_range')) $query->byDateRange($request->date_range);

        $auditLogs  = $query->paginate(50);
        $statistics = $this->getSecurityStatistics($request);

        $data = [
            'auditLogs'  => $auditLogs,
            'statistics' => $statistics,
            'filters'    => $request->only(['search','event','user_id','severity','date_range']),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('AuditLogs', $data);
    }

    private function getSecurityStatistics(Request $request)
    {
        $dateRange = $request->get('date_range', 'today');
        $query = AuditLog::query();

        // Apply date range to statistics
        $query->byDateRange($dateRange);

        return [
            'total_events' => $query->count(),
            'failed_logins' => (clone $query)->where('event', 'failed_login')->count(),
            'controlled_substance_access' => (clone $query)->where('event', 'controlled_substance_access')->count(),
            'prescription_modifications' => (clone $query)->where('event', 'prescription_modified')->count(),
            'data_exports' => (clone $query)->where('event', 'data_export')->count(),
            'unauthorized_attempts' => (clone $query)->where('event', 'unauthorized_access_attempt')->count(),
            'compliance_violations' => (clone $query)->where('compliance_flag', true)->count(),
        ];
    }

    public function export(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('event')) {
            $query->byEvent($request->event);
        }

        if ($request->filled('user_id')) {
            $query->byUser($request->user_id);
        }

        if ($request->filled('severity')) {
            $query->bySeverity($request->severity);
        }

        if ($request->filled('date_range')) {
            $query->byDateRange($request->date_range);
        }

        $auditLogs = $query->get();

        // Generate CSV
        $filename = 'audit_logs_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($auditLogs) {
            $file = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($file, [
                'ID', 'Event', 'User', 'Description', 'IP Address', 
                'Patient ID', 'Prescription Number', 'Medication', 
                'Controlled Substance', 'Risk Level', 'Severity', 
                'Created At'
            ]);

            // CSV data
            foreach ($auditLogs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->event,
                    $log->user->name ?? 'System',
                    $log->description,
                    $log->ip_address,
                    $log->patient_id,
                    $log->prescription_number,
                    $log->medication_name,
                    $log->controlled_substance,
                    $log->risk_level,
                    $log->severity,
                    $log->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function securityDashboard(Request $request)
    {
        $data = [
            'metrics'              => ['failed_logins_24h' => AuditLog::where('event','failed_login')->where('created_at','>=',now()->subDay())->count(), 'unique_ips_24h' => AuditLog::where('created_at','>=',now()->subDay())->distinct('ip_address')->count(), 'critical_events_24h' => AuditLog::where('severity','critical')->where('created_at','>=',now()->subDay())->count(), 'compliance_violations_30d' => AuditLog::where('compliance_flag',true)->where('created_at','>=',now()->subDays(30))->count()],
            'recentEvents'         => AuditLog::whereIn('event',['login','logout','failed_login','password_changed','unauthorized_access_attempt','security_breach_detected'])->with('user')->latest()->limit(20)->get(),
            'suspiciousActivities' => [],
            'threatIntelligence'   => ['blocked_ips' => 0, 'security_breaches' => 0, 'unauthorized_attempts' => AuditLog::where('event','unauthorized_access_attempt')->where('created_at','>=',now()->subDays(30))->count()],
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Security/Dashboard', $data);
    }

    public function complianceDashboard(Request $request)
    {
        $data = ['metrics' => ['dea_events_30d' => AuditLog::whereIn('event',['controlled_substance_access','narcotic_dispensed'])->where('created_at','>=',now()->subDays(30))->count(), 'hipaa_events_30d' => AuditLog::whereNotNull('patient_id')->where('created_at','>=',now()->subDays(30))->count(), 'prescription_modifications_30d' => AuditLog::where('event','prescription_modified')->where('created_at','>=',now()->subDays(30))->count(), 'data_exports_30d' => AuditLog::where('event','data_export')->where('created_at','>=',now()->subDays(30))->count()]];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Compliance/Dashboard', $data);
    }

    public function flagForReview(Request $request, AuditLog $auditLog)
    {
        $auditLog->update(['requires_review' => true, 'compliance_flag' => true]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Audit log flagged for review.']);
        }

        return back()->with('success', 'Audit log flagged for review');
    }
}