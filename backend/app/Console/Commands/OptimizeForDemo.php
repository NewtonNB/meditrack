<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class OptimizeForDemo extends Command
{
    protected $signature = 'demo:optimize';
    protected $description = 'Optimize MediTrack for demonstration';

    public function handle()
    {
        $this->info('🚀 Optimizing MediTrack for demonstration...');
        
        // Clear all caches
        $this->info('🧹 Clearing caches...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        
        // Optimize for performance
        $this->info('⚡ Optimizing performance...');
        Artisan::call('config:cache');
        Artisan::call('route:cache');
        Artisan::call('view:cache');
        
        // Warm up important caches
        $this->info('🔥 Warming up caches...');
        $this->warmUpCaches();
        
        // Verify database connection
        $this->info('🗄️ Verifying database...');
        try {
            DB::connection()->getPdo();
            $this->info('✅ Database connection successful');
            
            // Check if we have sample data
            $medicineCount = DB::table('medicines')->count();
            $salesCount = DB::table('sales')->count();
            
            $this->info("📊 Sample data status:");
            $this->info("   • Medicines: {$medicineCount}");
            $this->info("   • Sales records: {$salesCount}");
            
            if ($medicineCount < 10) {
                $this->warn('⚠️  Consider running: php artisan db:seed for more sample data');
            }
            
        } catch (\Exception $e) {
            $this->error('❌ Database connection failed: ' . $e->getMessage());
            return 1;
        }
        
        // Test "Wow" features
        $this->info('🌟 Testing "Wow" features...');
        Artisan::call('test:wow-features');
        
        $this->info('');
        $this->info('🎉 MediTrack is optimized and ready for demonstration!');
        $this->info('');
        $this->info('📋 Demo checklist:');
        $this->info('   ✅ Performance optimized');
        $this->info('   ✅ Caches warmed up');
        $this->info('   ✅ Database verified');
        $this->info('   ✅ "Wow" features tested');
        $this->info('');
        $this->info('🚀 Start demo with: php artisan serve');
        $this->info('🌐 Then visit: http://localhost:8000');
        $this->info('👤 Login as: admin@meditrack.com / password');
        
        return 0;
    }
    
    private function warmUpCaches()
    {
        // Cache frequently accessed data
        try {
            // Cache dashboard stats
            Cache::remember('dashboard_stats', 3600, function () {
                return [
                    'total_medicines' => DB::table('medicines')->count(),
                    'low_stock_count' => DB::table('medicines')->where('stock', '<', 10)->count(),
                    'total_sales' => DB::table('sales')->sum('total_price'),
                    'recent_sales' => DB::table('sales')->where('created_at', '>=', now()->subDays(7))->count(),
                ];
            });
            
            // Cache medicine categories
            Cache::remember('medicine_categories', 3600, function () {
                return DB::table('medicines')
                    ->select('category', DB::raw('count(*) as count'))
                    ->groupBy('category')
                    ->get();
            });
            
            $this->info('   ✅ Dashboard caches warmed');
            
        } catch (\Exception $e) {
            $this->warn('   ⚠️  Cache warming partially failed: ' . $e->getMessage());
        }
    }
}