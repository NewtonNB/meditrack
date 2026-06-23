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
            if (!Schema::hasColumn('medicines', 'base_unit')) {
                $table->string('base_unit')->default('piece')->after('category'); // piece, tablet, capsule, ml, etc.
            }
            if (!Schema::hasColumn('medicines', 'base_unit_quantity')) {
                $table->integer('base_unit_quantity')->default(1)->after('base_unit'); // Always 1 for base unit
            }
            
            // Package information
            if (!Schema::hasColumn('medicines', 'package_type')) {
                $table->string('package_type')->nullable()->after('base_unit_quantity'); // strip, box, bottle, etc.
            }
            if (!Schema::hasColumn('medicines', 'units_per_package')) {
                $table->integer('units_per_package')->nullable()->after('package_type'); // e.g., 10 tablets per strip
            }
            
            // Pricing per unit type
            if (!Schema::hasColumn('medicines', 'price_per_piece')) {
                $table->decimal('price_per_piece', 10, 2)->nullable()->after('selling_price'); // Price for single piece
            }
            if (!Schema::hasColumn('medicines', 'price_per_package')) {
                $table->decimal('price_per_package', 10, 2)->nullable()->after('price_per_piece'); // Price for package
            }
            
            // Allow fractional sales (for liquids, etc.)
            if (!Schema::hasColumn('medicines', 'allow_fractional')) {
                $table->boolean('allow_fractional')->default(false)->after('price_per_package');
            }
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
