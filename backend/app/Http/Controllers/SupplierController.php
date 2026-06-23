<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\PermissionService;
use App\Services\AuditTrailService;
use App\Services\NotificationService;

class SupplierController extends Controller
{
    protected PermissionService $permissionService;
    protected AuditTrailService $auditService;
    protected NotificationService $notificationService;

    public function __construct(
        PermissionService $permissionService, 
        AuditTrailService $auditService,
        NotificationService $notificationService
    ) {
        $this->permissionService = $permissionService;
        $this->auditService = $auditService;
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $query = Supplier::query();
        if ($request->query('status') === 'trashed') {
            $query = $query->onlyTrashed();
        }

        $suppliers = $query->latest()->paginate($request->get('per_page', 15));

        $data = [
            'suppliers' => $suppliers,
            'canManage' => auth()->user()->hasPermissionTo('manage_suppliers'),
            'showingTrashed' => $request->query('status') === 'trashed',
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($suppliers);
        }

        return Inertia::render('Suppliers', $data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255', 'unique:suppliers,name'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'name.unique' => 'A supplier with this name already exists.',
        ]);

        $supplier = Supplier::create($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Supplier created.', 'supplier' => $supplier], 201);
        }

        return back()->with('success', 'Supplier added.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255', 'unique:suppliers,name,' . $supplier->id],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'name.unique' => 'Another supplier is already using this name.',
        ]);

        $supplier->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Supplier updated.', 'supplier' => $supplier->fresh()]);
        }

        return back()->with('success', 'Supplier updated.');
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        if ($supplier->medicines()->exists()) {
            $msg = 'Cannot delete supplier with existing medicines.';
            return $request->is('api/*') || $request->expectsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->withErrors(['supplier' => $msg]);
        }

        $supplier->delete();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Supplier deleted.']);
        }

        return back()->with('success', 'Supplier deleted.');
    }

    public function restore(Request $request, $id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);
        $supplier->restore();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Supplier restored.']);
        }

        return back()->with('success', 'Supplier restored.');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:suppliers,id'],
        ]);

        $deletedCount = 0;
        $skippedCount = 0;

        $suppliers = Supplier::whereIn('id', $validated['ids'])->get();
        foreach ($suppliers as $supplier) {
            if ($supplier->medicines()->exists()) {
                $skippedCount++;
                continue;
            }

            $supplier->delete();
            $deletedCount++;
        }

        $message = "{$deletedCount} supplier(s) deleted.";
        if ($skippedCount > 0) {
            $message .= " {$skippedCount} supplier(s) skipped because they have associated medicines.";
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => $message, 'deleted' => $deletedCount, 'skipped' => $skippedCount]);
        }

        return back()->with('success', $message);
    }

    public function create()
    {
        // index uses a modal for creating suppliers — redirect to avoid missing page error
        return redirect()->route('suppliers.index');
    }
}


