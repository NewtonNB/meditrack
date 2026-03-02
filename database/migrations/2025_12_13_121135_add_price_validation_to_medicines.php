<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table("medicines", function (Blueprint $table) {
            // Add constraints to ensure reasonable pricing
            $table->decimal("min_selling_price", 10, 2)->default(1.00)->after("selling_price");
            $table->decimal("max_selling_price", 10, 2)->default(50000.00)->after("min_selling_price");
            
            // Add index for better performance
            $table->index(["selling_price", "cost_price"]);
        });
    }

    public function down()
    {
        Schema::table("medicines", function (Blueprint $table) {
            $table->dropColumn(["min_selling_price", "max_selling_price"]);
            $table->dropIndex(["selling_price", "cost_price"]);
        });
    }
};