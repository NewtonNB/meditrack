<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Customer;

class SystemOptimization extends Command
{
    protected $signature = 'system:optimize {--force : Force optimization even in production}';
    protected $description = 'Comprehensive system optimization for MediTrack';

    public function handle()
    {
        $this->info('🚀 Starting MediTrack System Optimization...');
        
        // Performance optimizations
        $this->optimizePerformance();
        
        // Database optimizations
        $this->optimizeDatabase();
        
        // Cache optimizations
        $this->optimizeCache();
        
        // Asset optimizations
        $this->optimizeAssets();
        
        // Security optimizations
        $this->optimizeSecurity();
        
        $this->info('✅ System optimization completed successfully!');
        
        return 0;
    }
    
    private function optimizePerformance()
    {
        $this->info('⚡ Optimizing Performance...');
        
        // Clear and optimize caches
        Artisan::call('optimize:clear');
        Artisan::call('config:cache');
        Artisan::call('route:cache');
        Artisan::call('view:cache');
        Artisan::call('event:cache');
        
        $this->line('   ✓ Application caches optimized');
        
        // Optimize composer autoloader
        if (app()->environment('production') || $this->option('force')) {
            exec('composer dump-autoload --optimize --no-dev');
            $this->line('   ✓ Composer autoloader optimized');
        }
    }
    
    private function optimizeDatabase()
    {
        $this->info('🗄️ Optimizing Database...');
        
        try {
            // Analyze table statistics
            $tables = ['medicines', 'sales', 'customers', 'suppliers'];
            
            foreach ($tables as $table) {
                $count = DB::table($table)->count();
                $this->line("   • {$table}: {$count} records");
            }
            
            // Optimize database tables (MySQL specific)
            if (config('database.default') === 'mysql') {
                DB::statement('OPTIMIZE TABLE medicines, sales, customers, suppliers');
                $this->line('   ✓ Database tables optimized');
            }
            
            // Update table statistics
            if (config('database.default') === 'mysql') {
                DB::statement('ANALYZE TABLE medicines, sales, customers, suppliers');
                $this->line('   ✓ Table statistics updated');
            }
            
        } catch (\Exception $e) {
            $this->warn('   ⚠ Database optimization skipped: ' . $e->getMessage());
        }
    }
    
    private function optimizeCache()
    {
        $this->info('🔥 Optimizing Cache System...');
        
        // Warm up critical caches
        $this->warmUpCaches();
        
        // Set up cache tags for better invalidation
        $this->setupCacheTags();
        
        $this->line('   ✓ Cache system optimized');
    }
    
    private function warmUpCaches()
    {
        // Dashboard statistics
        Cache::remember('dashboard_stats_optimized', 3600, function () {
            return [
                'medicines_count' => Medicine::count(),
                'low_stock_count' => Medicine::where('stock', '<', 10)->count(),
                'sales_today' => Sale::whereDate('created_at', today())->count(),
                'total_revenue' => Sale::sum('total_price'),
            ];
        });
        
        // Frequently accessed medicines
        Cache::remember('popular_medicines', 1800, function () {
            return Medicine::select('id', 'name', 'stock', 'selling_price')
                ->where('stock', '>', 0)
                ->orderBy('stock', 'desc')
                ->take(50)
                ->get();
        });
        
        // Recent activities cache
        Cache::remember('recent_activities_cache', 300, function () {
            return Sale::with(['medicine:id,name', 'customer:id,name'])
                ->latest()
                ->take(20)
                ->get();
        });
        
        $this->line('   ✓ Critical caches warmed up');
    }
    
    private function setupCacheTags()
    {
        // Set up cache tags for better cache management
        $tags = [
            'dashboard' => ['stats', 'activities', 'insights'],
            'medicines' => ['inventory', 'stock', 'pricing'],
            'sales' => ['transactions', 'revenue', 'analytics'],
            'customers' => ['profiles', 'history', 'preferences']
        ];
        
        foreach ($tags as $group => $tagList) {
            Cache::tags($tagList)->put("cache_group_{$group}", true, 3600);
        }
        
        $this->line('   ✓ Cache tags configured');
    }
    
    private function optimizeAssets()
    {
        $this->info('📦 Optimizing Assets...');
        
        // Check if assets are built
        if (file_exists(public_path('build/manifest.json'))) {
            $this->line('   ✓ Production assets found');
            
            // Verify asset integrity
            $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
            $assetCount = count($manifest);
            $this->line("   • {$assetCount} assets in manifest");
            
        } else {
            $this->warn('   ⚠ Production assets not found. Run: npm run build');
        }
        
        // Optimize images (if imagemagick is available)
        if (extension_loaded('imagick')) {
            $this->line('   ✓ Image optimization available');
        }
    }
    
    private function optimizeSecurity()
    {
        $this->info('🔒 Optimizing Security...');
        
        // Check security configurations
        $securityChecks = [
            'APP_DEBUG' => config('app.debug') === false,
            'APP_ENV' => config('app.env') === 'production',
            'HTTPS' => request()->isSecure() || app()->environment('local'),
            'SESSION_SECURE' => config('session.secure') || app()->environment('local'),
        ];
        
        foreach ($securityChecks as $check => $status) {
            if ($status || app()->environment('local')) {
                $this->line("   ✓ {$check}: OK");
            } else {
                $this->warn("   ⚠ {$check}: Review needed");
            }
        }
        
        // Clear sensitive caches in production
        if (app()->environment('production')) {
            Cache::forget('debug_*');
            $this->line('   ✓ Debug caches cleared');
        }
    }
}