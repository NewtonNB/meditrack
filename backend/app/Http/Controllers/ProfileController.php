<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /** Show profile (API + web) */
    public function show(Request $request)
    {
        $user = $request->user()->load('pharmacy');
        $data = ['user' => $user];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Profile/Show', $data);
    }

    /** Edit form (web only) */
    public function edit(Request $request)
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status'          => session('status'),
        ]);
    }

    /** Update profile */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'phone'    => ['nullable', 'string', 'max:50'],
            'bio'      => ['nullable', 'string', 'max:500'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'language' => ['nullable', 'string', 'max:10'],
        ]);

        $user = $request->user();
        if (isset($validated['email']) && $user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->fill($validated)->save();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Profile updated.', 'user' => $user->fresh()]);
        }

        return back()->with('status', 'profile-updated');
    }

    /** Change password */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        $request->user()->update(['password' => Hash::make($validated['password'])]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Password changed.']);
        }

        return back()->with('status', 'password-updated');
    }

    /** Upload avatar */
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120']]);

        $user = $request->user();
        if ($user->avatar) \Storage::disk('public')->delete($user->avatar);

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Avatar uploaded.', 'avatar_url' => \Storage::url($path)]);
        }

        return back()->with('success', 'Avatar uploaded.');
    }

    /** Delete avatar */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        if ($user->avatar) \Storage::disk('public')->delete($user->avatar);
        $user->update(['avatar' => null]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Avatar removed.']);
        }

        return back()->with('success', 'Avatar removed.');
    }

    /** Get preferences */
    public function getPreferences(Request $request)
    {
        $prefs = $request->user()->only(['timezone', 'language']);
        return response()->json(['preferences' => $prefs]);
    }

    /** Update preferences */
    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'timezone' => ['nullable', 'string', 'max:50'],
            'language' => ['nullable', 'string', 'max:10'],
        ]);
        $request->user()->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Preferences updated.']);
        }

        return back()->with('success', 'Preferences updated.');
    }

    /** Set theme */
    public function setTheme(Request $request)
    {
        $request->validate(['theme' => ['required', 'string', 'in:light,dark,system']]);
        $request->user()->update(['theme' => $request->theme]);
        return response()->json(['message' => 'Theme set.']);
    }

    /** Export data */
    public function exportData(Request $request)
    {
        $user = $request->user()->toArray();
        unset($user['password'], $user['remember_token']);
        $filename = 'profile_' . date('Y-m-d') . '.json';
        return response()->json($user)
            ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
    }

    /** Reset preferences */
    public function resetPreferences(Request $request)
    {
        $request->user()->update(['timezone' => 'UTC', 'language' => 'en']);
        return response()->json(['message' => 'Preferences reset.']);
    }

    /** Delete account */
    public function destroy(Request $request)
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();

        if ($request->is('api/*') || $request->expectsJson()) {
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            }
            $user->delete();
            return response()->json(['message' => 'Account deleted.']);
        }

        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
