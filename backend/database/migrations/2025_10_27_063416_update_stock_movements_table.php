<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // Add missing columns for enhanced inventory tracking
            if (!Schema::hasColumn('stock_movements', 'warehouse_id')) {
                $table->foreignId('warehouse_id')->nullable()->after('medicine_id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('stock_movements', 'batch_id')) {
                $table->foreignId('batch_id')->nullable()->after('warehouse_id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('stock_movements', 'movement_type')) {
                $table->enum('movement_type', ['in', 'out', 'transfer', 'adjustment', 'expired', 'damaged'])->default('adjustment')->after('batch_id');
            }
            if (!Schema::hasColumn('stock_movements', 'unit_type')) {
                $table->string('unit_type', 50)->default('tablet')->after('movement_type');
            }
            if (!Schema::hasColumn('stock_movements', 'reference_type')) {
                $table->string('reference_type')->nullable()->after('unit_type');
            }
            if (!Schema::hasColumn('stock_movements', 'notes')) {
                $table->text('notes')->nullable()->after('reference_type');
            }
            if (!Schema::hasColumn('stock_movements', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->onDelete('cascade');
            }
            
            // Rename existing columns to match new structure
            if (Schema::hasColumn('stock_movements', 'quantity_change') && !Schema::hasColumn('stock_movements', 'quantity')) {
                $table->renameColumn('quantity_change', 'quantity');
            }
            if (Schema::hasColumn('stock_movements', 'type') && Schema::hasColumn('stock_movements', 'movement_type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('stock_movements', 'note') && Schema::hasColumn('stock_movements', 'notes')) {
                $table->dropColumn('note');
            }
        });
    }

    public function down()
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['batch_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'warehouse_id', 'batch_id', 'movement_type', 'unit_type', 
                'reference_type', 'notes', 'created_by'
            ]);
            
            // Restore original columns
            $table->renameColumn('quantity', 'quantity_change');
            $table->string('type')->after('quantity_change');
            $table->text('note')->nullable()->after('reference_id');
        });
    }
};