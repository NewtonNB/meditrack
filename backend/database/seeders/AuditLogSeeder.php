<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;

class AuditLogSeeder extends Seeder
{
    public function run()
    {
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $events = [
            // Authentication events
            ['event' => 'login', 'description' => 'User logged in successfully', 'severity' => 'info', 'risk_level' => 'low'],
            ['event' => 'logout', 'description' => 'User logged out', 'severity' => 'info', 'risk_level' => 'low'],
            ['event' => 'failed_login', 'description' => 'Failed login attempt', 'severity' => 'warning', 'risk_level' => 'medium'],
            
            // Prescription events
            ['event' => 'prescription_created', 'description' => 'New prescription created', 'severity' => 'info', 'risk_level' => 'low', 'prescription_number' => 'RX-' . rand(1000, 9999), 'medication_name' => 'Amoxicillin 500mg'],
            ['event' => 'prescription_modified', 'description' => 'Prescription modified', 'severity' => 'warning', 'risk_level' => 'high', 'prescription_number' => 'RX-' . rand(1000, 9999), 'medication_name' => 'Lisinopril 10mg', 'compliance_flag' => true],
            ['event' => 'prescription_dispensed', 'description' => 'Prescription dispensed to patient', 'severity' => 'info', 'risk_level' => 'low', 'prescription_number' => 'RX-' . rand(1000, 9999), 'medication_name' => 'Metformin 850mg'],
            
            // Controlled substance events
            ['event' => 'controlled_substance_access', 'description' => 'Accessed controlled substance inventory', 'severity' => 'warning', 'risk_level' => 'high', 'medication_name' => 'Oxycodone 5mg', 'controlled_substance' => 'II', 'compliance_flag' => true, 'requires_review' => true],
            ['event' => 'narcotic_dispensed', 'description' => 'Narcotic medication dispensed', 'severity' => 'warning', 'risk_level' => 'high', 'medication_name' => 'Morphine 15mg', 'controlled_substance' => 'II', 'compliance_flag' => true, 'requires_review' => true],
            
            // Data and compliance events
            ['event' => 'patient_data_accessed', 'description' => 'Patient medical data accessed', 'severity' => 'info', 'risk_level' => 'medium', 'patient_id' => rand(1, 100), 'compliance_flag' => true],
            ['event' => 'data_export', 'description' => 'Patient data exported for reporting', 'severity' => 'info', 'risk_level' => 'medium', 'compliance_flag' => true],
            ['event' => 'hipaa_violation', 'description' => 'Potential HIPAA violation detected', 'severity' => 'critical', 'risk_level' => 'high', 'patient_id' => rand(1, 100), 'compliance_flag' => true, 'requires_review' => true],
            
            // Security events
            ['event' => 'unauthorized_access_attempt', 'description' => 'Unauthorized access attempt detected', 'severity' => 'critical', 'risk_level' => 'high', 'requires_review' => true],
            ['event' => 'suspicious_activity', 'description' => 'Suspicious user activity detected', 'severity' => 'warning', 'risk_level' => 'high'],
            ['event' => 'security_breach_detected', 'description' => 'Potential security breach detected', 'severity' => 'critical', 'risk_level' => 'high', 'requires_review' => true],
            ['event' => 'ip_blocked', 'description' => 'IP address blocked due to suspicious activity', 'severity' => 'warning', 'risk_level' => 'medium'],
            
            // System events
            ['event' => 'system_configuration_changed', 'description' => 'System configuration modified', 'severity' => 'info', 'risk_level' => 'medium'],
            ['event' => 'backup_created', 'description' => 'System backup created successfully', 'severity' => 'info', 'risk_level' => 'low'],
            ['event' => 'audit_report_generated', 'description' => 'Compliance audit report generated', 'severity' => 'info', 'risk_level' => 'low', 'compliance_flag' => true],
        ];

        $ipAddresses = [
            '192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.45', 
            '198.51.100.78', '192.0.2.123', '10.1.1.200', '172.20.0.15'
        ];

        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        ];

        // Generate audit logs for the past 30 days
        for ($i = 0; $i < 500; $i++) {
            $event = $events[array_rand($events)];
            $user = $users->random();
            $createdAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

            AuditLog::create(array_merge($event, [
                'user_id' => $user->id,
                'ip_address' => $ipAddresses[array_rand($ipAddresses)],
                'user_agent' => $userAgents[array_rand($userAgents)],
                'session_id' => 'sess_' . uniqid(),
                'location' => $this->getRandomLocation(),
                'properties' => [
                    'browser' => $this->extractBrowser($userAgents[array_rand($userAgents)]),
                    'platform' => $this->extractPlatform($userAgents[array_rand($userAgents)]),
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]));
        }

        $this->command->info('Created 500 sample audit log entries');
    }

    private function getRandomLocation(): string
    {
        $locations = [
            'New York, NY, USA',
            'Los Angeles, CA, USA', 
            'Chicago, IL, USA',
            'Houston, TX, USA',
            'Phoenix, AZ, USA',
            'Philadelphia, PA, USA',
            'San Antonio, TX, USA',
            'San Diego, CA, USA',
            'Dallas, TX, USA',
            'San Jose, CA, USA',
        ];

        return $locations[array_rand($locations)];
    }

    private function extractBrowser(string $userAgent): string
    {
        if (str_contains($userAgent, 'Chrome')) return 'Chrome';
        if (str_contains($userAgent, 'Firefox')) return 'Firefox';
        if (str_contains($userAgent, 'Safari')) return 'Safari';
        if (str_contains($userAgent, 'Edge')) return 'Edge';
        return 'Unknown';
    }

    private function extractPlatform(string $userAgent): string
    {
        if (str_contains($userAgent, 'Windows')) return 'Windows';
        if (str_contains($userAgent, 'Macintosh')) return 'macOS';
        if (str_contains($userAgent, 'Linux')) return 'Linux';
        if (str_contains($userAgent, 'iPhone')) return 'iOS';
        if (str_contains($userAgent, 'Android')) return 'Android';
        return 'Unknown';
    }
}