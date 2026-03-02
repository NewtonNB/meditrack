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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            
            // User and pharmacy context
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('pharmacy_id')->nullable();
            
            // Subject (the model being acted upon)
            $table->string('subject_type')->nullable(); // Model class name
            $table->unsignedBigInteger('subject_id')->nullable(); // Model ID
            
            // Activity details
            $table->string('event'); // created, updated, deleted, login, logout, etc.
            $table->text('description')->nullable(); // Human readable description
            
            // Data storage
            $table->json('properties')->nullable(); // Additional context data
            $table->json('old_values')->nullable(); // Original values before change
            $table->json('new_values')->nullable(); // New values after change
            
            // Request context
            $table->string('ip_address', 45)->nullable(); // IPv4 and IPv6 support
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('method', 10)->nullable(); // GET, POST, PUT, DELETE, etc.
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'pharmacy_id'], 'idx_user_pharmacy');
            $table->index(['subject_type', 'subject_id'], 'idx_subject');
            $table->index(['event', 'created_at'], 'idx_event_date');
            $table->index('pharmacy_id', 'idx_pharmacy');
            $table->index('created_at', 'idx_created_at');
            $table->index(['user_id', 'event'], 'idx_user_event');
            
            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pharmacy_id')->references('id')->on('pharmacy_clients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};