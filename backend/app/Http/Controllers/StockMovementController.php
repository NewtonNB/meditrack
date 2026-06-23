<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    /**
     * Display stock movements page
     */
    public function index(Request $request)
    {
        $query = StockMovement::with(['medicine', 'creator'])
            ->orderBy('created_at', 'desc');

        if ($request->medicine_id)  $query->where('medicine_id', $request->medicine_id);
        if ($request->warehouse_id) $query->where('warehouse_id', $request->warehouse_id);
        if ($request->type)         $query->where('movement_type', $request->type);
        if ($request->date_from)    $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to)      $query->whereDate('created_at', '<=', $request->date_to);
        if ($request->search) {
            $s = $request->search;
            $query->where(fn($q) => $q->whereHas('medicine', fn($m) => $m->where('name','like',"%$s%"))
                ->orWhere('reference','like',"%$s%")->orWhere('notes','like',"%$s%"));
        }

        $movements = $query->paginate($request->get('per_page', 10));
        $medicines = Medicine::select('id','name','generic_name','brand')->orderBy('name')->get();
        $stats = [
            'total_in'          => StockMovement::where('movement_type','in')->sum('quantity'),
            'total_out'         => abs(StockMovement::where('movement_type','out')->sum('quantity')),
            'total_adjustments' => abs(StockMovement::whereIn('movement_type',['adjustment','expired'])->sum('quantity')),
        ];

        $data = ['stockMovements' => $movements, 'medicines' => $medicines, 'stats' => $stats];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['data' => $movements]);
        }

        return Inertia::render('StockMovements', array_merge($data, [
            'filters'      => $request->only(['search','type','medicine_id','warehouse_id','date_from','date_to','per_page']),
            'canManage'    => auth()->user()->can('manage_medicines'),
            'canViewCosts' => auth()->user()->can('view_costs') || auth()->user()->hasRole('super_admin'),
        ]));
    }

    /**
     * Store a new stock movement
     */
    public function store(Request $request)
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
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            return back()->withErrors($validator)->withInput();
        }

        try {
            $movement = StockMovement::create([
                'medicine_id'   => $request->medicine_id,
                'warehouse_id'  => $request->warehouse_id ?? 1,
                'movement_type' => $request->movement_type,
                'quantity'      => $request->movement_type === 'in' ? $request->quantity : -$request->quantity,
                'unit_cost'     => $request->unit_cost,
                'reference'     => $request->reference ?? 'MANUAL-'.time(),
                'notes'         => $request->notes,
                'created_by'    => auth()->id(),
            ]);

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Stock movement recorded.', 'movement' => $movement], 201);
            }

            return back()->with('success', 'Stock movement recorded successfully');
        } catch (\Exception $e) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Failed to record stock movement: ' . $e->getMessage());
        }
    }

    /**
     * Store stock adjustment
     */
    public function storeAdjustment(Request $request)
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
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
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

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Stock adjustment applied.', 'movement' => $movement], 201);
            }

            return back()->with('success', 'Stock adjustment applied successfully');

        } catch (\Exception $e) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Failed to apply stock adjustment: ' . $e->getMessage());
        }
    }

    /**
     * Update a stock movement
     */
    public function update(Request $request, StockMovement $stockMovement)
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

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Stock movement updated.', 'movement' => $stockMovement]);
            }

            return back()->with('success', 'Stock movement updated successfully');

        } catch (\Exception $e) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Failed to update stock movement: ' . $e->getMessage());
        }
    }
}
