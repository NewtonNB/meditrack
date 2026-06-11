<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Enhance existing sales table
        Schema::table('sales', function (Blueprint $table) {
            // Transaction Details
            if (!Schema::hasColumn('sales', 'transaction_id')) {
                $table->string('transaction_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('sales', 'pos_terminal_id')) {
                $table->string('pos_terminal_id', 50)->nullable()->after('transaction_id');
            }
            if (!Schema::hasColumn('sales', 'cashier_id')) {
                $table->foreignId('cashier_id')->nullable()->after('pos_terminal_id')->constrained('users')->onDelete('set null');
            }
            
            // Customer & Loyalty
            if (!Schema::hasColumn('sales', 'loyalty_points_earned')) {
                $table->integer('loyalty_points_earned')->default(0)->after('customer_id');
            }
            if (!Schema::hasColumn('sales', 'loyalty_points_redeemed')) {
                $table->integer('loyalty_points_redeemed')->default(0)->after('loyalty_points_earned');
            }
            
            // Payment Details
            if (!Schema::hasColumn('sales', 'payment_methods')) {
                $table->json('payment_methods')->nullable()->after('loyalty_points_redeemed');
            }
            if (!Schema::hasColumn('sales', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'completed', 'failed', 'refunded'])->default('pending')->after('payment_methods');
            }
            
            // Financial Breakdown
            if (!Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('payment_status');
            }
            if (!Schema::hasColumn('sales', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('sales', 'tax_amount')) {
                $table->decimal('tax_amount', 10, 2)->default(0)->after('discount_amount');
            }
            
            // Profit Tracking
            if (!Schema::hasColumn('sales', 'total_cost')) {
                $table->decimal('total_cost', 10, 2)->default(0)->after('total_amount');
            }
            if (!Schema::hasColumn('sales', 'profit_margin')) {
                $table->decimal('profit_margin', 5, 2)->default(0)->after('total_cost');
            }
            
            // Receipt & Documentation
            if (!Schema::hasColumn('sales', 'receipt_number')) {
                $table->string('receipt_number', 100)->nullable()->after('profit_margin');
            }
            if (!Schema::hasColumn('sales', 'receipt_printed')) {
                $table->boolean('receipt_printed')->default(false)->after('receipt_number');
            }
            
            // Status & Timestamps
            if (!Schema::hasColumn('sales', 'sale_type')) {
                $table->enum('sale_type', ['pos', 'online', 'phone'])->default('pos')->after('receipt_printed');
            }
            if (!Schema::hasColumn('sales', 'is_offline')) {
                $table->boolean('is_offline')->default(false)->after('sale_type');
            }
            if (!Schema::hasColumn('sales', 'synced_at')) {
                $table->timestamp('synced_at')->nullable()->after('is_offline');
            }
        });

        // Payment transactions table
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->enum('payment_method', ['cash', 'card', 'mobile_money', 'insurance', 'loyalty_points']);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('UGX');
            $table->string('reference_number')->nullable();
            $table->json('gateway_response')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index(['sale_id', 'payment_method']);
            $table->index(['status', 'processed_at']);
        });

        // Customer loyalty program
        Schema::create('customer_loyalty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->integer('points_balance')->default(0);
            $table->enum('tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->integer('tier_progress')->default(0);
            $table->integer('lifetime_points')->default(0);
            $table->decimal('lifetime_spent', 12, 2)->default(0);
            $table->date('last_activity_date')->nullable();
            $table->timestamps();
            
            $table->unique('customer_id');
            $table->index(['tier', 'points_balance']);
        });

        // Loyalty transactions
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('transaction_type', ['earned', 'redeemed', 'expired', 'bonus', 'adjustment']);
            $table->integer('points');
            $table->string('description');
            $table->date('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['customer_id', 'transaction_type']);
            $table->index('expires_at');
        });

        // Promotions and discounts
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed_amount', 'bogo', 'bulk_discount', 'tier_discount']);
            $table->decimal('value', 10, 2);
            $table->json('conditions')->nullable(); // Minimum amount, quantity, etc.
            $table->json('applicable_items')->nullable(); // Specific medicines or categories
            $table->json('customer_tiers')->nullable(); // Which loyalty tiers qualify
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['is_active', 'start_date', 'end_date']);
            $table->index('type');
        });

        // Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->foreignId('promotion_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('usage_limit')->default(1);
            $table->integer('usage_count')->default(0);
            $table->timestamp('expires_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['code', 'is_active']);
            $table->index('expires_at');
        });

        // Returns and refunds
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number', 100)->unique();
            $table->foreignId('original_sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('reason', ['defective', 'wrong_item', 'customer_request', 'expired', 'damaged']);
            $table->enum('return_type', ['full_refund', 'partial_refund', 'exchange', 'credit_note']);
            $table->decimal('total_amount', 10, 2);
            $table->enum('refund_method', ['original_payment', 'cash', 'credit_note']);
            $table->enum('status', ['pending', 'approved', 'completed', 'rejected'])->default('pending');
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
            $table->index('original_sale_id');
        });

        // Return items
        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained()->onDelete('cascade');
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('condition_notes')->nullable();
            $table->boolean('restocked')->default(false);
            $table->timestamps();
            
            $table->index(['return_id', 'medicine_id']);
        });

        // POS terminals
        Schema::create('pos_terminals', function (Blueprint $table) {
            $table->id();
            $table->string('terminal_id', 50)->unique();
            $table->string('name');
            $table->string('location')->nullable();
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->string('ip_address', 45)->nullable();
            $table->json('printer_config')->nullable();
            $table->json('cash_drawer_config')->nullable();
            $table->json('scanner_config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync')->nullable();
            $table->timestamps();
            
            $table->index(['is_active', 'warehouse_id']);
        });

        // Offline transaction queue
        Schema::create('offline_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('terminal_id', 50);
            $table->json('transaction_data');
            $table->enum('transaction_type', ['sale', 'return', 'payment']);
            $table->enum('status', ['pending', 'synced', 'failed'])->default('pending');
            $table->integer('sync_attempts')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            
            $table->index(['terminal_id', 'status']);
            $table->index('created_at');
        });

        // Receipt templates
        Schema::create('receipt_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['customer', 'pharmacy', 'insurance']);
            $table->json('template_data');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->index(['type', 'is_default']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('receipt_templates');
        Schema::dropIfExists('offline_transactions');
        Schema::dropIfExists('pos_terminals');
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('customer_loyalty');
        Schema::dropIfExists('payment_transactions');
        
        // Remove columns from sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'transaction_id', 'pos_terminal_id', 'cashier_id',
                'loyalty_points_earned', 'loyalty_points_redeemed',
                'payment_methods', 'payment_status', 'subtotal',
                'discount_amount', 'tax_amount', 'total_cost',
                'profit_margin', 'receipt_number', 'receipt_printed',
                'sale_type', 'is_offline', 'synced_at'
            ]);
        });
    }
};