<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Permission;
use App\Models\Role;

class CheckUserPermissions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'user:check-permissions {--user= : User ID or email} {--fix : Fix missing permissions}';

    /**
     * The console command description.
     */
    protected $description = 'Check and optionally fix user permissions for navigation';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking User Permissions...');
        $this->newLine();

        // Get user
        $userIdentifier = $this->option('user');
        if ($userIdentifier) {
            $user = User::where('email', $userIdentifier)
                ->orWhere('id', $userIdentifier)
                ->first();
        } else {
            $user = User::first();
        }

        if (!$user) {
            $this->error('❌ User not found.');
            return Command::FAILURE;
        }

        $this->info("👤 User: {$user->name} ({$user->email})");
        $this->info("🏷️  Role: {$user->role}");
        $this->newLine();

        // Get user's current permissions
        $userPermissions = $user->getPermissionsViaRoles();
        $this->info("📋 Current Permissions ({$userPermissions->count()}):");
        
        if ($userPermissions->isEmpty()) {
            $this->warn('   ⚠️  No permissions found!');
        } else {
            foreach ($userPermissions as $permission) {
                $this->line("   ✅ {$permission->name}");
            }
        }
        $this->newLine();

        // Required permissions for navigation
        $requiredPermissions = [
            'manage_medicines',
            'process_sales', 
            'manage_customers',
            'manage_suppliers',
            'view_reports',
            'manage_users',
            'view_audit_logs',
            'manage_settings'
        ];

        $this->info("🎯 Required Permissions for Full Navigation:");
        $missingPermissions = [];
        
        foreach ($requiredPermissions as $permissionName) {
            $hasPermission = $user->hasPermissionTo($permissionName);
            if ($hasPermission) {
                $this->line("   ✅ {$permissionName}");
            } else {
                $this->line("   ❌ {$permissionName} (MISSING)");
                $missingPermissions[] = $permissionName;
            }
        }
        $this->newLine();

        if (empty($missingPermissions)) {
            $this->info("🎉 User has all required permissions!");
            return Command::SUCCESS;
        }

        $this->warn("⚠️  Missing {" . count($missingPermissions) . "} permissions:");
        foreach ($missingPermissions as $permission) {
            $this->line("   • {$permission}");
        }
        $this->newLine();

        if ($this->option('fix')) {
            $this->info("🔧 Fixing permissions...");
            
            // Get or create pharmacy_admin role
            $pharmacyAdminRole = Role::where('name', 'pharmacy_admin')->first();
            
            if (!$pharmacyAdminRole) {
                $this->error('❌ pharmacy_admin role not found. Please run RBAC seeder first.');
                $this->line('   Run: php artisan db:seed --class=RolesAndPermissionsSeeder');
                return Command::FAILURE;
            }

            // Assign pharmacy_admin role (which should have all permissions)
            if (!$user->hasRole('pharmacy_admin')) {
                $user->assignRole('pharmacy_admin');
                $this->info("   ✅ Assigned pharmacy_admin role to user");
            }

            // Also update the role field for compatibility
            $user->update(['role' => 'pharmacy_admin']);
            
            $this->info("🎉 Permissions fixed! User now has full access.");
            
        } else {
            $this->info("💡 To fix permissions, run:");
            $this->line("   php artisan user:check-permissions --fix");
            $this->line("   OR");
            $this->line("   php artisan ai:grant-permissions --all");
        }

        return Command::SUCCESS;
    }
}