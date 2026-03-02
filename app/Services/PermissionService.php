<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\ActivityLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    /**
     * Assign a role to a user.
     */
    public function assignRoleToUser(User $user, string $role): bool
    {
        try {
            $roleModel = Role::findByName($role);
            
            if (!$roleModel) {
                throw new \Exception("Role '{$role}' not found");
            }

            // Check if user already has this role
            if ($user->hasRole($role)) {
                return true; // Already has the role
            }

            $user->assignRole($roleModel);
            
            // Log the role assignment
            ActivityLog::createLog([
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'event' => 'role_assigned',
                'description' => "Assigned role '{$role}' to user '{$user->name}'",
                'properties' => [
                    'role' => $role,
                    'role_id' => $roleModel->id,
                ],
            ]);

            // Clear user's permission cache
            $this->clearUserPermissionCache($user);

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to assign role to user', [
                'user_id' => $user->id,
                'role' => $role,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Remove a role from a user.
     */
    public function removeRoleFromUser(User $user, string $role): bool
    {
        try {
            if (!$user->hasRole($role)) {
                return true; // User doesn't have the role
            }

            $user->removeRole($role);
            
            // Log the role removal
            ActivityLog::createLog([
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'event' => 'role_removed',
                'description' => "Removed role '{$role}' from user '{$user->name}'",
                'properties' => [
                    'role' => $role,
                ],
            ]);

            // Clear user's permission cache
            $this->clearUserPermissionCache($user);

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to remove role from user', [
                'user_id' => $user->id,
                'role' => $role,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Check if a user has a specific permission.
     */
    public function checkUserPermission(User $user, string $permission): bool
    {
        // Use caching for performance
        $cacheKey = "user_permission_{$user->id}_{$permission}";
        
        return Cache::remember($cacheKey, 3600, function () use ($user, $permission) {
            return $user->hasPermissionTo($permission);
        });
    }

    /**
     * Get all permissions for a user.
     */
    public function getUserPermissions(User $user): Collection
    {
        $cacheKey = "user_permissions_{$user->id}";
        
        return Cache::remember($cacheKey, 3600, function () use ($user) {
            return $user->getPermissionsViaRoles();
        });
    }

    /**
     * Sync user roles (replace all existing roles with new ones).
     */
    public function syncUserRoles(User $user, array $roles): void
    {
        $oldRoles = $user->getRoleNames()->toArray();
        
        $user->syncRoles($roles);
        
        // Log the role sync
        ActivityLog::createLog([
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'event' => 'roles_synced',
            'description' => "Updated user '{$user->name}' roles",
            'old_values' => ['roles' => $oldRoles],
            'new_values' => ['roles' => $roles],
            'properties' => [
                'old_roles' => $oldRoles,
                'new_roles' => $roles,
            ],
        ]);

        // Clear user's permission cache
        $this->clearUserPermissionCache($user);
    }

    /**
     * Get all available roles.
     */
    public function getAllRoles(): Collection
    {
        return Cache::remember('all_roles', 3600, function () {
            return Role::with('permissions')->get();
        });
    }

    /**
     * Get all available permissions.
     */
    public function getAllPermissions(): Collection
    {
        return Cache::remember('all_permissions', 3600, function () {
            return Permission::all();
        });
    }

    /**
     * Get role by name.
     */
    public function getRoleByName(string $name): ?Role
    {
        return Role::findByName($name);
    }

    /**
     * Get permission by name.
     */
    public function getPermissionByName(string $name): ?Permission
    {
        return Permission::findByName($name);
    }

    /**
     * Check if a role has a specific permission.
     */
    public function roleHasPermission(string $roleName, string $permissionName): bool
    {
        $role = $this->getRoleByName($roleName);
        
        if (!$role) {
            return false;
        }

        return $role->hasPermissionTo($permissionName);
    }

    /**
     * Get users with a specific role.
     */
    public function getUsersWithRole(string $roleName): Collection
    {
        $role = $this->getRoleByName($roleName);
        
        if (!$role) {
            return collect();
        }

        return $role->users;
    }

    /**
     * Get users with a specific permission.
     */
    public function getUsersWithPermission(string $permissionName): Collection
    {
        $permission = $this->getPermissionByName($permissionName);
        
        if (!$permission) {
            return collect();
        }

        // Get all roles that have this permission
        $roleIds = $permission->roles->pluck('id');
        
        // Get all users with those roles
        return User::whereHas('roles', function ($query) use ($roleIds) {
            $query->whereIn('roles.id', $roleIds);
        })->get();
    }

    /**
     * Create a new role with permissions.
     */
    public function createRole(string $name, array $permissions = []): Role
    {
        $role = Role::findOrCreate($name);
        
        if (!empty($permissions)) {
            $permissionModels = Permission::whereIn('name', $permissions)->get();
            $role->permissions()->sync($permissionModels->pluck('id'));
        }

        // Log role creation
        ActivityLog::createLog([
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'event' => 'created',
            'description' => "Created role '{$name}' with permissions",
            'properties' => [
                'permissions' => $permissions,
            ],
        ]);

        // Clear role cache
        Cache::forget('all_roles');

        return $role;
    }

    /**
     * Create a new permission.
     */
    public function createPermission(string $name): Permission
    {
        $permission = Permission::findOrCreate($name);
        
        // Log permission creation
        ActivityLog::createLog([
            'subject_type' => Permission::class,
            'subject_id' => $permission->id,
            'event' => 'created',
            'description' => "Created permission '{$name}'",
        ]);

        // Clear permission cache
        Cache::forget('all_permissions');

        return $permission;
    }

    /**
     * Get permission matrix for all roles.
     */
    public function getPermissionMatrix(): array
    {
        $roles = $this->getAllRoles();
        $permissions = $this->getAllPermissions();
        
        $matrix = [];
        
        foreach ($roles as $role) {
            $matrix[$role->name] = [];
            foreach ($permissions as $permission) {
                $matrix[$role->name][$permission->name] = $role->hasPermissionTo($permission);
            }
        }

        return $matrix;
    }

    /**
     * Clear user's permission cache.
     */
    protected function clearUserPermissionCache(User $user): void
    {
        $permissions = $this->getAllPermissions();
        
        foreach ($permissions as $permission) {
            Cache::forget("user_permission_{$user->id}_{$permission->name}");
        }
        
        Cache::forget("user_permissions_{$user->id}");
    }

    /**
     * Clear all permission-related caches.
     */
    public function clearAllCaches(): void
    {
        Cache::forget('all_roles');
        Cache::forget('all_permissions');
        
        // Clear user-specific caches (this is expensive, use sparingly)
        $users = User::all();
        foreach ($users as $user) {
            $this->clearUserPermissionCache($user);
        }
    }

    /**
     * Validate if user can perform action on resource.
     */
    public function canUserPerformAction(User $user, string $action, $resource = null): bool
    {
        // Check direct permission
        if ($this->checkUserPermission($user, $action)) {
            return true;
        }

        // Check resource-specific permissions if applicable
        if ($resource && method_exists($resource, 'canUserAccess')) {
            return $resource->canUserAccess($user, $action);
        }

        return false;
    }
}