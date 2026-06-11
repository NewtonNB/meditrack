<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for AI and machine learning services
    |
    */

    'api_endpoint' => env('AI_API_ENDPOINT', 'http://localhost:5000'),
    
    'services' => [
        'stock_prediction' => [
            'enabled' => env('AI_STOCK_PREDICTION_ENABLED', true),
            'cache_timeout' => 3600, // 1 hour
            'fallback_enabled' => true,
        ],
        
        'expiry_prediction' => [
            'enabled' => env('AI_EXPIRY_PREDICTION_ENABLED', true),
            'cache_timeout' => 1800, // 30 minutes
            'alert_thresholds' => [90, 30, 14, 7], // days before expiry
        ],
        
        'anomaly_detection' => [
            'enabled' => env('AI_ANOMALY_DETECTION_ENABLED', true),
            'real_time' => true,
            'risk_threshold' => 0.7,
        ],
        
        'nlp_search' => [
            'enabled' => env('AI_NLP_SEARCH_ENABLED', true),
            'cache_timeout' => 600, // 10 minutes
            'min_confidence' => 0.5,
        ],
        
        'chatbot' => [
            'enabled' => env('AI_CHATBOT_ENABLED', true),
            'session_timeout' => 1800, // 30 minutes
            'escalation_threshold' => 0.3,
        ],
    ],

    'model_management' => [
        'auto_retrain' => env('AI_AUTO_RETRAIN', false),
        'retrain_schedule' => 'weekly',
        'performance_threshold' => 0.8,
        'backup_models' => 3,
    ],

    'data_privacy' => [
        'anonymize_training_data' => true,
        'data_retention_days' => 365,
        'gdpr_compliance' => true,
        'audit_predictions' => true,
    ],

    'performance' => [
        'request_timeout' => 30,
        'max_batch_size' => 100,
        'parallel_requests' => 5,
        'rate_limit' => 1000, // requests per hour
    ],
];