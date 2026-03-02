<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\SystemOverviewController;

class TestSystemOverview extends Command
{
    protected $signature = 'test:system-overview';
    protected $description = 'Test the System Overview functionality';

    public function handle()
    {
        $this->info('Testing System Overview...');
        
        try {
            $controller = new SystemOverviewController();
            $this->info('✓ Controller instantiated successfully');
            
            // Test the stats method
            $response = $controller->getStats();
            $data = $response->getData(true);
            
            $this->info('✓ Stats retrieved successfully');
            $this->line('📊 System Statistics:');
            $this->line('  - Total Medicines: ' . $data['stats']['totalMedicines']);
            $this->line('  - Total Customers: ' . $data['stats']['totalCustomers']);
            $this->line('  - Total Sales: ' . $data['stats']['totalSales']);
            $this->line('  - Total Revenue: $' . number_format($data['stats']['totalRevenue'], 2));
            $this->line('  - System Health: ' . $data['systemHealth']);
            
            $this->info('🎉 System Overview is working correctly!');
            
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}