<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Get user settings (you might want to create a settings table)
        $settings = [
            'timezone' => $user->timezone ?? 'UTC',
            'language' => $user->language ?? 'en',
            'pharmacy_name' => $user->pharmacy_name ?? 'MediTrack Pharmacy',
            'pharmacy_address' => $user->pharmacy_address ?? '',
            'pharmacy_phone' => $user->pharmacy_phone ?? '',
            'pharmacy_email' => $user->pharmacy_email ?? '',
            'license_number' => $user->license_number ?? '',
            'tax_rate' => $user->tax_rate ?? 10,
            'currency' => $user->currency ?? 'UGX',
            'receipt_footer' => $user->receipt_footer ?? 'Thank you for your business!',
            'email_notifications' => $user->email_notifications ?? true,
            'sms_notifications' => $user->sms_notifications ?? false,
            'push_notifications' => $user->push_notifications ?? true,
            'low_stock_alerts' => $user->low_stock_alerts ?? true,
            'expiry_alerts' => $user->expiry_alerts ?? true,
            'sales_reports' => $user->sales_reports ?? true,
            'system_updates' => $user->system_updates ?? true,
            'marketing_emails' => $user->marketing_emails ?? false,
            'two_factor_enabled' => $user->two_factor_enabled ?? false,
            'session_timeout' => $user->session_timeout ?? 30,
            'password_expiry' => $user->password_expiry ?? 90,
            'login_attempts' => $user->login_attempts ?? 5,
            'require_password_change' => $user->require_password_change ?? false,
            'auto_backup' => $user->auto_backup ?? true,
            'backup_frequency' => $user->backup_frequency ?? 'daily',
            'data_retention' => $user->data_retention ?? 365,
            'maintenance_mode' => $user->maintenance_mode ?? false,
            'debug_mode' => $user->debug_mode ?? false,
            'cache_enabled' => $user->cache_enabled ?? true,
        ];

        return Inertia::render('Settings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'role' => $user->role ?? 'user',
                'created_at' => $user->created_at ? $user->created_at->toDateTimeString() : null,
            ],
            'settings' => $settings
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:500',
            'timezone' => 'required|string|max:50',
            'language' => 'required|string|max:10',
        ]);

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully!');
    }

    public function updatePharmacy(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'pharmacy_name' => 'required|string|max:255',
            'pharmacy_address' => 'nullable|string|max:500',
            'pharmacy_phone' => 'nullable|string|max:20',
            'pharmacy_email' => 'nullable|email|max:255',
            'license_number' => 'nullable|string|max:100',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'currency' => 'required|string|max:10',
            'receipt_footer' => 'nullable|string|max:255',
        ]);

        $user->update($validated);

        return back()->with('success', 'Pharmacy settings updated successfully!');
    }

    public function updateNotifications(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'low_stock_alerts' => 'boolean',
            'expiry_alerts' => 'boolean',
            'sales_reports' => 'boolean',
            'system_updates' => 'boolean',
            'marketing_emails' => 'boolean',
        ]);

        $user->update($validated);

        return back()->with('success', 'Notification preferences updated successfully!');
    }

    public function updateSecurity(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'two_factor_enabled' => 'boolean',
            'session_timeout' => 'required|integer|min:5|max:480',
            'password_expiry' => 'required|integer|min:30|max:365',
            'login_attempts' => 'required|integer|min:3|max:10',
            'require_password_change' => 'boolean',
        ]);

        $user->update($validated);

        return back()->with('success', 'Security settings updated successfully!');
    }

    public function updateSystem(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'auto_backup' => 'boolean',
            'backup_frequency' => 'required|string|in:hourly,daily,weekly,monthly',
            'data_retention' => 'required|integer|min:30|max:730',
            'maintenance_mode' => 'boolean',
            'debug_mode' => 'boolean',
            'cache_enabled' => 'boolean',
        ]);

        $user->update($validated);

        return back()->with('success', 'System settings updated successfully!');
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = Auth::user();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password changed successfully!');
    }

    public function exportSettings()
    {
        $user = Auth::user();
        $settings = $user->toArray();
        
        // Remove sensitive data
        unset($settings['password'], $settings['remember_token'], $settings['email_verified_at']);
        
        $filename = 'meditrack_settings_' . date('Y-m-d_H-i-s') . '.json';
        
        return response()->json($settings)
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Content-Type', 'application/json');
    }

    public function clearCache()
    {
        try {
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('view:clear');
            \Artisan::call('route:clear');
            
            return back()->with('success', 'Cache cleared successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to clear cache: ' . $e->getMessage());
        }
    }

    public function optimizeDatabase()
    {
        try {
            \Artisan::call('optimize');
            
            return back()->with('success', 'Database optimized successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to optimize database: ' . $e->getMessage());
        }
    }
}