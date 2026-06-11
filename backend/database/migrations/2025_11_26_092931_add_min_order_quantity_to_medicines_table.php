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
        Schema::table('medicines', function (Blueprint $table) {
            $table->integer('min_order_quantity')->nullable()->default(10)->after('reorder_level');
            $table->string('category')->nullable()->after('min_order_quantity');
            $table->boolean('is_prescription')->default(false)->after('category');
            $table->string('code')->nullable()->after('name');
            $table->decimal('purchase_price', 10, 2)->nullable()->after('cost_price');
            $table->integer('current_stock')->nullable()->after('stock');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn([
                'min_order_quantity',
                'category', 
                'is_prescription',
                'code',
                'purchase_price',
                'current_stock'
            ]);
        });
    }
};
