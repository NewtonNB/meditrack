<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\StockMovement;
use App\Services\PermissionService;
use App\Services\AuditTrailService;

class SaleController extends Controller
{
    protected PermissionService $permissionService;
    protected AuditTrailService $auditService;

    public function __construct(PermissionService $permissionService, AuditTrailService $auditService)
    {
        $this->permissionService = $permissionService;
        $this->auditService = $auditService;
    }
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Sale::with(['medicine', 'customer:id,name,phone,email', 'creator:id,name']);

        if ($user->isCashier() && !$user->hasPermissionTo('view_reports')) {
            $query->where('created_by', $user->id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->whereHas('medicine', fn($m) => $m->where('name', 'like', "%$s%"))
                ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%$s%")));
        }

        $sales = $query->latest()->paginate($request->get('per_page', 15));

        $data = [
            'sales'       => $sales,
            'canViewAll'  => $user->hasPermissionTo('view_reports'),
            'canManage'   => $user->hasAnyPermission(['manage_medicines', 'view_reports']),
            'canViewCosts'=> !$user->isCashier(),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['data' => $sales]);
        }

        $data['medicines'] = \App\Models\Medicine::orderBy('name')->get();
        $data['customers'] = \App\Models\Customer::where('pharmacy_id', $user->pharmacy_id ?? 1)->orderBy('name')->get();

        return Inertia::render('Sales', $data);
    }

    public function create(): Response
    {
        $user = auth()->user();
        
        // Get medicines with appropriate data based on user role
        $medicinesQuery = Medicine::orderBy('name');
        
        // Cashiers don't see cost prices
        if ($user->isCashier()) {
            $medicinesQuery->select(['id', 'name', 'brand', 'selling_price', 'stock']);
        }
        
        $medicines = $medicinesQuery->get();
        
        // Get customers for current pharmacy only
        $customers = Customer::where('pharmacy_id', auth()->user()->pharmacy_id ?? 1)
            ->orderBy('name')
            ->get();
        
        return Inertia::render('Sales', [
            'medicines' => $medicines,
            'customers' => $customers,
            'canViewCosts' => !$user->isCashier(),
        ]);
    }

    public function store(Request $request)
    {
        // Optimize validation - remove expensive exists checks for better performance
        $validated = $request->validate([
            'medicine_id' => ['required', 'integer'],
            'customer_id' => ['nullable', 'integer'],
            'customer' => ['nullable', 'string', 'max:255'], // Customer name from frontend
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10000'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'in:cash,mobile_money,card,credit'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Get medicine with stock check
        $medicine = Medicine::find($validated['medicine_id']);
        if (!$medicine) {
            return redirect()->back()->withErrors(['medicine_id' => 'Medicine not found.']);
        }
        
        // Check stock availability first
        if ($medicine->stock < $validated['quantity']) {
            return redirect()->back()->withErrors(['quantity' => 'Insufficient stock. Only ' . $medicine->stock . ' units available.']);
        }
        
        // Handle customer - optimize customer creation/lookup
        $customer = null;
        if (!empty($validated['customer_id'])) {
            $customer = Customer::find($validated['customer_id']);
        } elseif (!empty($validated['customer'])) {
            // Try to find customer by name first (with pharmacy filter for performance)
            $customer = Customer::where('name', $validated['customer'])
                ->where('pharmacy_id', auth()->user()->pharmacy_id ?? 1)
                ->first();
            
            // If not found, create new customer
            if (!$customer) {
                $customer = Customer::create([
                    'name' => $validated['customer'],
                    'phone' => $validated['customer_phone'] ?? null,
                    'email' => null,
                    'address' => null,
                    'pharmacy_id' => auth()->user()->pharmacy_id ?? 1,
                    'created_by' => auth()->id(),
                ]);
            }
        }
        
        $user = auth()->user();

            return DB::transaction(function () use ($validated, $medicine, $customer, $user, $request) {
                $unitPrice     = (float) $validated['unit_price'];
                $total         = $unitPrice * (int) $validated['quantity'];
                $invoiceNumber = 'INV-' . now()->format('Ymd') . '-' . str_pad(Sale::whereDate('created_at', now()->toDateString())->count() + 1, 4, '0', STR_PAD_LEFT);

                $sale = Sale::create([
                    'medicine_id'    => $medicine->id,
                    'customer_id'    => $customer?->id,
                    'customer'       => $customer?->name ?? ($validated['customer'] ?? null),
                    'customer_phone' => $customer?->phone ?? ($validated['customer_phone'] ?? null),
                    'quantity'       => $validated['quantity'],
                    'unit_price'     => $unitPrice,
                    'total_price'    => $total,
                    'payment_method' => $validated['payment_method'],
                    'notes'          => $validated['notes'] ?? null,
                    'invoice'        => $invoiceNumber,
                    'date'           => now()->toDateString(),
                    'sold_at'        => now(),
                    'created_by'     => auth()->id(),
                ]);

                $medicine->decrement('stock', (int) $validated['quantity']);

                try {
                    StockMovement::create([
                        'medicine_id'    => $medicine->id,
                        'warehouse_id'   => 1,
                        'pharmacy_id'    => auth()->user()->pharmacy_id ?? 1,
                        'movement_type'  => 'out',
                        'quantity'       => -1 * (int) $validated['quantity'],
                        'reference'      => 'SALE-' . $sale->id,
                        'reference_type' => 'sale',
                        'notes'          => 'Sale: ' . $medicine->name,
                        'created_by'     => auth()->id(),
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Stock movement failed: ' . $e->getMessage());
                }

                if ($request->is('api/*') || $request->expectsJson()) {
                    return response()->json(['message' => 'Sale recorded.', 'sale' => $sale->load('medicine', 'customer')], 201);
                }

                return redirect()->route('sales.index')->with('success', 'Sale recorded successfully.');
            });
    }

    public function destroy(Request $request, Sale $sale)
    {
        $user = auth()->user();
        if (!in_array($user->role, ['pharmacy_admin', 'super_admin'])) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403)
                : redirect()->back()->withErrors(['error' => 'Unauthorized.']);
        }

        DB::transaction(function () use ($sale, $user) {
            $medicine = $sale->medicine;
            if ($medicine) {
                $medicine->increment('stock', $sale->quantity);
                try {
                    StockMovement::create(['medicine_id' => $medicine->id, 'warehouse_id' => 1, 'pharmacy_id' => $user->pharmacy_id ?? 1, 'movement_type' => 'in', 'quantity' => $sale->quantity, 'reference' => 'DELETE-SALE-' . $sale->id, 'reference_type' => 'sale_deletion', 'notes' => 'Stock restored', 'created_by' => auth()->id()]);
                } catch (\Exception $e) { \Log::error($e->getMessage()); }
            }
            $sale->delete();
        });

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Sale deleted.']);
        }

        return redirect()->route('sales.index')->with('success', 'Sale deleted successfully.');
    }

    public function refund(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'reason'        => ['required', 'string', 'max:500'],
            'refund_amount' => ['required', 'numeric', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['refund_amount'] > $sale->total_price) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Refund amount exceeds sale total.'], 422)
                : redirect()->back()->withErrors(['refund_amount' => 'Refund amount cannot exceed sale total.']);
        }

        DB::transaction(function () use ($sale, $validated) {
            $sale->update([
                'refund_amount' => $validated['refund_amount'],
                'refund_reason' => $validated['reason'],
                'refund_notes'  => $validated['notes'] ?? null,
                'refunded_at'   => now(),
                'refunded_by'   => auth()->id(),
                'status'        => $validated['refund_amount'] >= $sale->total_price ? 'refunded' : 'partially_refunded',
            ]);

            if ($validated['refund_amount'] >= $sale->total_price && $sale->medicine) {
                $sale->medicine->increment('stock', $sale->quantity);
            }
        });

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Refund processed.', 'sale' => $sale->fresh()]);
        }

        return redirect()->route('sales.index')->with('success', 'Refund processed successfully.');
    }

    /**
     * API endpoint for POS sales
     */
    public function apiStore(Request $request)
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array',
                'items.*.medicine_id' => 'required|exists:medicines,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.total_price' => 'required|numeric|min:0',
                'customer_id' => 'nullable|exists:customers,id',
                'payment_method' => 'required|string',
                'subtotal' => 'required|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
                'discount_amount' => 'nullable|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'sale_type' => 'nullable|string|in:pos,bulk',
                'transaction_id' => 'nullable|string',
            ]);

            return DB::transaction(function () use ($validated) {
                $sales = [];
                $totalAmount = 0;

                // Process each item as a separate sale
                foreach ($validated['items'] as $item) {
                    $medicine = Medicine::findOrFail($item['medicine_id']);
                    
                    // Check stock
                    if ($medicine->stock < $item['quantity']) {
                        return response()->json([
                            'error' => "Insufficient stock for {$medicine->name}. Available: {$medicine->stock}"
                        ], 400);
                    }

                    // Create sale record
                    $sale = Sale::create([
                        'medicine_id' => $item['medicine_id'],
                        'customer_id' => $validated['customer_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['total_price'],
                        'sold_at' => now(),
                    ]);

                    // Update stock
                    $medicine->decrement('stock', $item['quantity']);

                    // Create stock movement
                    try {
                        StockMovement::create([
                            'medicine_id' => $medicine->id,
                            'warehouse_id' => 1,
                            'pharmacy_id' => auth()->user()->pharmacy_id ?? 1,
                            'movement_type' => 'out',
                            'quantity' => -1 * $item['quantity'],
                            'reference' => 'POS-SALE-' . $sale->id,
                            'reference_type' => 'sale',
                            'notes' => 'POS Sale - Transaction: ' . ($validated['transaction_id'] ?? 'N/A'),
                            'created_by' => auth()->id(),
                            // Legacy fields for backward compatibility
                            'type' => 'out',
                            'reference_id' => $sale->id,
                            'note' => 'POS Sale - ' . $medicine->name,
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to create stock movement for POS sale: ' . $e->getMessage());
                    }

                    // Log the sale transaction
                    $this->auditService->logCustomActivity(
                        'pos_sale_processed',
                        "POS Sale: {$item['quantity']} units of '{$medicine->name}'",
                        [
                            'sale_id' => $sale->id,
                            'medicine_id' => $medicine->id,
                            'medicine_name' => $medicine->name,
                            'customer_id' => $validated['customer_id'],
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'total_amount' => $item['total_price'],
                            'transaction_id' => $validated['transaction_id'],
                            'remaining_stock' => $medicine->stock - $item['quantity'],
                        ]
                    );

                    $sales[] = $sale;
                    $totalAmount += $item['total_price'];
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Sales recorded successfully',
                    'sales' => $sales,
                    'total_amount' => $totalAmount,
                    'transaction_id' => $validated['transaction_id'] ?? $sales[0]->id,
                ]);
            });

        } catch (\Exception $e) {
            \Log::error('POS Sale API Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to process sale: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing sale.
     */
    public function update(Request $request, Sale $sale): RedirectResponse
    {
        $user = auth()->user();
        
        // Check permissions
        if (!$user->hasAnyPermission(['manage_medicines', 'view_reports'])) {
            return redirect()->back()->with('error', 'You do not have permission to edit sales.');
        }
        
        // Validate the request
        $validated = $request->validate([
            'customer' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'medicine_id' => 'required|exists:medicines,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,mobile_money,insurance',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::transaction(function () use ($validated, $sale, $user) {
                // Get the medicine
                $medicine = Medicine::findOrFail($validated['medicine_id']);
                
                // Calculate the difference in quantity
                $oldQuantity = $sale->quantity;
                $newQuantity = $validated['quantity'];
                $quantityDifference = $newQuantity - $oldQuantity;
                
                // Check if we have enough stock for the increase
                if ($quantityDifference > 0 && $medicine->stock < $quantityDifference) {
                    throw new \Exception("Insufficient stock. Available: {$medicine->stock}, Required: {$quantityDifference}");
                }
                
                // Handle customer
                $customer = null;
                if (!empty($validated['customer'])) {
                    $customer = Customer::firstOrCreate(
                        ['name' => $validated['customer']],
                        [
                            'phone' => $validated['customer_phone'] ?? null,
                            'pharmacy_id' => $user->pharmacy_id ?? 1,
                        ]
                    );
                }
                
                // Calculate new total
                $unitPrice = $validated['unit_price'];
                $total = $unitPrice * $newQuantity;
                
                // Update the sale
                $sale->update([
                    'customer_id' => $customer ? $customer->id : null,
                    'medicine_id' => $validated['medicine_id'],
                    'quantity' => $newQuantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $total,
                    'payment_method' => $validated['payment_method'],
                    'notes' => $validated['notes'],
                    'updated_by' => $user->id,
                ]);
                
                // Update medicine stock
                $medicine->decrement('stock', $quantityDifference);
                
                // Update stock movement if quantity changed
                if ($quantityDifference != 0) {
                    StockMovement::create([
                        'medicine_id' => $medicine->id,
                        'warehouse_id' => 1,
                        'pharmacy_id' => $user->pharmacy_id ?? 1,
                        'movement_type' => 'out',
                        'quantity' => -1 * $quantityDifference,
                        'reference' => 'SALE-EDIT-' . $sale->id,
                        'reference_type' => 'sale',
                        'notes' => 'Sale quantity adjustment - ' . $medicine->name . ($customer ? ' to ' . $customer->name : ''),
                        'created_by' => $user->id,
                        'type' => 'out',
                        'reference_id' => $sale->id,
                        'note' => 'Sale edited - ' . $medicine->name,
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Sale updated successfully!');
            
        } catch (\Exception $e) {
            \Log::error('Failed to update sale: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update sale: ' . $e->getMessage());
        }
    }

    public function show(Request $request, Sale $sale)
    {
        $user = auth()->user();
        if ($user->isCashier() && !$user->hasPermissionTo('view_reports') && $sale->created_by !== $user->id) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $sale->load(['medicine', 'customer', 'creator']);
        $data = ['sale' => $sale, 'canViewCosts' => !$user->isCashier()];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('SaleDetails', $data);
    }

    public function report(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasPermissionTo('view_reports')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date'],
            'user_id'    => ['nullable', 'exists:users,id'],
        ]);

        $query = Sale::with(['medicine', 'customer', 'creator']);
        if ($validated['start_date'] ?? null) $query->whereDate('sold_at', '>=', $validated['start_date']);
        if ($validated['end_date']   ?? null) $query->whereDate('sold_at', '<=', $validated['end_date']);
        if ($validated['user_id']    ?? null) $query->where('created_by', $validated['user_id']);

        $sales      = $query->latest()->paginate(25);
        $totalSales = Sale::sum('total_price');
        $salesCount = Sale::count();

        $data = [
            'sales'   => $sales,
            'summary' => [
                'total_amount'   => $totalSales,
                'total_quantity' => Sale::sum('quantity'),
                'sales_count'    => $salesCount,
                'average_sale'   => $salesCount > 0 ? $totalSales / $salesCount : 0,
            ],
            'filters' => $validated,
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('SalesReport', $data);
    }
}


