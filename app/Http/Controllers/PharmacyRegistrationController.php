<?php

namespace App\Http\Controllers;

use App\Models\PharmacyClient;
use App\Models\User;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class PharmacyRegistrationController extends Controller
{
    public function show(): Response
    {
        $subscriptionPlans = SubscriptionPlan::where('is_active', true)->get();
        
        return Inertia::render('Auth/RegisterPharmacy', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    public function register(Request $request): RedirectResponse
    {
        $request->validate([
            // Pharmacy Information
            'pharmacy_name' => 'required|string|max:255',
            'pharmacy_email' => 'required|string|email|max:255|unique:pharmacy_clients,email',
            'pharmacy_phone' => 'nullable|string|max:50',
            'pharmacy_address' => 'nullable|string|max:500',
            'license_number' => 'required|string|max:255|unique:pharmacy_clients,license_number',
            
            // Admin User Information
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|string|email|max:255|unique:users,email',
            'admin_password' => ['required', 'confirmed', Rules\Password::defaults()],
            
            // Subscription
            'subscription_plan' => 'required|string|exists:subscription_plans,slug',
            'trial_days' => 'integer|min:0|max:30',
            
            // Terms
            'terms_accepted' => 'required|accepted',
            'marketing_emails' => 'boolean',
        ]);

        return DB::transaction(function () use ($request) {
            // Get subscription plan
            $subscriptionPlan = SubscriptionPlan::where('slug', $request->subscription_plan)->first();
            
            // Create pharmacy client
            $pharmacy = PharmacyClient::create([
                'name' => $request->pharmacy_name,
                'slug' => Str::slug($request->pharmacy_name) . '-' . Str::random(6),
                'email' => $request->pharmacy_email,
                'phone' => $request->pharmacy_phone,
                'address' => $request->pharmacy_address,
                'license_number' => $request->license_number,
                'subscription_plan' => $request->subscription_plan,
                'status' => 'active',
                'subscription_expires_at' => $request->subscription_plan === 'free' 
                    ? now()->addDays($request->trial_days ?? 7)
                    : now()->addMonth(),
                'monthly_fee' => $subscriptionPlan->monthly_price,
                'settings' => [
                    'timezone' => 'UTC',
                    'currency' => 'UGX',
                    'notifications' => true,
                    'marketing_emails' => $request->marketing_emails ?? false,
                ],
            ]);

            // Create admin user
            $adminUser = User::create([
                'name' => $request->admin_name,
                'email' => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'role' => 'pharmacy_admin',
                'pharmacy_id' => $pharmacy->id,
                'email_verified_at' => now(), // Auto-verify for now
            ]);

            // Create initial data for the pharmacy
            $this->createInitialData($pharmacy);

            // Send welcome email (you can implement this later)
            // Mail::to($adminUser->email)->send(new PharmacyWelcomeMail($pharmacy, $adminUser));

            return redirect()->route('pharmacy.registration.success', [
                'pharmacy' => $pharmacy->slug
            ])->with('success', 'Pharmacy registered successfully! Welcome to MediTrack.');
        });
    }

    public function success(Request $request): Response
    {
        $pharmacySlug = $request->get('pharmacy');
        $pharmacy = PharmacyClient::where('slug', $pharmacySlug)->first();

        if (!$pharmacy) {
            return redirect()->route('pharmacy.register');
        }

        return Inertia::render('Auth/PharmacyRegistrationSuccess', [
            'pharmacy' => $pharmacy,
        ]);
    }

    private function createInitialData(PharmacyClient $pharmacy): void
    {
        // Create sample suppliers
        $suppliers = [
            ['name' => 'MedSupply Co.', 'email' => 'contact@medsupply.com', 'phone' => '+1-555-0101'],
            ['name' => 'PharmaDirect', 'email' => 'orders@pharmadirect.com', 'phone' => '+1-555-0102'],
            ['name' => 'HealthPlus', 'email' => 'sales@healthplus.com', 'phone' => '+1-555-0103'],
        ];

        foreach ($suppliers as $supplierData) {
            $pharmacy->suppliers()->create($supplierData);
        }

        // Create sample medicines
        $medicines = [
            [
                'name' => 'Paracetamol 500mg',
                'brand' => 'Generic',
                'batch_number' => 'BATCH001',
                'expiry_date' => now()->addYear(),
                'cost_price' => 2.50,
                'selling_price' => 5.00,
                'stock' => 100,
                'supplier_id' => $pharmacy->suppliers()->first()->id,
            ],
            [
                'name' => 'Ibuprofen 400mg',
                'brand' => 'Generic',
                'batch_number' => 'BATCH002',
                'expiry_date' => now()->addYear(),
                'cost_price' => 3.00,
                'selling_price' => 6.00,
                'stock' => 80,
                'supplier_id' => $pharmacy->suppliers()->first()->id,
            ],
            [
                'name' => 'Amoxicillin 250mg',
                'brand' => 'Generic',
                'batch_number' => 'BATCH003',
                'expiry_date' => now()->addYear(),
                'cost_price' => 4.00,
                'selling_price' => 8.00,
                'stock' => 60,
                'supplier_id' => $pharmacy->suppliers()->first()->id,
            ],
        ];

        foreach ($medicines as $medicineData) {
            $pharmacy->medicines()->create($medicineData);
        }

        // Create sample customers
        $customers = [
            ['name' => 'John Smith', 'email' => 'john@example.com', 'phone' => '+1-555-1001'],
            ['name' => 'Jane Doe', 'email' => 'jane@example.com', 'phone' => '+1-555-1002'],
            ['name' => 'Bob Johnson', 'email' => 'bob@example.com', 'phone' => '+1-555-1003'],
        ];

        foreach ($customers as $customerData) {
            $pharmacy->customers()->create($customerData);
        }
    }
}
