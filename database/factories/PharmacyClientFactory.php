<?php

namespace Database\Factories;

use App\Models\PharmacyClient;
use Illuminate\Database\Eloquent\Factories\Factory;

class PharmacyClientFactory extends Factory
{
    protected $model = PharmacyClient::class;

    public function definition(): array
    {
        $plans = ['free', 'pro', 'enterprise'];
        $statuses = ['active', 'suspended', 'inactive'];
        
        return [
            'name' => $this->faker->company() . ' Pharmacy',
            'slug' => $this->faker->slug(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'license_number' => 'PH' . $this->faker->numberBetween(100000, 999999),
            'subscription_plan' => $this->faker->randomElement($plans),
            'status' => $this->faker->randomElement($statuses),
            'subscription_expires_at' => $this->faker->dateTimeBetween('now', '+1 year'),
            'monthly_fee' => $this->faker->randomFloat(2, 0, 200),
            'settings' => [
                'timezone' => $this->faker->timezone(),
                'currency' => 'UGX',
                'notifications' => $this->faker->boolean(),
            ],
        ];
    }
}
