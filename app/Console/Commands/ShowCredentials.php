<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ShowCredentials extends Command
{
    protected $signature = 'show:credentials';
    protected $description = 'Show all system credentials and access information';

    public function handle()
    {
        $this->info('🔐 MediTrack System Credentials & Access Information');
        $this->line('═══════════════════════════════════════════════════════════');
        
        // Application Information
        $this->info('📱 Application Details:');
        $this->line('  • App Name: ' . config('app.name'));
        $this->line('  • App URL: ' . config('app.url'));
        $this->line('  • Environment: ' . config('app.env'));
        $this->line('  • Debug Mode: ' . (config('app.debug') ? 'Enabled' : 'Disabled'));
        $this->line('');
        
        // Database Information
        $this->info('🗄️ Database Configuration:');
        $this->line('  • Connection: ' . config('database.default'));
        if (config('database.default') === 'sqlite') {
            $dbPath = database_path('database.sqlite');
            $this->line('  • Database File: ' . $dbPath);
            $this->line('  • File Exists: ' . (file_exists($dbPath) ? 'Yes' : 'No'));
            if (file_exists($dbPath)) {
                $this->line('  • File Size: ' . round(filesize($dbPath) / 1024, 2) . ' KB');
            }
        } else {
            $this->line('  • Host: ' . config('database.connections.' . config('database.default') . '.host'));
            $this->line('  • Database: ' . config('database.connections.' . config('database.default') . '.database'));
            $this->line('  • Username: ' . config('database.connections.' . config('database.default') . '.username'));
        }
        $this->line('');
        
        // User Accounts
        $this->info('👥 User Accounts:');
        try {
            $users = User::all(['id', 'name', 'email', 'created_at']);
            if ($users->count() > 0) {
                $this->table(
                    ['ID', 'Name', 'Email', 'Created'],
                    $users->map(function ($user) {
                        return [
                            $user->id,
                            $user->name,
                            $user->email,
                            $user->created_at->format('Y-m-d H:i:s')
                        ];
                    })->toArray()
                );
            } else {
                $this->warn('  • No users found in database');
                $this->line('  • Run: php artisan make:user to create a user');
            }
        } catch (\Exception $e) {
            $this->error('  • Error accessing users: ' . $e->getMessage());
        }
        $this->line('');
        
        // System Statistics
        $this->info('📊 System Statistics:');
        try {
            $stats = [
                'Users' => User::count(),
                'Medicines' => DB::table('medicines')->count(),
                'Customers' => DB::table('customers')->count(),
                'Suppliers' => DB::table('suppliers')->count(),
                'Sales' => DB::table('sales')->count(),
            ];
            
            foreach ($stats as $label => $count) {
                $this->line('  • ' . $label . ': ' . $count);
            }
        } catch (\Exception $e) {
            $this->error('  • Error accessing statistics: ' . $e->getMessage());
        }
        $this->line('');
        
        // Access URLs
        $this->info('🌐 Access URLs:');
        $baseUrl = config('app.url');
        $urls = [
            'Main Application' => $baseUrl,
            'Login Page' => $baseUrl . '/login',
            'Register Page' => $baseUrl . '/register',
            'Dashboard' => $baseUrl . '/dashboard',
            'Enhanced Analytics' => $baseUrl . '/dashboard/enhanced',
            'System Overview' => $baseUrl . '/system-overview',
            'Medicines' => $baseUrl . '/medicines',
            'Customers' => $baseUrl . '/customers',
            'Suppliers' => $baseUrl . '/suppliers',
            'Sales' => $baseUrl . '/sales',
        ];
        
        foreach ($urls as $label => $url) {
            $this->line('  • ' . $label . ': ' . $url);
        }
        $this->line('');
        
        // Development Information
        $this->info('🛠️ Development Information:');
        $this->line('  • PHP Version: ' . PHP_VERSION);
        $this->line('  • Laravel Version: ' . app()->version());
        $this->line('  • Node.js Required: Yes (for Vite)');
        $this->line('  • Database Migrations: Run "php artisan migrate:status" to check');
        $this->line('');
        
        // Quick Start Commands
        $this->info('🚀 Quick Start Commands:');
        $this->line('  • Start Development Server: php artisan serve');
        $this->line('  • Run Migrations: php artisan migrate');
        $this->line('  • Seed Database: php artisan db:seed');
        $this->line('  • Build Assets: npm run build');
        $this->line('  • Watch Assets: npm run dev');
        $this->line('  • Create User: php artisan make:user');
        $this->line('  • Test Dashboard: php artisan test:dashboard');
        $this->line('  • Test System Overview: php artisan test:system-overview');
        $this->line('');
        
        // Security Notes
        $this->warn('🔒 Security Notes:');
        $this->line('  • Change APP_KEY if deploying to production');
        $this->line('  • Set APP_DEBUG=false in production');
        $this->line('  • Configure proper database credentials for production');
        $this->line('  • Set up proper mail configuration for notifications');
        $this->line('');
        
        $this->info('✅ System is ready to use!');
        
        return 0;
    }
}