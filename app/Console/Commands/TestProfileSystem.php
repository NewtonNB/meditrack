<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\UserPreferencesService;

class TestProfileSystem extends Command
{
    protected $signature = 'test:profile-system';
    protected $description = 'Test the enhanced profile system functionality';

    protected $userPreferencesService;

    public function __construct(UserPreferencesService $userPreferencesService)
    {
        parent::__construct();
        $this->userPreferencesService = $userPreferencesService;
    }

    public function handle()
    {
        $this->info('Testing Enhanced Profile System...');
        $this->newLine();

        // Test 1: Get first user
        $user = User::first();
        if (!$user) {
            $this->error('No users found in database');
            return 1;
        }

        $this->info("Testing with user: {$user->name} ({$user->email})");
        $this->newLine();

        // Test 2: Profile completion
        $completion = $user->profile_completion;
        $this->info("Profile Completion: {$completion}%");

        // Test 3: Avatar URL
        $avatarUrl = $user->avatar_url;
        $this->info("Avatar URL: {$avatarUrl}");

        // Test 4: User preferences
        $preferences = $this->userPreferencesService->getUserPreferences($user);
        $this->info('User Preferences:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['Theme', $preferences['theme']],
                ['Language', $preferences['language']],
                ['Timezone', $preferences['timezone']],
                ['Date Format', $preferences['date_format']],
                ['Time Format', $preferences['time_format']],
                ['Currency', $preferences['currency']],
                ['Email Notifications', $preferences['notifications_email'] ? 'Yes' : 'No'],
                ['Browser Notifications', $preferences['notifications_browser'] ? 'Yes' : 'No'],
                ['SMS Notifications', $preferences['notifications_sms'] ? 'Yes' : 'No'],
            ]
        );

        // Test 5: User stats
        $stats = $this->userPreferencesService->getUserStats($user);
        $this->info('User Statistics:');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Profile Completion', $stats['profile_completion'] . '%'],
                ['Member Since', $stats['member_since']],
                ['Last Login', $stats['last_login'] ?? 'Never'],
                ['Total Logins', $stats['total_logins']],
                ['Active Sessions', $stats['active_sessions']],
            ]
        );

        // Test 6: Update preferences
        $this->info('Testing preference updates...');
        $this->userPreferencesService->updateUserPreferences($user, [
            'theme' => 'dark',
            'language' => 'es',
            'notifications_email' => false,
        ]);

        $updatedPreferences = $this->userPreferencesService->getUserPreferences($user);
        $this->info("Updated theme: {$updatedPreferences['theme']}");
        $this->info("Updated language: {$updatedPreferences['language']}");
        $this->info("Updated email notifications: " . ($updatedPreferences['notifications_email'] ? 'Yes' : 'No'));

        // Test 7: Reset preferences
        $this->info('Testing preference reset...');
        $this->userPreferencesService->resetPreferencesToDefault($user);
        
        $resetPreferences = $this->userPreferencesService->getUserPreferences($user);
        $this->info("Reset theme: {$resetPreferences['theme']}");
        $this->info("Reset language: {$resetPreferences['language']}");

        $this->newLine();
        $this->info('✅ Profile system test completed successfully!');
        
        return 0;
    }
}