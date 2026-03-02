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
    public function index(): Response
    {
        $suppliers = Supplier::with(['creator', 'updater'])->latest()->paginate(10);
        
        return Inertia::render('Suppliers', [
            'suppliers' => $suppliers,
            'canManage' => auth()->user()->hasPermissionTo('manage_suppliers'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $supplier = Supplier::create($validated);
        
        // Log supplier creation
        $this->auditService->logCustomActivity(
            'supplier_created',
            "Created supplier '{$supplier->name}'",
            [
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
            ]
        );

        // Send supplier notification
        $this->notificationService->sendSupplierNotification($supplier, 'created');

        // If request came from purchases page, redirect back with updated suppliers
        if ($request->header('referer') && str_contains($request->header('referer'), '/purchases')) {
            return redirect()->route('purchases.index')->with('success', 'Supplier added.');
        }
        
        return back()->with('success', 'Supplier added.');
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $supplier->update($validated);
        return back()->with('success', 'Supplier updated.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        // Check if supplier has medicines
        if ($supplier->medicines()->exists()) {
            return back()->withErrors(['supplier' => 'Cannot delete supplier with existing medicines.']);
        }
        
        // Log deletion before actually deleting
        $this->auditService->logCustomActivity(
            'supplier_deleted',
            "Deleted supplier '{$supplier->name}'",
            [
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
            ]
        );
        
        $supplier->delete();
        return back()->with('success', 'Supplier deleted.');
    }

    public function create()
    {
        // index uses a modal for creating suppliers — redirect to avoid missing page error
        return redirect()->route('suppliers.index');
    }
}


