<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\Branch;
use App\Models\Medicine;
use App\Models\Batch;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\ReorderRule;
use App\Models\Barcode;
use App\Models\Supplier;
use Carbon\Carbon;

class InventorySystemSeeder extends Seeder
{
    public function run()
    {
        // Create Warehouses (or get existing ones)
        $mainWarehouse = Warehouse::firstOrCreate(
            ['code' => 'MW001'],
            [
                'name' => 'Main Warehouse',
                'address' => '123 Main Street, City Center',
                'type' => 'main',
                'is_active' => true,
                'settings' => [
                    'temperature_controlled' => true,
                    'security_level' => 'high',
                    'operating_hours' => '24/7'
                ]
            ]
        );

        $branchWarehouse = Warehouse::firstOrCreate(
            ['code' => 'BW001'],
            [
                'name' => 'Branch Warehouse',
                'address' => '456 Branch Avenue, Suburb',
                'type' => 'branch',
                'is_active' => true,
                'settings' => [
                    'temperature_controlled' => false,
                    'security_level' => 'medium',
                    'operating_hours' => '8AM-8PM'
                ]
            ]
        );

        $storageWarehouse = Warehouse::firstOrCreate(
            ['code' => 'CS001'],
            [
                'name' => 'Cold Storage',
                'address' => '789 Storage Road, Industrial Area',
                'type' => 'storage',
                'is_active' => true,
                'settings' => [
                    'temperature_controlled' => true,
                    'temperature_range' => '2-8°C',
                    'security_level' => 'high',
                    'operating_hours' => '24/7'
                ]
            ]
        );

        // Create Branches (or get existing ones)
        Branch::firstOrCreate(
            ['code' => 'DT001'],
            [
                'warehouse_id' => $branchWarehouse->id,
                'name' => 'Downtown Branch',
                'manager_id' => 1, // Assuming user ID 1 exists
                'address' => '456 Branch Avenue, Downtown',
                'is_active' => true
            ]
        );

        Branch::firstOrCreate(
            ['code' => 'UT001'],
            [
                'warehouse_id' => $branchWarehouse->id,
                'name' => 'Uptown Branch',
                'manager_id' => 1,
                'address' => '789 Uptown Street, Uptown',
                'is_active' => true
            ]
        );

        // Update existing medicines with inventory settings
        $medicines = Medicine::take(10)->get();
        
        foreach ($medicines as $index => $medicine) {
            $medicine->update([
                'base_unit' => 'tablet',
                'unit_conversions' => [
                    'strip' => 10,
                    'box' => 100,
                    'bottle' => 30
                ],
                'reorder_point' => rand(20, 100),
                'reorder_quantity' => rand(100, 500),
                'safety_stock' => rand(10, 50),
                'lead_time_days' => rand(3, 14),
                'track_batches' => true,
                'require_expiry' => true,
                'barcode' => '123456789' . str_pad($index, 3, '0', STR_PAD_LEFT),
                'markup_percentage' => rand(15, 35)
            ]);
        }

        // Create Batches for medicines
        $suppliers = Supplier::take(3)->get();
        $warehouses = [$mainWarehouse, $branchWarehouse, $storageWarehouse];

        foreach ($medicines as $medicine) {
            // Create 2-4 batches per medicine
            $batchCount = rand(2, 4);
            
            for ($i = 0; $i < $batchCount; $i++) {
                $supplier = $suppliers->random();
                $warehouse = $warehouses[array_rand($warehouses)];
                
                $expiryDate = Carbon::now()->addDays(rand(30, 730)); // 30 days to 2 years
                $manufactureDate = Carbon::now()->subDays(rand(30, 180));
                $purchasePrice = $medicine->cost_price * rand(80, 120) / 100; // ±20% variation
                $sellingPrice = $medicine->selling_price;
                $quantityReceived = rand(50, 500);

                $batch = Batch::create([
                    'medicine_id' => $medicine->id,
                    'batch_number' => 'B' . date('Y') . str_pad($medicine->id, 3, '0', STR_PAD_LEFT) . str_pad($i + 1, 2, '0', STR_PAD_LEFT),
                    'lot_number' => 'L' . rand(1000, 9999),
                    'expiry_date' => $expiryDate,
                    'manufacture_date' => $manufactureDate,
                    'supplier_id' => $supplier->id,
                    'purchase_price' => $purchasePrice,
                    'selling_price' => $sellingPrice,
                    'quantity_received' => $quantityReceived,
                    'quantity_remaining' => rand(0, $quantityReceived), // Some consumed
                    'status' => 'active'
                ]);

                // Create stock level for this batch
                $stockQuantity = $batch->quantity_remaining;
                
                StockLevel::create([
                    'medicine_id' => $medicine->id,
                    'warehouse_id' => $warehouse->id,
                    'batch_id' => $batch->id,
                    'quantity' => $stockQuantity,
                    'reserved_quantity' => rand(0, min(10, $stockQuantity)),
                    'unit_type' => 'tablet',
                    'last_updated' => now(),
                    'audit_status' => ['pending', 'verified', 'discrepancy'][rand(0, 2)]
                ]);

                // Create some stock movements
                $movementCount = rand(1, 5);
                for ($j = 0; $j < $movementCount; $j++) {
                    $movementType = ['in', 'out', 'adjustment'][rand(0, 2)];
                    StockMovement::create([
                        'medicine_id' => $medicine->id,
                        'warehouse_id' => $warehouse->id,
                        'batch_id' => $batch->id,
                        'movement_type' => $movementType,
                        'quantity' => rand(1, 50),
                        'unit_type' => 'tablet',
                        'reference_type' => ['purchase', 'sale', 'adjustment', 'transfer'][rand(0, 3)],
                        'reference_id' => rand(1, 100),
                        'notes' => 'Sample movement for batch ' . $batch->batch_number,
                        'created_by' => 1,
                        'created_at' => Carbon::now()->subDays(rand(1, 30)),
                        // Legacy columns for compatibility
                        'type' => $movementType,
                        'note' => 'Sample movement for batch ' . $batch->batch_number
                    ]);
                }

                // Create barcode for batch
                Barcode::create([
                    'code' => $medicine->barcode . 'B' . str_pad($batch->id, 4, '0', STR_PAD_LEFT),
                    'type' => 'code128',
                    'medicine_id' => $medicine->id,
                    'batch_id' => $batch->id,
                    'unit_type' => 'tablet',
                    'quantity_per_scan' => 1,
                    'is_active' => true,
                    'metadata' => json_encode([
                        'batch_number' => $batch->batch_number,
                        'expiry_date' => $batch->expiry_date->format('Y-m-d')
                    ])
                ]);
            }

            // Create reorder rules for each medicine in each warehouse
            foreach ($warehouses as $warehouse) {
                ReorderRule::create([
                    'medicine_id' => $medicine->id,
                    'warehouse_id' => $warehouse->id,
                    'min_stock' => $medicine->reorder_point,
                    'max_stock' => $medicine->reorder_point * 5,
                    'reorder_point' => $medicine->reorder_point,
                    'reorder_quantity' => $medicine->reorder_quantity,
                    'supplier_id' => $suppliers->random()->id,
                    'lead_time_days' => $medicine->lead_time_days,
                    'is_active' => true,
                    'seasonal_adjustments' => json_encode([
                        'january' => 1.0,
                        'february' => 0.9,
                        'march' => 1.1,
                        'april' => 1.0,
                        'may' => 1.2,
                        'june' => 1.3,
                        'july' => 1.4,
                        'august' => 1.3,
                        'september' => 1.1,
                        'october' => 1.0,
                        'november' => 0.9,
                        'december' => 1.2
                    ])
                ]);
            }
        }

        // Create some expired batches for testing
        $expiredBatch = Batch::create([
            'medicine_id' => $medicines->first()->id,
            'batch_number' => 'EXPIRED001',
            'lot_number' => 'EXP001',
            'expiry_date' => Carbon::now()->subDays(30),
            'manufacture_date' => Carbon::now()->subDays(400),
            'supplier_id' => $suppliers->first()->id,
            'purchase_price' => 10.00,
            'selling_price' => 15.00,
            'quantity_received' => 100,
            'quantity_remaining' => 25,
            'status' => 'expired'
        ]);

        // Create some expiring soon batches
        $expiringSoonBatch = Batch::create([
            'medicine_id' => $medicines->skip(1)->first()->id,
            'batch_number' => 'EXPIRING001',
            'lot_number' => 'EXP002',
            'expiry_date' => Carbon::now()->addDays(15),
            'manufacture_date' => Carbon::now()->subDays(300),
            'supplier_id' => $suppliers->first()->id,
            'purchase_price' => 8.00,
            'selling_price' => 12.00,
            'quantity_received' => 200,
            'quantity_remaining' => 150,
            'status' => 'active'
        ]);

        StockLevel::create([
            'medicine_id' => $expiringSoonBatch->medicine_id,
            'warehouse_id' => $mainWarehouse->id,
            'batch_id' => $expiringSoonBatch->id,
            'quantity' => 150,
            'reserved_quantity' => 0,
            'unit_type' => 'tablet',
            'last_updated' => now(),
            'audit_status' => 'verified'
        ]);

        $this->command->info('Inventory system seeded successfully!');
        $this->command->info('Created:');
        $this->command->info('- 3 Warehouses');
        $this->command->info('- 2 Branches');
        $this->command->info('- ' . (count($medicines) * 3) . ' Batches');
        $this->command->info('- ' . (count($medicines) * 3) . ' Stock Levels');
        $this->command->info('- ' . (count($medicines) * 3 * 3) . ' Reorder Rules');
        $this->command->info('- Multiple Stock Movements and Barcodes');
    }
}