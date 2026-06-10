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
        $suppliers = Supplier::latest()->paginate($request->get('per_page', 15));

        $data = [
            'suppliers' => $suppliers,
            'canManage' => auth()->user()->hasPermissionTo('manage_suppliers'),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Suppliers', $data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
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
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
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

    public function create()
    {
        // index uses a modal for creating suppliers — redirect to avoid missing page error
        return redirect()->route('suppliers.index');
    }
}


