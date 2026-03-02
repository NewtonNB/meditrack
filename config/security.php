<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    */

    'password_policy' => [
        'min_length' => 8,
        'require_uppercase' => true,
        'require_lowercase' => true,
        'require_numbers' => true,
        'require_symbols' => true,
        'max_attempts' => 5,
        'lockout_duration' => 900, // 15 minutes
    ],

    'session_security' => [
        'regenerate_on_login' => true,
        'invalidate_on_password_change' => true,
        'timeout_warning' => 300, // 5 minutes before expiry
    ],

    'api_security' => [
        'rate_limit' => 60, // requests per minute
        'token_expiry' => 1440, // minutes (24 hours)
        'require_https' => env('APP_ENV') === 'production',
    ],

    'file_upload' => [
        'max_size' => 5120, // KB (5MB)
        'allowed_types' => ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        'scan_for_malware' => env('SCAN_UPLOADS', false),
    ],

    'logging' => [
        'log_failed_logins' => true,
        'log_admin_actions' => true,
        'log_data_exports' => true,
        'retention_days' => 90,
    ],
];