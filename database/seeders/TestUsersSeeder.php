<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users for development
        $testUsers = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@mediTrack.com',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'pharmacy_id' => 1,
            ],
            [
                'name' => 'Pharmacy Admin',
                'email' => 'pharmacist@mediTrack.com',
                'password' => Hash::make('password'),
                'role' => 'pharmacy_admin',
                'pharmacy_id' => 1,
            ],
            [
                'name' => 'Cashier User',
                'email' => 'cashier@mediTrack.com',
                'password' => Hash::make('password'),
                'role' => 'cashier',
                'pharmacy_id' => 1,
            ],
        ];

        foreach ($testUsers as $userData) {
            // Check if user already exists
            $existingUser = User::where('email', $userData['email'])->first();
            
            if (!$existingUser) {
                $user = User::create($userData);
                
                // Assign appropriate role
                $roleName = $userData['role'];
                $role = Role::where('name', $roleName)->first();
                
                if ($role) {
                    $user->assignRole($roleName);
                    $this->command->info("✅ Created user: {$userData['name']} ({$userData['email']}) with role: {$roleName}");
                } else {
                    $this->command->warn("⚠️  Role '{$roleName}' not found for user: {$userData['email']}");
                }
            } else {
                // Update existing user's role if needed
                $user = $existingUser;
                $roleName = $userData['role'];
                
                if (!$user->hasRole($roleName)) {
                    $user->assignRole($roleName);
                    $this->command->info("✅ Updated role for existing user: {$userData['name']} ({$userData['email']})");
                } else {
                    $this->command->info("ℹ️  User already exists: {$userData['name']} ({$userData['email']})");
                }
            }
        }
    }
}