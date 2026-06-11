<?php

namespace App\Traits;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

trait HasRoles
{
    /**
     * The roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->where('model_type', static::class);
    }

    /**
     * Assign the given role to the user.
     */
    public function assignRole(string|Role $role): self
    {
        if (is_string($role)) {
            $role = Role::findOrCreate($role);
        }

        $this->roles()->syncWithoutDetaching([
            $role->id => ['model_type' => static::class]
        ]);

        return $this;
    }

    /**
     * Remove the given role from the user.
     */
    public function removeRole(string|Role $role): self
    {
        if (is_string($role)) {
            $role = Role::findByName($role);
            if (!$role) {
                return $this;
            }
        }

        $this->roles()->detach($role->id);

        return $this;
    }

    /**
     * Sync the given roles with the user.
     */
    public function syncRoles(array $roles): self
    {
        $roleData = collect($roles)->mapWithKeys(function ($role) {
            $roleId = $role;
            if (is_string($role)) {
                $roleId = Role::findOrCreate($role)->id;
            } elseif ($role instanceof Role) {
                $roleId = $role->id;
            }
            
            return [$roleId => ['model_type' => static::class]];
        })->toArray();

        $this->roles()->sync($roleData);

        return $this;
    }

    /**
     * Determine if the user has the given role.
     */
    public function hasRole(string|Role $role): bool
    {
        if (is_string($role)) {
            return $this->roles()->where('name', $role)->exists();
        }

        return $this->roles()->where('roles.id', $role->id)->exists();
    }

    /**
     * Determine if the user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all permissions for the user through their roles.
     */
    public function getPermissionsViaRoles(): Collection
    {
        return $this->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id');
    }

    /**
     * Determine if the user can perform the given permission.
     */
    public function can($ability, $arguments = []): bool
    {
        // First check Laravel's built-in authorization
        if (parent::can($ability, $arguments)) {
            return true;
        }

        // Then check our custom permission system
        return $this->hasPermissionTo($ability);
    }

    /**
     * Check if user has permission.
     */
    public function hasPermissionTo(string|Permission $permission): bool
    {
        if (is_string($permission)) {
            $permission = Permission::findByName($permission);
            if (!$permission) {
                return false;
            }
        }

        return $this->getPermissionsViaRoles()->contains('id', $permission->id);
    }

    /**
     * Get all role names for the user.
     */
    public function getRoleNames(): Collection
    {
        return $this->roles->pluck('name');
    }
}