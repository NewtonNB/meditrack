<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'guard_name',
    ];

    /**
     * The permissions that belong to the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_has_permissions');
    }

    /**
     * The users that belong to the role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'model_has_roles', 'role_id', 'model_id')
            ->where('model_type', User::class);
    }

    /**
     * Find a role by name.
     */
    public static function findByName(string $name, string $guardName = 'web'): ?self
    {
        return static::where('name', $name)
            ->where('guard_name', $guardName)
            ->first();
    }

    /**
     * Create a role if it doesn't exist.
     */
    public static function findOrCreate(string $name, string $guardName = 'web'): self
    {
        $role = static::findByName($name, $guardName);

        if (!$role) {
            $role = static::create([
                'name' => $name,
                'guard_name' => $guardName,
            ]);
        }

        return $role;
    }

    /**
     * Give permission to role.
     */
    public function givePermissionTo(string|Permission $permission): self
    {
        if (is_string($permission)) {
            $permission = Permission::findOrCreate($permission);
        }

        $this->permissions()->syncWithoutDetaching([$permission->id]);

        return $this;
    }

    /**
     * Check if role has permission.
     */
    public function hasPermissionTo(string|Permission $permission): bool
    {
        if (is_string($permission)) {
            $permission = Permission::findByName($permission);
            if (!$permission) {
                return false;
            }
        }

        return $this->permissions()->where('permissions.id', $permission->id)->exists();
    }
}