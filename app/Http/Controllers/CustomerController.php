<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\PermissionService;
use App\Services\AuditTrailService;

class CustomerController extends Controller
{
    protected PermissionService $permissionService;
    protected AuditTrailService $auditService;

    public function __construct(PermissionService $permissionService, AuditTrailService $auditService)
    {
        $this->permissionService = $permissionService;
        $this->auditService = $auditService;
    }
    public function index(): Response
    {
        $user = auth()->user();
        
        $customers = Customer::with(['creator', 'updater'])
            ->where('pharmacy_id', $user->pharmacy_id ?? 1)
            ->latest()
            ->paginate(10);
        
        return Inertia::render('Customers', [
            'customers' => $customers,
            'canManage' => $user->hasPermissionTo('manage_customers'),
            'canCreate' => $user->hasAnyPermission(['manage_customers', 'process_sales']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        
        // Check permission - both cashiers and managers can create customers
        if (!$user->hasAnyPermission(['manage_customers', 'process_sales'])) {
            abort(403, 'Insufficient permissions to create customers.');
        }
        
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $customer = Customer::create($validated);
        
        // Log customer creation
        $this->auditService->logCustomActivity(
            'customer_created',
            "Created customer '{$customer->name}'",
            [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
            ]
        );

        return back()->with('success', 'Customer added.');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        // Check permission - only managers can update customers
        if (!auth()->user()->hasPermissionTo('manage_customers')) {
            abort(403, 'Insufficient permissions to update customers.');
        }
        
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $customer->update($validated);
        return back()->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        // Check permission - only managers can delete customers
        if (!auth()->user()->hasPermissionTo('manage_customers')) {
            abort(403, 'Insufficient permissions to delete customers.');
        }
        
        // Check if customer has sales
        if ($customer->sales()->exists()) {
            return back()->withErrors(['customer' => 'Cannot delete customer with existing sales records.']);
        }
        
        // Log deletion before actually deleting
        $this->auditService->logCustomActivity(
            'customer_deleted',
            "Deleted customer '{$customer->name}'",
            [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
            ]
        );
        
        $customer->delete();
        return back()->with('success', 'Customer deleted.');
    }

    public function create()
    {
        // index uses a modal for creating customers — redirect to avoid missing page error
        return redirect()->route('customers.index');
    }
}


