<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PharmacyApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public pharmacy registration API (with rate limiting)
Route::middleware('api.rate.limit')->group(function () {
    Route::post('/pharmacies', [PharmacyApiController::class, 'createPharmacy']);
    Route::get('/pharmacies/{slug}', [PharmacyApiController::class, 'getPharmacy']);
});

// Protected pharmacy management API (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::patch('/pharmacies/{slug}/status', [PharmacyApiController::class, 'updatePharmacyStatus']);
});
