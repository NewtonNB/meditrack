<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition(): array
    {
        $medicine = Medicine::inRandomOrder()->first() ?? Medicine::factory()->create();
        $quantity = $this->faker->numberBetween(1, 5);
        $unit = (float) $medicine->selling_price;
        return [
            'medicine_id' => $medicine->id,
            'customer_id' => $this->faker->boolean(70) ? (Customer::inRandomOrder()->value('id') ?? Customer::factory()) : null,
            'quantity' => $quantity,
            'unit_price' => $unit,
            'total_price' => $unit * $quantity,
            'sold_at' => $this->faker->dateTimeBetween('-2 months', 'now'),
        ];
    }
}







