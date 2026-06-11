<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Spatie\Permission\Models\Permission;

class CheckSalesPermissions extends Command
{
    protected $signature = 'check:sales-permissions';
    protected $description = 'Check and fix sales permissions for users';

    public function handle()
    {
        $this->info('=== Checking Sales Permissions ===');

        // Get first user
        $user = User::first();
        if (!$user) {
            $this->error('No users found in database');
            return;
        }

        $this->info("User: {$user->name} (ID: {$user->id})");
        $this->info("Role: {$user->role}");

        // Check if process_sales permission exists
        $permission = Permission::where('name', 'process_sales')->first();
        if (!$permission) {
            $this->error('❌ process_sales permission does not exist!');
            
            // Create the permission
            $this->info('Creating process_sales permission...');
            $permission = Permission::create(['name' => 'process_sales']);
            $this->info('✅ Created process_sales permission');
        } else {
            $this->info('✅ process_sales permission exists');
        }

        // Check if user has the permission
        $hasPermission = $user->hasPermissionTo('process_sales');
        $this->info('Has process_sales permission: ' . ($hasPermission ? 'YES' : 'NO'));

        if (!$hasPermission) {
            $this->info('Assigning process_sales permission to user...');
            $user->givePermissionTo('process_sales');
            $this->info("✅ Assigned process_sales permission to {$user->name}");
        }

        // Verify permission
        $user->refresh();
        $hasPermissionNow = $user->hasPermissionTo('process_sales');
        $this->info('Has process_sales permission now: ' . ($hasPermissionNow ? 'YES' : 'NO'));

        // Show all user permissions
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $this->info('All permissions: ' . implode(', ', $permissions));

        // Check all users
        $this->info("\n=== All Users Permission Status ===");
        $users = User::all();
        foreach ($users as $u) {
            $hasPerms = $u->hasPermissionTo('process_sales');
            $this->info("{$u->name} ({$u->role}): " . ($hasPerms ? '✅ HAS' : '❌ MISSING') . " process_sales");
            
            if (!$hasPerms) {
                $u->givePermissionTo('process_sales');
                $this->info("  → Assigned process_sales to {$u->name}");
            }
        }

        $this->info("\n=== Test Complete ===");
    }
}