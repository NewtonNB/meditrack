<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\DashboardController;
use App\Services\ActivityTrackingService;
use App\Services\AutomationService;
use App\Services\AnalyticsService;

class TestDashboard extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:dashboard';

    /**
     * The console command description.
     */
    protected $description = 'Test the dashboard functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Dashboard System...');

        try {
            // Test services
            $activityService = app(ActivityTrackingService::class);
            $automationService = app(AutomationService::class);
            $analyticsService = app(AnalyticsService::class);
            
            $this->info('✓ All services instantiated successfully');

            // Test getting dashboard data
            $recentActivities = $activityService->getRecentActivities(10);
            $this->info('✓ Recent activities: ' . count($recentActivities) . ' activities');

            // Test activity stats
            $stats = $activityService->getActivityStats();
            $this->info('✓ Activity stats retrieved');

            // Test automation summary
            $automationSummary = $automationService->getDashboardSummary();
            $this->info('✓ Automation summary retrieved');

            // Test analytics summary
            $analyticsSummary = $analyticsService->getDashboardSummary();
            $this->info('✓ Analytics summary retrieved');

            $this->info('🎉 Dashboard System is working correctly!');
            $this->info('📊 Dashboard data summary:');
            $this->line('  - Recent activities: ' . count($recentActivities));
            $this->line('  - Today\'s activities: ' . $stats['today']['total']);
            $this->line('  - System status: Operational');

        } catch (\Exception $e) {
            $this->error('❌ Error testing dashboard: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}