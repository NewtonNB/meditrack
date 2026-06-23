<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create subscription plans first
        $this->call(SubscriptionPlanSeeder::class);
        
        // Create roles and permissions
        $this->call(RolesAndPermissionsSeeder::class);

		// Create a super admin user (idempotent)
		$superAdmin = User::firstOrCreate(
			['email' => 'admin@mediTrack.com'],
			[
				'name' => 'Super Admin',
				'password' => bcrypt('1234'),
				'role' => 'super_admin',
				'pharmacy_id' => null,
			]
		);
        $superAdmin->assignRole('super_admin');

		// Create a demo pharmacy client (idempotent)
		$pharmacy = \App\Models\PharmacyClient::firstOrCreate(
			['slug' => 'demo-pharmacy'],
			[
				'name' => 'Demo Pharmacy',
				'email' => 'demo@pharmacy.com',
				'phone' => '+1234567890',
				'address' => '123 Main St, City, State',
				'license_number' => 'PH123456',
				'subscription_plan' => 'pro',
				'status' => 'active',
				'subscription_expires_at' => now()->addYear(),
				'monthly_fee' => 49.99,
			]
		);

		// Create a pharmacy admin user (idempotent)
		$pharmacyAdmin = User::firstOrCreate(
			['email' => 'tukamuhebwanewton@gmail.com'],
			[
				'name' => 'Pharmacy Admin',
				'password' => bcrypt('1234'),
				'role' => 'pharmacy_admin',
				'pharmacy_id' => $pharmacy->id,
			]
		);
        $pharmacyAdmin->assignRole('pharmacy_admin');
        
        // Create additional test users with different roles
		$pharmacist = User::firstOrCreate(
			['email' => 'pharmacist@demo.com'],
			[
				'name' => 'John Pharmacist',
				'password' => bcrypt('1234'),
				'role' => 'pharmacist',
				'pharmacy_id' => $pharmacy->id,
			]
		);
        $pharmacist->assignRole('pharmacist');
        
		$cashier = User::firstOrCreate(
			['email' => 'cashier@demo.com'],
			[
				'name' => 'Jane Cashier',
				'password' => bcrypt('1234'),
				'role' => 'cashier',
				'pharmacy_id' => $pharmacy->id,
			]
		);
        $cashier->assignRole('cashier');

        // Create sample data for the demo pharmacy
        \App\Models\Supplier::factory(5)->create(['pharmacy_id' => $pharmacy->id]);
        \App\Models\Customer::factory(15)->create(['pharmacy_id' => $pharmacy->id]);
        \App\Models\Medicine::factory(30)->create(['pharmacy_id' => $pharmacy->id]);
        \App\Models\Sale::factory(50)->create(['pharmacy_id' => $pharmacy->id]);

        // Create additional pharmacy clients
        \App\Models\PharmacyClient::factory(5)->create();


		// Seed extended systems (inventory, purchasing, AI integrations) only if tables exist
		if (Schema::hasTable('warehouses') && Schema::hasTable('batches') && Schema::hasTable('stock_levels')) {
			$this->call(InventorySystemSeeder::class);
		}

		if (Schema::hasTable('purchases') && Schema::hasTable('purchase_items')) {
			$this->call(PurchaseSystemSeeder::class);
		}

		if (Schema::hasTable('ml_models')) {
			$this->call(AISystemSeeder::class);
		}
    }
}
