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
        // Stock Predictions Table
        Schema::create('stock_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->date('prediction_date');
            $table->decimal('predicted_demand', 10, 2);
            $table->decimal('confidence_score', 5, 4);
            $table->integer('prediction_horizon'); // days ahead
            $table->string('model_version', 50);
            $table->decimal('actual_demand', 10, 2)->nullable();
            $table->decimal('accuracy_score', 5, 4)->nullable();
            $table->timestamps();
            
            $table->index(['medicine_id', 'prediction_date']);
            $table->index('prediction_date');
        });

        // Expiry Alerts Table
        Schema::create('expiry_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->string('batch_number', 100)->nullable();
            $table->date('expiry_date');
            $table->date('alert_date');
            $table->decimal('risk_score', 5, 4);
            $table->text('recommended_action')->nullable();
            $table->enum('status', ['pending', 'acknowledged', 'resolved'])->default('pending');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['medicine_id', 'expiry_date']);
            $table->index('alert_date');
            $table->index('status');
        });

        // Anomaly Detections Table
        Schema::create('anomaly_detections', function (Blueprint $table) {
            $table->id();
            $table->enum('transaction_type', ['sale', 'purchase', 'prescription']);
            $table->bigInteger('transaction_id');
            $table->string('anomaly_type', 100);
            $table->decimal('risk_score', 5, 4);
            $table->text('description');
            $table->timestamp('detected_at')->useCurrent();
            $table->enum('status', ['pending', 'investigating', 'resolved', 'false_positive'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
            
            $table->index(['transaction_type', 'transaction_id']);
            $table->index('detected_at');
            $table->index('status');
            $table->index('risk_score');
        });

        // ML Models Registry
        Schema::create('ml_models', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('version', 50);
            $table->enum('type', ['stock_prediction', 'expiry_prediction', 'anomaly_detection', 'nlp_search', 'chatbot']);
            $table->enum('status', ['training', 'deployed', 'deprecated'])->default('training');
            $table->json('accuracy_metrics')->nullable();
            $table->integer('training_data_size')->nullable();
            $table->timestamp('deployed_at')->nullable();
            $table->string('model_path', 500)->nullable();
            $table->json('hyperparameters')->nullable();
            $table->timestamps();
            
            $table->unique(['name', 'version']);
            $table->index(['type', 'status']);
        });

        // Search Queries Table
        Schema::create('search_queries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('query_text');
            $table->enum('search_type', ['symptom', 'medicine_name', 'category']);
            $table->integer('results_count');
            $table->bigInteger('clicked_result_id')->nullable();
            $table->decimal('satisfaction_score', 3, 2)->nullable();
            $table->decimal('processing_time', 6, 4);
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index('search_type');
        });

        // Chatbot Conversations Table
        Schema::create('chatbot_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('session_id', 100);
            $table->text('message');
            $table->text('response');
            $table->string('intent', 100)->nullable();
            $table->decimal('confidence_score', 5, 4)->nullable();
            $table->boolean('escalated')->default(false);
            $table->boolean('helpful')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'session_id']);
            $table->index('created_at');
            $table->index('intent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_conversations');
        Schema::dropIfExists('search_queries');
        Schema::dropIfExists('ml_models');
        Schema::dropIfExists('anomaly_detections');
        Schema::dropIfExists('expiry_alerts');
        Schema::dropIfExists('stock_predictions');
    }
};