<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $data = [
            'user' => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'phone'            => $user->phone ?? '',
                'bio'              => $user->bio ?? '',
                'role'             => $user->role ?? 'user',
                'timezone'         => $user->timezone ?? 'UTC',
                'language'         => $user->language ?? 'en',
                // Pharmacy / financial
                'pharmacy_name'    => $user->pharmacy_name ?? '',
                'pharmacy_address' => $user->pharmacy_address ?? '',
                'pharmacy_phone'   => $user->pharmacy_phone ?? '',
                'pharmacy_email'   => $user->pharmacy_email ?? '',
                'license_number'   => $user->license_number ?? '',
                'tax_rate'         => $user->tax_rate ?? '0.00',
                'currency'         => $user->currency ?? 'UGX',
                'receipt_footer'   => $user->receipt_footer ?? '',
                'bank_accounts'    => $user->bank_accounts ?? '',
                'payment_gateways' => $user->payment_gateways ?? '',
                // Notifications
                'email_notifications' => (bool) ($user->email_notifications ?? true),
                'sms_notifications'   => (bool) ($user->sms_notifications   ?? false),
                'push_notifications'  => (bool) ($user->push_notifications  ?? true),
                'low_stock_alerts'    => (bool) ($user->low_stock_alerts    ?? true),
                'expiry_alerts'       => (bool) ($user->expiry_alerts       ?? true),
                'sales_reports'       => (bool) ($user->sales_reports       ?? true),
                'system_updates'      => (bool) ($user->system_updates      ?? true),
                'marketing_emails'    => (bool) ($user->marketing_emails    ?? false),
                // Security
                'two_factor_enabled'      => (bool) ($user->two_factor_enabled      ?? false),
                'session_timeout'         => $user->session_timeout         ?? 30,
                'password_expiry'         => $user->password_expiry         ?? 90,
                'login_attempts'          => $user->login_attempts          ?? 5,
                'require_password_change' => (bool) ($user->require_password_change ?? false),
                // System
                'auto_backup'      => (bool) ($user->auto_backup      ?? true),
                'backup_frequency' => $user->backup_frequency ?? 'daily',
                'data_retention'   => $user->data_retention   ?? 365,
                'maintenance_mode' => (bool) ($user->maintenance_mode ?? false),
                'debug_mode'       => (bool) ($user->debug_mode       ?? false),
                'cache_enabled'    => (bool) ($user->cache_enabled    ?? true),
            ],
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Settings', $data);
    }

    public function updateProfile(Request $request)
    {
        $user      = Auth::user();
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'phone'    => 'nullable|string|max:20',
            'bio'      => 'nullable|string|max:500',
            'timezone' => 'required|string|max:50',
            'language' => 'required|string|max:10',
        ]);
        $user->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Profile updated.', 'user' => $user->fresh()]);
        }
        return back()->with('success', 'Profile updated successfully!');
    }

    public function updatePharmacy(Request $request)
    {
        $validated = $request->validate([
            'pharmacy_name'    => 'required|string|max:255',
            'pharmacy_address' => 'nullable|string|max:500',
            'pharmacy_phone'   => 'nullable|string|max:20',
            'pharmacy_email'   => 'nullable|email|max:255',
            'license_number'   => 'nullable|string|max:100',
            'tax_rate'         => 'required|numeric|min:0|max:100',
            'currency'         => 'required|string|max:10',
            'receipt_footer'   => 'nullable|string|max:255',
            'bank_accounts'    => 'nullable|string',
            'payment_gateways' => 'nullable|string',
        ]);
        Auth::user()->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Pharmacy settings updated.', 'user' => Auth::user()->fresh()]);
        }
        return back()->with('success', 'Pharmacy settings updated successfully!');
    }

    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'email_notifications' => 'boolean',
            'sms_notifications'   => 'boolean',
            'push_notifications'  => 'boolean',
            'low_stock_alerts'    => 'boolean',
            'expiry_alerts'       => 'boolean',
            'sales_reports'       => 'boolean',
            'system_updates'      => 'boolean',
            'marketing_emails'    => 'boolean',
        ]);
        Auth::user()->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Notification preferences updated.']);
        }
        return back()->with('success', 'Notification preferences updated successfully!');
    }

    public function updateSecurity(Request $request)
    {
        $validated = $request->validate([
            'two_factor_enabled'     => 'boolean',
            'session_timeout'        => 'required|integer|min:5|max:480',
            'password_expiry'        => 'required|integer|min:30|max:365',
            'login_attempts'         => 'required|integer|min:3|max:10',
            'require_password_change'=> 'boolean',
        ]);
        Auth::user()->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Security settings updated.']);
        }
        return back()->with('success', 'Security settings updated successfully!');
    }

    public function updateSystem(Request $request)
    {
        $validated = $request->validate([
            'auto_backup'      => 'boolean',
            'backup_frequency' => 'required|string|in:hourly,daily,weekly,monthly',
            'data_retention'   => 'required|integer|min:30|max:730',
            'maintenance_mode' => 'boolean',
            'debug_mode'       => 'boolean',
            'cache_enabled'    => 'boolean',
        ]);
        Auth::user()->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'System settings updated.']);
        }
        return back()->with('success', 'System settings updated successfully!');
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password'         => ['required', 'confirmed', Password::defaults()],
        ]);
        Auth::user()->update(['password' => Hash::make($request->password)]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Password changed.']);
        }
        return back()->with('success', 'Password changed successfully!');
    }

    public function exportSettings(Request $request)
    {
        $user = Auth::user()->toArray();
        unset($user['password'], $user['remember_token'], $user['email_verified_at']);
        $filename = 'meditrack_settings_' . date('Y-m-d_H-i-s') . '.json';
        $json     = json_encode($user, JSON_PRETTY_PRINT);

        return response($json, 200)
            ->header('Content-Type', 'application/json')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function clearCache(Request $request)
    {
        try {
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('view:clear');
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Cache cleared.']);
            }
            return back()->with('success', 'Cache cleared successfully!');
        } catch (\Exception $e) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to clear cache: '.$e->getMessage());
        }
    }

    public function optimizeDatabase(Request $request)
    {
        try {
            \Artisan::call('optimize');
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Database optimized.']);
            }
            return back()->with('success', 'Database optimized successfully!');
        } catch (\Exception $e) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to optimize: '.$e->getMessage());
        }
    }
}