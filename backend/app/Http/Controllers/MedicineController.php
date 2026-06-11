<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\PermissionService;
use App\Services\AuditTrailService;

class MedicineController extends Controller
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
        $query = Medicine::with(['supplier']);

        if ($user->isCashier()) {
            $query->select(['id', 'name', 'brand', 'selling_price', 'stock', 'supplier_id', 'expiry_date', 'category', 'reorder_level', 'created_at']);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('name', 'like', "%$s%")
                ->orWhere('brand', 'like', "%$s%")
                ->orWhere('generic_name', 'like', "%$s%"));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $medicines = $query->latest()->paginate($request->get('per_page', 15));

        if ($user->isCashier()) {
            $medicines->getCollection()->transform(fn($m) => $m->makeHidden(['cost_price']));
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($medicines);
        }

        $data = [
            'medicines'    => $medicines,
            'canManage'    => $user->hasPermissionTo('manage_medicines'),
            'canViewCosts' => !$user->isCashier(),
        ];

        return Inertia::render('Medicines/Enhanced', $data);
    }

    public function create(): Response
    {
        // Check permission
        if (!auth()->user()->hasPermissionTo('manage_medicines')) {
            abort(403, 'Insufficient permissions to create medicines.');
        }
        
        $suppliers = Supplier::orderBy('name')->get();
        return Inertia::render('Medicines', [
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('manage_medicines')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403)
                : abort(403);
        }

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'brand'         => ['nullable', 'string', 'max:255'],
            'batch_number'  => ['nullable', 'string', 'max:255'],
            'expiry_date'   => ['nullable', 'date'],
            'cost_price'    => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock'         => ['required', 'integer', 'min:0'],
            'supplier_id'   => ['nullable', 'exists:suppliers,id'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $medicine = Medicine::create($validated);

        $this->auditService->logCustomActivity('medicine_created', "Created medicine '{$medicine->name}'", [
            'medicine_id' => $medicine->id, 'initial_stock' => $medicine->stock,
        ]);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Medicine created.', 'medicine' => $medicine], 201);
        }

        return redirect()->route('medicines.index')->with('success', 'Medicine created successfully.');
    }

    public function update(Request $request, Medicine $medicine)
    {
        if (!auth()->user()->hasPermissionTo('manage_medicines')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'batch_number' => ['nullable', 'string', 'max:255'],
            'expiry_date' => ['nullable', 'date'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ]);

        $medicine->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Medicine updated.', 'medicine' => $medicine->fresh()]);
        }

        return back()->with('success', 'Medicine updated.');
    }

    public function destroy(Request $request, Medicine $medicine)
    {
        if (!auth()->user()->hasPermissionTo('manage_medicines')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $medicine->delete();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Medicine deleted.']);
        }

        return back()->with('success', 'Medicine deleted.');
    }

    public function history(Request $request, Medicine $medicine)
    {
        $activities = $this->auditService->getModelHistory($medicine, 50);
        $data = ['medicine' => $medicine->load(['supplier']), 'activities' => $activities];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('MedicineHistory', $data);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:medicines,id']);

        $count = Medicine::whereIn('id', $request->ids)->delete();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => "{$count} medicine(s) deleted."]);
        }

        return back()->with('success', "{$count} medicine(s) deleted successfully");
    }

    /**
     * Export medicines data.
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'csv');
        $user = auth()->user();
        
        // Build query
        $query = Medicine::with(['supplier']);
        
        // Apply search filter
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('batch_number', 'like', "%{$search}%");
            });
        }
        
        // Apply stock filter
        if ($request->stock_filter && $request->stock_filter !== 'all') {
            switch ($request->stock_filter) {
                case 'low':
                    $query->whereRaw('stock > 0 AND stock <= reorder_level');
                    break;
                case 'out':
                    $query->where('stock', 0);
                    break;
                case 'available':
                    $query->whereRaw('stock > reorder_level');
                    break;
            }
        }
        
        // Apply category filter
        if ($request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        
        $medicines = $query->get();
        
        // Export based on format
        switch ($format) {
            case 'csv':
                return $this->exportCsv($medicines, $user);
            case 'excel':
                return $this->exportExcel($medicines, $user);
            case 'pdf':
                return $this->exportPdf($medicines, $user);
            default:
                return back()->withErrors(['error' => 'Invalid export format']);
        }
    }

    /**
     * Export to CSV format.
     */
    private function exportCsv($medicines, $user)
    {
        $filename = 'medicines_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];
        
        $callback = function() use ($medicines, $user) {
            $file = fopen('php://output', 'w');
            
            // Headers
            $headers = ['ID', 'Name', 'Brand', 'Generic Name', 'Category', 'Stock', 'Reorder Level'];
            if (!$user->isCashier()) {
                $headers[] = 'Cost Price';
                $headers[] = 'Selling Price';
            }
            $headers = array_merge($headers, ['Expiry Date', 'Batch Number', 'Supplier']);
            
            fputcsv($file, $headers);
            
            // Data
            foreach ($medicines as $medicine) {
                $row = [
                    $medicine->id,
                    $medicine->name,
                    $medicine->brand,
                    $medicine->generic_name,
                    $medicine->category,
                    $medicine->stock,
                    $medicine->reorder_level,
                ];
                
                if (!$user->isCashier()) {
                    $row[] = $medicine->cost_price;
                    $row[] = $medicine->selling_price;
                }
                
                $row[] = $medicine->expiry_date;
                $row[] = $medicine->batch_number;
                $row[] = $medicine->supplier->name ?? 'N/A';
                
                fputcsv($file, $row);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export to Excel format (using CSV for now).
     */
    private function exportExcel($medicines, $user)
    {
        // For now, use CSV format with .xlsx extension
        // In production, use a library like PhpSpreadsheet
        return $this->exportCsv($medicines, $user);
    }

    /**
     * Export to PDF format.
     */
    private function exportPdf($medicines, $user)
    {
        // For now, return a simple HTML that can be printed as PDF
        // In production, use a library like DomPDF or TCPDF
        $html = view('exports.medicines-pdf', [
            'medicines' => $medicines,
            'canViewCosts' => !$user->isCashier(),
            'exportDate' => now()->format('Y-m-d H:i:s'),
        ])->render();
        
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'inline; filename="medicines_' . date('Y-m-d_His') . '.html"');
    }

    /**
     * Validate medicine pricing
     */
    public function validatePricing(Request $request)
    {
        $request->validate([
            'cost_price' => 'required|numeric|min:0.01',
            'selling_price' => 'required|numeric|min:0.01',
            'category' => 'nullable|string'
        ]);

        $pricingService = app(\App\Services\PricingService::class);
        
        $validation = $pricingService->validatePrice(
            $request->cost_price,
            $request->selling_price,
            $request->category
        );

        $recommendation = $pricingService->calculateRecommendedPrice(
            $request->cost_price,
            $request->category
        );

        return response()->json([
            'validation' => $validation,
            'recommendation' => $recommendation,
            'guidelines' => $pricingService->getPricingGuidelines()
        ]);
    }

    /**
     * Get pricing guidelines
     */
    public function getPricingGuidelines()
    {
        $pricingService = app(\App\Services\PricingService::class);
        
        return response()->json([
            'guidelines' => $pricingService->getPricingGuidelines(),
            'categories' => $pricingService->getMedicineCategories()
        ]);
    }

    /**
     * Update medicine prices based on guidelines
     */
    public function updatePricing(Request $request)
    {
        $request->validate([
            'medicine_ids' => 'nullable|array',
            'medicine_ids.*' => 'exists:medicines,id'
        ]);

        $pricingService = app(\App\Services\PricingService::class);
        $result = $pricingService->updateMedicinePrices($request->medicine_ids);

        return response()->json([
            'success' => true,
            'message' => "Updated pricing for {$result['updated']} out of {$result['total']} medicines",
            'result' => $result
        ]);
    }

    /**
     * Generate pricing report
     */
    public function pricingReport()
    {
        $pricingService = app(\App\Services\PricingService::class);
        $report = $pricingService->generatePricingReport();

        return response()->json($report);
    }
}