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
        Schema::table('sales', function (Blueprint $table) {
            // Add missing customer fields
            if (!Schema::hasColumn('sales', 'customer')) {
                $table->string('customer')->nullable()->after('customer_id');
            }
            
            if (!Schema::hasColumn('sales', 'customer_phone')) {
                $table->string('customer_phone')->nullable()->after('customer');
            }
            
            if (!Schema::hasColumn('sales', 'payment_method')) {
                $table->string('payment_method')->default('cash')->after('total_price');
            }
            
            if (!Schema::hasColumn('sales', 'notes')) {
                $table->text('notes')->nullable()->after('payment_method');
            }
            
            if (!Schema::hasColumn('sales', 'date')) {
                $table->date('date')->default(now()->toDateString())->after('notes');
            }
            
            if (!Schema::hasColumn('sales', 'status')) {
                $table->enum('status', ['completed', 'pending', 'cancelled', 'refunded'])->default('completed')->after('date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'customer',
                'customer_phone', 
                'payment_method',
                'notes',
                'date',
                'status'
            ]);
        });
    }
};
