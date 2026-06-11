<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\PharmacyClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Services\PermissionService;
use App\Services\AuditTrailService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserManagementController extends Controller
{
    protected PermissionService $permissionService;
    protected AuditTrailService $auditService;

    public function __construct(PermissionService $permissionService, AuditTrailService $auditService)
    {
        $this->permissionService = $permissionService;
        $this->auditService = $auditService;
    }

    public function index(Request $request): InertiaResponse|JsonResponse
    {
        $user  = auth()->user();
        $query = User::select(['id','name','email','role','pharmacy_id','is_active','last_login_at','created_at']);

        if (!$user->isSuperAdmin()) {
            $query->where('pharmacy_id', $user->pharmacy_id);
        }

        $users = $query->latest()->paginate(15);

        $serializedUsers = [
            'data'         => $users->map(fn($u) => [
                'id'           => $u->id,
                'name'         => $u->name ?? '',
                'email'        => $u->email ?? '',
                'role'         => $u->role ?? 'user',
                'pharmacy_id'  => $u->pharmacy_id,
                'is_active'    => $u->is_active ?? true,
                'avatar_url'   => $u->avatar_url ?? null,
                'last_login_at'=> $u->last_login_at?->format('Y-m-d H:i:s'),
                'created_at'   => $u->created_at?->format('Y-m-d H:i:s'),
            ])->toArray(),
            'current_page' => $users->currentPage(),
            'last_page'    => $users->lastPage(),
            'per_page'     => $users->perPage(),
            'total'        => $users->total(),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($serializedUsers);
        }

        $roles       = collect($this->permissionService->getAllRoles())->map(fn($r) => is_string($r)
            ? ['id' => null, 'name' => $r, 'display_name' => $r]
            : ['id' => $r->id ?? null, 'name' => $r->name ?? 'unknown', 'display_name' => $r->display_name ?? $r->name]
        )->toArray();

        $pharmacies = $user->isSuperAdmin()
            ? PharmacyClient::select(['id','name','email'])->get()->toArray()
            : (PharmacyClient::find($user->pharmacy_id)
                ? [['id' => $user->pharmacy_id, 'name' => PharmacyClient::find($user->pharmacy_id)->name, 'email' => null]]
                : []);

        return Inertia::render('UserManagement', [
            'users'        => $serializedUsers,
            'roles'        => $roles,
            'pharmacies'   => $pharmacies,
            'canManageAll' => (bool) $user->isSuperAdmin(),
            'filters'      => ['search' => (string)(request('search') ?? ''), 'role' => (string)(request('role') ?? ''), 'status' => (string)(request('status') ?? '')],
        ]);
    }

    public function store(Request $request)
    {
        $user      = auth()->user();
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'    => ['required', Rules\Password::defaults()],
            'role'        => ['required', 'string'],
            'pharmacy_id' => ['nullable', 'exists:pharmacy_clients,id'],
        ]);

        if (!$user->isSuperAdmin()) $validated['pharmacy_id'] = $user->pharmacy_id;
        if (!$this->canAssignRole($user, $validated['role'])) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Cannot assign this role.'], 422)
                : back()->withErrors(['role' => 'You cannot assign this role.']);
        }

        $newUser = User::create(['name' => $validated['name'], 'email' => $validated['email'], 'password' => Hash::make($validated['password']), 'pharmacy_id' => $validated['pharmacy_id'], 'role' => $validated['role']]);
        $this->permissionService->assignRoleToUser($newUser, $validated['role']);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'User created.', 'user' => $newUser], 201);
        }

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $targetUser)
    {
        $currentUser = auth()->user();
        if (!$this->canManageUser($currentUser, $targetUser)) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$targetUser->id],
            'role'        => ['required', 'string'],
            'pharmacy_id' => ['nullable', 'exists:pharmacy_clients,id'],
        ]);

        if (!$currentUser->isSuperAdmin()) $validated['pharmacy_id'] = $currentUser->pharmacy_id;
        if (!$this->canAssignRole($currentUser, $validated['role'])) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Cannot assign this role.'], 422)
                : back()->withErrors(['role' => 'You cannot assign this role.']);
        }

        $oldRole = $targetUser->getPrimaryRole();
        $targetUser->update(['name' => $validated['name'], 'email' => $validated['email'], 'pharmacy_id' => $validated['pharmacy_id'], 'role' => $validated['role']]);
        if ($oldRole !== $validated['role']) $this->permissionService->syncUserRoles($targetUser, [$validated['role']]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'User updated.', 'user' => $targetUser->fresh()]);
        }

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $targetUser)
    {
        $currentUser = auth()->user();
        if (!$this->canManageUser($currentUser, $targetUser)) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        if ($currentUser->id === $targetUser->id) {
            $msg = 'You cannot delete your own account.';
            return $request->is('api/*') || $request->expectsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->withErrors(['user' => $msg]);
        }

        $targetUser->delete();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'User deleted.']);
        }

        return back()->with('success', 'User deleted successfully.');
    }

    /**
     * Check if current user can assign a specific role.
     */
    protected function canAssignRole(User $user, string $role): bool
    {
        // Super admins can assign any role
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Pharmacy admins can assign pharmacist and cashier roles
        if ($user->isPharmacyAdmin()) {
            return in_array($role, ['pharmacist', 'cashier']);
        }

        return false;
    }

    /**
     * Check if current user can manage target user.
     */
    protected function canManageUser(User $currentUser, User $targetUser): bool
    {
        // Super admins can manage anyone
        if ($currentUser->isSuperAdmin()) {
            return true;
        }

        // Pharmacy admins can manage users in their pharmacy (except other admins)
        if ($currentUser->isPharmacyAdmin()) {
            return $targetUser->pharmacy_id === $currentUser->pharmacy_id && 
                   !$targetUser->isSuperAdmin() && 
                   !$targetUser->isPharmacyAdmin();
        }

        return false;
    }

    /**
     * Upload avatar for a user.
     */
    public function uploadAvatar(Request $request, User $user): RedirectResponse
    {
        // Check if current user can manage this user
        if (!$this->canManageUser(auth()->user(), $user)) {
            abort(403, 'Unauthorized to manage this user');
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB max
        ]);

        try {
            // Ensure avatars directory exists
            if (!\Storage::disk('public')->exists('avatars')) {
                \Storage::disk('public')->makeDirectory('avatars');
            }

            // Delete old avatar if exists
            if ($user->avatar) {
                \Storage::disk('public')->delete($user->avatar);
            }

            // Store new avatar
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            
            // Update user avatar path
            $user->update(['avatar' => $avatarPath]);

            // Log the activity
            $this->auditService->logActivity('avatar_updated', $user, [
                'description' => 'User avatar updated',
                'properties' => [
                    'avatar_path' => $avatarPath,
                    'updated_by' => auth()->user()->name
                ]
            ]);

            return back()->with('success', 'Profile image updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Avatar upload failed: ' . $e->getMessage());
            return back()->withErrors(['avatar' => 'Failed to upload image. Please try again.']);
        }
    }

    /**
     * Delete avatar for a user.
     */
    public function deleteAvatar(User $user): RedirectResponse
    {
        // Check if current user can manage this user
        if (!$this->canManageUser(auth()->user(), $user)) {
            abort(403, 'Unauthorized to manage this user');
        }

        try {
            // Delete avatar file if exists
            if ($user->avatar) {
                \Storage::disk('public')->delete($user->avatar);
            }

            // Remove avatar path from user
            $user->update(['avatar' => null]);

            // Log the activity
            $this->auditService->logActivity('avatar_deleted', $user, [
                'description' => 'User avatar deleted',
                'properties' => [
                    'deleted_by' => auth()->user()->name
                ]
            ]);

            return back()->with('success', 'Profile image removed successfully.');
        } catch (\Exception $e) {
            \Log::error('Avatar deletion failed: ' . $e->getMessage());
            return back()->withErrors(['avatar' => 'Failed to remove image. Please try again.']);
        }
    }
}