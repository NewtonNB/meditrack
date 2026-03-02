<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // For SQLite, we need to recreate the table to modify column constraints
        // First, let's just update existing data and make the seeder handle nulls
        
        // Update existing records to have consistent data
        DB::statement("UPDATE stock_movements SET type = 'adjustment' WHERE type IS NULL");
        DB::statement("UPDATE stock_movements SET note = notes WHERE note IS NULL AND notes IS NOT NULL");
        DB::statement("UPDATE stock_movements SET quantity = ABS(quantity) WHERE quantity < 0");
        
        // Set default values for new columns where they're null
        DB::statement("UPDATE stock_movements SET movement_type = COALESCE(movement_type, 'adjustment')");
        DB::statement("UPDATE stock_movements SET unit_type = COALESCE(unit_type, 'tablet')");
        DB::statement("UPDATE stock_movements SET notes = COALESCE(notes, note)");
    }

    public function down()
    {
        // Nothing to rollback for data updates
    }
};