<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        // Create a separate API middleware group without Inertia
        $middleware->group('api-json', [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->alias([
            'superadmin' => \App\Http\Middleware\SuperAdminMiddleware::class,
            'pharmacy.context' => \App\Http\Middleware\SetPharmacyContext::class,
            'subscription.check' => \App\Http\Middleware\CheckSubscriptionExpiry::class,
            'security.headers' => \App\Http\Middleware\SecurityHeaders::class,
            'api.rate.limit' => \App\Http\Middleware\ApiRateLimit::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
            'audit.trail' => \App\Http\Middleware\AuditTrailMiddleware::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\SetPharmacyContext::class,
            \App\Http\Middleware\CheckSubscriptionExpiry::class,
            \App\Http\Middleware\AuditTrailMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
