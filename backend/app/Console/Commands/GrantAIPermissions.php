<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Permission;

class GrantAIPermissions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ai:grant-permissions {--user= : User ID or email} {--all : Grant to all users}';

    /**
     * The console command description.
     */
    protected $description = 'Grant AI-related permissions to users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔐 Granting AI Permissions...');
        $this->newLine();

        // Get the view_reports permission
        $viewReportsPermission = Permission::where('name', 'view_reports')->first();
        
        if (!$viewReportsPermission) {
            $this->error('❌ view_reports permission not found. Please run the RBAC seeder first.');
            $this->line('   Run: php artisan db:seed --class=RolesAndPermissionsSeeder');
            return Command::FAILURE;
        }

        // Find or create pharmacy_admin role (which has view_reports permission)
        $pharmacyAdminRole = \App\Models\Role::where('name', 'pharmacy_admin')->first();
        
        if (!$pharmacyAdminRole) {
            $this->error('❌ pharmacy_admin role not found. Please run the RBAC seeder first.');
            $this->line('   Run: php artisan db:seed --class=RolesAndPermissionsSeeder');
            return Command::FAILURE;
        }

        if ($this->option('all')) {
            // Grant to all users
            $users = User::all();
            
            foreach ($users as $user) {
                if (!$user->hasPermissionTo('view_reports')) {
                    // Assign pharmacy_admin role which has view_reports permission
                    $user->assignRole('pharmacy_admin');
                    $this->line("   ✅ Granted AI permissions to: {$user->name} ({$user->email})");
                } else {
                    $this->line("   ℹ️  {$user->name} already has AI permissions");
                }
            }
            
            $this->info("🎉 AI permissions processed for {$users->count()} users!");
            
        } else {
            // Grant to specific user or first user
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
            
            if (!$user->hasPermissionTo('view_reports')) {
                $user->assignRole('pharmacy_admin');
                $this->info("✅ Granted AI permissions to: {$user->name} ({$user->email})");
            } else {
                $this->info("ℹ️  User {$user->name} already has AI permissions.");
            }
        }

        $this->newLine();
        $this->info('🚀 You can now access the AI Dashboard!');
        $this->line('   Navigate to: /ai-dashboard');
        
        return Command::SUCCESS;
    }
}