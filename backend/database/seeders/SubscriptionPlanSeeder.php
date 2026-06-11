<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small pharmacies getting started',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'max_users' => 1,
                'max_medicines' => 100,
                'max_customers' => 50,
                'max_suppliers' => 10,
                'max_sales_per_month' => 100,
                'reports_enabled' => false,
                'api_access' => false,
                'custom_branding' => false,
                'features' => ['Basic POS system', 'Medicine inventory tracking', 'Customer management', 'Basic reports', 'Expiry tracking', 'Email support'],
                'is_active' => true,
                'trial_days' => 7,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Ideal for growing pharmacies with multiple staff',
                'monthly_price' => 10,
                'yearly_price' => 100,
                'max_users' => 5,
                'max_medicines' => 1000,
                'max_customers' => 500,
                'max_suppliers' => 50,
                'max_sales_per_month' => 1000,
                'reports_enabled' => true,
                'api_access' => true,
                'custom_branding' => false,
                'features' => ['Everything in Starter', 'Advanced reporting & analytics', 'Expiry date alerts', 'Supplier management', 'Stock movement tracking', 'Multi-location support', 'Priority support'],
                'is_active' => true,
                'trial_days' => 14,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large pharmacies with complex needs',
                'monthly_price' => 25,
                'yearly_price' => 250,
                'max_users' => -1, // Unlimited
                'max_medicines' => -1, // Unlimited
                'max_customers' => -1, // Unlimited
                'max_suppliers' => -1, // Unlimited
                'max_sales_per_month' => -1, // Unlimited
                'reports_enabled' => true,
                'api_access' => true,
                'custom_branding' => true,
                'features' => ['Everything in Pro', 'Unlimited users & data', 'Advanced analytics dashboard', 'API access', 'Custom integrations', 'White-label options', '24/7 phone support', 'Dedicated account manager'],
                'is_active' => true,
                'trial_days' => 30,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::create($plan);
        }
    }
}
