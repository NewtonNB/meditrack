<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\POS\POSService;
use App\Services\POS\PaymentService;
use App\Services\POS\LoyaltyService;
use App\Services\POS\PromotionService;
use App\Models\Medicine;
use App\Models\Customer;
use App\Models\POSTerminal;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class TestPOSSystem extends Command
{
    protected $signature = 'test:pos-system';
    protected $description = 'Test the POS system functionality';

    public function handle()
    {
        $this->info('Testing POS System...');
        
        try {
            // Test database tables
            $this->testDatabaseTables();
            
            // Test models
            $this->testModels();
            
            // Test services
            $this->testServices();
            
            // Create sample data
            $this->createSampleData();
            
            $this->info('✅ POS System test completed successfully!');
            
        } catch (\Exception $e) {
            $this->error('❌ POS System test failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }

    protected function testDatabaseTables()
    {
        $this->info('Testing database tables...');
        
        $tables = [
            'sales',
            'payment_transactions',
            'customer_loyalty',
            'loyalty_transactions',
            'promotions',
            'coupons',
            'pos_terminals',
            'returns',
            'return_items'
        ];
        
        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                $this->line("✅ Table '{$table}' exists");
            } else {
                throw new \Exception("Table '{$table}' does not exist");
            }
        }
    }

    protected function testModels()
    {
        $this->info('Testing models...');
        
        $models = [
            \App\Models\Sale::class,
            \App\Models\PaymentTransaction::class,
            \App\Models\CustomerLoyalty::class,
            \App\Models\LoyaltyTransaction::class,
            \App\Models\Promotion::class,
            \App\Models\Coupon::class,
            \App\Models\POSTerminal::class
        ];
        
        foreach ($models as $model) {
            $instance = new $model();
            $this->line("✅ Model '{$model}' instantiated successfully");
        }
    }

    protected function testServices()
    {
        $this->info('Testing services...');
        
        $services = [
            \App\Services\POS\POSService::class,
            \App\Services\POS\PaymentService::class,
            \App\Services\POS\LoyaltyService::class,
            \App\Services\POS\PromotionService::class
        ];
        
        foreach ($services as $service) {
            $instance = app($service);
            $this->line("✅ Service '{$service}' resolved successfully");
        }
    }

    protected function createSampleData()
    {
        $this->info('Creating sample data...');
        
        // Create POS Terminal
        $terminal = POSTerminal::firstOrCreate([
            'name' => 'Main Terminal'
        ], [
            'terminal_id' => 'TERM-001',
            'location' => 'Front Counter',
            'warehouse_id' => 1,
            'ip_address' => '192.168.1.100',
            'is_active' => true,
            'last_sync' => now()
        ]);
        $this->line("✅ POS Terminal created: {$terminal->name}");
        
        // Create sample customer with loyalty
        $customer = Customer::firstOrCreate([
            'email' => 'john.doe@example.com'
        ], [
            'name' => 'John Doe',
            'phone' => '+1234567890',
            'is_active' => true
        ]);
        
        $loyaltyService = app(LoyaltyService::class);
        $customerLoyalty = $loyaltyService->getOrCreateCustomerLoyalty($customer->id);
        $this->line("✅ Customer with loyalty created: {$customer->name} (Tier: {$customerLoyalty->tier})");
        
        // Create sample promotion
        $promotion = \App\Models\Promotion::firstOrCreate([
            'name' => 'Summer Sale'
        ], [
            'description' => '10% off all medicines',
            'type' => 'percentage',
            'value' => 10.00,
            'start_date' => now()->subDays(7),
            'end_date' => now()->addDays(30),
            'is_active' => true
        ]);
        $this->line("✅ Promotion created: {$promotion->name}");
        
        // Create sample coupon
        $coupon = \App\Models\Coupon::firstOrCreate([
            'code' => 'WELCOME10'
        ], [
            'promotion_id' => $promotion->id,
            'usage_limit' => 100,
            'expires_at' => now()->addDays(30),
            'is_active' => true
        ]);
        $this->line("✅ Coupon created: {$coupon->code}");
        
        // Test payment methods configuration
        $paymentService = app(PaymentService::class);
        $paymentMethods = $paymentService->getPaymentMethodConfig();
        $this->line("✅ Payment methods configured: " . implode(', ', array_keys($paymentMethods)));
        
        $this->info('Sample data created successfully!');
    }
}