<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class DebugNavigation extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'debug:navigation {--user= : User ID or email}';

    /**
     * The console command description.
     */
    protected $description = 'Debug navigation visibility issues';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Debugging Navigation Issues...');
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

        // Get user's permissions
        $userPermissions = $user->getPermissionsViaRoles();
        $this->info("📋 User Permissions ({$userPermissions->count()}):");
        foreach ($userPermissions as $permission) {
            $this->line("   ✅ {$permission->name}");
        }
        $this->newLine();

        // Navigation configuration for pharmacy_admin
        $navigationItems = [
            ['name' => 'Dashboard', 'route' => 'dashboard', 'permission' => null],

            ['name' => 'User Management', 'route' => 'users.management', 'permission' => 'manage_users'],
            ['name' => 'Audit Logs', 'route' => 'audit.index', 'permission' => 'view_audit_logs'],
            ['name' => 'Medicines', 'route' => 'medicines.index', 'permission' => 'manage_medicines'],
            ['name' => 'Sales', 'route' => 'sales.index', 'permission' => 'process_sales'],
            ['name' => 'Sales Reports', 'route' => 'sales.report', 'permission' => 'view_reports'],
            ['name' => 'Customers', 'route' => 'customers.index', 'permission' => 'manage_customers'],
            ['name' => 'Suppliers', 'route' => 'suppliers.index', 'permission' => 'manage_suppliers'],
            ['name' => 'Reports', 'route' => 'reports.index', 'permission' => 'view_reports'],
            ['name' => 'Settings', 'route' => 'settings.index', 'permission' => 'manage_settings'],
        ];

        $this->info("🎯 Navigation Items for pharmacy_admin role:");
        $visibleCount = 0;
        
        foreach ($navigationItems as $item) {
            $hasPermission = $this->hasPermission($user, $item['permission']);
            $status = $hasPermission ? '✅ VISIBLE' : '❌ HIDDEN';
            $reason = $item['permission'] ? "Requires: {$item['permission']}" : 'No permission required';
            
            $this->line("   {$status} {$item['name']} ({$reason})");
            
            if ($hasPermission) {
                $visibleCount++;
            }
        }
        
        $this->newLine();
        $this->info("📊 Summary: {$visibleCount} out of " . count($navigationItems) . " items should be visible");
        
        if ($visibleCount < count($navigationItems)) {
            $this->warn("⚠️  Some navigation items are hidden due to missing permissions.");
            $this->info("💡 All items should be visible for pharmacy_admin role.");
        } else {
            $this->info("🎉 All navigation items should be visible!");
        }

        return Command::SUCCESS;
    }

    private function hasPermission(User $user, ?string $permission): bool
    {
        if (!$permission) {
            return true; // No permission required
        }
        
        return $user->hasPermissionTo($permission);
    }
}