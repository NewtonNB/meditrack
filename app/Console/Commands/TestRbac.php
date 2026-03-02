<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

class TestRbac extends Command
{
    protected $signature = 'test:rbac';
    protected $description = 'Test RBAC functionality';

    public function handle()
    {
        $this->info('Testing RBAC System...');

        // Check if roles and permissions exist
        $roles = Role::all();
        $permissions = Permission::all();

        $this->info("Roles created: " . $roles->count());
        $this->info("Permissions created: " . $permissions->count());

        foreach ($roles as $role) {
            $this->line("Role: {$role->name} - Permissions: " . $role->permissions->count());
        }

        // Test user role assignment
        $user = User::first();
        if ($user) {
            $this->info("Testing with user: {$user->name}");
            
            // Assign pharmacist role
            $user->assignRole('pharmacist');
            $this->info("Assigned pharmacist role");
            
            // Check role
            $hasRole = $user->hasRole('pharmacist');
            $this->info("Has pharmacist role: " . ($hasRole ? 'Yes' : 'No'));
            
            // Check permission
            $hasPermission = $user->hasPermissionTo('manage_medicines');
            $this->info("Has manage_medicines permission: " . ($hasPermission ? 'Yes' : 'No'));
            
        } else {
            $this->error("No users found in database");
        }

        return 0;
    }
}