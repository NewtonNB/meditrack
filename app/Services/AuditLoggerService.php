<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLoggerService
{
    public static function log(array $data)
    {
        // Automatically add common fields
        $logData = array_merge([
            'user_id' => Auth::id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'session_id' => session()->getId(),
            'created_at' => now(),
        ], $data);

        // Auto-assess risk level if not provided
        if (!isset($logData['risk_level'])) {
            $logData['risk_level'] = self::assessRiskLevel($logData);
        }

        // Auto-assess severity if not provided
        if (!isset($logData['severity'])) {
            $logData['severity'] = self::assessSeverity($logData);
        }

        // Set compliance flag for pharmacy-specific events
        if (!isset($logData['compliance_flag'])) {
            $logData['compliance_flag'] = self::requiresCompliance($logData);
        }

        return AuditLog::create($logData);
    }

    // Pharmacy-specific logging methods
    public static function logLogin($user, $success = true)
    {
        return self::log([
            'event' => $success ? 'login' : 'failed_login',
            'user_id' => $success ? $user->id : null,
            'description' => $success 
                ? "User {$user->name} logged in successfully" 
                : "Failed login attempt for {$user->email}",
            'severity' => $success ? 'info' : 'warning',
            'risk_level' => $success ? 'low' : 'medium',
        ]);
    }

    public static function logPrescriptionAccess($prescriptionId, $patientId, $medicationName, $controlledSubstance = null)
    {
        return self::log([
            'event' => 'prescription_accessed',
            'subject_id' => $prescriptionId,
            'subject_type' => 'Prescription',
            'patient_id' => $patientId,
            'prescription_number' => "RX-{$prescriptionId}",
            'medication_name' => $medicationName,
            'controlled_substance' => $controlledSubstance,
            'description' => "Accessed prescription for {$medicationName}" . 
                           ($controlledSubstance ? " (Schedule {$controlledSubstance})" : ''),
            'severity' => $controlledSubstance ? 'warning' : 'info',
            'risk_level' => $controlledSubstance ? 'high' : 'low',
            'compliance_flag' => !empty($controlledSubstance),
        ]);
    }

    public static function logControlledSubstanceAccess($medicationName, $schedule, $patientId = null)
    {
        return self::log([
            'event' => 'controlled_substance_access',
            'patient_id' => $patientId,
            'medication_name' => $medicationName,
            'controlled_substance' => $schedule,
            'description' => "Accessed controlled substance: {$medicationName} (Schedule {$schedule})",
            'severity' => 'warning',
            'risk_level' => 'high',
            'compliance_flag' => true,
            'requires_review' => true,
        ]);
    }

    public static function logDataExport($exportType, $recordCount)
    {
        return self::log([
            'event' => 'data_export',
            'description' => "Exported {$recordCount} {$exportType} records",
            'properties' => [
                'export_type' => $exportType,
                'record_count' => $recordCount,
            ],
            'severity' => 'info',
            'risk_level' => 'medium',
            'compliance_flag' => true,
        ]);
    }

    public static function logUnauthorizedAccess($attemptedResource)
    {
        return self::log([
            'event' => 'unauthorized_access_attempt',
            'description' => "Unauthorized access attempt to {$attemptedResource}",
            'properties' => [
                'attempted_resource' => $attemptedResource,
                'user_agent' => request()->userAgent(),
            ],
            'severity' => 'critical',
            'risk_level' => 'high',
            'requires_review' => true,
        ]);
    }

    public static function logPatientDataAccess($patientId, $dataType)
    {
        return self::log([
            'event' => 'patient_data_accessed',
            'patient_id' => $patientId,
            'description' => "Accessed patient {$dataType} data",
            'properties' => [
                'data_type' => $dataType,
            ],
            'severity' => 'info',
            'risk_level' => 'medium',
            'compliance_flag' => true, // HIPAA compliance
        ]);
    }

    public static function logPrescriptionModification($prescriptionId, $oldValues, $newValues)
    {
        return self::log([
            'event' => 'prescription_modified',
            'subject_id' => $prescriptionId,
            'subject_type' => 'Prescription',
            'prescription_number' => "RX-{$prescriptionId}",
            'description' => "Prescription modified",
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'severity' => 'warning',
            'risk_level' => 'high',
            'compliance_flag' => true,
            'requires_review' => true,
        ]);
    }

    // Risk assessment logic
    private static function assessRiskLevel(array $data): string
    {
        $event = $data['event'] ?? '';
        
        $highRiskEvents = [
            'failed_login', 'unauthorized_access_attempt', 'security_breach_detected',
            'controlled_substance_access', 'prescription_modified', 'hipaa_violation'
        ];
        
        $mediumRiskEvents = [
            'patient_data_accessed', 'data_export', 'password_changed', 'role_changed'
        ];
        
        if (in_array($event, $highRiskEvents)) {
            return 'high';
        }
        
        if (in_array($event, $mediumRiskEvents)) {
            return 'medium';
        }
        
        return 'low';
    }

    // Severity assessment logic
    private static function assessSeverity(array $data): string
    {
        $event = $data['event'] ?? '';
        
        $criticalEvents = [
            'security_breach_detected', 'hipaa_violation', 'unauthorized_access_attempt'
        ];
        
        $warningEvents = [
            'failed_login', 'controlled_substance_access', 'prescription_modified',
            'patient_data_accessed'
        ];
        
        if (in_array($event, $criticalEvents)) {
            return 'critical';
        }
        
        if (in_array($event, $warningEvents)) {
            return 'warning';
        }
        
        return 'info';
    }

    // Compliance requirement assessment
    private static function requiresCompliance(array $data): bool
    {
        $event = $data['event'] ?? '';
        
        $complianceEvents = [
            'controlled_substance_access', 'prescription_modified', 'patient_data_accessed',
            'data_export', 'hipaa_violation', 'narcotic_dispensed'
        ];
        
        return in_array($event, $complianceEvents) || 
               !empty($data['patient_id']) || 
               !empty($data['controlled_substance']);
    }
}