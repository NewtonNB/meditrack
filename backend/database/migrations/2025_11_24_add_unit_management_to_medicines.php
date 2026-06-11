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
            // Base unit information
            $table->string('base_unit')->default('piece')->after('category'); // piece, tablet, capsule, ml, etc.
            $table->integer('base_unit_quantity')->default(1)->after('base_unit'); // Always 1 for base unit
            
            // Package information
            $table->string('package_type')->nullable()->after('base_unit_quantity'); // strip, box, bottle, etc.
            $table->integer('units_per_package')->nullable()->after('package_type'); // e.g., 10 tablets per strip
            
            // Pricing per unit type
            $table->decimal('price_per_piece', 10, 2)->nullable()->after('selling_price'); // Price for single piece
            $table->decimal('price_per_package', 10, 2)->nullable()->after('price_per_piece'); // Price for package
            
            // Allow fractional sales (for liquids, etc.)
            $table->boolean('allow_fractional')->default(false)->after('price_per_package');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn([
                'base_unit',
                'base_unit_quantity',
                'package_type',
                'units_per_package',
                'price_per_piece',
                'price_per_package',
                'allow_fractional',
            ]);
        });
    }
};
