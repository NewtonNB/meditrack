<?php

namespace App\Http\Controllers;

use App\Services\POS\POSService;
use App\Services\POS\PaymentService;
use App\Services\POS\LoyaltyService;
use App\Services\POS\PromotionService;
use App\Models\Sale;
use App\Models\Medicine;
use App\Models\Customer;
use App\Models\POSTerminal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class POSController extends Controller
{
    protected $posService;
    protected $paymentService;
    protected $loyaltyService;
    protected $promotionService;

    public function __construct(
        POSService $posService,
        PaymentService $paymentService,
        LoyaltyService $loyaltyService,
        PromotionService $promotionService
    ) {
        $this->posService = $posService;
        $this->paymentService = $paymentService;
        $this->loyaltyService = $loyaltyService;
        $this->promotionService = $promotionService;
    }

    /**
     * Display POS interface
     */
    public function index()
    {
        return Inertia::render('POS/Dashboard', [
            'terminals' => POSTerminal::where('is_active', true)->get(),
            'paymentMethods' => $this->paymentService->getPaymentMethodConfig(),
            'customers' => Customer::where('pharmacy_id', auth()->user()->pharmacy_id ?? 1)
                ->orderBy('name')
                ->get()
        ]);
    }

    /**
     * Search medicines for POS
     */
    public function searchMedicines(Request $request)
    {
        $query = $request->get('q', '');
        $warehouseId = $request->get('warehouse_id', 1);
        
        $medicines = Medicine::with(['stockLevels' => function ($query) use ($warehouseId) {
                $query->where('warehouse_id', $warehouseId);
            }])
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('generic_name', 'like', "%{$query}%")
                  ->orWhere('barcode', 'like', "%{$query}%");
            })
            ->where('is_active', true)
            ->limit(20)
            ->get()
            ->map(function ($medicine) {
                $stockLevel = $medicine->stockLevels->first();
                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'generic_name' => $medicine->generic_name,
                    'barcode' => $medicine->barcode,
                    'selling_price' => $medicine->selling_price,
                    'cost_price' => $medicine->cost_price,
                    'available_stock' => $stockLevel ? $stockLevel->current_stock : 0,
                    'unit' => $medicine->unit,
                    'category' => $medicine->category,
                    'requires_prescription' => $medicine->requires_prescription
                ];
            });

        return response()->json($medicines);
    }

    /**
     * Search customers for POS
     */
    public function searchCustomers(Request $request)
    {
        $query = $request->get('q', '');
        
        $customers = Customer::with('customerLoyalty')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            })
            ->where('is_active', true)
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'loyalty_points' => $customer->customerLoyalty ? $customer->customerLoyalty->points_balance : 0,
                    'tier' => $customer->customerLoyalty ? $customer->customerLoyalty->tier : 'bronze'
                ];
            });

        return response()->json($customers);
    }

    /**
     * Calculate transaction totals
     */
    public function calculateTotals(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id'
        ]);

        try {
            $items = $request->input('items');
            $customerId = $request->input('customer_id');
            
            // Calculate subtotal
            $subtotal = collect($items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });
            
            // Calculate discounts
            $discountResult = $this->promotionService->calculateDiscounts($items, $customerId, $subtotal);
            
            // Calculate loyalty points
            $loyaltyPoints = 0;
            if ($customerId) {
                $loyaltyPoints = $this->loyaltyService->calculatePointsForPurchase($customerId, $subtotal - $discountResult['discount_amount']);
            }
            
            // Calculate tax (10%)
            $taxRate = 0.10;
            $taxableAmount = $subtotal - $discountResult['discount_amount'];
            $taxAmount = $taxableAmount * $taxRate;
            
            $totalAmount = $subtotal - $discountResult['discount_amount'] + $taxAmount;
            
            return response()->json([
                'subtotal' => round($subtotal, 2),
                'discount_amount' => round($discountResult['discount_amount'], 2),
                'tax_amount' => round($taxAmount, 2),
                'total_amount' => round($totalAmount, 2),
                'loyalty_points_earned' => $loyaltyPoints,
                'applied_promotions' => $discountResult['applied_promotions']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error calculating totals: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to calculate totals'], 500);
        }
    }

    /**
     * Create new transaction
     */
    public function createTransaction(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'terminal_id' => 'nullable|exists:pos_terminals,id',
            'warehouse_id' => 'nullable|exists:warehouses,id'
        ]);

        try {
            $sale = $this->posService->createTransaction(
                $request->input('items'),
                [
                    'customer_id' => $request->input('customer_id'),
                    'terminal_id' => $request->input('terminal_id'),
                    'warehouse_id' => $request->input('warehouse_id', 1),
                    'cashier_id' => auth()->id()
                ]
            );

            return response()->json([
                'success' => true,
                'transaction' => $sale,
                'message' => 'Transaction created successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process payment
     */
    public function processPayment(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|string',
            'payments.*.amount' => 'required|numeric|min:0.01',
            'payments.*.details' => 'sometimes|array'
        ]);

        try {
            $sale = $this->posService->processPayment(
                $request->input('sale_id'),
                $request->input('payments')
            );

            return response()->json([
                'success' => true,
                'sale' => $sale,
                'message' => 'Payment processed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing payment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply coupon
     */
    public function applyCoupon(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'items' => 'required|array',
            'subtotal' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id'
        ]);

        try {
            $result = $this->promotionService->applyCoupon(
                $request->input('coupon_code'),
                $request->input('items'),
                $request->input('customer_id'),
                $request->input('subtotal')
            );

            return response()->json([
                'success' => true,
                'coupon' => $result['coupon'],
                'discount_amount' => $result['discount_amount'],
                'message' => 'Coupon applied successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get transaction details
     */
    public function getTransaction($transactionId)
    {
        try {
            $transaction = $this->posService->getTransaction($transactionId);
            return response()->json($transaction);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }
    }

    /**
     * Void transaction
     */
    public function voidTransaction(Request $request, $transactionId)
    {
        $request->validate([
            'reason' => 'required|string|max:255'
        ]);

        try {
            $sale = $this->posService->voidTransaction($transactionId, $request->input('reason'));

            return response()->json([
                'success' => true,
                'sale' => $sale,
                'message' => 'Transaction voided successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error voiding transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get daily sales summary
     */
    public function getDailySummary(Request $request)
    {
        $date = $request->input('date', today());
        $terminalId = $request->input('terminal_id');

        try {
            $summary = $this->posService->getDailySummary($date, $terminalId);
            return response()->json($summary);

        } catch (\Exception $e) {
            Log::error('Error getting daily summary: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get daily summary'], 500);
        }
    }

    /**
     * Get customer loyalty info
     */
    public function getCustomerLoyalty($customerId)
    {
        try {
            $loyaltyInfo = $this->loyaltyService->getCustomerLoyaltySummary($customerId);
            return response()->json($loyaltyInfo);

        } catch (\Exception $e) {
            Log::error('Error getting customer loyalty: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get loyalty information'], 500);
        }
    }

    /**
     * Get available promotions
     */
    public function getPromotions(Request $request)
    {
        $customerId = $request->input('customer_id');
        
        try {
            $promotions = $this->promotionService->getAvailablePromotions($customerId);
            return response()->json($promotions);

        } catch (\Exception $e) {
            Log::error('Error getting promotions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get promotions'], 500);
        }
    }

    /**
     * Print receipt
     */
    public function printReceipt($transactionId)
    {
        try {
            $transaction = $this->posService->getTransaction($transactionId);
            
            // Return receipt data for printing
            return response()->json([
                'transaction' => $transaction,
                'receipt_data' => $this->formatReceiptData($transaction)
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }
    }

    /**
     * Format receipt data
     */
    protected function formatReceiptData($transaction)
    {
        return [
            'store_name' => config('app.name'),
            'store_address' => config('app.address', ''),
            'store_phone' => config('app.phone', ''),
            'transaction_id' => $transaction->transaction_id,
            'receipt_number' => $transaction->receipt_number,
            'date' => $transaction->created_at->format('Y-m-d H:i:s'),
            'cashier' => $transaction->cashier->name ?? 'Unknown',
            'customer' => $transaction->customer ? [
                'name' => $transaction->customer->name,
                'phone' => $transaction->customer->phone,
                'loyalty_points' => $transaction->loyalty_points_earned
            ] : null,
            'items' => $transaction->saleItems->map(function ($item) {
                return [
                    'name' => $item->medicine->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price
                ];
            }),
            'subtotal' => $transaction->subtotal,
            'discount_amount' => $transaction->discount_amount,
            'tax_amount' => $transaction->tax_amount,
            'total_amount' => $transaction->total_amount,
            'payments' => $transaction->paymentTransactions->map(function ($payment) {
                return [
                    'method' => $payment->getPaymentMethodLabel(),
                    'amount' => $payment->amount
                ];
            })
        ];
    }
}