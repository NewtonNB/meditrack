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
        Schema::table('users', function (Blueprint $table) {
            // Profile settings (phone and bio already exist)
            $table->string('timezone')->default('UTC');
            $table->string('language')->default('en');
            
            // Pharmacy settings
            $table->string('pharmacy_name')->nullable();
            $table->text('pharmacy_address')->nullable();
            $table->string('pharmacy_phone')->nullable();
            $table->string('pharmacy_email')->nullable();
            $table->string('license_number')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(10.00);
            $table->string('currency')->default('UGX');
            $table->string('receipt_footer')->nullable();
            
            // Notification settings
            $table->boolean('email_notifications')->default(true);
            $table->boolean('sms_notifications')->default(false);
            $table->boolean('push_notifications')->default(true);
            $table->boolean('low_stock_alerts')->default(true);
            $table->boolean('expiry_alerts')->default(true);
            $table->boolean('sales_reports')->default(true);
            $table->boolean('system_updates')->default(true);
            $table->boolean('marketing_emails')->default(false);
            
            // Security settings
            $table->boolean('two_factor_enabled')->default(false);
            $table->integer('session_timeout')->default(30);
            $table->integer('password_expiry')->default(90);
            $table->integer('login_attempts')->default(5);
            $table->boolean('require_password_change')->default(false);
            
            // System settings
            $table->boolean('auto_backup')->default(true);
            $table->string('backup_frequency')->default('daily');
            $table->integer('data_retention')->default(365);
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('debug_mode')->default(false);
            $table->boolean('cache_enabled')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'timezone', 'language',
                'pharmacy_name', 'pharmacy_address', 'pharmacy_phone', 'pharmacy_email',
                'license_number', 'tax_rate', 'currency', 'receipt_footer',
                'email_notifications', 'sms_notifications', 'push_notifications',
                'low_stock_alerts', 'expiry_alerts', 'sales_reports', 'system_updates', 'marketing_emails',
                'two_factor_enabled', 'session_timeout', 'password_expiry', 'login_attempts', 'require_password_change',
                'auto_backup', 'backup_frequency', 'data_retention', 'maintenance_mode', 'debug_mode', 'cache_enabled'
            ]);
        });
    }
};