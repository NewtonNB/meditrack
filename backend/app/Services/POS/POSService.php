<?php

namespace App\Services\POS;

use App\Models\Sale;
use App\Models\Medicine;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\CustomerLoyalty;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class POSService
{
    protected $inventoryService;
    protected $paymentService;
    protected $loyaltyService;
    protected $promotionService;

    public function __construct(
        InventoryService $inventoryService,
        PaymentService $paymentService,
        LoyaltyService $loyaltyService,
        PromotionService $promotionService
    ) {
        $this->inventoryService = $inventoryService;
        $this->paymentService = $paymentService;
        $this->loyaltyService = $loyaltyService;
        $this->promotionService = $promotionService;
    }

    /**
     * Create a new POS transaction
     */
    public function createTransaction($items, $options = [])
    {
        DB::beginTransaction();
        
        try {
            $transactionId = $this->generateTransactionId();
            $customerId = $options['customer_id'] ?? null;
            $terminalId = $options['terminal_id'] ?? null;
            $cashierId = $options['cashier_id'] ?? auth()->id();
            $warehouseId = $options['warehouse_id'] ?? 1;

            // Calculate totals
            $calculations = $this->calculateTransactionTotals($items, $customerId);
            
            // Create the sale record
            $sale = Sale::create([
                'transaction_id' => $transactionId,
                'pos_terminal_id' => $terminalId,
                'cashier_id' => $cashierId,
                'customer_id' => $customerId,
                'subtotal' => $calculations['subtotal'],
                'discount_amount' => $calculations['discount_amount'],
                'tax_amount' => $calculations['tax_amount'],
                'total_price' => $calculations['total_amount'],
                'total_cost' => $calculations['total_cost'],
                'profit_margin' => $calculations['profit_margin'],
                'loyalty_points_earned' => $calculations['loyalty_points_earned'],
                'loyalty_points_redeemed' => $calculations['loyalty_points_redeemed'],
                'payment_status' => 'pending',
                'sale_type' => 'pos',
                'is_offline' => $options['is_offline'] ?? false,
                'receipt_number' => $this->generateReceiptNumber()
            ]);

            // Add sale items
            foreach ($items as $item) {
                $sale->saleItems()->create([
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'batch_id' => $item['batch_id'] ?? null,
                    'discount_amount' => $item['discount_amount'] ?? 0
                ]);
            }

            // Update inventory
            $this->updateInventoryForSale($items, $warehouseId);

            // Process loyalty points if customer provided
            if ($customerId && $calculations['loyalty_points_earned'] > 0) {
                $this->loyaltyService->awardPoints(
                    $customerId, 
                    $calculations['loyalty_points_earned'],
                    'Purchase points',
                    $sale->id
                );
            }

            DB::commit();
            
            Log::info("POS transaction created: {$transactionId}");
            
            return $sale->load(['saleItems.medicine', 'customer', 'paymentTransactions']);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to create POS transaction: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process payment for a transaction
     */
    public function processPayment($saleId, $payments)
    {
        DB::beginTransaction();
        
        try {
            $sale = Sale::findOrFail($saleId);
            
            if ($sale->payment_status === 'completed') {
                throw new \Exception('Transaction already completed');
            }

            $totalPaid = 0;
            $paymentRecords = [];

            foreach ($payments as $payment) {
                $paymentTransaction = $this->paymentService->processPayment(
                    $sale,
                    $payment['method'],
                    $payment['amount'],
                    $payment['details'] ?? []
                );

                $paymentRecords[] = $paymentTransaction;
                $totalPaid += $payment['amount'];
            }

            // Verify total payment amount
            if (abs($totalPaid - $sale->total_price) > 0.01) {
                throw new \Exception('Payment amount does not match transaction total');
            }

            // Update sale status
            $sale->update([
                'payment_status' => 'completed',
                'payment_methods' => collect($payments)->pluck('method')->toArray()
            ]);

            DB::commit();
            
            Log::info("Payment processed for transaction: {$sale->transaction_id}");
            
            return $sale->load('paymentTransactions');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to process payment: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calculate transaction totals including discounts and taxes
     */
    protected function calculateTransactionTotals($items, $customerId = null)
    {
        $subtotal = 0;
        $totalCost = 0;
        $discountAmount = 0;
        $loyaltyPointsEarned = 0;
        $loyaltyPointsRedeemed = 0;

        // Calculate subtotal and cost
        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            $itemTotal = $item['quantity'] * $item['unit_price'];
            $itemCost = $item['quantity'] * ($medicine->cost_price ?? 0);
            
            $subtotal += $itemTotal;
            $totalCost += $itemCost;
        }

        // Apply promotions and discounts
        if ($customerId) {
            $promotionResult = $this->promotionService->calculateDiscounts($items, $customerId, $subtotal);
            $discountAmount = $promotionResult['discount_amount'];
            
            // Calculate loyalty points
            $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
            if ($customerLoyalty) {
                $loyaltyPointsEarned = $customerLoyalty->calculatePointsForAmount($subtotal - $discountAmount);
            }
        }

        // Calculate tax (assuming 10% tax rate)
        $taxRate = 0.10;
        $taxableAmount = $subtotal - $discountAmount;
        $taxAmount = $taxableAmount * $taxRate;

        $totalAmount = $subtotal - $discountAmount + $taxAmount;
        $profitMargin = $totalCost > 0 ? (($totalAmount - $totalCost) / $totalAmount) * 100 : 0;

        return [
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'total_cost' => $totalCost,
            'profit_margin' => $profitMargin,
            'loyalty_points_earned' => $loyaltyPointsEarned,
            'loyalty_points_redeemed' => $loyaltyPointsRedeemed
        ];
    }

    /**
     * Update inventory for completed sale
     */
    protected function updateInventoryForSale($items, $warehouseId)
    {
        foreach ($items as $item) {
            $this->inventoryService->removeStock(
                $item['medicine_id'],
                $warehouseId,
                $item['quantity'],
                [
                    'reference_type' => 'sale',
                    'reference_id' => null, // Will be updated after sale creation
                    'notes' => 'POS sale transaction'
                ]
            );
        }
    }

    /**
     * Generate unique transaction ID
     */
    protected function generateTransactionId()
    {
        do {
            $transactionId = 'TXN-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        } while (Sale::where('transaction_id', $transactionId)->exists());

        return $transactionId;
    }

    /**
     * Generate unique receipt number
     */
    protected function generateReceiptNumber()
    {
        $prefix = 'RCP';
        $date = date('Ymd');
        $sequence = Sale::whereDate('created_at', today())->count() + 1;
        
        return $prefix . '-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get transaction details
     */
    public function getTransaction($transactionId)
    {
        return Sale::where('transaction_id', $transactionId)
                  ->with([
                      'saleItems.medicine',
                      'customer',
                      'paymentTransactions',
                      'cashier'
                  ])
                  ->firstOrFail();
    }

    /**
     * Get daily sales summary
     */
    public function getDailySummary($date = null, $terminalId = null)
    {
        $date = $date ?? today();
        
        $query = Sale::whereDate('created_at', $date)
                    ->where('payment_status', 'completed');
        
        if ($terminalId) {
            $query->where('pos_terminal_id', $terminalId);
        }

        $sales = $query->get();
        
        return [
            'date' => $date,
            'terminal_id' => $terminalId,
            'total_transactions' => $sales->count(),
            'total_revenue' => $sales->sum('total_price'),
            'total_profit' => $sales->sum('total_price') - $sales->sum('total_cost'),
            'average_transaction' => $sales->count() > 0 ? $sales->avg('total_price') : 0,
            'payment_methods' => $this->getPaymentMethodBreakdown($sales),
            'top_selling_items' => $this->getTopSellingItems($date, $terminalId),
            'hourly_breakdown' => $this->getHourlyBreakdown($sales)
        ];
    }

    /**
     * Get payment method breakdown
     */
    protected function getPaymentMethodBreakdown($sales)
    {
        $breakdown = [];
        
        foreach ($sales as $sale) {
            foreach ($sale->paymentTransactions as $payment) {
                $method = $payment->payment_method;
                if (!isset($breakdown[$method])) {
                    $breakdown[$method] = [
                        'count' => 0,
                        'amount' => 0
                    ];
                }
                $breakdown[$method]['count']++;
                $breakdown[$method]['amount'] += $payment->amount;
            }
        }
        
        return $breakdown;
    }

    /**
     * Get top selling items for the day
     */
    protected function getTopSellingItems($date, $terminalId = null, $limit = 10)
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.payment_status', 'completed');
            
        if ($terminalId) {
            $query->where('sales.pos_terminal_id', $terminalId);
        }
        
        return $query->select(
                'medicines.name',
                'medicines.generic_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.total_price) as total_revenue'),
                DB::raw('COUNT(DISTINCT sales.id) as transaction_count')
            )
            ->groupBy('medicines.id', 'medicines.name', 'medicines.generic_name')
            ->orderBy('total_quantity', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get hourly sales breakdown
     */
    protected function getHourlyBreakdown($sales)
    {
        $breakdown = [];
        
        for ($hour = 0; $hour < 24; $hour++) {
            $breakdown[$hour] = [
                'hour' => $hour,
                'transactions' => 0,
                'revenue' => 0
            ];
        }
        
        foreach ($sales as $sale) {
            $hour = $sale->created_at->hour;
            $breakdown[$hour]['transactions']++;
            $breakdown[$hour]['revenue'] += $sale->total_price;
        }
        
        return array_values($breakdown);
    }

    /**
     * Void a transaction
     */
    public function voidTransaction($transactionId, $reason = null)
    {
        DB::beginTransaction();
        
        try {
            $sale = Sale::where('transaction_id', $transactionId)->firstOrFail();
            
            if ($sale->payment_status === 'voided') {
                throw new \Exception('Transaction already voided');
            }
            
            // Reverse inventory changes
            foreach ($sale->saleItems as $item) {
                $this->inventoryService->addStock(
                    $item->medicine_id,
                    $sale->warehouse_id ?? 1,
                    $item->quantity,
                    [
                        'reference_type' => 'void',
                        'reference_id' => $sale->id,
                        'notes' => "Voided transaction: {$reason}"
                    ]
                );
            }
            
            // Reverse loyalty points
            if ($sale->customer_id && $sale->loyalty_points_earned > 0) {
                $this->loyaltyService->adjustPoints(
                    $sale->customer_id,
                    -$sale->loyalty_points_earned,
                    "Voided transaction: {$sale->transaction_id}"
                );
            }
            
            // Update sale status
            $sale->update([
                'payment_status' => 'voided',
                'void_reason' => $reason,
                'voided_at' => now(),
                'voided_by' => auth()->id()
            ]);
            
            DB::commit();
            
            Log::info("Transaction voided: {$transactionId}", ['reason' => $reason]);
            
            return $sale;
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Failed to void transaction: " . $e->getMessage());
            throw $e;
        }
    }
}