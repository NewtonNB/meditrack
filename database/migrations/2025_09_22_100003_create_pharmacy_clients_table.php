<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('license_number')->nullable();
            $table->string('subscription_plan')->default('free'); // free, pro, enterprise
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('active');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->decimal('monthly_fee', 10, 2)->default(0);
            $table->json('settings')->nullable(); // Custom settings per pharmacy
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_clients');
    }
};
