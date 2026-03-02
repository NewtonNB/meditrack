<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyClient;
use App\Models\User;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class PharmacyApiController extends Controller
{
    /**
     * Create a new pharmacy via API
     */
    public function createPharmacy(Request $request): JsonResponse
    {
        $request->validate([
            'pharmacy_name' => 'required|string|max:255',
            'pharmacy_email' => 'required|string|email|max:255|unique:pharmacy_clients,email',
            'pharmacy_phone' => 'nullable|string|max:50',
            'pharmacy_address' => 'nullable|string|max:500',
            'license_number' => 'required|string|max:255|unique:pharmacy_clients,license_number',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|string|email|max:255|unique:users,email',
            'admin_password' => ['required', Rules\Password::defaults()],
            'subscription_plan' => 'required|string|exists:subscription_plans,slug',
            'trial_days' => 'integer|min:0|max:30',
            'auto_verify' => 'boolean',
        ]);

        try {
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
                        'created_via_api' => true,
                    ],
                ]);

                // Create admin user
                $adminUser = User::create([
                    'name' => $request->admin_name,
                    'email' => $request->admin_email,
                    'password' => Hash::make($request->admin_password),
                    'role' => 'pharmacy_admin',
                    'pharmacy_id' => $pharmacy->id,
                    'email_verified_at' => $request->auto_verify ? now() : null,
                ]);

                // Create initial data
                $this->createInitialData($pharmacy);

                return response()->json([
                    'success' => true,
                    'message' => 'Pharmacy created successfully',
                    'data' => [
                        'pharmacy' => $pharmacy->fresh(),
                        'admin_user' => $adminUser->fresh(),
                        'login_url' => route('login'),
                        'dashboard_url' => route('dashboard'),
                    ]
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create pharmacy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pharmacy information
     */
    public function getPharmacy(string $slug): JsonResponse
    {
        $pharmacy = PharmacyClient::where('slug', $slug)
            ->with(['users', 'medicines', 'customers', 'suppliers', 'sales'])
            ->first();

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $pharmacy
        ]);
    }

    /**
     * Update pharmacy status
     */
    public function updatePharmacyStatus(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,suspended,inactive',
        ]);

        $pharmacy = PharmacyClient::where('slug', $slug)->first();

        if (!$pharmacy) {
            return response()->json([
                'success' => false,
                'message' => 'Pharmacy not found'
            ], 404);
        }

        $pharmacy->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Pharmacy status updated successfully',
            'data' => $pharmacy->fresh()
        ]);
    }

    /**
     * Create initial data for pharmacy
     */
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
        ];

        foreach ($medicines as $medicineData) {
            $pharmacy->medicines()->create($medicineData);
        }

        // Create sample customers
        $customers = [
            ['name' => 'John Smith', 'email' => 'john@example.com', 'phone' => '+1-555-1001'],
            ['name' => 'Jane Doe', 'email' => 'jane@example.com', 'phone' => '+1-555-1002'],
        ];

        foreach ($customers as $customerData) {
            $pharmacy->customers()->create($customerData);
        }
    }
}
