<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add pharmacy_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
            $table->enum('role', ['super_admin', 'pharmacy_admin', 'pharmacist', 'cashier'])->default('pharmacist');
        });

        // Add pharmacy_id to all pharmacy-related tables
        Schema::table('medicines', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacy_clients')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn(['pharmacy_id', 'role']);
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn('pharmacy_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn('pharmacy_id');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn('pharmacy_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn('pharmacy_id');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_id']);
            $table->dropColumn('pharmacy_id');
        });
    }
};
