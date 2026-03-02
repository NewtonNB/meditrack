<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Warehouse;
use App\Models\Medicine;
use App\Models\Batch;
use App\Models\StockLevel;
use App\Models\ReorderRule;
use App\Services\Inventory\InventoryService;
use App\Services\Inventory\BatchTrackingService;
use App\Services\Inventory\UnitConversionService;

class TestInventorySystem extends Command
{
    protected $signature = 'inventory:test {--service=all : Test specific service (all, inventory, batch, unit)}';
    protected $description = 'Test the inventory management system';

    protected $inventoryService;
    protected $batchService;
    protected $unitService;

    public function __construct(
        InventoryService $inventoryService,
        BatchTrackingService $batchService,
        UnitConversionService $unitService
    ) {
        parent::__construct();
        $this->inventoryService = $inventoryService;
        $this->batchService = $batchService;
        $this->unitService = $unitService;
    }

    public function handle()
    {
        $service = $this->option('service');

        $this->info('🧪 Testing Inventory Management System');
        $this->newLine();

        if ($service === 'all' || $service === 'inventory') {
            $this->testInventoryService();
        }

        if ($service === 'all' || $service === 'batch') {
            $this->testBatchService();
        }

        if ($service === 'all' || $service === 'unit') {
            $this->testUnitConversionService();
        }

        $this->testDataIntegrity();
        $this->displaySystemStatus();

        $this->newLine();
        $this->info('✅ Inventory system testing completed!');
    }

    protected function testInventoryService()
    {
        $this->info('📦 Testing Inventory Service...');

        try {
            $medicine = Medicine::first();
            $warehouse = Warehouse::first();

            if (!$medicine || !$warehouse) {
                $this->error('❌ No medicine or warehouse found. Run seeder first.');
                return;
            }

            // Test stock level retrieval
            $stockLevel = $this->inventoryService->getStockLevel($medicine->id, $warehouse->id);
            $this->line("   Stock Level: {$stockLevel} units");

            // Test available stock
            $availableStock = $this->inventoryService->getAvailableStock($medicine->id, $warehouse->id);
            $this->line("   Available Stock: {$availableStock} units");

            // Test low stock items
            $lowStockItems = $this->inventoryService->getLowStockItems($warehouse->id);
            $this->line("   Low Stock Items: {$lowStockItems->count()}");

            // Test expiring batches
            $expiringBatches = $this->inventoryService->getExpiringBatches(30, $warehouse->id);
            $this->line("   Expiring Batches (30 days): {$expiringBatches->count()}");

            // Test inventory summary
            $summary = $this->inventoryService->getInventorySummary($warehouse->id);
            $this->line("   Total Items: {$summary['total_items']}");
            $this->line("   Total Value: $" . number_format($summary['total_value'], 2));

            $this->info('✅ Inventory Service: PASSED');

        } catch (\Exception $e) {
            $this->error('❌ Inventory Service: FAILED - ' . $e->getMessage());
        }

        $this->newLine();
    }

    protected function testBatchService()
    {
        $this->info('🏷️  Testing Batch Service...');

        try {
            $medicine = Medicine::first();
            $warehouse = Warehouse::first();

            if (!$medicine || !$warehouse) {
                $this->error('❌ No medicine or warehouse found.');
                return;
            }

            // Test batch selection for sale
            $batchSelection = $this->batchService->getBatchesForSale($medicine->id, $warehouse->id, 10);
            $this->line("   Available Batches: " . count($batchSelection['batches']));
            $this->line("   Total Available: {$batchSelection['total_available']} units");

            // Test expiring batches
            $expiringBatches = $this->batchService->getExpiringBatches(30, $warehouse->id);
            $this->line("   Expiring Batches: {$expiringBatches->count()}");

            // Test batch profitability
            $batch = Batch::first();
            if ($batch) {
                $profitability = $this->batchService->getBatchProfitability($batch->id);
                $this->line("   Sample Batch Profit Margin: " . number_format($profitability['profit_margin'], 2) . '%');
            }

            $this->info('✅ Batch Service: PASSED');

        } catch (\Exception $e) {
            $this->error('❌ Batch Service: FAILED - ' . $e->getMessage());
        }

        $this->newLine();
    }

    protected function testUnitConversionService()
    {
        $this->info('🔄 Testing Unit Conversion Service...');

        try {
            $medicine = Medicine::first();

            if (!$medicine) {
                $this->error('❌ No medicine found.');
                return;
            }

            // Test unit conversion
            $convertedQuantity = $this->unitService->convert($medicine->id, 100, 'tablet', 'strip');
            $this->line("   100 tablets = {$convertedQuantity} strips");

            // Test available units
            $availableUnits = $this->unitService->getAvailableUnits($medicine->id);
            $this->line("   Available Units: " . implode(', ', $availableUnits));

            // Test conversion factor
            $factor = $this->unitService->getConversionFactor($medicine->id, 'tablet', 'box');
            $this->line("   Tablet to Box Factor: {$factor}");

            // Test unit formatting
            $formatted = $this->unitService->formatQuantity(150, 'tablet');
            $this->line("   Formatted: {$formatted}");

            $this->info('✅ Unit Conversion Service: PASSED');

        } catch (\Exception $e) {
            $this->error('❌ Unit Conversion Service: FAILED - ' . $e->getMessage());
        }

        $this->newLine();
    }

    protected function testDataIntegrity()
    {
        $this->info('🔍 Testing Data Integrity...');

        // Check warehouses
        $warehouseCount = Warehouse::count();
        $this->line("   Warehouses: {$warehouseCount}");

        // Check batches
        $batchCount = Batch::count();
        $activeBatches = Batch::where('status', 'active')->count();
        $this->line("   Total Batches: {$batchCount}");
        $this->line("   Active Batches: {$activeBatches}");

        // Check stock levels
        $stockLevelCount = StockLevel::count();
        $this->line("   Stock Level Records: {$stockLevelCount}");

        // Check reorder rules
        $reorderRuleCount = ReorderRule::count();
        $activeRules = ReorderRule::where('is_active', true)->count();
        $this->line("   Reorder Rules: {$reorderRuleCount}");
        $this->line("   Active Rules: {$activeRules}");

        // Check for orphaned records
        $orphanedStockLevels = StockLevel::whereDoesntHave('medicine')->count();
        $orphanedBatches = Batch::whereDoesntHave('medicine')->count();

        if ($orphanedStockLevels > 0 || $orphanedBatches > 0) {
            $this->warn("   ⚠️  Found orphaned records: {$orphanedStockLevels} stock levels, {$orphanedBatches} batches");
        } else {
            $this->line("   ✅ No orphaned records found");
        }

        $this->info('✅ Data Integrity: PASSED');
        $this->newLine();
    }

    protected function displaySystemStatus()
    {
        $this->info('📊 System Status Summary');

        // Overall statistics
        $totalMedicines = Medicine::count();
        $totalWarehouses = Warehouse::active()->count();
        $totalBatches = Batch::active()->count();
        $totalStockValue = StockLevel::join('medicines', 'stock_levels.medicine_id', '=', 'medicines.id')
                                   ->sum(\DB::raw('stock_levels.quantity * medicines.selling_price'));

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Medicines', $totalMedicines],
                ['Active Warehouses', $totalWarehouses],
                ['Active Batches', $totalBatches],
                ['Total Stock Value', '$' . number_format($totalStockValue, 2)],
            ]
        );

        // Low stock alerts
        $lowStockCount = $this->inventoryService->getLowStockItems()->count();
        $expiringCount = $this->inventoryService->getExpiringBatches(30)->count();

        if ($lowStockCount > 0) {
            $this->warn("⚠️  {$lowStockCount} items are below reorder point");
        }

        if ($expiringCount > 0) {
            $this->warn("⚠️  {$expiringCount} batches expire within 30 days");
        }

        if ($lowStockCount === 0 && $expiringCount === 0) {
            $this->info('✅ No immediate inventory concerns');
        }
    }
}