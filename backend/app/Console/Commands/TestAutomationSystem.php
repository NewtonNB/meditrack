<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Medicine;
use App\Models\Supplier;
use App\Services\AutomationService;
use Carbon\Carbon;

class TestAutomationSystem extends Command
{
    protected $signature = 'test:automation-system';
    protected $description = 'Test the smart automation system with sample data';

    protected $automationService;

    public function __construct(AutomationService $automationService)
    {
        parent::__construct();
        $this->automationService = $automationService;
    }

    public function handle()
    {
        $this->info('Testing Smart Automation System...');
        $this->newLine();

        // Create test suppliers if they don't exist
        $this->createTestSuppliers();

        // Create test medicines with various stock levels and expiry dates
        $this->createTestMedicines();

        // Test reorder suggestions
        $this->testReorderSuggestions();

        // Test expiry reminders
        $this->testExpiryReminders();

        // Test dashboard summary
        $this->testDashboardSummary();

        $this->newLine();
        $this->info('✅ Automation system test completed successfully!');
        
        return 0;
    }

    private function createTestSuppliers()
    {
        $this->info('Creating test suppliers...');

        $suppliers = [
            [
                'name' => 'MediCorp Pharmaceuticals',
                'contact_person' => 'John Smith',
                'phone' => '+1-555-0101',
                'email' => 'orders@medicorp.com',
                'address' => '123 Pharma Street, Medical City',
            ],
            [
                'name' => 'HealthPlus Distributors',
                'contact_person' => 'Sarah Johnson',
                'phone' => '+1-555-0102',
                'email' => 'supply@healthplus.com',
                'address' => '456 Health Avenue, Wellness Town',
            ],
            [
                'name' => 'Global Medical Supplies',
                'contact_person' => 'Mike Wilson',
                'phone' => '+1-555-0103',
                'email' => 'info@globalmed.com',
                'address' => '789 Medical Plaza, Care City',
            ],
        ];

        foreach ($suppliers as $supplierData) {
            Supplier::firstOrCreate(
                ['email' => $supplierData['email']],
                $supplierData
            );
        }

        $this->info('✓ Test suppliers created');
    }

    private function createTestMedicines()
    {
        $this->info('Creating test medicines with various stock scenarios...');

        $suppliers = Supplier::all();
        if ($suppliers->isEmpty()) {
            $this->error('No suppliers found. Please create suppliers first.');
            return;
        }

        $medicines = [
            // Critical reorder scenarios
            [
                'name' => 'Paracetamol 500mg',
                'code' => 'PAR500',
                'current_stock' => 5,
                'reorder_level' => 20,
                'purchase_price' => 0.50,
                'selling_price' => 1.00,
                'expiry_date' => Carbon::now()->addMonths(6),
                'scenario' => 'critical_reorder'
            ],
            [
                'name' => 'Amoxicillin 250mg',
                'code' => 'AMX250',
                'current_stock' => 8,
                'reorder_level' => 15,
                'purchase_price' => 2.00,
                'selling_price' => 4.00,
                'expiry_date' => Carbon::now()->addMonths(8),
                'scenario' => 'high_reorder'
            ],
            
            // Critical expiry scenarios
            [
                'name' => 'Ibuprofen 400mg',
                'code' => 'IBU400',
                'current_stock' => 50,
                'reorder_level' => 10,
                'purchase_price' => 0.75,
                'selling_price' => 1.50,
                'expiry_date' => Carbon::now()->addDays(5), // Expires in 5 days
                'scenario' => 'critical_expiry'
            ],
            [
                'name' => 'Aspirin 100mg',
                'code' => 'ASP100',
                'current_stock' => 30,
                'reorder_level' => 25,
                'purchase_price' => 0.30,
                'selling_price' => 0.60,
                'expiry_date' => Carbon::now()->addDays(20), // Expires in 20 days
                'scenario' => 'high_expiry'
            ],
            
            // Medium priority scenarios
            [
                'name' => 'Cetirizine 10mg',
                'code' => 'CET10',
                'current_stock' => 12,
                'reorder_level' => 15,
                'purchase_price' => 1.20,
                'selling_price' => 2.40,
                'expiry_date' => Carbon::now()->addDays(45),
                'scenario' => 'medium_priority'
            ],
            [
                'name' => 'Omeprazole 20mg',
                'code' => 'OME20',
                'current_stock' => 25,
                'reorder_level' => 10,
                'purchase_price' => 3.00,
                'selling_price' => 6.00,
                'expiry_date' => Carbon::now()->addDays(70),
                'scenario' => 'medium_expiry'
            ],
            
            // Well-stocked items
            [
                'name' => 'Vitamin C 1000mg',
                'code' => 'VITC1000',
                'current_stock' => 100,
                'reorder_level' => 20,
                'purchase_price' => 0.80,
                'selling_price' => 1.60,
                'expiry_date' => Carbon::now()->addYear(),
                'scenario' => 'well_stocked'
            ],
        ];

        foreach ($medicines as $medicineData) {
            $supplier = $suppliers->random();
            $scenario = $medicineData['scenario'];
            unset($medicineData['scenario']);

            $medicine = Medicine::firstOrCreate(
                ['code' => $medicineData['code']],
                array_merge($medicineData, [
                    'supplier_id' => $supplier->id,
                    'category' => 'general',
                    'is_prescription' => rand(0, 1),
                    'min_order_quantity' => rand(10, 50),
                    'batch_number' => 'BATCH-' . strtoupper(substr(md5($medicineData['code']), 0, 6)),
                ])
            );

            $this->line("  ✓ {$medicine->name} ({$scenario})");
        }

        $this->info('✓ Test medicines created with various scenarios');
    }

    private function testReorderSuggestions()
    {
        $this->info('Testing reorder suggestions...');

        $suggestions = $this->automationService->getReorderSuggestions();

        $this->info("Found {$suggestions->count()} reorder suggestions:");
        
        if ($suggestions->count() > 0) {
            $this->table(
                ['Medicine', 'Current Stock', 'Reorder Level', 'Suggested Qty', 'Urgency', 'Days Until Stockout'],
                $suggestions->take(5)->map(function ($suggestion) {
                    return [
                        $suggestion['medicine_name'],
                        $suggestion['current_stock'],
                        $suggestion['reorder_level'],
                        $suggestion['suggested_quantity'],
                        strtoupper($suggestion['urgency_level']),
                        round($suggestion['days_until_stockout'], 1),
                    ];
                })->toArray()
            );

            // Show urgency breakdown
            $urgencyBreakdown = $suggestions->groupBy('urgency_level')->map->count();
            $this->info('Urgency Breakdown:');
            foreach ($urgencyBreakdown as $level => $count) {
                $this->line("  • " . ucfirst($level) . ": {$count} items");
            }
        } else {
            $this->warn('No reorder suggestions found. All medicines are well-stocked!');
        }
    }

    private function testExpiryReminders()
    {
        $this->info('Testing expiry reminders...');

        $reminders = $this->automationService->getExpiryReminders();

        $this->info("Found {$reminders->count()} expiry reminders:");
        
        if ($reminders->count() > 0) {
            $this->table(
                ['Medicine', 'Stock', 'Expiry Date', 'Days Left', 'Urgency', 'Potential Loss'],
                $reminders->take(5)->map(function ($reminder) {
                    return [
                        $reminder['medicine_name'],
                        $reminder['current_stock'],
                        $reminder['expiry_date'],
                        $reminder['days_until_expiry'],
                        strtoupper($reminder['urgency_level']),
                        '$' . number_format($reminder['estimated_loss'], 2),
                    ];
                })->toArray()
            );

            // Show urgency breakdown
            $urgencyBreakdown = $reminders->groupBy('urgency_level')->map->count();
            $this->info('Urgency Breakdown:');
            foreach ($urgencyBreakdown as $level => $count) {
                $this->line("  • " . ucfirst($level) . ": {$count} items");
            }
        } else {
            $this->warn('No expiry reminders found. All medicines have sufficient shelf life!');
        }
    }

    private function testDashboardSummary()
    {
        $this->info('Testing dashboard summary...');

        $summary = $this->automationService->getDashboardSummary();

        $this->info('Dashboard Summary:');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Reorder Suggestions', $summary['reorder_suggestions']['total']],
                ['Critical Reorders', $summary['reorder_suggestions']['critical']],
                ['High Priority Reorders', $summary['reorder_suggestions']['high']],
                ['Estimated Reorder Cost', '$' . number_format($summary['reorder_suggestions']['estimated_cost'], 2)],
                ['Total Expiry Reminders', $summary['expiry_reminders']['total']],
                ['Critical Expiries', $summary['expiry_reminders']['critical']],
                ['High Priority Expiries', $summary['expiry_reminders']['high']],
                ['Potential Loss from Expiry', '$' . number_format($summary['expiry_reminders']['potential_loss'], 2)],
                ['Quick Actions Available', count($summary['quick_actions'])],
            ]
        );

        if (!empty($summary['quick_actions'])) {
            $this->info('Quick Actions:');
            foreach ($summary['quick_actions'] as $action) {
                $this->line("  • [{$action['priority']}] {$action['title']}");
            }
        }
    }
}