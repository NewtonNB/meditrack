<?php

use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/pharmacies', [SuperAdminController::class, 'pharmacies'])->name('pharmacies');
    Route::patch('/pharmacies/{pharmacy}/status', [SuperAdminController::class, 'updatePharmacyStatus'])->name('pharmacies.status');
    Route::patch('/pharmacies/{pharmacy}/plan', [SuperAdminController::class, 'updatePharmacyPlan'])->name('pharmacies.plan');
    Route::get('/payments', [SuperAdminController::class, 'payments'])->name('payments');
    Route::get('/analytics', [SuperAdminController::class, 'analytics'])->name('analytics');
    Route::get('/settings', [SuperAdminController::class, 'settings'])->name('settings');
    Route::post('/subscription-plans', [SuperAdminController::class, 'createSubscriptionPlan'])->name('subscription-plans.create');
    Route::patch('/subscription-plans/{plan}', [SuperAdminController::class, 'updateSubscriptionPlan'])->name('subscription-plans.update');
});
