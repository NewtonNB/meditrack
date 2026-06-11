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
            // Only add columns that don't exist
            if (!Schema::hasColumn('sales', 'sale_type')) {
                // Sale type: pos (retail) or bulk (wholesale)
                $table->enum('sale_type', ['pos', 'bulk'])->default('pos')->after('id');
            }
            
            if (!Schema::hasColumn('sales', 'unit_type')) {
                // Unit type: piece, strip, box
                $table->string('unit_type')->default('piece')->after('quantity');
            }
            
            if (!Schema::hasColumn('sales', 'base_quantity')) {
                // Base quantity (always in pieces for stock tracking)
                $table->integer('base_quantity')->default(0)->after('unit_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['sale_type', 'unit_type', 'base_quantity']);
        });
    }
};
