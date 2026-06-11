<?php

namespace App\Http\Controllers;

use App\Models\PharmacyClient;
use App\Models\SubscriptionPlan;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function showPaymentForm(Request $request): Response
    {
        $pharmacy = auth()->user()->pharmacy;
        $planSlug = $request->get('plan', $pharmacy->subscription_plan);
        $billingCycle = $request->get('cycle', 'monthly');
        
        $subscriptionPlan = SubscriptionPlan::where('slug', $planSlug)->firstOrFail();
        
        $amount = $billingCycle === 'yearly' 
            ? $subscriptionPlan->yearly_price 
            : $subscriptionPlan->monthly_price;
        
        return Inertia::render('Payments/PaymentForm', [
            'pharmacy' => $pharmacy,
            'subscriptionPlan' => $subscriptionPlan,
            'billingCycle' => $billingCycle,
            'amount' => $amount,
            'paymentMethods' => $this->getAvailablePaymentMethods(),
        ]);
    }

    public function processPayment(Request $request): RedirectResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'payment_method' => 'required|in:stripe,paypal,paystack,flutterwave,momo,bank_transfer,manual',
            'billing_cycle' => 'required|in:monthly,yearly',
            'amount' => 'required|numeric|min:0',
        ]);

        $pharmacy = auth()->user()->pharmacy;
        $subscriptionPlan = SubscriptionPlan::findOrFail($request->plan_id);
        
        return DB::transaction(function () use ($request, $pharmacy, $subscriptionPlan) {
            // Create payment record
            $payment = Payment::create([
                'pharmacy_id' => $pharmacy->id,
                'subscription_plan_id' => $subscriptionPlan->id,
                'amount' => $request->amount,
                'currency' => 'UGX',
                'status' => 'pending',
                'payment_method' => $request->payment_method,
                'billing_cycle' => $request->billing_cycle,
                'due_date' => now()->addDays(7),
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
            ]);

            // Process payment based on method
            switch ($request->payment_method) {
                case 'stripe':
                    return $this->processStripePayment($payment, $request);
                case 'paypal':
                    return $this->processPayPalPayment($payment, $request);
                case 'paystack':
                    return $this->processPaystackPayment($payment, $request);
                case 'flutterwave':
                    return $this->processFlutterwavePayment($payment, $request);
                case 'momo':
                    return $this->processMomoPayment($payment, $request);
                case 'bank_transfer':
                    return $this->processBankTransferPayment($payment, $request);
                case 'manual':
                    return $this->processManualPayment($payment, $request);
                default:
                    return back()->with('error', 'Invalid payment method');
            }
        });
    }

    public function handlePaymentCallback(Request $request, string $gateway): RedirectResponse
    {
        $paymentId = $request->get('payment_id');
        $payment = Payment::findOrFail($paymentId);
        
        // Verify payment with gateway
        $isSuccessful = $this->verifyPaymentWithGateway($payment, $gateway, $request);
        
        if ($isSuccessful) {
            $this->completePayment($payment);
            return redirect()->route('subscription.management')
                ->with('success', 'Payment completed successfully!');
        } else {
            $payment->update(['status' => 'failed']);
            return redirect()->route('subscription.management')
                ->with('error', 'Payment failed. Please try again.');
        }
    }

    public function showSubscriptionManagement(): Response
    {
        $pharmacy = auth()->user()->pharmacy;
        $subscriptionPlan = $pharmacy->subscriptionPlan;
        $payments = $pharmacy->payments()->latest()->take(10)->get();
        
        // Calculate usage statistics
        $usage = [
            'users' => $pharmacy->users()->count(),
            'medicines' => $pharmacy->medicines()->count(),
            'customers' => $pharmacy->customers()->count(),
            'sales_this_month' => $pharmacy->sales()
                ->whereMonth('created_at', now()->month)
                ->count(),
        ];
        
        return Inertia::render('SubscriptionManagement', [
            'pharmacy' => $pharmacy,
            'subscriptionPlan' => $subscriptionPlan,
            'payments' => $payments,
            'usage' => $usage,
        ]);
    }

    public function showExpired(): Response
    {
        return Inertia::render('SubscriptionExpired');
    }

    private function getAvailablePaymentMethods(): array
    {
        return [
            'stripe' => [
                'name' => 'Credit/Debit Card',
                'description' => 'Pay with Visa, Mastercard, or American Express',
                'icon' => 'bi-credit-card',
                'enabled' => config('services.stripe.enabled', false),
            ],
            'paypal' => [
                'name' => 'PayPal',
                'description' => 'Pay with your PayPal account',
                'icon' => 'bi-paypal',
                'enabled' => config('services.paypal.enabled', false),
            ],
            'paystack' => [
                'name' => 'Paystack',
                'description' => 'Pay with card, bank transfer, or mobile money',
                'icon' => 'bi-bank',
                'enabled' => config('services.paystack.enabled', true),
            ],
            'flutterwave' => [
                'name' => 'Flutterwave',
                'description' => 'Pay with card, bank transfer, or mobile money',
                'icon' => 'bi-phone',
                'enabled' => config('services.flutterwave.enabled', true),
            ],
            'momo' => [
                'name' => 'Mobile Money',
                'description' => 'Pay with MTN, Airtel, or Orange Money',
                'icon' => 'bi-phone',
                'enabled' => config('services.momo.enabled', true),
            ],
            'bank_transfer' => [
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer',
                'icon' => 'bi-building',
                'enabled' => true,
            ],
            'manual' => [
                'name' => 'Manual Payment',
                'description' => 'Contact support for manual payment processing',
                'icon' => 'bi-person',
                'enabled' => true,
            ],
        ];
    }

    private function processStripePayment(Payment $payment, Request $request): RedirectResponse
    {
        // Implement Stripe payment processing
        // This would integrate with Stripe's API
        return redirect()->route('payments.stripe', ['payment' => $payment->id]);
    }

    private function processPayPalPayment(Payment $payment, Request $request): RedirectResponse
    {
        // Implement PayPal payment processing
        return redirect()->route('payments.paypal', ['payment' => $payment->id]);
    }

    private function processPaystackPayment(Payment $payment, Request $request): RedirectResponse
    {
        // Implement Paystack payment processing
        return redirect()->route('payments.paystack', ['payment' => $payment->id]);
    }

    private function processFlutterwavePayment(Payment $payment, Request $request): RedirectResponse
    {
        // Implement Flutterwave payment processing
        return redirect()->route('payments.flutterwave', ['payment' => $payment->id]);
    }

    private function processMomoPayment(Payment $payment, Request $request): RedirectResponse
    {
        // Implement Mobile Money payment processing
        return redirect()->route('payments.momo', ['payment' => $payment->id]);
    }

    private function processBankTransferPayment(Payment $payment, Request $request): RedirectResponse
    {
        $payment->update([
            'status' => 'pending',
            'notes' => 'Bank transfer payment initiated. Please complete the transfer and contact support.',
        ]);
        
        return redirect()->route('subscription.management')
            ->with('success', 'Bank transfer instructions have been sent to your email.');
    }

    private function processManualPayment(Payment $payment, Request $request): RedirectResponse
    {
        $payment->update([
            'status' => 'pending',
            'notes' => 'Manual payment requested. Our team will contact you shortly.',
        ]);
        
        return redirect()->route('subscription.management')
            ->with('success', 'Manual payment request submitted. Our team will contact you shortly.');
    }

    private function verifyPaymentWithGateway(Payment $payment, string $gateway, Request $request): bool
    {
        // Implement gateway-specific verification
        // This would verify the payment with the respective gateway
        return true; // Placeholder
    }

    private function completePayment(Payment $payment): void
    {
        $payment->update([
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        // Update pharmacy subscription
        $pharmacy = $payment->pharmacy;
        $subscriptionPlan = $payment->subscriptionPlan;
        
        $pharmacy->update([
            'subscription_plan' => $subscriptionPlan->slug,
            'subscription_expires_at' => $payment->billing_cycle === 'yearly' 
                ? now()->addYear() 
                : now()->addMonth(),
            'monthly_fee' => $subscriptionPlan->monthly_price,
            'status' => 'active',
        ]);
    }
}
