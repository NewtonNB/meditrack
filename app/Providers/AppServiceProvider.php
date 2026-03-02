<?php


namespace App\Providers;


use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Tighten\Ziggy\Ziggy;
use Inertia\Inertia;
use Illuminate\Support\Facades\Event;
use App\Listeners\AuthEventListener;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register POS Services
        $this->app->singleton(\App\Services\POS\POSService::class);
        $this->app->singleton(\App\Services\POS\PaymentService::class);
        $this->app->singleton(\App\Services\POS\LoyaltyService::class);
        $this->app->singleton(\App\Services\POS\PromotionService::class);
        
        // Register Analytics Service
        $this->app->singleton(\App\Services\AnalyticsService::class);
        
        // Register Purchase Service
        $this->app->singleton(\App\Services\PurchaseService::class);
        
        // Register Notification Service
        $this->app->singleton(\App\Services\NotificationService::class);
        
        // Register Search Service
        $this->app->singleton(\App\Services\SearchService::class);
        
        // Register Report Service
        $this->app->singleton(\App\Services\ReportService::class);
        
        // Register User Preferences Service
        $this->app->singleton(\App\Services\UserPreferencesService::class);
        
        // Register Automation Service
        $this->app->singleton(\App\Services\AutomationService::class);
        
        // Register Sales Prediction Service
        $this->app->singleton(\App\Services\SalesPredictionService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production') || env('FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        Inertia::share([
            'auth' => [
                'user' => fn () => auth()->user() ? [
                    'id' => auth()->user()->id,
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'role' => auth()->user()->role,
                    'pharmacy_id' => auth()->user()->pharmacy_id,
                ] : null,
                'permissions' => fn () => auth()->user() 
                    ? auth()->user()->getPermissionsViaRoles()->pluck('name')->toArray()
                    : [],
                'debug_permissions' => fn () => auth()->user() 
                    ? [
                        'user_id' => auth()->user()->id,
                        'user_role' => auth()->user()->role,
                        'roles_count' => auth()->user()->roles()->count(),
                        'permissions_count' => auth()->user()->getPermissionsViaRoles()->count(),
                        'permissions' => auth()->user()->getPermissionsViaRoles()->pluck('name')->toArray()
                    ]
                    : null,
            ],
            'ziggy' => fn () => array_merge(
                (new Ziggy)->toArray(),
                [
                    'location' => url()->current(),
                ]
            ),
        ]);

        // Register authentication event listeners
        Event::subscribe(AuthEventListener::class);
    }
}
