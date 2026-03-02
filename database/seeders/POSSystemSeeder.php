<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Medicine;
use App\Models\Customer;
use App\Models\POSTerminal;
use App\Models\Promotion;
use App\Models\Coupon;
use App\Models\CustomerLoyalty;
use App\Models\StockLevel;
use App\Models\Warehouse;

class POSSystemSeeder extends Seeder
{
    public function run()
    {
        // Create POS Terminals
        $terminals = [
            [
                'terminal_id' => 'TERM-001',
                'name' => 'Main Counter Terminal',
                'location' => 'Front Counter',
                'warehouse_id' => 1,
                'ip_address' => '192.168.1.100',
                'is_active' => true,
                'last_sync' => now()
            ],
            [
                'terminal_id' => 'TERM-002',
                'name' => 'Pharmacy Counter',
                'location' => 'Pharmacy Section',
                'warehouse_id' => 1,
                'ip_address' => '192.168.1.101',
                'is_active' => true,
                'last_sync' => now()
            ]
        ];

        foreach ($terminals as $terminal) {
            POSTerminal::firstOrCreate(
                ['terminal_id' => $terminal['terminal_id']],
                $terminal
            );
        }

        // Create sample medicines with stock
        $medicines = [
            [
                'name' => 'Paracetamol 500mg',
                'brand' => 'Tylenol',
                'selling_price' => 5.99,
                'cost_price' => 3.50,
                'stock' => 500,
                'batch_number' => 'PAR001',
                'expiry_date' => now()->addMonths(18)
            ],
            [
                'name' => 'Ibuprofen 400mg',
                'brand' => 'Advil',
                'selling_price' => 8.99,
                'cost_price' => 5.20,
                'stock' => 300,
                'batch_number' => 'IBU001',
                'expiry_date' => now()->addMonths(24)
            ],
            [
                'name' => 'Amoxicillin 250mg',
                'brand' => 'Amoxil',
                'selling_price' => 12.99,
                'cost_price' => 8.50,
                'stock' => 200,
                'batch_number' => 'AMX001',
                'expiry_date' => now()->addMonths(12)
            ],
            [
                'name' => 'Vitamin C 1000mg',
                'brand' => 'Nature Made',
                'selling_price' => 15.99,
                'cost_price' => 9.00,
                'stock' => 150,
                'batch_number' => 'VTC001',
                'expiry_date' => now()->addMonths(36)
            ],
            [
                'name' => 'Cough Syrup',
                'brand' => 'Robitussin',
                'selling_price' => 9.99,
                'cost_price' => 6.00,
                'stock' => 100,
                'batch_number' => 'CSY001',
                'expiry_date' => now()->addMonths(18)
            ],
            [
                'name' => 'Aspirin 325mg',
                'brand' => 'Bayer',
                'selling_price' => 4.99,
                'cost_price' => 2.80,
                'stock' => 400,
                'batch_number' => 'ASP001',
                'expiry_date' => now()->addMonths(30)
            ],
            [
                'name' => 'Omeprazole 20mg',
                'brand' => 'Prilosec',
                'selling_price' => 18.99,
                'cost_price' => 12.00,
                'stock' => 180,
                'batch_number' => 'OMP001',
                'expiry_date' => now()->addMonths(24)
            ],
            [
                'name' => 'Loratadine 10mg',
                'brand' => 'Claritin',
                'selling_price' => 7.99,
                'cost_price' => 4.50,
                'stock' => 250,
                'batch_number' => 'LOR001',
                'expiry_date' => now()->addMonths(30)
            ]
        ];

        foreach ($medicines as $medicineData) {
            $stockAmount = $medicineData['stock'];
            unset($medicineData['stock']);
            
            $medicine = Medicine::firstOrCreate(
                ['name' => $medicineData['name']],
                $medicineData
            );

            // Create stock level
            $warehouse = Warehouse::first();
            if ($warehouse) {
                StockLevel::firstOrCreate(
                    [
                        'medicine_id' => $medicine->id,
                        'warehouse_id' => $warehouse->id
                    ],
                    [
                        'quantity' => $stockAmount,
                        'reserved_quantity' => 0,
                        'unit_type' => 'tablet',
                        'audit_status' => 'verified'
                    ]
                );
            }
        }

        // Create sample customers with loyalty
        $customers = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@example.com',
                'phone' => '+1-555-0101',
                'address' => '123 Main St, City, State 12345',
                'tier' => 'silver',
                'points' => 1250
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@example.com',
                'phone' => '+1-555-0102',
                'address' => '456 Oak Ave, City, State 12345',
                'tier' => 'gold',
                'points' => 3500
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'michael.brown@example.com',
                'phone' => '+1-555-0103',
                'address' => '789 Pine Rd, City, State 12345',
                'tier' => 'bronze',
                'points' => 450
            ],
            [
                'name' => 'Emily Davis',
                'email' => 'emily.davis@example.com',
                'phone' => '+1-555-0104',
                'address' => '321 Elm St, City, State 12345',
                'tier' => 'platinum',
                'points' => 8750
            ],
            [
                'name' => 'Robert Wilson',
                'email' => 'robert.wilson@example.com',
                'phone' => '+1-555-0105',
                'address' => '654 Maple Dr, City, State 12345',
                'tier' => 'gold',
                'points' => 2800
            ]
        ];

        foreach ($customers as $customerData) {
            $points = $customerData['points'];
            $tier = $customerData['tier'];
            unset($customerData['points'], $customerData['tier']);

            $customer = Customer::firstOrCreate(
                ['email' => $customerData['email']],
                array_merge($customerData, [
                    'pharmacy_id' => 1
                ])
            );

            // Create loyalty record
            CustomerLoyalty::firstOrCreate(
                ['customer_id' => $customer->id],
                [
                    'points_balance' => $points,
                    'tier' => $tier,
                    'lifetime_points' => $points + rand(500, 2000),
                    'lifetime_spent' => $this->getTierMinimumSpent($tier) + rand(100, 1000),
                    'last_activity_date' => now()->subDays(rand(1, 30))
                ]
            );
        }

        // Create sample promotions
        $promotions = [
            [
                'name' => 'Summer Health Sale',
                'description' => '15% off all vitamins and supplements',
                'type' => 'percentage',
                'value' => 15.00,
                'conditions' => json_encode(['minimum_amount' => 25.00]),
                'applicable_items' => json_encode(['categories' => ['Vitamins']]),
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(23),
                'is_active' => true
            ],
            [
                'name' => 'Pain Relief Bundle',
                'description' => 'Buy 2 pain relief items, get 10% off',
                'type' => 'percentage',
                'value' => 10.00,
                'conditions' => json_encode(['minimum_quantity' => 2]),
                'applicable_items' => json_encode(['categories' => ['Pain Relief']]),
                'start_date' => now()->subDays(3),
                'end_date' => now()->addDays(27),
                'is_active' => true
            ],
            [
                'name' => 'Senior Citizen Discount',
                'description' => '5% discount for customers over 65',
                'type' => 'percentage',
                'value' => 5.00,
                'customer_tiers' => json_encode(['all']),
                'start_date' => now()->subDays(30),
                'end_date' => now()->addDays(365),
                'is_active' => true
            ]
        ];

        foreach ($promotions as $promotion) {
            Promotion::firstOrCreate(
                ['name' => $promotion['name']],
                $promotion
            );
        }

        // Create sample coupons
        $coupons = [
            [
                'code' => 'WELCOME10',
                'promotion_id' => 1,
                'usage_limit' => 100,
                'usage_count' => 15,
                'expires_at' => now()->addDays(30),
                'is_active' => true
            ],
            [
                'code' => 'HEALTH20',
                'promotion_id' => 2,
                'usage_limit' => 50,
                'usage_count' => 8,
                'expires_at' => now()->addDays(15),
                'is_active' => true
            ],
            [
                'code' => 'SAVE5NOW',
                'promotion_id' => 3,
                'usage_limit' => 200,
                'usage_count' => 45,
                'expires_at' => now()->addDays(60),
                'is_active' => true
            ]
        ];

        foreach ($coupons as $coupon) {
            Coupon::firstOrCreate(
                ['code' => $coupon['code']],
                $coupon
            );
        }

        $this->command->info('POS System sample data created successfully!');
    }

    private function getTierMinimumSpent($tier)
    {
        $minimums = [
            'bronze' => 0,
            'silver' => 1000,
            'gold' => 5000,
            'platinum' => 15000
        ];

        return $minimums[$tier] ?? 0;
    }
}