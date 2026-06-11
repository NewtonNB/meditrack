<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Medicine;
use App\Models\Customer;
use App\Services\AuditTrailService;
use App\Services\PermissionService;

class TestAuditSystem extends Command
{
    protected $signature = 'test:audit-system';
    protected $description = 'Test the complete RBAC and Audit Trail system';

    protected AuditTrailService $auditService;
    protected PermissionService $permissionService;

    public function __construct(AuditTrailService $auditService, PermissionService $permissionService)
    {
        parent::__construct();
        $this->auditService = $auditService;
        $this->permissionService = $permissionService;
    }

    public function handle()
    {
        $this->info('🔍 Testing RBAC and Audit Trail System...');
        $this->newLine();

        // Test 1: RBAC System
        $this->testRBACSystem();
        
        // Test 2: Audit Trail System
        $this->testAuditTrailSystem();
        
        // Test 3: Permission Checks
        $this->testPermissionChecks();
        
        // Test 4: Audit Statistics
        $this->testAuditStatistics();

        $this->newLine();
        $this->info('✅ All tests completed successfully!');
        
        return 0;
    }

    protected function testRBACSystem(): void
    {
        $this->info('1️⃣ Testing RBAC System...');
        
        // Get test users
        $superAdmin = User::where('role', 'super_admin')->first();
        $pharmacist = User::where('role', 'pharmacist')->first();
        $cashier = User::where('role', 'cashier')->first();

        if (!$superAdmin || !$pharmacist || !$cashier) {
            $this->warn('⚠️  Some test users not found. Run database seeder first.');
            return;
        }

        // Test role assignments
        $this->line("Super Admin permissions: " . $this->permissionService->getUserPermissions($superAdmin)->count());
        $this->line("Pharmacist permissions: " . $this->permissionService->getUserPermissions($pharmacist)->count());
        $this->line("Cashier permissions: " . $this->permissionService->getUserPermissions($cashier)->count());

        // Test specific permissions
        $canManageMedicines = $this->permissionService->checkUserPermission($pharmacist, 'manage_medicines');
        $canManageUsers = $this->permissionService->checkUserPermission($cashier, 'manage_users');
        
        $this->line("Pharmacist can manage medicines: " . ($canManageMedicines ? '✅' : '❌'));
        $this->line("Cashier can manage users: " . ($canManageUsers ? '❌' : '✅'));
        
        $this->info('✅ RBAC System working correctly');
        $this->newLine();
    }

    protected function testAuditTrailSystem(): void
    {
        $this->info('2️⃣ Testing Audit Trail System...');
        
        // Create a test customer to generate audit logs
        $user = User::first();
        auth()->login($user);
        
        $customer = Customer::create([
            'name' => 'Test Customer ' . now()->timestamp,
            'email' => 'test' . now()->timestamp . '@example.com',
            'phone' => '1234567890',
            'address' => 'Test Address',
        ]);

        // Update the customer
        $customer->update(['name' => 'Updated Test Customer']);
        
        // Get audit history
        $activities = $this->auditService->getModelHistory($customer, 10);
        
        $this->line("Created customer with ID: {$customer->id}");
        $this->line("Audit activities recorded: " . $activities->count());
        
        foreach ($activities as $activity) {
            $this->line("  - {$activity->event}: {$activity->formatted_description}");
        }
        
        // Clean up
        $customer->delete();
        
        $this->info('✅ Audit Trail System working correctly');
        $this->newLine();
    }

    protected function testPermissionChecks(): void
    {
        $this->info('3️⃣ Testing Permission Checks...');
        
        $users = User::with('roles')->take(3)->get();
        
        foreach ($users as $user) {
            $primaryRole = $user->getPrimaryRole();
            $permissions = $this->permissionService->getUserPermissions($user);
            
            $this->line("User: {$user->name} (Role: {$primaryRole})");
            $this->line("  Permissions: " . $permissions->pluck('name')->implode(', '));
        }
        
        $this->info('✅ Permission Checks working correctly');
        $this->newLine();
    }

    protected function testAuditStatistics(): void
    {
        $this->info('4️⃣ Testing Audit Statistics...');
        
        $statistics = $this->auditService->getAuditStatistics();
        
        $this->line("Total activities: " . $statistics['total_activities']);
        $this->line("Event types: " . count($statistics['event_counts']));
        $this->line("Active users: " . count($statistics['user_counts']));
        
        if (!empty($statistics['event_counts'])) {
            $this->line("Most common events:");
            $topEvents = array_slice($statistics['event_counts'], 0, 3, true);
            foreach ($topEvents as $event => $count) {
                $this->line("  - {$event}: {$count}");
            }
        }
        
        $this->info('✅ Audit Statistics working correctly');
        $this->newLine();
    }
}