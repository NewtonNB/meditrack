<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // low_stock, expiry_alert, system_alert, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data for the notification
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['unread', 'read', 'dismissed'])->default('unread');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // null for system-wide notifications
            $table->string('icon')->nullable();
            $table->string('color')->default('blue');
            $table->string('action_url')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status', 'created_at']);
            $table->index(['type', 'priority']);
        });

        // Notification preferences table
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('notification_type');
            $table->boolean('in_app_enabled')->default(true);
            $table->boolean('email_enabled')->default(false);
            $table->boolean('sms_enabled')->default(false);
            $table->json('conditions')->nullable(); // Custom conditions for the notification
            $table->timestamps();
            
            $table->unique(['user_id', 'notification_type']);
        });

        // Notification templates table
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->string('title_template');
            $table->text('message_template');
            $table->string('icon')->nullable();
            $table->string('color')->default('blue');
            $table->enum('default_priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Email notification queue table
        Schema::create('email_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained()->onDelete('cascade');
            $table->string('recipient_email');
            $table->string('subject');
            $table->text('body');
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('email_notifications');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
    }
};