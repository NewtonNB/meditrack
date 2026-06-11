<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sale;
use App\Models\PaymentTransaction;
use App\Models\Medicine;
use App\Models\Customer;
use Carbon\Carbon;

class AnalyticsDataSeeder extends Seeder
{
    public function run()
    {
        $medicines = Medicine::all();
        $customers = Customer::all();
        
        if ($medicines->isEmpty() || $customers->isEmpty()) {
            $this->command->warn('Please run POSSystemSeeder first to create medicines and customers');
            return;
        }

        // Create sales data for the last 30 days
        for ($i = 30; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dailySales = rand(5, 20); // Random number of sales per day
            
            for ($j = 0; $j < $dailySales; $j++) {
                $this->createSale($date, $medicines, $customers);
            }
        }

        $this->command->info('Analytics sample data created successfully!');
    }

    private function createSale($date, $medicines, $customers)
    {
        // Random customer (80% chance of having a customer)
        $customer = rand(1, 100) <= 80 ? $customers->random() : null;
        
        // Random number of items in sale (1-5 items)
        $itemCount = rand(1, 5);
        $selectedMedicines = $medicines->random($itemCount);
        
        $subtotal = 0;
        $totalCost = 0;
        $saleItems = [];
        
        foreach ($selectedMedicines as $medicine) {
            $quantity = rand(1, 3);
            $unitPrice = $medicine->selling_price;
            $itemTotal = $quantity * $unitPrice;
            $itemCost = $quantity * $medicine->cost_price;
            
            $subtotal += $itemTotal;
            $totalCost += $itemCost;
            
            $saleItems[] = [
                'medicine_id' => $medicine->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $itemTotal
            ];
        }
        
        // Apply random discount (20% chance)
        $discountAmount = 0;
        if (rand(1, 100) <= 20) {
            $discountAmount = $subtotal * (rand(5, 15) / 100); // 5-15% discount
        }
        
        // Calculate tax (10%)
        $taxAmount = ($subtotal - $discountAmount) * 0.10;
        $totalAmount = $subtotal - $discountAmount + $taxAmount;
        
        // Create sale
        $sale = Sale::create([
            'transaction_id' => 'TXN-' . $date->format('Ymd') . '-' . strtoupper(uniqid()),
            'medicine_id' => $selectedMedicines->first()->id, // Required field
            'customer_id' => $customer ? $customer->id : null,
            'cashier_id' => 1, // Assuming user ID 1 exists
            'quantity' => $saleItems[0]['quantity'], // Required field
            'unit_price' => $saleItems[0]['unit_price'], // Required field
            'total_price' => $totalAmount,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_cost' => $totalCost,
            'profit_margin' => $totalAmount > 0 ? (($totalAmount - $totalCost) / $totalAmount) * 100 : 0,
            'payment_status' => 'completed',
            'sale_type' => 'pos',
            'receipt_number' => 'RCP-' . $date->format('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'sold_at' => $date->addHours(rand(8, 20))->addMinutes(rand(0, 59)), // Random time during business hours
            'created_at' => $date,
            'updated_at' => $date,
            'pharmacy_id' => 1
        ]);
        
        // Note: sale_items table doesn't exist, sales table handles individual items
        
        // Create payment transaction
        $paymentMethods = ['cash', 'card', 'mobile_money', 'insurance'];
        $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
        
        PaymentTransaction::create([
            'sale_id' => $sale->id,
            'payment_method' => $paymentMethod,
            'amount' => $totalAmount,
            'currency' => 'UGX',
            'reference_number' => strtoupper($paymentMethod) . '-' . uniqid(),
            'status' => 'completed',
            'processed_at' => $sale->created_at
        ]);
    }
}