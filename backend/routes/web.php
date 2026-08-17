<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// Public pharmacy registration routes
Route::get('/register-pharmacy', [App\Http\Controllers\PharmacyRegistrationController::class, 'show'])
    ->name('pharmacy.register');
Route::post('/register-pharmacy', [App\Http\Controllers\PharmacyRegistrationController::class, 'register']);
Route::get('/pharmacy-registration-success', [App\Http\Controllers\PharmacyRegistrationController::class, 'success'])
    ->name('pharmacy.registration.success');

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

// CSRF token refresh endpoint
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
})->middleware('auth');

// Test route to verify dashboard is working
Route::get('/test-dashboard', function () {
    return response()->json([
        'message' => 'Dashboard route is working!',
        'user' => Auth::user() ? Auth::user()->email : 'Not logged in',
        'timestamp' => now()->toDateTimeString()
    ]);
})->middleware(['auth'])->name('test.dashboard');
Route::get('/dashboard/enhanced', [DashboardController::class, 'enhanced'])->middleware(['auth', 'verified'])->name('dashboard.enhanced');

Route::get('/system-overview', [App\Http\Controllers\SystemOverviewController::class, 'index'])->middleware(['auth', 'verified'])->name('system.overview');
// Moved to API section below

// Moved to API section below

Route::middleware('auth')->group(function () {
    // Medicines routes with proper permissions
    Route::get('/medicines', [MedicineController::class, 'index'])->name('medicines.index');
    Route::get('/medicines/export', [MedicineController::class, 'export'])->name('medicines.export');
    Route::middleware('permission:manage_medicines')->group(function () {
        Route::get('/medicines/create', [MedicineController::class, 'create'])->name('medicines.create');
        Route::post('/medicines', [MedicineController::class, 'store'])->name('medicines.store');
        Route::put('/medicines/{medicine}', [MedicineController::class, 'update'])->name('medicines.update');
        Route::delete('/medicines/{medicine}', [MedicineController::class, 'destroy'])->name('medicines.destroy');
        Route::post('/medicines/bulk-delete', [MedicineController::class, 'bulkDelete'])->name('medicines.bulk-delete');
        
        // Pricing management routes
        Route::post('/medicines/validate-pricing', [MedicineController::class, 'validatePricing'])->name('medicines.validate-pricing');
        Route::get('/medicines/pricing-guidelines', [MedicineController::class, 'getPricingGuidelines'])->name('medicines.pricing-guidelines');
        Route::post('/medicines/update-pricing', [MedicineController::class, 'updatePricing'])->name('medicines.update-pricing');
        Route::get('/medicines/pricing-report', [MedicineController::class, 'pricingReport'])->name('medicines.pricing-report');
    });
    
    // Customer routes with proper permissions
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::middleware('permission:manage_customers')->group(function () {
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    });
    
    // Supplier routes with proper permissions
    Route::middleware('permission:manage_suppliers')->group(function () {
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
    });
    
    // Sales routes with proper permissions
    Route::middleware('permission:process_sales')->group(function () {
        Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
        Route::get('/sales/create', [SaleController::class, 'create'])->name('sales.create');
        Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
        Route::put('/sales/{sale}', [SaleController::class, 'update'])->name('sales.update');
        Route::delete('/sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');
        Route::post('/sales/{sale}/refund', [SaleController::class, 'refund'])->name('sales.refund');
    });
    // Purchase Management routes with proper permissions
    Route::middleware('permission:manage_purchases')->group(function () {
        Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
        Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
        Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
        Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
        Route::get('/purchases/{purchase}/edit', [PurchaseController::class, 'edit'])->name('purchases.edit');
        Route::put('/purchases/{purchase}', [PurchaseController::class, 'update'])->name('purchases.update');
        Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');
        Route::get('/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive');
        Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'processReceive'])->name('purchases.process-receive');
        Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel');
        Route::post('/purchases/{purchase}/mark-ordered', [PurchaseController::class, 'markAsOrdered'])->name('purchases.mark-ordered');
        Route::get('/purchases-report', [PurchaseController::class, 'report'])->name('purchases.report');
        Route::get('/purchases-statistics', [PurchaseController::class, 'statistics'])->name('purchases.statistics');
    });
    // Enhanced Profile routes
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/update', [ProfileController::class, 'update'])->name('update');
        Route::patch('/password', [ProfileController::class, 'updatePassword'])->name('password.update');
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar'])->name('avatar.upload');
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar'])->name('avatar.delete');
        Route::patch('/preferences', [ProfileController::class, 'updatePreferences'])->name('preferences.update');
        Route::post('/theme', [ProfileController::class, 'setTheme'])->name('theme.set');
        Route::get('/preferences', [ProfileController::class, 'getPreferences'])->name('preferences.get');
        Route::get('/export', [ProfileController::class, 'exportData'])->name('export');
        Route::post('/reset-preferences', [ProfileController::class, 'resetPreferences'])->name('preferences.reset');
        Route::delete('/destroy', [ProfileController::class, 'destroy'])->name('destroy');
    });

    // Smart Automation routes are handled by routes/api.php under auth:sanctum.
    // Do NOT duplicate here — web.php uses session auth which conflicts with Bearer token auth.

    // Placeholder routes for new sidebar links
    Route::get('/reports', function () {
        return Inertia::render('Reports');
    })->middleware('permission:view_reports')->name('reports.index');

    // Stock Movements Routes
    Route::get('/stock-movements', [App\Http\Controllers\StockMovementController::class, 'index'])
        ->middleware('permission:manage_medicines')
        ->name('stock-movements.index');
    
    Route::post('/stock-movements', [App\Http\Controllers\InventoryController::class, 'storeStockMovement'])
        ->middleware('permission:manage_medicines')
        ->name('stock-movements.store');
    
    Route::put('/stock-movements/{stockMovement}', [App\Http\Controllers\InventoryController::class, 'updateStockMovement'])
        ->middleware('permission:manage_medicines')
        ->name('stock-movements.update');
    
    Route::post('/stock-movements/adjustment', [App\Http\Controllers\InventoryController::class, 'storeStockAdjustment'])
        ->middleware('permission:manage_medicines')
        ->name('stock-movements.adjustment');

    Route::get('/users', function () {
        return Inertia::render('Users');
    })->middleware('permission:manage_users')->name('users.index');

    Route::get('/settings', function () {
        return Inertia::render('Settings');
    })->middleware('permission:manage_settings')->name('settings.index');

    // Subscription and Payment routes
    Route::get('/subscription/management', [App\Http\Controllers\PaymentController::class, 'showSubscriptionManagement'])
        ->name('subscription.management');
    Route::get('/subscription/expired', [App\Http\Controllers\PaymentController::class, 'showExpired'])
        ->name('subscription.expired');
    Route::get('/payments/form', [App\Http\Controllers\PaymentController::class, 'showPaymentForm'])
        ->name('payments.form');
    Route::post('/payments/process', [App\Http\Controllers\PaymentController::class, 'processPayment'])
        ->name('payments.process');
    Route::get('/payments/callback/{gateway}', [App\Http\Controllers\PaymentController::class, 'handlePaymentCallback'])
        ->name('payments.callback');

    // User Management routes (Admin only)
    Route::middleware('permission:manage_users')->group(function () {
        Route::get('/user-management', [App\Http\Controllers\UserManagementController::class, 'index'])->name('users.management');
        Route::post('/user-management', [App\Http\Controllers\UserManagementController::class, 'store'])->name('users.store');
        Route::put('/user-management/{user}', [App\Http\Controllers\UserManagementController::class, 'update'])->name('users.update');
        Route::delete('/user-management/{user}', [App\Http\Controllers\UserManagementController::class, 'destroy'])->name('users.destroy');
        Route::post('/user-management/{user}/avatar', [App\Http\Controllers\UserManagementController::class, 'uploadAvatar'])->name('users.avatar.upload');
        Route::delete('/user-management/{user}/avatar', [App\Http\Controllers\UserManagementController::class, 'deleteAvatar'])->name('users.avatar.delete');
    });
    
    // Test route for debugging user management
    Route::get('/user-management-test', function () {
        $controller = new App\Http\Controllers\UserManagementController(
            new App\Services\PermissionService(),
            new App\Services\AuditTrailService()
        );
        return $controller->index();
    })->middleware(['auth'])->name('users.management.test');

    // Enhanced Audit Trail routes (Admin only)
    Route::middleware('permission:view_audit_logs')->group(function () {
        Route::get('/audit-logs', [App\Http\Controllers\AuditLogController::class, 'index'])->name('audit.index');
        Route::get('/audit-logs/export', [App\Http\Controllers\AuditLogController::class, 'export'])->name('audit.export');
        Route::post('/audit-logs/{auditLog}/flag', [App\Http\Controllers\AuditLogController::class, 'flagForReview'])->name('audit.flag');
        Route::get('/security/dashboard', [App\Http\Controllers\AuditLogController::class, 'securityDashboard'])->name('security.dashboard');
        Route::get('/compliance/dashboard', [App\Http\Controllers\AuditLogController::class, 'complianceDashboard'])->name('compliance.dashboard');
        
        // Legacy routes for backward compatibility
        Route::get('/audit-logs/security', [App\Http\Controllers\AuditController::class, 'security'])->name('audit.security');
    });

    // AI & Smart Assistance routes
    Route::prefix('ai')->name('ai.')->group(function () {
        // Stock Prediction routes
        Route::middleware('permission:view_reports')->group(function () {
            Route::get('/stock-predictions/{medicine}', [App\Http\Controllers\AIController::class, 'getStockPrediction'])->name('stock.prediction');
            Route::get('/reorder-recommendations', [App\Http\Controllers\AIController::class, 'getReorderRecommendations'])->name('reorder.recommendations');
            Route::get('/seasonal-trends/{medicine}', [App\Http\Controllers\AIController::class, 'getSeasonalTrends'])->name('seasonal.trends');
            Route::post('/retrain-stock-model', [App\Http\Controllers\AIController::class, 'retrainStockModel'])->name('retrain.stock');
        });

        // Expiry Prediction routes
        Route::middleware('permission:manage_medicines')->group(function () {
            Route::get('/expiry-alerts', [App\Http\Controllers\AIController::class, 'getExpiryAlerts'])->name('expiry.alerts');
            Route::post('/expiry-alerts/{alert}/acknowledge', [App\Http\Controllers\AIController::class, 'acknowledgeExpiryAlert'])->name('expiry.acknowledge');
        });

        // Anomaly Detection routes
        Route::middleware('permission:view_audit_logs')->group(function () {
            Route::get('/anomalies', [App\Http\Controllers\AIController::class, 'getAnomalies'])->name('anomalies.index');
            Route::post('/anomalies/{anomaly}/review', [App\Http\Controllers\AIController::class, 'reviewAnomaly'])->name('anomalies.review');
            Route::get('/anomaly-dashboard', [App\Http\Controllers\AIController::class, 'getAnomalyDashboard'])->name('anomalies.dashboard');
        });

        // AI Service Health
        Route::get('/health', [App\Http\Controllers\AIController::class, 'getServiceHealth'])->name('health');
    });



    // Medicine history route
    Route::get('/medicines/{medicine}/history', [MedicineController::class, 'history'])
        ->middleware('permission:manage_medicines,view_audit_logs')
        ->name('medicines.history');
    
    // Sales reporting routes
    Route::get('/sales/report', [SaleController::class, 'report'])->name('sales.report');
    Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');

    // Notification routes
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', function() {
            return Inertia::render('Notifications/Index');
        })->name('index');
        Route::post('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('mark.read');
        Route::post('/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('mark.all.read');
        Route::post('/{id}/dismiss', [App\Http\Controllers\NotificationController::class, 'dismiss'])->name('dismiss');
        Route::post('/cleanup', [App\Http\Controllers\NotificationController::class, 'cleanup'])->name('cleanup');
        Route::get('/cleanup', [App\Http\Controllers\NotificationController::class, 'cleanup'])->name('cleanup.get');
        Route::get('/preferences', function() {
            return Inertia::render('Notifications/Preferences');
        })->name('preferences');
        Route::post('/preferences', [App\Http\Controllers\NotificationController::class, 'updatePreferences'])->name('preferences.update');
        Route::post('/test', [App\Http\Controllers\NotificationController::class, 'test'])->name('test');
    });

    // Settings routes
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [App\Http\Controllers\SettingsController::class, 'index'])->name('index');
        Route::put('/profile', [App\Http\Controllers\SettingsController::class, 'updateProfile'])->name('profile');
        Route::put('/pharmacy', [App\Http\Controllers\SettingsController::class, 'updatePharmacy'])->name('pharmacy');
        Route::put('/notifications', [App\Http\Controllers\SettingsController::class, 'updateNotifications'])->name('notifications');
        Route::put('/security', [App\Http\Controllers\SettingsController::class, 'updateSecurity'])->name('security');
        Route::put('/system', [App\Http\Controllers\SettingsController::class, 'updateSystem'])->name('system');
        Route::post('/password', [App\Http\Controllers\SettingsController::class, 'changePassword'])->name('password');
        Route::get('/export', [App\Http\Controllers\SettingsController::class, 'exportSettings'])->name('export');
        Route::post('/clear-cache', [App\Http\Controllers\SettingsController::class, 'clearCache'])->name('clear-cache');
        Route::post('/optimize-database', [App\Http\Controllers\SettingsController::class, 'optimizeDatabase'])->name('optimize-database');
    });

    // Ziggy routes
    Route::get('/ziggy', fn () => response()->json(new \Tighten\Ziggy\Ziggy))->name('ziggy');

});

require __DIR__.'/auth.php';
require __DIR__.'/superadmin.php';

// NOTE: All /api/* routes are handled by routes/api.php with auth:sanctum.
// Do NOT duplicate them here — web.php uses session auth which breaks Bearer token authentication.



// Customer and Supplier create routes (for modal forms)
Route::middleware('auth')->group(function () {
    Route::get('customers/create', function () {
        return redirect()->route('customers.index');
    })->name('customers.create');
    
    Route::get('suppliers/create', function () {
        return redirect()->route('suppliers.index');
    })->middleware('permission:manage_suppliers')->name('suppliers.create');
});
    // Inventory Management Routes
    Route::get('/inventory', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory.dashboard')->middleware('permission:manage_medicines');
    Route::prefix('inventory')->name('inventory.')->middleware('permission:manage_medicines')->group(function () {
        // Stock Level Management
        Route::get('/stock-levels/{medicine}', [App\Http\Controllers\InventoryController::class, 'getStockLevels']);
        Route::post('/add-stock', [App\Http\Controllers\InventoryController::class, 'addStock']);
        Route::post('/remove-stock', [App\Http\Controllers\InventoryController::class, 'removeStock']);
        Route::post('/transfer-stock', [App\Http\Controllers\InventoryController::class, 'transferStock']);
        
        // Stock Monitoring
        Route::get('/low-stock', [App\Http\Controllers\InventoryController::class, 'getLowStockItems']);
        Route::get('/expiring-batches', [App\Http\Controllers\InventoryController::class, 'getExpiringBatches']);
        Route::get('/movements', [App\Http\Controllers\InventoryController::class, 'getStockMovements']);
        Route::get('/summary', [App\Http\Controllers\InventoryController::class, 'getSummary']);
        
        // Batch Management
        Route::post('/batches', [App\Http\Controllers\InventoryController::class, 'createBatch']);
        Route::get('/batches/{batch}', [App\Http\Controllers\InventoryController::class, 'getBatch']);
        Route::post('/batches/{batch}/expire', [App\Http\Controllers\InventoryController::class, 'markBatchExpired']);
        Route::post('/batches/{batch}/recall', [App\Http\Controllers\InventoryController::class, 'recallBatch']);
        
        // Unit Conversion
        Route::post('/convert-units', [App\Http\Controllers\InventoryController::class, 'convertUnits']);
        Route::get('/units/{medicine}', [App\Http\Controllers\InventoryController::class, 'getAvailableUnits']);
    });

    // POS System routes
    Route::prefix('pos')->name('pos.')->middleware('permission:process_sales')->group(function () {
        Route::get('/', [App\Http\Controllers\POSController::class, 'index'])->name('dashboard');
        Route::get('/search/medicines', [App\Http\Controllers\POSController::class, 'searchMedicines'])->name('search.medicines');
        Route::get('/search/customers', [App\Http\Controllers\POSController::class, 'searchCustomers'])->name('search.customers');
        Route::post('/calculate-totals', [App\Http\Controllers\POSController::class, 'calculateTotals'])->name('calculate.totals');
        Route::post('/create-transaction', [App\Http\Controllers\POSController::class, 'createTransaction'])->name('create.transaction');
        Route::post('/process-payment', [App\Http\Controllers\POSController::class, 'processPayment'])->name('process.payment');
        Route::post('/apply-coupon', [App\Http\Controllers\POSController::class, 'applyCoupon'])->name('apply.coupon');
        Route::get('/transaction/{transactionId}', [App\Http\Controllers\POSController::class, 'getTransaction'])->name('transaction.show');
        Route::post('/transaction/{transactionId}/void', [App\Http\Controllers\POSController::class, 'voidTransaction'])->name('transaction.void');
        Route::get('/daily-summary', [App\Http\Controllers\POSController::class, 'getDailySummary'])->name('daily.summary');
        Route::get('/customer/{customerId}/loyalty', [App\Http\Controllers\POSController::class, 'getCustomerLoyalty'])->name('customer.loyalty');
        Route::get('/promotions', [App\Http\Controllers\POSController::class, 'getPromotions'])->name('promotions');
        Route::get('/receipt/{transactionId}', [App\Http\Controllers\POSController::class, 'printReceipt'])->name('receipt.print');
    });

    // Analytics Dashboard routes
    Route::prefix('analytics')->name('analytics.')->middleware('permission:view_reports')->group(function () {
        Route::get('/', [App\Http\Controllers\AnalyticsController::class, 'index'])->name('dashboard');
        Route::get('/sales-trends', [App\Http\Controllers\AnalyticsController::class, 'getSalesTrends'])->name('sales.trends');
        Route::get('/best-selling', [App\Http\Controllers\AnalyticsController::class, 'getBestSellingMedicines'])->name('best.selling');
        Route::get('/expiring-medicines', [App\Http\Controllers\AnalyticsController::class, 'getExpiringMedicines'])->name('expiring.medicines');
        Route::get('/stock-summary', [App\Http\Controllers\AnalyticsController::class, 'getStockSummary'])->name('stock.summary');
        Route::get('/customer-analytics', [App\Http\Controllers\AnalyticsController::class, 'getCustomerAnalytics'])->name('customer.analytics');
        Route::get('/payment-methods', [App\Http\Controllers\AnalyticsController::class, 'getPaymentMethodAnalytics'])->name('payment.methods');
        Route::get('/summary', [App\Http\Controllers\AnalyticsController::class, 'getDashboardSummary'])->name('summary');
    });

    // Search page route
    Route::get('/search', [App\Http\Controllers\SearchController::class, 'index'])->name('search.index');

    // Reports routes
    Route::middleware('permission:view_reports')->group(function () {
        Route::get('/reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/statistics', [App\Http\Controllers\ReportController::class, 'statistics'])->name('reports.statistics');
        Route::get('/reports/dashboard', [App\Http\Controllers\ReportController::class, 'dashboardReport'])->name('reports.dashboard');
        Route::get('/reports/dashboard/export-pdf', [App\Http\Controllers\ReportController::class, 'exportDashboardPdf'])->name('reports.dashboard.export.pdf');
        
        // Sales Reports
        Route::prefix('reports/sales')->name('reports.sales.')->group(function () {
            Route::get('/', [App\Http\Controllers\ReportController::class, 'salesReport'])->name('data');
            Route::get('/export-pdf', [App\Http\Controllers\ReportController::class, 'exportSalesPdf'])->name('export.pdf');
            Route::get('/export-excel', [App\Http\Controllers\ReportController::class, 'exportSalesExcel'])->name('export.excel');
        });
        
        // Expiry Reports
        Route::prefix('reports/expiry')->name('reports.expiry.')->group(function () {
            Route::get('/', [App\Http\Controllers\ReportController::class, 'expiryReport'])->name('data');
            Route::get('/export-pdf', [App\Http\Controllers\ReportController::class, 'exportExpiryPdf'])->name('export.pdf');
            Route::get('/export-excel', [App\Http\Controllers\ReportController::class, 'exportExpiryExcel'])->name('export.excel');
        });
        
        // Stock Reports
        Route::prefix('reports/stock')->name('reports.stock.')->group(function () {
            Route::get('/', [App\Http\Controllers\ReportController::class, 'stockReport'])->name('data');
            Route::get('/export-pdf', [App\Http\Controllers\ReportController::class, 'exportStockPdf'])->name('export.pdf');
            Route::get('/export-excel', [App\Http\Controllers\ReportController::class, 'exportStockExcel'])->name('export.excel');
        });
    });

    // System Overview
    Route::get('/system-overview', function () {
        return Inertia::render('SystemOverview');
    })->middleware('permission:manage_settings')->name('system.overview');