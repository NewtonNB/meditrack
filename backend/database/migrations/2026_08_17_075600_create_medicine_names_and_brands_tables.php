<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Medicine Names Table
        Schema::create('medicine_names', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('generic_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Medicine Brands Table
        Schema::create('medicine_brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('manufacturer')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Seed common medicine names
        DB::table('medicine_names')->insert([
            ['name' => 'Paracetamol', 'generic_name' => 'Acetaminophen', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ibuprofen', 'generic_name' => 'Ibuprofen', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Amoxicillin', 'generic_name' => 'Amoxicillin', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ciprofloxacin', 'generic_name' => 'Ciprofloxacin', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Metformin', 'generic_name' => 'Metformin', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Omeprazole', 'generic_name' => 'Omeprazole', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Aspirin', 'generic_name' => 'Acetylsalicylic Acid', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cetirizine', 'generic_name' => 'Cetirizine', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Seed common brands
        DB::table('medicine_brands')->insert([
            ['name' => 'Panadol', 'manufacturer' => 'GSK', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nurofen', 'manufacturer' => 'Reckitt Benckiser', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Augmentin', 'manufacturer' => 'GSK', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cipro', 'manufacturer' => 'Bayer', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Glucophage', 'manufacturer' => 'Merck', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Losec', 'manufacturer' => 'AstraZeneca', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bayer', 'manufacturer' => 'Bayer', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Zyrtec', 'manufacturer' => 'UCB', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Generic', 'manufacturer' => 'Various', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicine_brands');
        Schema::dropIfExists('medicine_names');
    }
};
