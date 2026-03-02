<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'guard_name',
    ];

    /**
     * The roles that belong to the permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_has_permissions');
    }

    /**
     * Find a permission by name.
     */
    public static function findByName(string $name, string $guardName = 'web'): ?self
    {
        return static::where('name', $name)
            ->where('guard_name', $guardName)
            ->first();
    }

    /**
     * Create a permission if it doesn't exist.
     */
    public static function findOrCreate(string $name, string $guardName = 'web'): self
    {
        $permission = static::findByName($name, $guardName);

        if (!$permission) {
            $permission = static::create([
                'name' => $name,
                'guard_name' => $guardName,
            ]);
        }

        return $permission;
    }
}