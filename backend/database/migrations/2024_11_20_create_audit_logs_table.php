<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event');
            $table->string('event_type')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_type')->nullable();
            $table->text('description')->nullable();
            $table->json('properties')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            
            // Pharmacy-specific fields
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('location')->nullable();
            $table->string('session_id')->nullable();
            $table->unsignedBigInteger('patient_id')->nullable();
            $table->string('prescription_number')->nullable();
            $table->string('medication_name')->nullable();
            $table->string('controlled_substance')->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->boolean('requires_review')->default(false);
            $table->boolean('compliance_flag')->default(false);
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['event', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['severity', 'created_at']);
            $table->index(['risk_level', 'created_at']);
            $table->index(['patient_id', 'created_at']);
            $table->index(['prescription_number']);
            $table->index(['ip_address']);
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};