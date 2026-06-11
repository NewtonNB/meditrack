<?php

namespace App\Services\POS;

use App\Models\Sale;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Process a payment for a sale
     */
    public function processPayment(Sale $sale, $method, $amount, $details = [])
    {
        try {
            $paymentTransaction = PaymentTransaction::create([
                'sale_id' => $sale->id,
                'payment_method' => $method,
                'amount' => $amount,
                'currency' => 'UGX',
                'reference_number' => $this->generateReferenceNumber($method),
                'gateway_response' => $this->processPaymentGateway($method, $amount, $details),
                'status' => 'pending'
            ]);

            // Process based on payment method
            switch ($method) {
                case 'cash':
                    $this->processCashPayment($paymentTransaction, $details);
                    break;
                case 'card':
                    $this->processCardPayment($paymentTransaction, $details);
                    break;
                case 'mobile_money':
                    $this->processMobileMoneyPayment($paymentTransaction, $details);
                    break;
                case 'insurance':
                    $this->processInsurancePayment($paymentTransaction, $details);
                    break;
                case 'loyalty_points':
                    $this->processLoyaltyPointsPayment($paymentTransaction, $details);
                    break;
                default:
                    throw new \Exception("Unsupported payment method: {$method}");
            }

            return $paymentTransaction;

        } catch (\Exception $e) {
            Log::error("Payment processing failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process cash payment
     */
    protected function processCashPayment(PaymentTransaction $payment, $details)
    {
        $amountTendered = $details['amount_tendered'] ?? $payment->amount;
        $change = $amountTendered - $payment->amount;

        $payment->markAsCompleted(
            $payment->reference_number,
            [
                'amount_tendered' => $amountTendered,
                'change_given' => $change,
                'processed_at' => now()->toISOString()
            ]
        );

        Log::info("Cash payment processed", [
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
            'change' => $change
        ]);
    }

    /**
     * Process card payment
     */
    protected function processCardPayment(PaymentTransaction $payment, $details)
    {
        // Simulate card processing
        $cardNumber = $details['card_number'] ?? '';
        $maskedCard = $this->maskCardNumber($cardNumber);
        
        // In real implementation, integrate with payment gateway
        $gatewayResponse = $this->simulateCardGateway($payment->amount, $details);
        
        if ($gatewayResponse['status'] === 'approved') {
            $payment->markAsCompleted(
                $gatewayResponse['transaction_id'],
                array_merge($gatewayResponse, [
                    'masked_card' => $maskedCard,
                    'card_type' => $this->detectCardType($cardNumber)
                ])
            );
        } else {
            $payment->markAsFailed($gatewayResponse['error_message']);
            throw new \Exception("Card payment failed: " . $gatewayResponse['error_message']);
        }

        Log::info("Card payment processed", [
            'payment_id' => $payment->id,
            'masked_card' => $maskedCard,
            'status' => $gatewayResponse['status']
        ]);
    }

    /**
     * Process mobile money payment
     */
    protected function processMobileMoneyPayment(PaymentTransaction $payment, $details)
    {
        $phoneNumber = $details['phone_number'] ?? '';
        $provider = $details['provider'] ?? '';
        
        // Simulate mobile money processing
        $gatewayResponse = $this->simulateMobileMoneyGateway($payment->amount, $details);
        
        if ($gatewayResponse['status'] === 'approved') {
            $payment->markAsCompleted(
                $gatewayResponse['transaction_id'],
                array_merge($gatewayResponse, [
                    'phone_number' => $this->maskPhoneNumber($phoneNumber),
                    'provider' => $provider
                ])
            );
        } else {
            $payment->markAsFailed($gatewayResponse['error_message']);
            throw new \Exception("Mobile money payment failed: " . $gatewayResponse['error_message']);
        }

        Log::info("Mobile money payment processed", [
            'payment_id' => $payment->id,
            'provider' => $provider,
            'status' => $gatewayResponse['status']
        ]);
    }

    /**
     * Process insurance payment
     */
    protected function processInsurancePayment(PaymentTransaction $payment, $details)
    {
        $insuranceProvider = $details['insurance_provider'] ?? '';
        $policyNumber = $details['policy_number'] ?? '';
        $authorizationCode = $details['authorization_code'] ?? '';
        
        // Simulate insurance verification
        $verificationResult = $this->simulateInsuranceVerification($details);
        
        if ($verificationResult['approved']) {
            $payment->markAsCompleted(
                $authorizationCode,
                array_merge($verificationResult, [
                    'insurance_provider' => $insuranceProvider,
                    'policy_number' => $this->maskPolicyNumber($policyNumber),
                    'coverage_amount' => $verificationResult['coverage_amount']
                ])
            );
        } else {
            $payment->markAsFailed($verificationResult['error_message']);
            throw new \Exception("Insurance payment failed: " . $verificationResult['error_message']);
        }

        Log::info("Insurance payment processed", [
            'payment_id' => $payment->id,
            'provider' => $insuranceProvider,
            'status' => $verificationResult['approved'] ? 'approved' : 'declined'
        ]);
    }

    /**
     * Process loyalty points payment
     */
    protected function processLoyaltyPointsPayment(PaymentTransaction $payment, $details)
    {
        $customerId = $details['customer_id'] ?? null;
        $pointsToRedeem = $details['points_to_redeem'] ?? 0;
        
        if (!$customerId) {
            throw new \Exception('Customer ID required for loyalty points payment');
        }
        
        // Verify customer has enough points
        $customerLoyalty = \App\Models\CustomerLoyalty::where('customer_id', $customerId)->first();
        
        if (!$customerLoyalty || $customerLoyalty->points_balance < $pointsToRedeem) {
            $payment->markAsFailed('Insufficient loyalty points');
            throw new \Exception('Insufficient loyalty points');
        }
        
        // Redeem points
        $customerLoyalty->redeemPoints(
            $pointsToRedeem,
            "Payment for transaction {$payment->sale->transaction_id}",
            $payment->sale_id
        );
        
        $payment->markAsCompleted(
            "LP-" . $payment->id,
            [
                'points_redeemed' => $pointsToRedeem,
                'points_value' => $payment->amount,
                'remaining_balance' => $customerLoyalty->fresh()->points_balance
            ]
        );

        Log::info("Loyalty points payment processed", [
            'payment_id' => $payment->id,
            'customer_id' => $customerId,
            'points_redeemed' => $pointsToRedeem
        ]);
    }

    /**
     * Generate payment reference number
     */
    protected function generateReferenceNumber($method)
    {
        $prefix = strtoupper(substr($method, 0, 3));
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(Str::random(4));
        
        return "{$prefix}-{$timestamp}-{$random}";
    }

    /**
     * Process payment through gateway (placeholder)
     */
    protected function processPaymentGateway($method, $amount, $details)
    {
        // This would integrate with actual payment gateways
        return [
            'gateway' => 'simulation',
            'method' => $method,
            'amount' => $amount,
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Simulate card gateway response
     */
    protected function simulateCardGateway($amount, $details)
    {
        // Simulate random success/failure for demo
        $success = rand(1, 100) <= 95; // 95% success rate
        
        if ($success) {
            return [
                'status' => 'approved',
                'transaction_id' => 'TXN-' . strtoupper(Str::random(10)),
                'approval_code' => strtoupper(Str::random(6)),
                'gateway_fee' => $amount * 0.029, // 2.9% fee
                'processed_at' => now()->toISOString()
            ];
        } else {
            return [
                'status' => 'declined',
                'error_code' => 'DECLINED',
                'error_message' => 'Card declined by issuer'
            ];
        }
    }

    /**
     * Simulate mobile money gateway response
     */
    protected function simulateMobileMoneyGateway($amount, $details)
    {
        $success = rand(1, 100) <= 90; // 90% success rate
        
        if ($success) {
            return [
                'status' => 'approved',
                'transaction_id' => 'MM-' . strtoupper(Str::random(10)),
                'gateway_fee' => $amount * 0.015, // 1.5% fee
                'processed_at' => now()->toISOString()
            ];
        } else {
            return [
                'status' => 'declined',
                'error_code' => 'INSUFFICIENT_FUNDS',
                'error_message' => 'Insufficient funds in mobile money account'
            ];
        }
    }

    /**
     * Simulate insurance verification
     */
    protected function simulateInsuranceVerification($details)
    {
        $approved = rand(1, 100) <= 85; // 85% approval rate
        
        if ($approved) {
            return [
                'approved' => true,
                'coverage_amount' => $details['amount'] ?? 0,
                'deductible' => 0,
                'copay' => 0,
                'verification_code' => 'INS-' . strtoupper(Str::random(8))
            ];
        } else {
            return [
                'approved' => false,
                'error_code' => 'COVERAGE_DENIED',
                'error_message' => 'Treatment not covered by insurance policy'
            ];
        }
    }

    /**
     * Mask card number for security
     */
    protected function maskCardNumber($cardNumber)
    {
        if (strlen($cardNumber) < 4) {
            return '****';
        }
        
        return '****-****-****-' . substr($cardNumber, -4);
    }

    /**
     * Mask phone number for privacy
     */
    protected function maskPhoneNumber($phoneNumber)
    {
        if (strlen($phoneNumber) < 4) {
            return '****';
        }
        
        return '***-***-' . substr($phoneNumber, -4);
    }

    /**
     * Mask policy number for privacy
     */
    protected function maskPolicyNumber($policyNumber)
    {
        if (strlen($policyNumber) < 4) {
            return '****';
        }
        
        return '****' . substr($policyNumber, -4);
    }

    /**
     * Detect card type from number
     */
    protected function detectCardType($cardNumber)
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        
        if (preg_match('/^4/', $cardNumber)) {
            return 'Visa';
        } elseif (preg_match('/^5[1-5]/', $cardNumber)) {
            return 'MasterCard';
        } elseif (preg_match('/^3[47]/', $cardNumber)) {
            return 'American Express';
        } elseif (preg_match('/^6(?:011|5)/', $cardNumber)) {
            return 'Discover';
        }
        
        return 'Unknown';
    }

    /**
     * Get payment method configuration
     */
    public function getPaymentMethodConfig()
    {
        return [
            'cash' => [
                'name' => 'Cash',
                'enabled' => true,
                'requires_change_calculation' => true,
                'icon' => '💵'
            ],
            'card' => [
                'name' => 'Credit/Debit Card',
                'enabled' => true,
                'gateway_fee_percentage' => 2.9,
                'icon' => '💳'
            ],
            'mobile_money' => [
                'name' => 'Mobile Money',
                'enabled' => true,
                'gateway_fee_percentage' => 1.5,
                'icon' => '📱'
            ],
            'insurance' => [
                'name' => 'Insurance',
                'enabled' => true,
                'requires_authorization' => true,
                'icon' => '🏥'
            ],
            'loyalty_points' => [
                'name' => 'Loyalty Points',
                'enabled' => true,
                'conversion_rate' => 100, // 1 point = UGX 100
                'icon' => '⭐'
            ]
        ];
    }
}