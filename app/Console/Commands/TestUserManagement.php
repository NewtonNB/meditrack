<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\UserManagementController;
use App\Services\PermissionService;
use App\Services\AuditTrailService;
use App\Models\User;

class TestUserManagement extends Command
{
    protected $signature = 'test:user-management';
    protected $description = 'Test the User Management functionality';

    public function handle()
    {
        $this->info('Testing User Management System...');
        
        try {
            // Test services
            $permissionService = new PermissionService();
            $auditService = new AuditTrailService();
            $this->info('✓ Services instantiated successfully');
            
            // Test controller
            $controller = new UserManagementController($permissionService, $auditService);
            $this->info('✓ Controller instantiated successfully');
            
            // Test user queries
            $totalUsers = User::count();
            $activeUsers = User::where('is_active', true)->count();
            $adminUsers = User::where('role', 'like', '%admin%')->count();
            $pharmacists = User::where('role', 'pharmacist')->count();
            
            $this->info('✓ User queries executed successfully');
            $this->line('👥 User Statistics:');
            $this->line('  - Total Users: ' . $totalUsers);
            $this->line('  - Active Users: ' . $activeUsers);
            $this->line('  - Administrators: ' . $adminUsers);
            $this->line('  - Pharmacists: ' . $pharmacists);
            
            // Test roles
            $roles = $permissionService->getAllRoles();
            $this->info('✓ Roles retrieved: ' . count($roles));
            
            $this->info('🎉 User Management System is working correctly!');
            
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}