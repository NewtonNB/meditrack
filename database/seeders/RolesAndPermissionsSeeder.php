<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'manage_users',
            'manage_medicines',
            'manage_customers',
            'manage_suppliers',
            'manage_purchases',
            'process_sales',
            'view_reports',
            'manage_settings',
            'export_data',
            'view_audit_logs',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Create roles and assign permissions
        $this->createSuperAdminRole();
        $this->createPharmacyAdminRole();
        $this->createPharmacistRole();
        $this->createCashierRole();
    }

    private function createSuperAdminRole(): void
    {
        $role = Role::findOrCreate('super_admin');
        
        // Super admin gets all permissions
        $permissions = Permission::all();
        $role->permissions()->sync($permissions->pluck('id'));
    }

    private function createPharmacyAdminRole(): void
    {
        $role = Role::findOrCreate('pharmacy_admin');
        
        // Pharmacy admin gets all permissions except some system-level ones
        $permissions = [
            'manage_users',
            'manage_medicines',
            'manage_customers',
            'manage_suppliers',
            'manage_purchases',
            'process_sales',
            'view_reports',
            'manage_settings',
            'export_data',
            'view_audit_logs',
        ];

        $permissionIds = Permission::whereIn('name', $permissions)->pluck('id');
        $role->permissions()->sync($permissionIds);
    }

    private function createPharmacistRole(): void
    {
        $role = Role::findOrCreate('pharmacist');
        
        // Pharmacist permissions - no user management or system settings
        $permissions = [
            'manage_medicines',
            'manage_customers',
            'manage_suppliers',
            'manage_purchases',
            'process_sales',
            'view_reports',
        ];

        $permissionIds = Permission::whereIn('name', $permissions)->pluck('id');
        $role->permissions()->sync($permissionIds);
    }

    private function createCashierRole(): void
    {
        $role = Role::findOrCreate('cashier');
        
        // Cashier permissions - limited to sales and basic customer operations
        $permissions = [
            'manage_customers', // Limited to lookup/basic operations
            'process_sales',
        ];

        $permissionIds = Permission::whereIn('name', $permissions)->pluck('id');
        $role->permissions()->sync($permissionIds);
    }
}