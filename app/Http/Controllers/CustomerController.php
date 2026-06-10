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
    public function index(Request $request)
    {
        $user      = auth()->user();
        $customers = Customer::with(['creator'])
            ->where('pharmacy_id', $user->pharmacy_id ?? 1)
            ->latest()->paginate($request->get('per_page', 15));

        $data = [
            'customers' => $customers,
            'canManage' => $user->hasPermissionTo('manage_customers'),
            'canCreate' => $user->hasAnyPermission(['manage_customers', 'process_sales']),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Customers', $data);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasAnyPermission(['manage_customers', 'process_sales'])) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['pharmacy_id'] = $user->pharmacy_id ?? 1;
        $validated['created_by']  = $user->id;

        $customer = Customer::create($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Customer created.', 'customer' => $customer], 201);
        }

        return back()->with('success', 'Customer added.');
    }

    public function update(Request $request, Customer $customer)
    {
        if (!auth()->user()->hasPermissionTo('manage_customers')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $customer->update($validated);

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Customer updated.', 'customer' => $customer->fresh()]);
        }

        return back()->with('success', 'Customer updated.');
    }

    public function destroy(Request $request, Customer $customer)
    {
        if (!auth()->user()->hasPermissionTo('manage_customers')) {
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => 'Forbidden.'], 403) : abort(403);
        }

        if ($customer->sales()->exists()) {
            $msg = 'Cannot delete customer with existing sales records.';
            return $request->is('api/*') || $request->expectsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->withErrors(['customer' => $msg]);
        }

        $customer->delete();

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Customer deleted.']);
        }

        return back()->with('success', 'Customer deleted.');
    }

    public function create()
    {
        // index uses a modal for creating customers — redirect to avoid missing page error
        return redirect()->route('customers.index');
    }
}


