<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use App\Models\Medicine;
use App\Models\StockLevel;
use App\Events\LowStockDetected;
use App\Events\MedicineExpiring;
use Illuminate\Support\Facades\Log;

class CheckNotificationAlerts extends Command
{
    protected $signature = 'notifications:check-alerts';
    protected $description = 'Check for low stock and expiring medicines and send notifications';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('🔔 Checking for notification alerts...');
        
        $lowStockAlerts = $this->checkLowStockAlerts();
        $expiryAlerts = $this->checkExpiryAlerts();
        
        $this->info("✅ Alert check completed:");
        $this->line("   📦 Low stock alerts: {$lowStockAlerts}");
        $this->line("   ⏰ Expiry alerts: {$expiryAlerts}");
        
        if ($lowStockAlerts > 0 || $expiryAlerts > 0) {
            $this->warn("⚠️  {$lowStockAlerts} low stock and {$expiryAlerts} expiry alerts created");
        } else {
            $this->info("✅ No new alerts needed");
        }
        
        return 0;
    }

    protected function checkLowStockAlerts()
    {
        $this->info('📦 Checking low stock levels...');
        
        $lowStockItems = StockLevel::with('medicine')
            ->whereRaw('quantity <= 50') // Default reorder level
            ->get();

        $alertsCreated = 0;

        foreach ($lowStockItems as $stockLevel) {
            if (!$stockLevel->medicine) continue;

            // Check if alert already exists for this medicine in the last 24 hours
            $existingAlert = \App\Models\Notification::where('type', 'low_stock')
                ->where('data->medicine_id', $stockLevel->medicine_id)
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$existingAlert) {
                // Fire event for real-time notifications
                event(new LowStockDetected($stockLevel->medicine, $stockLevel->quantity, 50));
                
                $this->line("   ⚠️  Low stock alert: {$stockLevel->medicine->name} ({$stockLevel->quantity} units)");
                $alertsCreated++;
            }
        }

        return $alertsCreated;
    }

    protected function checkExpiryAlerts()
    {
        $this->info('⏰ Checking expiring medicines...');
        
        $expiringMedicines = Medicine::where('expiry_date', '<=', now()->addDays(30))
            ->where('expiry_date', '>', now())
            ->get();

        $alertsCreated = 0;

        foreach ($expiringMedicines as $medicine) {
            $daysToExpiry = now()->diffInDays($medicine->expiry_date);
            
            // Check if alert already exists for this medicine in the last 24 hours
            $existingAlert = \App\Models\Notification::where('type', 'expiry_alert')
                ->where('data->medicine_id', $medicine->id)
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$existingAlert) {
                // Fire event for real-time notifications
                event(new MedicineExpiring($medicine, $daysToExpiry));
                
                $urgency = $daysToExpiry <= 7 ? 'CRITICAL' : ($daysToExpiry <= 30 ? 'HIGH' : 'MEDIUM');
                $this->line("   ⚠️  Expiry alert ({$urgency}): {$medicine->name} ({$daysToExpiry} days)");
                $alertsCreated++;
            }
        }

        return $alertsCreated;
    }
}