<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;

class UserPreferencesService
{
    public function getUserPreferences(User $user)
    {
        $preferences = $user->preferences()->pluck('value', 'key')->toArray();
        
        // Set default preferences if they don't exist
        $defaultPreferences = $this->getDefaultPreferences();
        
        return array_merge($defaultPreferences, $preferences);
    }

    public function updateUserPreferences(User $user, array $preferences)
    {
        foreach ($preferences as $key => $value) {
            $user->preferences()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return $this->getUserPreferences($user);
    }

    public function updateUserProfile(User $user, array $data)
    {
        $user->update([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'phone' => $data['phone'] ?? $user->phone,
            'address' => $data['address'] ?? $user->address,
            'bio' => $data['bio'] ?? $user->bio,
            'date_of_birth' => $data['date_of_birth'] ?? $user->date_of_birth,
            'emergency_contact' => $data['emergency_contact'] ?? $user->emergency_contact,
        ]);

        return $user->fresh();
    }

    public function uploadAvatar(User $user, UploadedFile $file)
    {
        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Generate unique filename
        $filename = 'avatars/' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();

        // Store the original file
        $path = $file->storeAs('', $filename, 'public');

        // Create thumbnail (if image processing is available)
        try {
            $fullPath = storage_path('app/public/' . $filename);
            if (extension_loaded('gd') || extension_loaded('imagick')) {
                // Create a 200x200 thumbnail
                $image = Image::make($fullPath);
                $image->fit(200, 200, function ($constraint) {
                    $constraint->upsize();
                });
                $image->save();
            }
        } catch (\Exception $e) {
            // If image processing fails, continue with original file
        }

        // Update user avatar path
        $user->update(['avatar' => $filename]);

        return [
            'avatar_url' => Storage::disk('public')->url($filename),
            'avatar_path' => $filename,
        ];
    }

    public function deleteAvatar(User $user)
    {
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
            return true;
        }

        return false;
    }

    public function getDefaultPreferences()
    {
        return [
            'theme' => 'light',
            'language' => 'en',
            'timezone' => 'UTC',
            'date_format' => 'Y-m-d',
            'time_format' => '24h',
            'currency' => 'UGX',
            'notifications_email' => true,
            'notifications_browser' => true,
            'notifications_sms' => false,
            'dashboard_layout' => 'default',
            'items_per_page' => 15,
            'auto_logout' => 30, // minutes
            'two_factor_enabled' => false,
        ];
    }

    public function getThemePreference(User $user)
    {
        $preference = $user->preferences()->where('key', 'theme')->first();
        return $preference ? $preference->value : 'light';
    }

    public function setThemePreference(User $user, string $theme)
    {
        $validThemes = ['light', 'dark', 'auto'];
        
        if (!in_array($theme, $validThemes)) {
            throw new \InvalidArgumentException('Invalid theme. Must be one of: ' . implode(', ', $validThemes));
        }

        $user->preferences()->updateOrCreate(
            ['key' => 'theme'],
            ['value' => $theme]
        );

        return $theme;
    }

    public function getUserStats(User $user)
    {
        $stats = [
            'profile_completion' => $this->calculateProfileCompletion($user),
            'last_login' => $user->last_login_at,
            'member_since' => $user->created_at,
            'total_logins' => $user->login_count ?? 0,
            'active_sessions' => 1, // For now, assume 1 active session
            'preferences_set' => $user->preferences()->count(),
        ];

        // Add role-specific stats
        if ($user->hasPermissionTo('process_sales')) {
            $stats['sales_processed'] = \App\Models\Sale::where('created_by', $user->id)->count();
        }

        if ($user->hasPermissionTo('manage_medicines')) {
            $stats['medicines_managed'] = \App\Models\Medicine::where('created_by', $user->id)->count();
        }

        return $stats;
    }

    protected function calculateProfileCompletion(User $user)
    {
        $fields = ['name', 'email', 'phone', 'address', 'bio', 'date_of_birth', 'avatar'];
        $completedFields = 0;

        foreach ($fields as $field) {
            if (!empty($user->$field)) {
                $completedFields++;
            }
        }

        return round(($completedFields / count($fields)) * 100);
    }

    public function exportUserData(User $user)
    {
        return [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'date_of_birth' => $user->date_of_birth,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
            ],
            'preferences' => $this->getUserPreferences($user),
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getPermissionsViaRoles()->pluck('name'),
            'statistics' => $this->getUserStats($user),
        ];
    }

    public function resetPreferencesToDefault(User $user)
    {
        $user->preferences()->delete();
        return $this->getDefaultPreferences();
    }
}