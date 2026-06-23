<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Only create tables that don't exist yet
        
        // Reorder rules table
        if (!Schema::hasTable('reorder_rules')) {
            Schema::create('reorder_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
                $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
                $table->integer('min_stock');
                $table->integer('max_stock');
                $table->integer('reorder_point');
                $table->integer('reorder_quantity');
                $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
                $table->integer('lead_time_days')->default(7);
                $table->boolean('is_active')->default(true);
                $table->json('seasonal_adjustments')->nullable(); // monthly multipliers
                $table->timestamps();
                
                $table->unique(['medicine_id', 'warehouse_id']);
                $table->index(['is_active', 'reorder_point']);
            });
        }

        // Stock audits table
        if (!Schema::hasTable('stock_audits')) {
            Schema::create('stock_audits', function (Blueprint $table) {
                $table->id();
                $table->string('audit_number')->unique();
                $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
                $table->date('audit_date');
                $table->enum('status', ['planned', 'in_progress', 'completed', 'cancelled'])->default('planned');
                $table->foreignId('auditor_id')->constrained('users')->onDelete('cascade');
                $table->integer('total_items')->default(0);
                $table->integer('discrepancies')->default(0);
                $table->decimal('variance_value', 12, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                
                $table->index(['warehouse_id', 'audit_date']);
                $table->index(['status', 'auditor_id']);
            });
        }

        // Stock audit items table
        if (!Schema::hasTable('stock_audit_items')) {
            Schema::create('stock_audit_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('audit_id')->constrained('stock_audits')->onDelete('cascade');
                $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
                $table->foreignId('batch_id')->nullable()->constrained()->onDelete('cascade');
                $table->integer('expected_quantity');
                $table->integer('actual_quantity')->nullable();
                $table->integer('variance')->default(0);
                $table->string('unit_type', 50)->default('tablet');
                $table->text('notes')->nullable();
                $table->string('photo_path')->nullable();
                $table->boolean('verified')->default(false);
                $table->timestamps();
                
                $table->index(['audit_id', 'medicine_id']);
                $table->index('variance');
            });
        }

        // Barcodes table for mapping codes to products
        if (!Schema::hasTable('barcodes')) {
            Schema::create('barcodes', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->enum('type', ['ean13', 'ean8', 'upc', 'code128', 'qr', 'custom']);
                $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
                $table->foreignId('batch_id')->nullable()->constrained()->onDelete('cascade');
                $table->string('unit_type', 50)->default('tablet');
                $table->integer('quantity_per_scan')->default(1);
                $table->boolean('is_active')->default(true);
                $table->json('metadata')->nullable(); // additional barcode info
                $table->timestamps();
                
                $table->index(['code', 'is_active']);
                $table->index(['medicine_id', 'type']);
            });
        }

        // Add missing columns to existing tables
        
        // Enhance medicines table if columns don't exist
        Schema::table('medicines', function (Blueprint $table) {
            if (!Schema::hasColumn('medicines', 'markup_percentage')) {
                $table->decimal('markup_percentage', 5, 2)->default(20.00)->after('cost_price');
            }
            if (!Schema::hasColumn('medicines', 'base_unit')) {
                $table->string('base_unit')->default('tablet')->after('category');
            }
            if (!Schema::hasColumn('medicines', 'unit_conversions')) {
                $table->json('unit_conversions')->nullable()->after('base_unit');
            }
            if (!Schema::hasColumn('medicines', 'reorder_point')) {
                $table->integer('reorder_point')->default(0)->after('stock');
            }
            if (!Schema::hasColumn('medicines', 'reorder_quantity')) {
                $table->integer('reorder_quantity')->default(0)->after('reorder_point');
            }
            if (!Schema::hasColumn('medicines', 'safety_stock')) {
                $table->integer('safety_stock')->default(0)->after('reorder_quantity');
            }
            if (!Schema::hasColumn('medicines', 'lead_time_days')) {
                $table->integer('lead_time_days')->default(0)->after('safety_stock');
            }
            if (!Schema::hasColumn('medicines', 'track_batches')) {
                $table->boolean('track_batches')->default(false)->after('lead_time_days');
            }
            if (!Schema::hasColumn('medicines', 'require_expiry')) {
                $table->boolean('require_expiry')->default(false)->after('track_batches');
            }
            if (!Schema::hasColumn('medicines', 'barcode')) {
                $table->string('barcode')->nullable()->unique()->after('require_expiry');
            }
        });

        // Enhance batches table if needed
        if (Schema::hasTable('batches')) {
            Schema::table('batches', function (Blueprint $table) {
                if (!Schema::hasColumn('batches', 'quantity_remaining')) {
                    $table->integer('quantity_remaining')->after('quantity_received');
                }
                if (!Schema::hasColumn('batches', 'status')) {
                    $table->enum('status', ['active', 'expired', 'recalled', 'depleted'])->default('active')->after('quantity_remaining');
                }
                if (!Schema::hasColumn('batches', 'notes')) {
                    $table->text('notes')->nullable()->after('status');
                }
            });
        }

        // Enhance stock_levels table if needed
        if (Schema::hasTable('stock_levels')) {
            Schema::table('stock_levels', function (Blueprint $table) {
                if (!Schema::hasColumn('stock_levels', 'reserved_quantity')) {
                    $table->integer('reserved_quantity')->default(0)->after('quantity');
                }
                if (!Schema::hasColumn('stock_levels', 'unit_type')) {
                    $table->string('unit_type', 50)->default('tablet')->after('reserved_quantity');
                }
                if (!Schema::hasColumn('stock_levels', 'last_updated')) {
                    $table->timestamp('last_updated')->useCurrent()->after('unit_type');
                }
                if (!Schema::hasColumn('stock_levels', 'audit_status')) {
                    $table->enum('audit_status', ['pending', 'verified', 'discrepancy'])->default('pending')->after('last_updated');
                }
            });
        }

        // Enhance purchase_orders table if needed
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_orders', 'order_number')) {
                    $table->string('order_number')->unique()->after('id');
                }
                if (!Schema::hasColumn('purchase_orders', 'status')) {
                    $table->enum('status', ['draft', 'pending', 'approved', 'sent', 'partial', 'received', 'cancelled'])->default('draft')->after('warehouse_id');
                }
                if (!Schema::hasColumn('purchase_orders', 'order_date')) {
                    $table->date('order_date')->after('status');
                }
                if (!Schema::hasColumn('purchase_orders', 'expected_date')) {
                    $table->date('expected_date')->nullable()->after('order_date');
                }
                if (!Schema::hasColumn('purchase_orders', 'received_date')) {
                    $table->date('received_date')->nullable()->after('expected_date');
                }
                if (!Schema::hasColumn('purchase_orders', 'approved_by')) {
                    $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->after('created_by');
                }
                if (!Schema::hasColumn('purchase_orders', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable()->after('approved_by');
                }
                if (!Schema::hasColumn('purchase_orders', 'notes')) {
                    $table->text('notes')->nullable()->after('approved_at');
                }
            });
        }

        // Enhance purchase_order_items table if needed
        if (Schema::hasTable('purchase_order_items')) {
            Schema::table('purchase_order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_order_items', 'unit_type')) {
                    $table->string('unit_type', 50)->default('tablet')->after('quantity');
                }
                if (!Schema::hasColumn('purchase_order_items', 'received_quantity')) {
                    $table->integer('received_quantity')->default(0)->after('total_price');
                }
                if (!Schema::hasColumn('purchase_order_items', 'notes')) {
                    $table->text('notes')->nullable()->after('batch_id');
                }
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('barcodes');
        Schema::dropIfExists('stock_audit_items');
        Schema::dropIfExists('stock_audits');
        Schema::dropIfExists('reorder_rules');
        
        // Remove added columns from existing tables
        if (Schema::hasTable('medicines')) {
            Schema::table('medicines', function (Blueprint $table) {
                if (Schema::hasColumn('medicines', 'markup_percentage')) {
                    $table->dropColumn('markup_percentage');
                }
            });
        }
    }
};