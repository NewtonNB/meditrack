<?php

namespace Database\Factories;

use App\Models\Medicine;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineFactory extends Factory
{
    protected $model = Medicine::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Paracetamol','Amoxicillin','Ibuprofen','Cetirizine']).' '.$this->faker->numberBetween(100, 1000).'mg',
            'brand' => $this->faker->company(),
            'batch_number' => strtoupper($this->faker->bothify('BN####')),
            'expiry_date' => $this->faker->dateTimeBetween('+3 months', '+2 years')->format('Y-m-d'),
            'cost_price' => $this->faker->randomFloat(2, 1, 50),
            'selling_price' => $this->faker->randomFloat(2, 2, 100),
            'stock' => $this->faker->numberBetween(10, 500),
            'supplier_id' => Supplier::inRandomOrder()->value('id') ?? Supplier::factory(),
        ];
    }
}







