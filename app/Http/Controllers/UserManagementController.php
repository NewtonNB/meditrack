<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\PharmacyClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    /**
     * Display a listing of users.
     */
    public function index(): InertiaResponse
    {
        $user = auth()->user();
        
        $query = User::select(['id', 'name', 'email', 'role', 'pharmacy_id', 'is_active', 'last_login_at', 'created_at']);
        
        // Super admins see all users, pharmacy admins see only their pharmacy users
        if (!$user->isSuperAdmin()) {
            $query->where('pharmacy_id', $user->pharmacy_id);
        }
        
        $users = $query->latest()->paginate(15);
        
        // Safely serialize users data without problematic relationships
        $serializedUsers = [
            'data' => collect($users->items())->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name ?? '',
                    'email' => $user->email ?? '',
                    'role' => $user->role ?? 'user',
                    'pharmacy_id' => $user->pharmacy_id,
                    'is_active' => $user->is_active ?? true,
                    'avatar_url' => $user->avatar_url,
                    'last_login_at' => $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : null,
                    'created_at' => $user->created_at ? $user->created_at->format('Y-m-d H:i:s') : null,
                ];
            })->toArray(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'per_page' => $users->perPage(),
            'total' => $users->total(),
        ];
        
        // Safely serialize roles
        $roles = $this->permissionService->getAllRoles();
        $serializedRoles = collect($roles)->map(function ($role) {
            if (is_string($role)) {
                return [
                    'id' => null,
                    'name' => $role,
                    'display_name' => $role,
                ];
            }
            return [
                'id' => $role->id ?? null,
                'name' => $role->name ?? 'unknown',
                'display_name' => $role->display_name ?? $role->name ?? 'Unknown Role',
            ];
        })->toArray();
        
        // Safely serialize pharmacies
        $serializedPharmacies = [];
        if ($user->isSuperAdmin()) {
            $pharmacies = PharmacyClient::select(['id', 'name', 'email'])->get();
            $serializedPharmacies = $pharmacies->map(function ($pharmacy) {
                return [
                    'id' => $pharmacy->id,
                    'name' => $pharmacy->name,
                    'email' => $pharmacy->email ?? null,
                ];
            })->toArray();
        } else {
            // Get user's pharmacy safely
            $userPharmacy = PharmacyClient::select(['id', 'name', 'email'])
                ->where('id', $user->pharmacy_id)
                ->first();
            
            if ($userPharmacy) {
                $serializedPharmacies = [[
                    'id' => $userPharmacy->id,
                    'name' => $userPharmacy->name,
                    'email' => $userPharmacy->email ?? null,
                ]];
            }
        }
        
        return Inertia::render('UserManagement', [
            'users' => $serializedUsers,
            'roles' => $serializedRoles,
            'pharmacies' => $serializedPharmacies,
            'canManageAll' => (bool) $user->isSuperAdmin(),
            'filters' => [
                'search' => (string) (request('search') ?? ''),
                'role' => (string) (request('role') ?? ''),
                'status' => (string) (request('status') ?? ''),
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Rules\Password::defaults()],
            'role' => ['required', 'string'],
            'pharmacy_id' => ['nullable', 'exists:pharmacy_clients,id'],
        ]);

        // Validate pharmacy assignment
        if (!$user->isSuperAdmin()) {
            $validated['pharmacy_id'] = $user->pharmacy_id; // Force same pharmacy
        }

        // Validate role assignment permissions
        if (!$this->canAssignRole($user, $validated['role'])) {
            return back()->withErrors(['role' => 'You cannot assign this role.']);
        }

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'pharmacy_id' => $validated['pharmacy_id'],
            'role' => $validated['role'], // Legacy field
        ]);

        // Assign role using RBAC system
        $this->permissionService->assignRoleToUser($newUser, $validated['role']);

        return back()->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $targetUser): RedirectResponse
    {
        $currentUser = auth()->user();
        
        // Check if current user can manage this user
        if (!$this->canManageUser($currentUser, $targetUser)) {
            abort(403, 'You cannot manage this user.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $targetUser->id],
            'role' => ['required', 'string'],
            'pharmacy_id' => ['nullable', 'exists:pharmacy_clients,id'],
        ]);

        // Validate pharmacy assignment
        if (!$currentUser->isSuperAdmin()) {
            $validated['pharmacy_id'] = $currentUser->pharmacy_id; // Force same pharmacy
        }

        // Validate role assignment permissions
        if (!$this->canAssignRole($currentUser, $validated['role'])) {
            return back()->withErrors(['role' => 'You cannot assign this role.']);
        }

        $oldRole = $targetUser->getPrimaryRole();
        
        $targetUser->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'pharmacy_id' => $validated['pharmacy_id'],
            'role' => $validated['role'], // Legacy field
        ]);

        // Update role if changed
        if ($oldRole !== $validated['role']) {
            $this->permissionService->syncUserRoles($targetUser, [$validated['role']]);
        }

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $targetUser): RedirectResponse
    {
        $currentUser = auth()->user();
        
        // Check if current user can manage this user
        if (!$this->canManageUser($currentUser, $targetUser)) {
            abort(403, 'You cannot delete this user.');
        }

        // Prevent self-deletion
        if ($currentUser->id === $targetUser->id) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        $targetUser->delete();
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