<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PharmacyApiController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SystemOverviewController;
use App\Http\Controllers\PharmacyRegistrationController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\StockMovementController;

/*
|--------------------------------------------------------------------------
| API Routes - MediTrack REST API
|--------------------------------------------------------------------------
| All routes return JSON responses
| Authentication: Sanctum token (Bearer token in Authorization header)
*/

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// Handle CORS preflight requests
Route::options('/auth/{any}', function () {
    return response('', 200);
})->where('any', '.*');

// Test endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::post('/register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'store']);
    Route::post('/forgot-password', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store']);
    Route::post('/reset-password', [App\Http\Controllers\Auth\NewPasswordController::class, 'store']);
});

// Public pharmacy registration
Route::prefix('pharmacies')->middleware('api.rate.limit')->group(function () {
    Route::post('/', [PharmacyApiController::class, 'createPharmacy']);
    Route::get('/{slug}', [PharmacyApiController::class, 'getPharmacy']);
    Route::post('/register', [PharmacyRegistrationController::class, 'register']);
});


// ─── PROTECTED ROUTES ────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth management
    Route::post('/auth/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/auth/me', function (Request $request) {
        $user = $request->user()->load('pharmacy');
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'pharmacy_id' => $user->pharmacy_id,
                'avatar' => $user->avatar,
                'pharmacy' => $user->pharmacy,
                'permissions' => $user->getPermissionsViaRoles()->pluck('name')->toArray(),
                'roles' => $user->getRoleNames()->toArray(),
            ],
        ]);
    });

    // ── Dashboard ──────────────────────────────────────────────────────────
    Route::prefix('dashboard')->name('api.dashboard.')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('/enhanced', [DashboardController::class, 'enhanced']);
    });

    // ── Medicines ──────────────────────────────────────────────────────────
    Route::prefix('medicines')->name('api.medicines.')->group(function () {
        Route::get('/', [MedicineController::class, 'index']);
        Route::get('/export', [MedicineController::class, 'export']);
        Route::get('/pricing-guidelines', [MedicineController::class, 'getPricingGuidelines']);
        Route::get('/pricing-report', [MedicineController::class, 'pricingReport']);
        Route::middleware('permission:manage_medicines')->group(function () {
            Route::post('/', [MedicineController::class, 'store']);
            Route::put('/{medicine}', [MedicineController::class, 'update']);
            Route::delete('/{medicine}', [MedicineController::class, 'destroy']);
            Route::post('/bulk-delete', [MedicineController::class, 'bulkDelete']);
            Route::post('/{medicine}/restore', [MedicineController::class, 'restore']);
            Route::post('/validate-pricing', [MedicineController::class, 'validatePricing']);
            Route::post('/update-pricing', [MedicineController::class, 'updatePricing']);
            Route::get('/{medicine}/history', [MedicineController::class, 'history']);
        });
    });

    // ── Customers ──────────────────────────────────────────────────────────
    Route::prefix('customers')->name('api.customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::middleware('permission:manage_customers')->group(function () {
            Route::post('/', [CustomerController::class, 'store']);
            Route::put('/{customer}', [CustomerController::class, 'update']);
            Route::delete('/{customer}', [CustomerController::class, 'destroy']);
            Route::post('/bulk-delete', [CustomerController::class, 'bulkDelete']);
            Route::post('/{customer}/restore', [CustomerController::class, 'restore']);
        });
    });

    // ── Suppliers ──────────────────────────────────────────────────────────
    Route::prefix('suppliers')->name('api.suppliers.')->middleware('permission:manage_suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);
        Route::post('/', [SupplierController::class, 'store']);
        Route::put('/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/{supplier}', [SupplierController::class, 'destroy']);
        Route::post('/bulk-delete', [SupplierController::class, 'bulkDelete']);
        Route::post('/{supplier}/restore', [SupplierController::class, 'restore']);
    });

    // ── Sales ──────────────────────────────────────────────────────────────
    Route::prefix('sales')->name('api.sales.')->middleware('permission:process_sales')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::post('/', [SaleController::class, 'store']);
        Route::get('/report', [SaleController::class, 'report']);
        Route::get('/{sale}', [SaleController::class, 'show']);
        Route::put('/{sale}', [SaleController::class, 'update']);
        Route::delete('/{sale}', [SaleController::class, 'destroy']);
        Route::post('/{sale}/refund', [SaleController::class, 'refund']);
    });

    // ── Purchases ──────────────────────────────────────────────────────────
    Route::prefix('purchases')->name('api.purchases.')->middleware('permission:manage_purchases')->group(function () {
        Route::get('/', [PurchaseController::class, 'index']);
        Route::post('/', [PurchaseController::class, 'store']);
        Route::get('/report', [PurchaseController::class, 'report']);
        Route::get('/statistics', [PurchaseController::class, 'statistics']);
        Route::get('/{purchase}', [PurchaseController::class, 'show']);
        Route::put('/{purchase}', [PurchaseController::class, 'update']);
        Route::delete('/{purchase}', [PurchaseController::class, 'destroy']);
        Route::get('/{purchase}/receive', [PurchaseController::class, 'receive']);
        Route::post('/{purchase}/receive', [PurchaseController::class, 'processReceive']);
        Route::post('/{purchase}/cancel', [PurchaseController::class, 'cancel']);
        Route::post('/{purchase}/mark-ordered', [PurchaseController::class, 'markAsOrdered']);
    });

    // ── Profile ────────────────────────────────────────────────────────────
    Route::prefix('profile')->name('api.profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::patch('/', [ProfileController::class, 'update']);
        Route::patch('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);
        Route::patch('/preferences', [ProfileController::class, 'updatePreferences']);
        Route::get('/preferences', [ProfileController::class, 'getPreferences']);
        Route::post('/theme', [ProfileController::class, 'setTheme']);
        Route::get('/export', [ProfileController::class, 'exportData']);
        Route::post('/reset-preferences', [ProfileController::class, 'resetPreferences']);
        Route::delete('/', [ProfileController::class, 'destroy']);
    });

    // ── Notifications ──────────────────────────────────────────────────────
    Route::prefix('notifications')->name('api.notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/statistics', [NotificationController::class, 'statistics']);
        Route::get('/preferences', [NotificationController::class, 'getPreferences']);
        Route::post('/preferences', [NotificationController::class, 'updatePreferences']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/cleanup', [NotificationController::class, 'cleanup']);
        Route::post('/test', [NotificationController::class, 'test']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/{id}/dismiss', [NotificationController::class, 'dismiss']);
    });

    // ── Settings ───────────────────────────────────────────────────────────
    Route::prefix('settings')->name('api.settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::put('/profile', [SettingsController::class, 'updateProfile']);
        Route::put('/pharmacy', [SettingsController::class, 'updatePharmacy']);
        Route::put('/notifications', [SettingsController::class, 'updateNotifications']);
        Route::put('/security', [SettingsController::class, 'updateSecurity']);
        Route::put('/system', [SettingsController::class, 'updateSystem']);
        Route::post('/password', [SettingsController::class, 'changePassword']);
        Route::get('/export', [SettingsController::class, 'exportSettings']);
        Route::post('/clear-cache', [SettingsController::class, 'clearCache']);
        Route::post('/optimize-database', [SettingsController::class, 'optimizeDatabase']);
    });

    // ── User Management ────────────────────────────────────────────────────
    Route::prefix('users')->name('api.users.')->middleware('permission:manage_users')->group(function () {
        Route::get('/', [UserManagementController::class, 'index']);
        Route::post('/', [UserManagementController::class, 'store']);
        Route::put('/{user}', [UserManagementController::class, 'update']);
        Route::delete('/{user}', [UserManagementController::class, 'destroy']);
        Route::post('/bulk-delete', [UserManagementController::class, 'bulkDelete']);
        Route::post('/{user}/restore', [UserManagementController::class, 'restore']);
        Route::post('/{user}/avatar', [UserManagementController::class, 'uploadAvatar']);
        Route::delete('/{user}/avatar', [UserManagementController::class, 'deleteAvatar']);
    });

    // ── Inventory ──────────────────────────────────────────────────────────
    Route::prefix('inventory')->name('api.inventory.')->middleware('permission:manage_medicines')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/stock-levels/{medicine}', [InventoryController::class, 'getStockLevels']);
        Route::post('/add-stock', [InventoryController::class, 'addStock']);
        Route::post('/remove-stock', [InventoryController::class, 'removeStock']);
        Route::post('/transfer-stock', [InventoryController::class, 'transferStock']);
        Route::get('/low-stock', [InventoryController::class, 'getLowStockItems']);
        Route::get('/expiring-batches', [InventoryController::class, 'getExpiringBatches']);
        Route::get('/movements', [InventoryController::class, 'getStockMovements']);
        Route::get('/summary', [InventoryController::class, 'getSummary']);
        Route::post('/batches', [InventoryController::class, 'createBatch']);
        Route::get('/batches/{batch}', [InventoryController::class, 'getBatch']);
        Route::post('/batches/{batch}/expire', [InventoryController::class, 'markBatchExpired']);
        Route::post('/batches/{batch}/recall', [InventoryController::class, 'recallBatch']);
        Route::post('/convert-units', [InventoryController::class, 'convertUnits']);
        Route::get('/units/{medicine}', [InventoryController::class, 'getAvailableUnits']);
    });

    // ── Stock Movements ────────────────────────────────────────────────────
    Route::prefix('stock-movements')->name('api.stock-movements.')->middleware('permission:manage_medicines')->group(function () {
        Route::get('/', [App\Http\Controllers\StockMovementController::class, 'index']);
        Route::post('/', [App\Http\Controllers\StockMovementController::class, 'store']);
        Route::put('/{stockMovement}', [App\Http\Controllers\StockMovementController::class, 'update']);
        Route::post('/adjustment', [App\Http\Controllers\StockMovementController::class, 'storeAdjustment']);
    });

    // ── POS ────────────────────────────────────────────────────────────────
    Route::prefix('pos')->name('api.pos.')->middleware('permission:process_sales')->group(function () {
        Route::get('/', [POSController::class, 'index']);
        Route::get('/search/medicines', [POSController::class, 'searchMedicines']);
        Route::get('/search/customers', [POSController::class, 'searchCustomers']);
        Route::post('/calculate-totals', [POSController::class, 'calculateTotals']);
        Route::post('/create-transaction', [POSController::class, 'createTransaction']);
        Route::post('/process-payment', [POSController::class, 'processPayment']);
        Route::post('/apply-coupon', [POSController::class, 'applyCoupon']);
        Route::get('/transaction/{transactionId}', [POSController::class, 'getTransaction']);
        Route::post('/transaction/{transactionId}/void', [POSController::class, 'voidTransaction']);
        Route::get('/daily-summary', [POSController::class, 'getDailySummary']);
        Route::get('/customer/{customerId}/loyalty', [POSController::class, 'getCustomerLoyalty']);
        Route::get('/promotions', [POSController::class, 'getPromotions']);
        Route::get('/receipt/{transactionId}', [POSController::class, 'printReceipt']);
    });

    // ── Analytics ──────────────────────────────────────────────────────────
    Route::prefix('analytics')->name('api.analytics.')->middleware('permission:view_reports')->group(function () {
        Route::get('/', [AnalyticsController::class, 'index']);
        Route::get('/sales-trends', [AnalyticsController::class, 'getSalesTrends']);
        Route::get('/best-selling', [AnalyticsController::class, 'getBestSellingMedicines']);
        Route::get('/expiring-medicines', [AnalyticsController::class, 'getExpiringMedicines']);
        Route::get('/stock-summary', [AnalyticsController::class, 'getStockSummary']);
        Route::get('/customer-analytics', [AnalyticsController::class, 'getCustomerAnalytics']);
        Route::get('/payment-methods', [AnalyticsController::class, 'getPaymentMethodAnalytics']);
        Route::get('/summary', [AnalyticsController::class, 'getDashboardSummary']);
    });

    // ── Reports ────────────────────────────────────────────────────────────
    Route::prefix('reports')->name('api.reports.')->middleware('permission:view_reports')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::get('/statistics', [ReportController::class, 'statistics']);
        Route::get('/dashboard', [ReportController::class, 'dashboardReport']);
        Route::get('/dashboard/export-pdf', [ReportController::class, 'exportDashboardPdf']);
        Route::get('/sales', [ReportController::class, 'salesReport']);
        Route::get('/sales/export-pdf', [ReportController::class, 'exportSalesPdf']);
        Route::get('/sales/export-excel', [ReportController::class, 'exportSalesExcel']);
        Route::get('/expiry', [ReportController::class, 'expiryReport']);
        Route::get('/expiry/export-pdf', [ReportController::class, 'exportExpiryPdf']);
        Route::get('/expiry/export-excel', [ReportController::class, 'exportExpiryExcel']);
        Route::get('/stock', [ReportController::class, 'stockReport']);
        Route::get('/stock/export-pdf', [ReportController::class, 'exportStockPdf']);
        Route::get('/stock/export-excel', [ReportController::class, 'exportStockExcel']);
    });

    // ── Search ─────────────────────────────────────────────────────────────
    Route::prefix('search')->name('api.search.')->group(function () {
        Route::get('/', [SearchController::class, 'index']);
        Route::post('/global', [SearchController::class, 'globalSearch']);
        Route::post('/medicines', [SearchController::class, 'searchMedicines']);
        Route::post('/customers', [SearchController::class, 'searchCustomers']);
        Route::post('/sales', [SearchController::class, 'searchSales']);
        Route::post('/suppliers', [SearchController::class, 'searchSuppliers']);
        Route::post('/purchases', [SearchController::class, 'searchPurchases']);
        Route::get('/suggestions', [SearchController::class, 'suggestions']);
        Route::get('/filter-options', [SearchController::class, 'filterOptions']);
        Route::get('/statistics', [SearchController::class, 'statistics']);
    });

    // ── Audit Logs ─────────────────────────────────────────────────────────
    Route::prefix('audit-logs')->name('api.audit.')->middleware('permission:view_audit_logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/export', [AuditLogController::class, 'export']);
        Route::get('/security', [AuditLogController::class, 'securityDashboard']);
        Route::get('/compliance', [AuditLogController::class, 'complianceDashboard']);
        Route::post('/{auditLog}/flag', [AuditLogController::class, 'flagForReview']);
    });

    // ── AI & Automation ────────────────────────────────────────────────────
    Route::prefix('ai')->name('api.ai.')->group(function () {
        Route::get('/health', [AIController::class, 'getServiceHealth']);
        Route::middleware('permission:view_reports')->group(function () {
            Route::get('/stock-predictions/{medicine}', [AIController::class, 'getStockPrediction']);
            Route::get('/reorder-recommendations', [AIController::class, 'getReorderRecommendations']);
            Route::get('/seasonal-trends/{medicine}', [AIController::class, 'getSeasonalTrends']);
            Route::post('/retrain-stock-model', [AIController::class, 'retrainStockModel']);
        });
        Route::middleware('permission:manage_medicines')->group(function () {
            Route::get('/expiry-alerts', [AIController::class, 'getExpiryAlerts']);
            Route::post('/expiry-alerts/{alert}/acknowledge', [AIController::class, 'acknowledgeExpiryAlert']);
        });
        Route::middleware('permission:view_audit_logs')->group(function () {
            Route::get('/anomalies', [AIController::class, 'getAnomalies']);
            Route::post('/anomalies/{anomaly}/review', [AIController::class, 'reviewAnomaly']);
            Route::get('/anomaly-dashboard', [AIController::class, 'getAnomalyDashboard']);
        });
    });

    Route::prefix('automation')->group(function () {
        Route::get('/data', [AutomationController::class, 'getAutomationData'])->name('automation.data');
        Route::get('/quick-insights', [AutomationController::class, 'getQuickInsights'])->name('automation.quick-insights');
        Route::get('/dashboard', [AutomationController::class, 'dashboard'])->name('automation.dashboard');
        Route::get('/reorder-suggestions', [AutomationController::class, 'reorderSuggestions'])->name('automation.reorder-suggestions');
        Route::post('/reorder/{medicine}/action', [AutomationController::class, 'markReorderActioned'])->name('automation.reorder.action');
        Route::post('/expiry/{medicine}/action', [AutomationController::class, 'markExpiryHandled'])->name('automation.expiry.action');
        Route::post('/generate-po/{medicine}', [AutomationController::class, 'generatePurchaseOrder'])->name('automation.generate-po');
    });

    // ── Payments & Subscriptions ───────────────────────────────────────────
    Route::prefix('payments')->name('api.payments.')->group(function () {
        Route::get('/subscription', [PaymentController::class, 'showSubscriptionManagement']);
        Route::get('/form', [PaymentController::class, 'showPaymentForm']);
        Route::post('/process', [PaymentController::class, 'processPayment']);
        Route::get('/callback/{gateway}', [PaymentController::class, 'handlePaymentCallback']);
    });

    // ── System Overview ────────────────────────────────────────────────────
    Route::prefix('system')->name('api.system.')->group(function () {
        Route::get('/overview', [SystemOverviewController::class, 'index']);
        Route::get('/stats', [SystemOverviewController::class, 'getStats']);
    });

    // ── Super Admin ────────────────────────────────────────────────────────
    Route::prefix('super-admin')->name('api.super-admin.')->middleware('superadmin')->group(function () {
        Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/pharmacies', [SuperAdminController::class, 'pharmacies']);
        Route::patch('/pharmacies/{slug}/status', [PharmacyApiController::class, 'updatePharmacyStatus']);
    });

});
