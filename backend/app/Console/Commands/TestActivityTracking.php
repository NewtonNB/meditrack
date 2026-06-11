<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Medicine;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Supplier;
use App\Services\ActivityTrackingService;

class TestActivityTracking extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:activity-tracking';

    /**
     * The console command description.
     */
    protected $description = 'Test the activity tracking system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Activity Tracking System...');

        try {
            // Test ActivityTrackingService
            $activityService = app(ActivityTrackingService::class);
            
            $this->info('✓ ActivityTrackingService instantiated successfully');

            // Test getting recent activities
            $activities = $activityService->getRecentActivities(5);
            
            $this->info('✓ Recent activities retrieved: ' . count($activities) . ' activities found');

            // Test activity stats
            $stats = $activityService->getActivityStats();
            
            $this->info('✓ Activity stats retrieved successfully');
            $this->line('  - Today: ' . $stats['today']['total'] . ' activities');
            $this->line('  - This week: ' . $stats['this_week']['total'] . ' activities');
            $this->line('  - This month: ' . $stats['this_month']['total'] . ' activities');

            // Test model activity tracking (if models exist)
            $medicineCount = Medicine::count();
            $customerCount = Customer::count();
            $saleCount = Sale::count();
            $supplierCount = Supplier::count();

            $this->info('✓ Model counts:');
            $this->line('  - Medicines: ' . $medicineCount);
            $this->line('  - Customers: ' . $customerCount);
            $this->line('  - Sales: ' . $saleCount);
            $this->line('  - Suppliers: ' . $supplierCount);

            // Test creating a test activity log
            $testActivity = $activityService->logActivity([
                'event' => 'system_test',
                'description' => 'Activity tracking system test completed successfully',
                'properties' => [
                    'test_timestamp' => now()->toISOString(),
                    'system_status' => 'operational',
                ]
            ]);

            $this->info('✓ Test activity logged with ID: ' . $testActivity->id);

            $this->info('🎉 Activity Tracking System is working correctly!');

        } catch (\Exception $e) {
            $this->error('❌ Error testing activity tracking: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}