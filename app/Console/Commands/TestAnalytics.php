<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AnalyticsService;

class TestAnalytics extends Command
{
    protected $signature = 'test:analytics';
    protected $description = 'Test the analytics service';

    public function handle()
    {
        $this->info('Testing Analytics Service...');
        
        try {
            $service = app(AnalyticsService::class);
            
            // Test dashboard summary
            $summary = $service->getDashboardSummary();
            $this->info("✅ Dashboard Summary:");
            $this->line("   Today's Revenue: $" . number_format($summary['today']['revenue'], 2));
            $this->line("   Today's Transactions: " . $summary['today']['transactions']);
            $this->line("   Today's Profit: $" . number_format($summary['today']['profit'], 2));
            
            // Test sales trends
            $trends = $service->getSalesTrends('daily', 7);
            $this->info("✅ Sales Trends (Last 7 days): " . count($trends) . " data points");
            
            // Test best selling medicines
            $bestSelling = $service->getBestSellingMedicines(5, 30);
            $this->info("✅ Best Selling Medicines: " . count($bestSelling) . " items");
            
            // Test stock summary
            $stock = $service->getStockSummary();
            $this->info("✅ Stock Summary:");
            $this->line("   Total Medicines: " . $stock['total_medicines']);
            $this->line("   Total Stock Value: $" . number_format($stock['total_stock_value'], 2));
            $this->line("   Low Stock Items: " . $stock['low_stock_count']);
            
            // Test customer analytics
            $customers = $service->getCustomerAnalytics();
            $this->info("✅ Customer Analytics:");
            $this->line("   Total Customers: " . $customers['total_customers']);
            $this->line("   Active Customers: " . $customers['active_customers']);
            
            $this->info('🎉 Analytics Service test completed successfully!');
            
        } catch (\Exception $e) {
            $this->error('❌ Analytics Service test failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }
}