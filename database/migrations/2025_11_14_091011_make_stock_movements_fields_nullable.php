<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Disable foreign key checks
            DB::statement('PRAGMA foreign_keys = OFF');
            
            // Get existing data
            $movements = DB::table('stock_movements')->get();
            
            // Drop the old table
            Schema::dropIfExists('stock_movements');
            
            // Recreate with only essential foreign keys
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('medicine_id')->constrained('medicines')->onDelete('cascade');
                $table->unsignedBigInteger('warehouse_id')->nullable(); // No FK - table may not exist
                $table->unsignedBigInteger('pharmacy_id')->nullable(); // No FK - make it work without
                $table->unsignedBigInteger('batch_id')->nullable(); // No FK - table doesn't exist
                $table->string('movement_type')->nullable();
                $table->integer('quantity');
                $table->decimal('unit_cost', 10, 2)->nullable();
                $table->string('reference')->nullable();
                $table->string('unit_type')->nullable();
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable(); // No FK - make it flexible
                
                // Legacy fields for backward compatibility
                $table->string('type')->nullable();
                $table->text('note')->nullable();
                $table->integer('quantity_change')->nullable();
                
                $table->timestamps();
            });
            
            // Restore data
            foreach ($movements as $movement) {
                DB::table('stock_movements')->insert((array) $movement);
            }
            
            // Re-enable foreign key checks
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            // For other databases
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropForeign(['warehouse_id']);
                $table->dropForeign(['pharmacy_id']);
                $table->dropForeign(['created_by']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't add the foreign keys back
    }
};
