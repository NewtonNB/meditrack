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
        $warehouseId = $request->get('warehouse_id');
        
        $data = [
            'warehouses' => Warehouse::active()->get(),
            'summary' => $this->inventoryService->getInventorySummary($warehouseId),
            'lowStockItems' => $this->inventoryService->getLowStockItems($warehouseId)->take(10),
            'expiringBatches' => $this->inventoryService->getExpiringBatches(30, $warehouseId)->take(10),
            'recentMovements' => $this->inventoryService->getStockMovements(null, $warehouseId, 20)
        ];

        return Inertia::render('Inventory/Dashboard', $data);
    }

    /**
     * Display stock movements page
     */
    public function stockMovementsIndex(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $medicineId = $request->get('medicine_id');
        $warehouseId = $request->get('warehouse_id');
        $type = $request->get('type');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $search = $request->get('search');

        // Build query
        $query = StockMovement::with(['medicine', 'creator', 'sale.customer'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($medicineId) {
            $query->where('medicine_id', $medicineId);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($type) {
            $query->where('movement_type', $type);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('medicine', function($mq) use ($search) {
                    $mq->where('name', 'like', "%{$search}%")
                      ->orWhere('generic_name', 'like', "%{$search}%");
                })
                ->orWhere('reference', 'like', "%{$search}%")
                ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $movements = $query->paginate($perPage);

        // Get medicines for dropdown
        $medicines = Medicine::select('id', 'name', 'generic_name', 'brand')
            ->orderBy('name')
            ->get();

        // Calculate statistics
        $stats = [
            'total_in' => StockMovement::where('movement_type', 'in')->sum('quantity'),
            'total_out' => abs(StockMovement::where('movement_type', 'out')->sum('quantity')), // Make positive for display
            'total_adjustments' => abs(StockMovement::whereIn('movement_type', ['adjustment', 'expired'])->sum('quantity')), // Make positive for display
        ];

        return Inertia::render('StockMovements', [
            'stockMovements' => $movements,
            'medicines' => $medicines,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'medicine_id' => $medicineId,
                'warehouse_id' => $warehouseId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'per_page' => $perPage,
            ],
            'canManage' => auth()->user()->can('manage_medicines'),
            'canViewCosts' => auth()->user()->can('view_costs') || auth()->user()->hasRole('super_admin') || auth()->user()->hasRole('pharmacy_admin'),
        ]);
    }

    /**
     * Store a new stock movement
     */
    public function storeStockMovement(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'movement_type' => 'required|in:in,out,adjustment,expired',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'batch_number' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date|after:today',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            // Create the stock movement record
            $movement = StockMovement::create([
                'medicine_id' => $request->medicine_id,
                'warehouse_id' => $request->warehouse_id ?? 1,
                'movement_type' => $request->movement_type,
                'quantity' => $request->movement_type === 'in' ? $request->quantity : -$request->quantity,
                'unit_cost' => $request->unit_cost,
                'reference' => $request->reference ?? 'MANUAL-' . time(),
                'notes' => $request->notes,
                'created_by' => auth()->id(),
            ]);

            return back()->with('success', 'Stock movement recorded successfully');

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to record stock movement: ' . $e->getMessage());
        }
    }

    /**
     * Store stock adjustment
     */
    public function storeStockAdjustment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'adjustment_type' => 'required|in:add,subtract,set',
            'quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $warehouseId = $request->warehouse_id ?? 1;
            
            // Calculate quantity based on adjustment type
            $newQuantity = match($request->adjustment_type) {
                'add' => $request->quantity,
                'subtract' => -$request->quantity,
                'set' => $request->quantity, // For 'set', just use the quantity as-is
            };

            // Create the adjustment movement
            $movement = StockMovement::create([
                'medicine_id' => $request->medicine_id,
                'warehouse_id' => $warehouseId,
                'movement_type' => 'adjustment',
                'quantity' => $newQuantity,
                'reference' => 'ADJ-' . time(),
                'notes' => "Reason: {$request->reason}. " . ($request->notes ?? ''),
                'created_by' => auth()->id(),
            ]);

            return back()->with('success', 'Stock adjustment applied successfully');

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to apply stock adjustment: ' . $e->getMessage());
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

    /**
     * Update a stock movement
     */
    public function updateStockMovement(Request $request, StockMovement $stockMovement)
    {
        $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'movement_type' => 'required|in:in,out,adjustment,expired',
            'quantity' => 'required|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'batch_number' => 'nullable|string|max:255',
        ]);

        try {
            // Get the original medicine and quantity for stock adjustment
            $originalMedicine = Medicine::find($stockMovement->medicine_id);
            $originalQuantity = $stockMovement->quantity;
            $newMedicine = Medicine::find($request->medicine_id);
            $newQuantity = $request->quantity;

            // Reverse the original stock movement
            if ($originalMedicine) {
                if (in_array($stockMovement->movement_type, ['in', 'adjustment']) && $originalQuantity > 0) {
                    // Was adding stock, so subtract it back
                    $originalMedicine->decrement('stock', abs($originalQuantity));
                } elseif (in_array($stockMovement->movement_type, ['out', 'expired']) && $originalQuantity < 0) {
                    // Was removing stock, so add it back
                    $originalMedicine->increment('stock', abs($originalQuantity));
                }
            }

            // Apply the new stock movement
            if ($newMedicine) {
                if (in_array($request->movement_type, ['in', 'adjustment']) && $newQuantity > 0) {
                    // Adding stock
                    $newMedicine->increment('stock', abs($newQuantity));
                } elseif (in_array($request->movement_type, ['out', 'expired']) && $newQuantity > 0) {
                    // Removing stock (store as negative)
                    $newMedicine->decrement('stock', abs($newQuantity));
                    $newQuantity = -abs($newQuantity);
                }
            }

            // Update the stock movement record
            $stockMovement->update([
                'medicine_id' => $request->medicine_id,
                'movement_type' => $request->movement_type,
                'quantity' => $newQuantity,
                'unit_cost' => $request->unit_cost,
                'reference' => $request->reference,
                'notes' => $request->notes,
                'expiry_date' => $request->expiry_date,
                'batch_number' => $request->batch_number,
            ]);

            return back()->with('success', 'Stock movement updated successfully');

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update stock movement: ' . $e->getMessage());
        }
    }
}