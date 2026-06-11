<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationPreference;
use App\Models\User;

class NotificationSystemSeeder extends Seeder
{
    public function run()
    {
        // Create notification templates
        $templates = NotificationTemplate::getDefaultTemplates();
        
        foreach ($templates as $template) {
            NotificationTemplate::firstOrCreate(
                ['type' => $template['type']],
                $template
            );
        }
        
        $this->command->info('Notification templates created successfully!');
        
        // Create default notification preferences for existing users
        $users = User::all();
        $defaultPreferences = \App\Models\NotificationPreference::getDefaultPreferences();
        
        foreach ($users as $user) {
            foreach ($defaultPreferences as $type => $settings) {
                NotificationPreference::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'notification_type' => $type
                    ],
                    array_merge($settings, [
                        'user_id' => $user->id,
                        'notification_type' => $type
                    ])
                );
            }
        }
        
        $this->command->info('Default notification preferences created for all users!');
        
        // Create some sample notifications for demonstration
        $this->createSampleNotifications();
    }
    
    protected function createSampleNotifications()
    {
        $notificationService = app(\App\Services\NotificationService::class);
        
        // Create sample system alerts
        $notificationService->createSystemAlert(
            'Welcome to MediTrack Notifications',
            'Your notification system is now active and ready to keep you informed about important events.',
            'medium'
        );
        
        $notificationService->createSystemAlert(
            'System Maintenance Scheduled',
            'System maintenance is scheduled for tonight at 2:00 AM. Expected downtime: 30 minutes.',
            'high'
        );
        
        // Create sample low stock alert (if medicines exist)
        $medicine = \App\Models\Medicine::first();
        if ($medicine) {
            $notificationService->createLowStockAlert($medicine, 5, 50);
        }
        
        $this->command->info('Sample notifications created!');
    }
}