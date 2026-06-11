<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('stock_levels')) {
            Schema::create('stock_levels', function (Blueprint $table) {
                $table->id();
                $table->foreignId('medicine_id')->constrained('medicines')->onDelete('cascade');
                $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
                $table->foreignId('batch_id')->nullable()->constrained('batches')->onDelete('cascade');
                $table->integer('quantity')->default(0);
                $table->integer('reserved_quantity')->default(0);
                $table->string('unit_type', 50)->default('tablet');
                $table->timestamp('last_updated')->nullable();
                $table->string('audit_status', 50)->default('pending');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_levels');
    }
};
