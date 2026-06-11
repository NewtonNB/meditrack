<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'notification_type',
        'in_app_enabled',
        'email_enabled',
        'sms_enabled',
        'conditions'
    ];

    protected $casts = [
        'in_app_enabled' => 'boolean',
        'email_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'conditions' => 'array'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Methods
    public static function getDefaultPreferences()
    {
        return [
            'low_stock' => [
                'in_app_enabled' => true,
                'email_enabled' => true,
                'sms_enabled' => false
            ],
            'expiry_alert' => [
                'in_app_enabled' => true,
                'email_enabled' => true,
                'sms_enabled' => false
            ],
            'sale_completed' => [
                'in_app_enabled' => true,
                'email_enabled' => false,
                'sms_enabled' => false
            ],
            'system_alert' => [
                'in_app_enabled' => true,
                'email_enabled' => true,
                'sms_enabled' => false
            ]
        ];
    }

    public static function getUserPreference($userId, $notificationType)
    {
        return self::where('user_id', $userId)
                  ->where('notification_type', $notificationType)
                  ->first();
    }

    public static function isEnabledForUser($userId, $notificationType, $channel = 'in_app')
    {
        $preference = self::getUserPreference($userId, $notificationType);
        
        if (!$preference) {
            $defaults = self::getDefaultPreferences();
            return $defaults[$notificationType][$channel . '_enabled'] ?? false;
        }
        
        return $preference->{$channel . '_enabled'};
    }
}