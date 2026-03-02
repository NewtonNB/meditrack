<?php

namespace App\Services;

use App\Models\User;
use App\Models\Medicine;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    /**
     * Send low stock alert notifications
     */
    public function sendLowStockAlert(Medicine $medicine, array $recipients = []): bool
    {
        try {
            $data = [
                'medicine' => $medicine,
                'current_stock' => $medicine->stock,
                'reorder_level' => $medicine->reorder_level,
                'urgency' => $this->calculateUrgency($medicine),
                'suggested_action' => $this->getSuggestedAction($medicine)
            ];

            // Send email notifications
            $emailSent = $this->sendEmailNotification(
                'Low Stock Alert',
                'emails.low-stock-alert',
                $data,
                $recipients
            );

            // Send SMS notifications
            $smsSent = $this->sendSMSNotification(
                $this->formatLowStockSMS($medicine),
                $recipients
            );

            // Log notification
            $this->logNotification('low_stock_alert', $medicine->id, [
                'email_sent' => $emailSent,
                'sms_sent' => $smsSent,
                'recipients_count' => count($recipients)
            ]);

            return $emailSent || $smsSent;

        } catch (\Exception $e) {
            Log::error('Failed to send low stock alert', [
                'medicine_id' => $medicine->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send expiry alert notifications
     */
    public function sendExpiryAlert(Medicine $medicine, int $daysUntilExpiry, array $recipients = []): bool
    {
        try {
            $data = [
                'medicine' => $medicine,
                'days_until_expiry' => $daysUntilExpiry,
                'expiry_date' => $medicine->expiry_date,
                'current_stock' => $medicine->stock,
                'potential_loss' => $medicine->stock * $medicine->selling_price,
                'suggested_discount' => $this->getSuggestedDiscount($daysUntilExpiry)
            ];

            // Send email notifications
            $emailSent = $this->sendEmailNotification(
                'Medicine Expiry Alert',
                'emails.expiry-alert',
                $data,
                $recipients
            );

            // Send SMS notifications
            $smsSent = $this->sendSMSNotification(
                $this->formatExpiryAlertSMS($medicine, $daysUntilExpiry),
                $recipients
            );

            // Log notification
            $this->logNotification('expiry_alert', $medicine->id, [
                'email_sent' => $emailSent,
                'sms_sent' => $smsSent,
                'days_until_expiry' => $daysUntilExpiry,
                'recipients_count' => count($recipients)
            ]);

            return $emailSent || $smsSent;

        } catch (\Exception $e) {
            Log::error('Failed to send expiry alert', [
                'medicine_id' => $medicine->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send sales milestone notifications
     */
    public function sendSalesMilestone(array $data, array $recipients = []): bool
    {
        try {
            // Send email notifications
            $emailSent = $this->sendEmailNotification(
                'Sales Milestone Achieved',
                'emails.sales-milestone',
                $data,
                $recipients
            );

            // Send SMS notifications
            $smsSent = $this->sendSMSNotification(
                $this->formatSalesMilestoneSMS($data),
                $recipients
            );

            return $emailSent || $smsSent;

        } catch (\Exception $e) {
            Log::error('Failed to send sales milestone notification', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send system alert notifications
     */
    public function sendSystemAlert(string $title, string $message, string $priority = 'medium', array $recipients = []): bool
    {
        try {
            $data = [
                'title' => $title,
                'message' => $message,
                'priority' => $priority,
                'timestamp' => now(),
                'system_status' => $this->getSystemStatus()
            ];

            // Send email notifications
            $emailSent = $this->sendEmailNotification(
                "System Alert: {$title}",
                'emails.system-alert',
                $data,
                $recipients
            );

            // Send SMS for high priority alerts
            $smsSent = false;
            if ($priority === 'high' || $priority === 'critical') {
                $smsSent = $this->sendSMSNotification(
                    "ALERT: {$title} - {$message}",
                    $recipients
                );
            }

            return $emailSent || $smsSent;

        } catch (\Exception $e) {
            Log::error('Failed to send system alert', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send email notification
     */
    private function sendEmailNotification(string $subject, string $template, array $data, array $recipients): bool
    {
        try {
            if (empty($recipients)) {
                $recipients = $this->getDefaultEmailRecipients();
            }

            foreach ($recipients as $recipient) {
                if (filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
                    Mail::send($template, $data, function ($message) use ($subject, $recipient) {
                        $message->to($recipient)
                               ->subject($subject)
                               ->from(config('mail.from.address'), config('mail.from.name'));
                    });
                }
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Email notification failed', [
                'subject' => $subject,
                'template' => $template,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send SMS notification
     */
    private function sendSMSNotification(string $message, array $recipients): bool
    {
        try {
            if (empty($recipients)) {
                $recipients = $this->getDefaultSMSRecipients();
            }

            // Filter for phone numbers
            $phoneNumbers = array_filter($recipients, function($recipient) {
                return preg_match('/^\+?[1-9]\d{1,14}$/', $recipient);
            });

            if (empty($phoneNumbers)) {
                return false;
            }

            // Use Twilio, Nexmo, or other SMS service
            return $this->sendViaTwilio($message, $phoneNumbers);

        } catch (\Exception $e) {
            Log::error('SMS notification failed', [
                'message' => $message,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send SMS via Twilio (mock implementation)
     */
    private function sendViaTwilio(string $message, array $phoneNumbers): bool
    {
        try {
            // Mock Twilio API call
            $twilioSid = config('services.twilio.sid');
            $twilioToken = config('services.twilio.token');
            $twilioFrom = config('services.twilio.from');

            if (!$twilioSid || !$twilioToken || !$twilioFrom) {
                Log::info('Twilio not configured, SMS simulation', [
                    'message' => $message,
                    'recipients' => $phoneNumbers
                ]);
                return true; // Simulate success for demo
            }

            foreach ($phoneNumbers as $phoneNumber) {
                // Simulate API call
                $response = Http::withBasicAuth($twilioSid, $twilioToken)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json", [
                        'From' => $twilioFrom,
                        'To' => $phoneNumber,
                        'Body' => $message
                    ]);

                if (!$response->successful()) {
                    Log::error('Twilio SMS failed', [
                        'phone' => $phoneNumber,
                        'response' => $response->body()
                    ]);
                }
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Twilio SMS service error', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Format low stock SMS message
     */
    private function formatLowStockSMS(Medicine $medicine): string
    {
        return "LOW STOCK ALERT: {$medicine->name} has only {$medicine->stock} units left (reorder level: {$medicine->reorder_level}). Immediate action required.";
    }

    /**
     * Format expiry alert SMS message
     */
    private function formatExpiryAlertSMS(Medicine $medicine, int $daysUntilExpiry): string
    {
        return "EXPIRY ALERT: {$medicine->name} expires in {$daysUntilExpiry} days. {$medicine->stock} units at risk. Consider discount or return.";
    }

    /**
     * Format sales milestone SMS message
     */
    private function formatSalesMilestoneSMS(array $data): string
    {
        return "MILESTONE: {$data['message']} Total sales: {$data['total_sales']}. Great work!";
    }

    /**
     * Calculate urgency level for medicine
     */
    private function calculateUrgency(Medicine $medicine): string
    {
        $stockRatio = $medicine->stock / max($medicine->reorder_level, 1);
        
        if ($stockRatio <= 0.2) return 'critical';
        if ($stockRatio <= 0.5) return 'high';
        if ($stockRatio <= 0.8) return 'medium';
        return 'low';
    }

    /**
     * Get suggested action for low stock
     */
    private function getSuggestedAction(Medicine $medicine): string
    {
        $urgency = $this->calculateUrgency($medicine);
        
        switch ($urgency) {
            case 'critical':
                return 'Order immediately from emergency supplier';
            case 'high':
                return 'Place order within 24 hours';
            case 'medium':
                return 'Schedule order within 3 days';
            default:
                return 'Plan reorder for next week';
        }
    }

    /**
     * Get suggested discount percentage based on days until expiry
     */
    private function getSuggestedDiscount(int $daysUntilExpiry): int
    {
        if ($daysUntilExpiry <= 7) return 50;
        if ($daysUntilExpiry <= 30) return 25;
        if ($daysUntilExpiry <= 60) return 15;
        return 10;
    }

    /**
     * Get default email recipients
     */
    private function getDefaultEmailRecipients(): array
    {
        return User::whereHas('roles', function($query) {
            $query->whereIn('name', ['pharmacy_admin', 'super_admin']);
        })->pluck('email')->toArray();
    }

    /**
     * Get default SMS recipients
     */
    private function getDefaultSMSRecipients(): array
    {
        return User::whereHas('roles', function($query) {
            $query->whereIn('name', ['pharmacy_admin', 'super_admin']);
        })->whereNotNull('phone')->pluck('phone')->toArray();
    }

    /**
     * Get system status for alerts
     */
    private function getSystemStatus(): array
    {
        // Get server load (Windows compatible)
        $serverLoad = 0;
        if (function_exists('sys_getloadavg')) {
            $loadAvg = sys_getloadavg();
            $serverLoad = $loadAvg[0] ?? 0;
        } elseif (PHP_OS_FAMILY === 'Windows') {
            // Windows alternative - use CPU usage approximation
            $serverLoad = 0.5; // Placeholder for Windows
        }

        return [
            'timestamp' => now(),
            'server_load' => $serverLoad,
            'memory_usage' => memory_get_usage(true),
            'disk_space' => disk_free_space('.') ?: 0,
            'php_version' => PHP_VERSION,
            'os' => PHP_OS_FAMILY,
        ];
    }

    /**
     * Log notification for tracking
     */
    private function logNotification(string $type, int $entityId, array $metadata): void
    {
        Log::info('Notification sent', [
            'type' => $type,
            'entity_id' => $entityId,
            'metadata' => $metadata,
            'timestamp' => now()
        ]);

        // Store in cache for dashboard
        $key = "notifications_sent_" . now()->format('Y-m-d');
        $count = Cache::get($key, 0);
        Cache::put($key, $count + 1, now()->addDays(7));
    }

    /**
     * Get notification statistics
     */
    public function getNotificationStats(): array
    {
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');
        
        return [
            'sent_today' => Cache::get("notifications_sent_{$today}", 0),
            'sent_yesterday' => Cache::get("notifications_sent_{$yesterday}", 0),
            'total_this_week' => $this->getWeeklyNotificationCount(),
            'success_rate' => $this->calculateSuccessRate(),
        ];
    }

    /**
     * Get weekly notification count
     */
    private function getWeeklyNotificationCount(): int
    {
        $count = 0;
        for ($i = 0; $i < 7; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $count += Cache::get("notifications_sent_{$date}", 0);
        }
        return $count;
    }

    /**
     * Calculate notification success rate
     */
    private function calculateSuccessRate(): float
    {
        // This would be calculated based on delivery confirmations
        // For demo purposes, return a simulated rate
        return 95.5;
    }

    /**
     * Send purchase order notification
     */
    public function sendPurchaseOrderNotification($purchase, string $action = 'created', array $recipients = []): bool
    {
        try {
            $data = [
                'purchase' => $purchase,
                'action' => $action,
                'supplier' => $purchase->supplier,
                'total_amount' => $purchase->total_amount,
                'items_count' => $purchase->items->count(),
                'created_by' => $purchase->user->name ?? 'System',
                'timestamp' => now()
            ];

            $subject = match($action) {
                'created' => "New Purchase Order #{$purchase->purchase_number}",
                'received' => "Purchase Order #{$purchase->purchase_number} Received",
                'cancelled' => "Purchase Order #{$purchase->purchase_number} Cancelled",
                default => "Purchase Order #{$purchase->purchase_number} Updated"
            };

            // Send email notifications
            $emailSent = $this->sendEmailNotification(
                $subject,
                'emails.purchase-notification',
                $data,
                $recipients
            );

            // Create in-app notification
            $this->createInAppNotification([
                'type' => 'purchase_order',
                'title' => $subject,
                'message' => $this->formatPurchaseMessage($purchase, $action),
                'data' => [
                    'purchase_id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'supplier_name' => $purchase->supplier->name ?? 'Unknown',
                    'total_amount' => $purchase->total_amount,
                    'action' => $action
                ],
                'priority' => $action === 'created' ? 'medium' : 'low',
                'category' => 'procurement'
            ]);

            // Log notification
            $this->logNotification('purchase_order', $purchase->id, [
                'action' => $action,
                'email_sent' => $emailSent,
                'recipients_count' => count($recipients)
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send purchase order notification', [
                'purchase_id' => $purchase->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send supplier notification
     */
    public function sendSupplierNotification($supplier, string $action = 'created', array $recipients = []): bool
    {
        try {
            $data = [
                'supplier' => $supplier,
                'action' => $action,
                'created_by' => auth()->user()->name ?? 'System',
                'timestamp' => now()
            ];

            $subject = match($action) {
                'created' => "New Supplier Added: {$supplier->name}",
                'updated' => "Supplier Updated: {$supplier->name}",
                'deleted' => "Supplier Removed: {$supplier->name}",
                default => "Supplier {$supplier->name} Modified"
            };

            // Create in-app notification
            $this->createInAppNotification([
                'type' => 'supplier',
                'title' => $subject,
                'message' => $this->formatSupplierMessage($supplier, $action),
                'data' => [
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->name,
                    'action' => $action
                ],
                'priority' => 'low',
                'category' => 'suppliers'
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send supplier notification', [
                'supplier_id' => $supplier->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Create in-app notification
     */
    private function createInAppNotification(array $data): void
    {
        // Store notification in cache/database for real-time display
        $notificationId = 'notification_' . uniqid();
        $notification = array_merge($data, [
            'id' => $notificationId,
            'read' => false,
            'created_at' => now()->toISOString(),
            'user_id' => auth()->id(),
            'pharmacy_id' => auth()->user()->pharmacy_id ?? null
        ]);

        // Store in cache for real-time access
        $cacheKey = 'notifications_' . (auth()->user()->pharmacy_id ?? 'global');
        $existingNotifications = Cache::get($cacheKey, []);
        array_unshift($existingNotifications, $notification);
        
        // Keep only last 100 notifications
        $existingNotifications = array_slice($existingNotifications, 0, 100);
        
        Cache::put($cacheKey, $existingNotifications, now()->addDays(7));

        // Broadcast to real-time listeners (if using websockets)
        // broadcast(new NotificationCreated($notification));
    }

    /**
     * Format purchase message for notifications
     */
    private function formatPurchaseMessage($purchase, string $action): string
    {
        $supplier = $purchase->supplier->name ?? 'Unknown Supplier';
        $amount = 'UGX ' . number_format($purchase->total_amount);
        
        return match($action) {
            'created' => "Purchase order from {$supplier} for {$amount} has been created and is pending approval.",
            'received' => "Purchase order from {$supplier} for {$amount} has been received and stock updated.",
            'cancelled' => "Purchase order from {$supplier} for {$amount} has been cancelled.",
            default => "Purchase order from {$supplier} for {$amount} has been updated."
        };
    }

    /**
     * Format supplier message for notifications
     */
    private function formatSupplierMessage($supplier, string $action): string
    {
        return match($action) {
            'created' => "New supplier '{$supplier->name}' has been added to the system.",
            'updated' => "Supplier '{$supplier->name}' information has been updated.",
            'deleted' => "Supplier '{$supplier->name}' has been removed from the system.",
            default => "Supplier '{$supplier->name}' has been modified."
        };
    }

    /**
     * Send bulk notifications
     */
    public function sendBulkNotifications(array $notifications): array
    {
        $results = [];
        
        foreach ($notifications as $notification) {
            $result = match($notification['type']) {
                'low_stock' => $this->sendLowStockAlert(
                    Medicine::find($notification['medicine_id']),
                    $notification['recipients'] ?? []
                ),
                'expiry' => $this->sendExpiryAlert(
                    Medicine::find($notification['medicine_id']),
                    $notification['days_until_expiry'],
                    $notification['recipients'] ?? []
                ),
                'system' => $this->sendSystemAlert(
                    $notification['title'],
                    $notification['message'],
                    $notification['priority'] ?? 'medium',
                    $notification['recipients'] ?? []
                ),
                'purchase_order' => $this->sendPurchaseOrderNotification(
                    $notification['purchase'],
                    $notification['action'] ?? 'created',
                    $notification['recipients'] ?? []
                ),
                'supplier' => $this->sendSupplierNotification(
                    $notification['supplier'],
                    $notification['action'] ?? 'created',
                    $notification['recipients'] ?? []
                ),
                default => false
            };
            
            $results[] = [
                'type' => $notification['type'],
                'success' => $result,
                'timestamp' => now()
            ];
        }
        
        return $results;
    }
}