<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;

class PurchaseSystemSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creating purchase system data...');

        // Get existing data
        $suppliers = Supplier::all();
        $medicines = Medicine::all();
        $users = User::all();

        if ($suppliers->isEmpty() || $medicines->isEmpty() || $users->isEmpty()) {
            $this->command->warn('Please ensure suppliers, medicines, and users exist before running this seeder.');
            return;
        }

        // Create sample purchases
        $this->createSamplePurchases($suppliers, $medicines, $users);

        $this->command->info('Purchase system data created successfully!');
    }

    private function createSamplePurchases($suppliers, $medicines, $users)
    {
        $statuses = ['pending', 'ordered', 'partially_received', 'received', 'cancelled'];
        
        for ($i = 1; $i <= 20; $i++) {
            $supplier = $suppliers->random();
            $user = $users->random();
            $status = $statuses[array_rand($statuses)];
            
            $purchaseDate = Carbon::now()->subDays(rand(1, 90));
            $expectedDeliveryDate = $purchaseDate->copy()->addDays(rand(3, 14));
            
            $purchase = Purchase::create([
                'purchase_number' => 'PO' . $purchaseDate->format('Ymd') . str_pad($i, 3, '0', STR_PAD_LEFT),
                'supplier_id' => $supplier->id,
                'user_id' => $user->id,
                'purchase_date' => $purchaseDate,
                'expected_delivery_date' => $expectedDeliveryDate,
                'actual_delivery_date' => $status === 'received' ? $expectedDeliveryDate->copy()->addDays(rand(-2, 5)) : null,
                'status' => $status,
                'tax_amount' => rand(0, 100),
                'discount_amount' => rand(0, 50),
                'shipping_cost' => rand(10, 100),
                'notes' => $this->generatePurchaseNotes(),
                'payment_terms' => [
                    'payment_method' => ['cash', 'credit', 'bank_transfer'][array_rand(['cash', 'credit', 'bank_transfer'])],
                    'payment_due_days' => rand(15, 60),
                    'early_payment_discount' => rand(0, 5),
                ],
                'invoice_number' => $status !== 'pending' ? 'INV-' . $purchaseDate->format('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT) : null,
                'invoice_date' => $status !== 'pending' ? $purchaseDate->copy()->addDays(rand(1, 3)) : null,
            ]);

            // Add purchase items
            $itemCount = rand(2, 6);
            $selectedMedicines = $medicines->random($itemCount);
            
            foreach ($selectedMedicines as $medicine) {
                $quantity = rand(10, 200);
                $unitCost = $medicine->cost_price * (1 + (rand(-10, 30) / 100)); // Vary cost by ±10% to +30%
                
                $quantityReceived = 0;
                if ($status === 'received') {
                    $quantityReceived = $quantity;
                } elseif ($status === 'partially_received') {
                    $quantityReceived = rand(1, $quantity - 1);
                }
                
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'medicine_id' => $medicine->id,
                    'quantity_ordered' => $quantity,
                    'quantity_received' => $quantityReceived,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'batch_number' => $quantityReceived > 0 ? 'BATCH-' . $purchaseDate->format('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT) : null,
                    'expiry_date' => $quantityReceived > 0 ? Carbon::now()->addMonths(rand(12, 36)) : null,
                    'manufacturing_date' => $quantityReceived > 0 ? $purchaseDate->copy()->subDays(rand(30, 180)) : null,
                    'notes' => rand(0, 1) ? $this->generateItemNotes() : null,
                ]);
            }

            // Calculate and update totals
            $purchase->calculateTotals();
        }

        $this->command->info('Created 20 sample purchases with items');
    }

    private function generatePurchaseNotes()
    {
        $notes = [
            'Regular monthly stock replenishment',
            'Emergency order due to high demand',
            'Bulk purchase for cost savings',
            'New supplier trial order',
            'Seasonal stock preparation',
            'Special promotion from supplier',
            'Quality medicines from trusted supplier',
            'Fast-moving items restock',
            'Prescription medicines order',
            'OTC medicines bulk order',
        ];

        return $notes[array_rand($notes)];
    }

    private function generateItemNotes()
    {
        $notes = [
            'Store in cool, dry place',
            'Handle with care - fragile',
            'Check expiry date upon receipt',
            'Refrigeration required',
            'High-demand item',
            'New formulation',
            'Generic alternative',
            'Brand name medicine',
            'Controlled substance',
            'Special storage requirements',
        ];

        return $notes[array_rand($notes)];
    }
}