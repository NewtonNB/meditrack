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
            $table->decimal('refund_amount', 10, 2)->nullable()->after('total_price');
            $table->string('refund_reason')->nullable()->after('refund_amount');
            $table->text('refund_notes')->nullable()->after('refund_reason');
            $table->timestamp('refunded_at')->nullable()->after('refund_notes');
            $table->unsignedBigInteger('refunded_by')->nullable()->after('refunded_at');
            $table->enum('status', ['completed', 'refunded', 'partially_refunded'])->default('completed')->after('refunded_by');
            
            $table->foreign('refunded_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['refunded_by']);
            $table->dropColumn([
                'refund_amount',
                'refund_reason', 
                'refund_notes',
                'refunded_at',
                'refunded_by',
                'status'
            ]);
        });
    }
};