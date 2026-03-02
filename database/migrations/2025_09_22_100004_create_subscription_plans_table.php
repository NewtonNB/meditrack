<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Starter, Pro, Enterprise
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('yearly_price', 10, 2)->default(0);
            $table->integer('max_users')->default(1);
            $table->integer('max_medicines')->default(100);
            $table->integer('max_customers')->default(500);
            $table->integer('max_suppliers')->default(10);
            $table->integer('max_sales_per_month')->default(100);
            $table->boolean('reports_enabled')->default(true);
            $table->boolean('api_access')->default(false);
            $table->boolean('custom_branding')->default(false);
            $table->json('features')->nullable(); // Additional features
            $table->integer('trial_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
