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
        // For SQLite, we need to recreate the table without the foreign key
        // First, check if we're using SQLite
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Disable foreign key checks
            DB::statement('PRAGMA foreign_keys = OFF');
            
            // Get existing data
            $movements = DB::table('stock_movements')->get();
            
            // Drop the old table
            Schema::dropIfExists('stock_movements');
            
            // Recreate without batch foreign key
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('medicine_id')->constrained('medicines')->onDelete('cascade');
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->onDelete('cascade');
                $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
                $table->unsignedBigInteger('batch_id')->nullable(); // No foreign key constraint
                $table->string('movement_type')->nullable();
                $table->integer('quantity');
                $table->decimal('unit_cost', 10, 2)->nullable();
                $table->string('reference')->nullable();
                $table->string('unit_type')->nullable();
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('cascade');
                
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
            // For other databases, just drop the foreign key
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropForeign(['batch_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't add the foreign key back since the batches table doesn't exist
    }
};
