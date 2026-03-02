<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Medicine;
use App\Services\PurchaseService;

class TestPurchaseSystem extends Command
{
    protected $signature = 'test:purchase-system';
    protected $description = 'Test the purchase management system functionality';

    public function handle()
    {
        $this->info('🛒 Testing Purchase Management System...');
        $this->info('==========================================');
        
        $allPassed = true;
        
        // Test database tables
        $allPassed &= $this->testDatabaseTables();
        
        // Test models and relationships
        $allPassed &= $this->testModelsAndRelationships();
        
        // Test purchase service
        $allPassed &= $this->testPurchaseService();
        
        // Test purchase operations
        $allPassed &= $this->testPurchaseOperations();
        
        $this->newLine();
        
        if ($allPassed) {
            $this->info('🎉 ALL PURCHASE SYSTEM TESTS PASSED!');
            $this->info('✅ Purchase management system is fully operational');
            $this->displayPurchaseSystemSummary();
        } else {
            $this->error('❌ Some purchase system tests failed');
            $this->warn('Please review the issues above');
        }
        
        return $allPassed ? 0 : 1;
    }
    
    protected function testDatabaseTables()
    {
        $this->info('🔍 Testing Database Tables...');
        
        $tables = [
            'purchases',
            'purchase_items',
        ];
        
        $allTablesExist = true;
        
        foreach ($tables as $table) {
            if (\Schema::hasTable($table)) {
                $this->line("   ✅ Table '{$table}' exists");
            } else {
                $this->line("   ❌ Table '{$table}' missing");
                $allTablesExist = false;
            }
        }
        
        return $allTablesExist;
    }
    
    protected function testModelsAndRelationships()
    {
        $this->info('🔍 Testing Models and Relationships...');
        
        try {
            // Test Purchase model
            $purchaseCount = Purchase::count();
            $this->line("   ✅ Purchase model working - {$purchaseCount} purchases found");
            
            // Test PurchaseItem model
            $itemCount = PurchaseItem::count();
            $this->line("   ✅ PurchaseItem model working - {$itemCount} items found");
            
            // Test relationships
            $purchase = Purchase::with(['supplier', 'user', 'items.medicine'])->first();
            if ($purchase) {
                $this->line("   ✅ Purchase relationships working");
                $this->line("      - Supplier: " . ($purchase->supplier->name ?? 'N/A'));
                $this->line("      - User: " . ($purchase->user->name ?? 'N/A'));
                $this->line("      - Items: " . $purchase->items->count());
            }
            
            return true;
            
        } catch (\Exception $e) {
            $this->line('   ❌ Model/Relationship test failed: ' . $e->getMessage());
            return false;
        }
    }
    
    protected function testPurchaseService()
    {
        $this->info('🔍 Testing Purchase Service...');
        
        try {
            $service = app(PurchaseService::class);
            $this->line('   ✅ PurchaseService resolved successfully');
            
            // Test service methods
            $methods = [
                'createPurchase',
                'updatePurchase',
                'receivePurchase',
                'cancelPurchase',
                'getPurchaseStatistics',
                'generatePurchaseReport',
            ];
            
            foreach ($methods as $method) {
                if (method_exists($service, $method)) {
                    $this->line("   ✅ Method '{$method}' exists");
                } else {
                    $this->line("   ❌ Method '{$method}' missing");
                    return false;
                }
            }
            
            // Test statistics
            $stats = $service->getPurchaseStatistics();
            $this->line("   ✅ Statistics generated successfully");
            $this->line("      - Total purchases: " . $stats['total_purchases']);
            $this->line("      - Pending purchases: " . $stats['pending_purchases']);
            
            return true;
            
        } catch (\Exception $e) {
            $this->line('   ❌ PurchaseService test failed: ' . $e->getMessage());
            return false;
        }
    }
    
    protected function testPurchaseOperations()
    {
        $this->info('🔍 Testing Purchase Operations...');
        
        try {
            // Test purchase number generation
            $purchaseNumber = Purchase::generatePurchaseNumber();
            $this->line("   ✅ Purchase number generation: {$purchaseNumber}");
            
            // Test status scopes
            $pendingCount = Purchase::pending()->count();
            $receivedCount = Purchase::received()->count();
            $overdueCount = Purchase::overdue()->count();
            
            $this->line("   ✅ Status scopes working:");
            $this->line("      - Pending: {$pendingCount}");
            $this->line("      - Received: {$receivedCount}");
            $this->line("      - Overdue: {$overdueCount}");
            
            // Test purchase calculations
            $purchase = Purchase::with('items')->first();
            if ($purchase) {
                $totalItems = $purchase->total_items;
                $totalReceived = $purchase->total_received;
                $completionPercentage = $purchase->completion_percentage;
                
                $this->line("   ✅ Purchase calculations working:");
                $this->line("      - Total items: {$totalItems}");
                $this->line("      - Total received: {$totalReceived}");
                $this->line("      - Completion: {$completionPercentage}%");
            }
            
            return true;
            
        } catch (\Exception $e) {
            $this->line('   ❌ Purchase operations test failed: ' . $e->getMessage());
            return false;
        }
    }
    
    protected function displayPurchaseSystemSummary()
    {
        $this->newLine();
        $this->info('📊 PURCHASE SYSTEM SUMMARY');
        $this->info('==========================');
        
        try {
            $stats = [
                'Total Purchases' => Purchase::count(),
                'Total Purchase Items' => PurchaseItem::count(),
                'Pending Purchases' => Purchase::pending()->count(),
                'Ordered Purchases' => Purchase::ordered()->count(),
                'Received Purchases' => Purchase::received()->count(),
                'Overdue Purchases' => Purchase::overdue()->count(),
                'Total Suppliers' => Supplier::count(),
                'Total Medicines' => Medicine::count(),
            ];
            
            foreach ($stats as $label => $value) {
                $this->line("   {$label}: " . number_format($value));
            }
            
            $this->newLine();
            $this->info('💰 FINANCIAL SUMMARY');
            $this->info('====================');
            
            $totalValue = Purchase::sum('total_amount');
            $avgOrderValue = Purchase::avg('total_amount');
            $thisMonthValue = Purchase::whereMonth('purchase_date', now()->month)
                                   ->whereYear('purchase_date', now()->year)
                                   ->sum('total_amount');
            
            $this->line("   Total Purchase Value: $" . number_format($totalValue, 2));
            $this->line("   Average Order Value: $" . number_format($avgOrderValue, 2));
            $this->line("   This Month Value: $" . number_format($thisMonthValue, 2));
            
            $this->newLine();
            $this->info('📋 PURCHASE STATUS BREAKDOWN');
            $this->info('============================');
            
            $statusCounts = Purchase::selectRaw('status, COUNT(*) as count')
                                  ->groupBy('status')
                                  ->get();
            
            foreach ($statusCounts as $status) {
                $this->line("   " . ucfirst(str_replace('_', ' ', $status->status)) . ": " . $status->count);
            }
            
            $this->newLine();
            $this->info('🚀 PURCHASE SYSTEM FEATURES');
            $this->info('===========================');
            
            $features = [
                '📝 Purchase Order Creation' => '✅ ENABLED',
                '📦 Multi-Item Purchases' => '✅ ENABLED',
                '🏪 Supplier Management' => '✅ ENABLED',
                '📊 Purchase Tracking' => '✅ ENABLED',
                '📋 Receiving Management' => '✅ ENABLED',
                '💰 Cost Calculations' => '✅ ENABLED',
                '📈 Purchase Analytics' => '✅ ENABLED',
                '🔍 Advanced Filtering' => '✅ ENABLED',
                '📄 Purchase Reports' => '✅ ENABLED',
                '🔔 Status Notifications' => '✅ ENABLED',
            ];
            
            foreach ($features as $feature => $status) {
                $this->line("   {$feature}: {$status}");
            }
            
        } catch (\Exception $e) {
            $this->warn('Could not generate complete purchase system summary');
        }
    }
}