<?php

namespace App\Http\Controllers;

use App\Services\Inventory\InventoryService;
use App\Services\Inventory\BatchTrackingService;
use App\Services\Inventory\UnitConversionService;
use App\Models\Warehouse;
use App\Models\Medicine;
use App\Models\StockLevel;
use App\Models\Batch;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InventoryController extends Controller
{
    protected $inventoryService;
    protected $batchService;
    protected $unitService;

    public function __construct(
        InventoryService $inventoryService,
        BatchTrackingService $batchService,
        UnitConversionService $unitService
    ) {
        $this->inventoryService = $inventoryService;
        $this->batchService = $batchService;
        $this->unitService = $unitService;
    }

    /**
     * Display inventory dashboard
     */
    public function index(Request $request)
    {
        try {
            $warehouseId = $request->get('warehouse_id');

            // Get summary
            $totalItems = Medicine::count();
            $lowStockItems = Medicine::where('stock', '<', 10)->count();
            $outOfStockItems = Medicine::where('stock', '=', 0)->count();
            $expiringBatches = Medicine::whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<=', now()->addDays(30))
                ->count();

            // Get low stock items
            $lowStock = Medicine::with('supplier:id,name')
                ->where('stock', '<', 10)
                ->where('stock', '>', 0)
                ->orderBy('stock', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($med) {
                    return [
                        'id' => $med->id,
                        'medicine' => [
                            'name' => $med->name,
                            'brand' => $med->brand,
                        ],
                        'batch_number' => $med->batch_number ?? 'N/A',
                        'quantity_remaining' => $med->stock,
                        'expiry_date' => $med->expiry_date,
                    ];
                });

            // Get expiring batches
            $expiring = Medicine::whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<=', now()->addDays(30))
                ->whereDate('expiry_date', '>=', now())
                ->orderBy('expiry_date', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($med) {
                    return [
                        'id' => $med->id,
                        'medicine' => [
                            'name' => $med->name,
                        ],
                        'batch_number' => $med->batch_number ?? 'N/A',
                        'quantity_remaining' => $med->stock,
                        'expiry_date' => $med->expiry_date,
                    ];
                });

            // Get recent stock movements
            $movements = StockMovement::with('medicine:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($mov) {
                    return [
                        'id' => $mov->id,
                        'medicine' => [
                            'name' => $mov->medicine->name ?? 'Unknown',
                        ],
                        'movement_type' => $mov->movement_type ?? $mov->type,
                        'type' => $mov->movement_type ?? $mov->type,
                        'quantity' => $mov->quantity,
                        'reference' => $mov->reference,
                        'notes' => $mov->notes ?? $mov->note,
                        'created_at' => $mov->created_at,
                    ];
                });

            $data = [
                'summary' => [
                    'total_items' => $totalItems,
                    'low_stock_items' => $lowStockItems,
                    'out_of_stock_items' => $outOfStockItems,
                    'expiring_batches' => $expiringBatches,
                ],
                'lowStockItems' => $lowStock,
                'expiringBatches' => $expiring,
                'recentMovements' => $movements,
            ];

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($data);
            }

            $data['warehouses'] = Warehouse::active()->get();
            return Inertia::render('Inventory/Dashboard', $data);
        } catch (\Exception $e) {
            Log::error('Inventory index error: ' . $e->getMessage());
            
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'summary' => [
                        'total_items' => 0,
                        'low_stock_items' => 0,
                        'out_of_stock_items' => 0,
                        'expiring_batches' => 0,
                    ],
                    'lowStockItems' => [],
                    'expiringBatches' => [],
                    'recentMovements' => [],
                ], 200);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to load inventory data.']);
        }
    }




    /**
     * Get stock levels for a medicine
     */
    public function getStockLevels(Request $request, $medicineId)
    {
        $warehouseId = $request->get('warehouse_id');
        $unitType = $request->get('unit_type');

        $stockLevel = $this->inventoryService->getStockLevel($medicineId, $warehouseId, $unitType);
        $availableStock = $this->inventoryService->getAvailableStock($medicineId, $warehouseId, $unitType);

        return response()->json([
            'medicine_id' => $medicineId,
            'warehouse_id' => $warehouseId,
            'total_stock' => $stockLevel,
            'available_stock' => $availableStock,
            'reserved_stock' => $stockLevel - $availableStock,
            'unit_type' => $unitType
        ]);
    }

    /**
     * Add stock to inventory
     */
    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|integer|min:1',
            'batch_id' => 'nullable|exists:batches,id',
            'unit_type' => 'string|max:50',
            'reference_type' => 'string|max:50',
            'reference_id' => 'nullable|integer',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $stockLevel = $this->inventoryService->addStock(
                $request->medicine_id,
                $request->warehouse_id,
                $request->quantity,
                $request->only(['batch_id', 'unit_type', 'reference_type', 'reference_id', 'notes'])
            );

            return response()->json([
                'message' => 'Stock added successfully',
                'stock_level' => $stockLevel
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove stock from inventory
     */
    public function removeStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|integer|min:1',
            'unit_type' => 'string|max:50',
            'use_fifo' => 'boolean',
            'reference_type' => 'string|max:50',
            'reference_id' => 'nullable|integer',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $result = $this->inventoryService->removeStock(
                $request->medicine_id,
                $request->warehouse_id,
                $request->quantity,
                $request->only(['unit_type', 'use_fifo', 'reference_type', 'reference_id', 'notes'])
            );

            return response()->json([
                'message' => 'Stock removed successfully',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Transfer stock between warehouses
     */
    public function transferStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|integer|min:1',
            'unit_type' => 'string|max:50',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $result = $this->inventoryService->transferStock(
                $request->medicine_id,
                $request->from_warehouse_id,
                $request->to_warehouse_id,
                $request->quantity,
                $request->only(['unit_type', 'notes'])
            );

            return response()->json([
                'message' => 'Stock transferred successfully',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get low stock items
     */
    public function getLowStockItems(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');
        $lowStockItems = $this->inventoryService->getLowStockItems($warehouseId);

        return response()->json([
            'low_stock_items' => $lowStockItems,
            'count' => $lowStockItems->count()
        ]);
    }

    /**
     * Get expiring batches
     */
    public function getExpiringBatches(Request $request)
    {
        $days = $request->get('days', 30);
        $warehouseId = $request->get('warehouse_id');
        
        $expiringBatches = $this->batchService->getExpiringBatches($days, $warehouseId);

        return response()->json([
            'expiring_batches' => $expiringBatches,
            'count' => $expiringBatches->count()
        ]);
    }

    /**
     * Create new batch
     */
    public function createBatch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'required|string|max:255',
            'lot_number' => 'nullable|string|max:255',
            'expiry_date' => 'required|date|after:today',
            'manufacture_date' => 'nullable|date|before_or_equal:today',
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'quantity_received' => 'required|integer|min:1',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'unit_type' => 'string|max:50',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $batch = $this->batchService->createBatch($request->all());

            return response()->json([
                'message' => 'Batch created successfully',
                'batch' => $batch
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get batch details
     */
    public function getBatch($batchId)
    {
        try {
            $batch = Batch::with(['medicine', 'supplier', 'stockLevels.warehouse'])->findOrFail($batchId);
            $profitability = $this->batchService->getBatchProfitability($batchId);

            return response()->json([
                'batch' => $batch,
                'profitability' => $profitability
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Batch not found'], 404);
        }
    }

    /**
     * Mark batch as expired
     */
    public function markBatchExpired(Request $request, $batchId)
    {
        $warehouseId = $request->get('warehouse_id');

        try {
            $result = $this->batchService->markAsExpired($batchId, $warehouseId);

            return response()->json([
                'message' => 'Batch marked as expired successfully',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Recall batch
     */
    public function recallBatch(Request $request, $batchId)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'warehouse_id' => 'nullable|exists:warehouses,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $result = $this->batchService->recallBatch(
                $batchId,
                $request->reason,
                $request->warehouse_id
            );

            return response()->json([
                'message' => 'Batch recalled successfully',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get stock movements
     */
    public function getStockMovements(Request $request)
    {
        $medicineId = $request->get('medicine_id');
        $warehouseId = $request->get('warehouse_id');
        $limit = $request->get('limit', 100);

        $movements = $this->inventoryService->getStockMovements($medicineId, $warehouseId, $limit);

        return response()->json([
            'movements' => $movements,
            'count' => $movements->count()
        ]);
    }

    /**
     * Convert units
     */
    public function convertUnits(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'quantity' => 'required|numeric|min:0',
            'from_unit' => 'required|string|max:50',
            'to_unit' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $convertedQuantity = $this->unitService->convert(
                $request->medicine_id,
                $request->quantity,
                $request->from_unit,
                $request->to_unit
            );

            return response()->json([
                'original_quantity' => $request->quantity,
                'original_unit' => $request->from_unit,
                'converted_quantity' => $convertedQuantity,
                'converted_unit' => $request->to_unit,
                'conversion_factor' => $this->unitService->getConversionFactor(
                    $request->medicine_id,
                    $request->from_unit,
                    $request->to_unit
                )
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get available units for a medicine
     */
    public function getAvailableUnits($medicineId)
    {
        try {
            $units = $this->unitService->getAvailableUnits($medicineId);
            
            $unitsWithInfo = collect($units)->map(function ($unit) {
                return [
                    'unit' => $unit,
                    'info' => $this->unitService->getUnitInfo($unit)
                ];
            });

            return response()->json([
                'medicine_id' => $medicineId,
                'available_units' => $unitsWithInfo
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get inventory summary
     */
    public function getSummary(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');
        $summary = $this->inventoryService->getInventorySummary($warehouseId);

        return response()->json($summary);
    }

}