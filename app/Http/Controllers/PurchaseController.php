<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Medicine;
use App\Models\Supplier;
use App\Services\PurchaseService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    protected $purchaseService;
    protected $notificationService;

    public function __construct(PurchaseService $purchaseService, NotificationService $notificationService)
    {
        $this->purchaseService = $purchaseService;
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $purchases = Purchase::with(['supplier', 'items'])
            ->latest()->paginate($request->get('per_page', 15));

        $data = [
            'purchases'  => $purchases,
            'canManage'  => true,
            'suppliers'  => Supplier::orderBy('name')->get(['id', 'name', 'phone', 'email', 'address']),
            'medicines'  => Medicine::orderBy('name')->get(['id', 'name', 'generic_name', 'cost_price']),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['purchases' => $purchases, 'canManage' => true]);
        }

        return Inertia::render('Purchases', $data);
    }

    public function create(): Response
    {
        return Inertia::render('Purchases/Create', [
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name', 'contact_person', 'phone', 'email']),
            'medicines' => Medicine::orderBy('name')->get(['id', 'name', 'generic_name', 'cost_price']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'              => ['required', 'exists:suppliers,id'],
            'purchase_date'            => ['required', 'date'],
            'expected_delivery_date'   => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'tax_amount'               => ['nullable', 'numeric', 'min:0'],
            'discount_amount'          => ['nullable', 'numeric', 'min:0'],
            'shipping_cost'            => ['nullable', 'numeric', 'min:0'],
            'notes'                    => ['nullable', 'string', 'max:1000'],
            'payment_terms'            => ['nullable', 'array'],
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.medicine_id'      => ['required', 'exists:medicines,id'],
            'items.*.quantity'         => ['required', 'integer', 'min:1'],
            'items.*.unit_cost'        => ['required', 'numeric', 'min:0'],
            'items.*.notes'            => ['nullable', 'string', 'max:255'],
        ]);

        $purchase = $this->purchaseService->createPurchase($validated);
        $this->notificationService->sendPurchaseOrderNotification($purchase, 'created');

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Purchase created.', 'purchase' => $purchase->load('supplier', 'items')], 201);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase order created successfully.');
    }

    public function show(Request $request, Purchase $purchase)
    {
        $purchase->load(['supplier', 'user', 'items.medicine', 'stockMovements']);
        $data = ['purchase' => $purchase];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Purchases/Show', $data);
    }

    public function edit(Purchase $purchase): Response
    {
        if (in_array($purchase->status, ['received', 'cancelled'])) {
            return redirect()->route('purchases.show', $purchase)
                           ->with('error', 'Cannot edit a purchase that is already received or cancelled.');
        }

        $purchase->load(['items.medicine']);

        return Inertia::render('Purchases/Edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name', 'contact_person', 'phone', 'email']),
            'medicines' => Medicine::orderBy('name')->get(['id', 'name', 'generic_name', 'cost_price']),
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        if (in_array($purchase->status, ['received', 'cancelled'])) {
            $msg = 'Cannot update a purchase that is already received or cancelled.';
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $msg], 422)
                : redirect()->route('purchases.show', $purchase)->with('error', $msg);
        }

        $validated = $request->validate([
            'supplier_id'            => ['required', 'exists:suppliers,id'],
            'purchase_date'          => ['required', 'date'],
            'expected_delivery_date' => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'tax_amount'             => ['nullable', 'numeric', 'min:0'],
            'discount_amount'        => ['nullable', 'numeric', 'min:0'],
            'shipping_cost'          => ['nullable', 'numeric', 'min:0'],
            'notes'                  => ['nullable', 'string', 'max:1000'],
            'payment_terms'          => ['nullable', 'array'],
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.medicine_id'    => ['required', 'exists:medicines,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.unit_cost'      => ['required', 'numeric', 'min:0'],
            'items.*.notes'          => ['nullable', 'string', 'max:255'],
        ]);

        $purchase = $this->purchaseService->updatePurchase($purchase, $validated);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Purchase updated.', 'purchase' => $purchase->fresh(['supplier', 'items'])]);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase order updated successfully.');
    }

    public function destroy(Request $request, Purchase $purchase)
    {
        if (in_array($purchase->status, ['received', 'partially_received'])) {
            $msg = 'Cannot delete a purchase that has been received.';
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $msg], 422)
                : redirect()->route('purchases.show', $purchase)->with('error', $msg);
        }

        $purchase->delete();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Purchase deleted.']);
        }

        return redirect()->route('purchases.index')->with('success', 'Purchase order deleted successfully.');
    }

    public function receive(Request $request, Purchase $purchase)
    {
        if (in_array($purchase->status, ['received', 'cancelled'])) {
            $msg = 'This purchase cannot be received.';
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $msg], 422)
                : redirect()->route('purchases.show', $purchase)->with('error', $msg);
        }

        $purchase->load(['supplier', 'items.medicine']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['purchase' => $purchase]);
        }

        return Inertia::render('Purchases/Receive', ['purchase' => $purchase]);
    }

    public function processReceive(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'    => ['required', 'exists:purchase_items,id'],
            'items.*.quantity_received'   => ['required', 'integer', 'min:0'],
            'items.*.batch_number'        => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date'         => ['nullable', 'date', 'after:today'],
            'items.*.manufacturing_date'  => ['nullable', 'date', 'before_or_equal:today'],
        ]);

        $purchase = $this->purchaseService->receivePurchase($purchase, $validated['items']);
        $this->notificationService->sendPurchaseOrderNotification($purchase, 'received');

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Purchase received.', 'purchase' => $purchase->fresh()]);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase items received successfully.');
    }

    public function cancel(Request $request, Purchase $purchase)
    {
        if (in_array($purchase->status, ['received', 'cancelled'])) {
            $msg = 'This purchase cannot be cancelled.';
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $msg], 422)
                : redirect()->route('purchases.show', $purchase)->with('error', $msg);
        }

        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $this->purchaseService->cancelPurchase($purchase, $validated['reason']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Purchase cancelled.']);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase order cancelled successfully.');
    }

    public function markAsOrdered(Request $request, Purchase $purchase)
    {
        if ($purchase->status !== 'pending') {
            $msg = 'Only pending purchases can be marked as ordered.';
            return $request->expectsJson() || $request->is('api/*')
                ? response()->json(['message' => $msg], 422)
                : redirect()->route('purchases.show', $purchase)->with('error', $msg);
        }

        $purchase->update(['status' => 'ordered']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Marked as ordered.', 'purchase' => $purchase->fresh()]);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase order marked as ordered.');
    }

    public function report(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'status' => ['nullable', 'string'],
        ]);

        $purchases = $this->purchaseService->generatePurchaseReport($filters);

        return response()->json([
            'purchases' => $purchases,
            'summary' => [
                'total_purchases' => $purchases->count(),
                'total_amount' => $purchases->sum('total_amount'),
                'total_items' => $purchases->sum('total_items'),
            ],
        ]);
    }

    public function statistics(): JsonResponse
    {
        return response()->json($this->purchaseService->getPurchaseStatistics());
    }
}







