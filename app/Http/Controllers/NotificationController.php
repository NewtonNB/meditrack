<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use App\Services\NotificationMonitorService;
use App\Models\NotificationPreference;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    protected $notificationService;
    protected $monitorService;

    public function __construct(
        NotificationService $notificationService,
        NotificationMonitorService $monitorService
    ) {
        $this->notificationService = $notificationService;
        $this->monitorService = $monitorService;
    }

    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Handle case where user is not authenticated
            if (!$user) {
                return response()->json([
                    'notifications' => [],
                    'unread_count' => 0,
                    'summary' => [
                        'total' => 0,
                        'critical' => 0,
                        'high' => 0,
                        'medium' => 0,
                        'low' => 0
                    ]
                ]);
            }
            
            // For super_admin, show notifications from all pharmacies (pass null)
            // For regular users, filter by their pharmacy_id
            $pharmacyId = $user->isSuperAdmin() ? null : ($user->pharmacy_id ?? null);
            
            // Get real-time monitored notifications
            $notifications = $this->monitorService->getAllNotifications($pharmacyId);
            
            // Clear cache to ensure fresh data
            $this->monitorService->clearNotificationCache($pharmacyId);
            
            // Apply limit if specified
            $limit = $request->get('limit', 50);
            if ($limit > 0) {
                $notifications = array_slice($notifications, 0, $limit);
            }
            
            // Filter unread only if requested
            if ($request->boolean('unread_only')) {
                $notifications = array_filter($notifications, function($n) {
                    return !($n['read'] ?? false);
                });
            }

            // Calculate unread count
            $unreadCount = count(array_filter($notifications, function($n) {
                return !($n['read'] ?? false);
            }));
            
            return response()->json([
                'notifications' => array_values($notifications),
                'unread_count' => $unreadCount,
                'summary' => $this->monitorService->getNotificationSummary($pharmacyId)
            ]);
        } catch (\Exception $e) {
            \Log::error('Notification fetch error: ' . $e->getMessage());
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
                'summary' => [
                    'total' => 0,
                    'critical' => 0,
                    'high' => 0,
                    'medium' => 0,
                    'low' => 0
                ]
            ]);
        }
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        try {
            $user = auth()->user();
            
            // Handle case where user is not authenticated
            if (!$user) {
                return response()->json([
                    'count' => 0,
                    'critical' => 0,
                    'high' => 0,
                    'medium' => 0,
                    'low' => 0
                ]);
            }
            
            // For super_admin, show notifications from all pharmacies (pass null)
            // For regular users, filter by their pharmacy_id
            $pharmacyId = $user->isSuperAdmin() ? null : ($user->pharmacy_id ?? null);
            
            $notifications = $this->monitorService->getAllNotifications($pharmacyId);
            $summary = $this->monitorService->getNotificationSummary($pharmacyId);
            
            // Calculate unread count
            $unreadCount = count(array_filter($notifications, function($n) {
                return !($n['read'] ?? false);
            }));
            
            return response()->json([
                'count' => $unreadCount,
                'critical' => $summary['critical'],
                'high' => $summary['high'],
                'medium' => $summary['medium'],
                'low' => $summary['low'],
                'by_category' => $summary['by_category']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'count' => 0,
                'critical' => 0,
                'high' => 0,
                'medium' => 0,
                'low' => 0
            ]);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        try {
            $user = auth()->user();
            
            // Handle virtual notifications from NotificationMonitorService
            // These are not stored in database, so we'll store read status in cache
            $cacheKey = "notification_read_{$user->id}_{$id}";
            \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addDays(30));
            
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error marking notification as read', [
                'id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read'
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        try {
            $user = auth()->user();
            $pharmacyId = $user->isSuperAdmin() ? null : ($user->pharmacy_id ?? null);
            
            // Get all current notifications
            $notifications = $this->monitorService->getAllNotifications($pharmacyId);
            
            // Mark each notification as read in cache
            $count = 0;
            foreach ($notifications as $notification) {
                $cacheKey = "notification_read_{$user->id}_{$notification['id']}";
                \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addDays(30));
                $count++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "Marked {$count} notifications as read"
            ]);
        } catch (\Exception $e) {
            \Log::error('Error marking all notifications as read', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read'
            ], 500);
        }
    }

    /**
     * Dismiss notification
     */
    public function dismiss($id)
    {
        try {
            $user = auth()->user();
            
            // Handle virtual notifications by storing dismissed status in cache
            $cacheKey = "notification_dismissed_{$user->id}_{$id}";
            \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addDays(30));
            
            return response()->json([
                'success' => true,
                'message' => 'Notification dismissed'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error dismissing notification', [
                'id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to dismiss notification'
            ], 500);
        }
    }

    /**
     * Get notification preferences (API endpoint)
     */
    public function getPreferences()
    {
        $user = auth()->user();
        $preferences = NotificationPreference::where('user_id', $user->id)->get()->toArray();
        
        // Convert default preferences to array format
        $defaultPrefs = NotificationPreference::getDefaultPreferences();
        $defaultPreferences = [];
        foreach ($defaultPrefs as $type => $settings) {
            $defaultPreferences[] = [
                'notification_type' => $type,
                'in_app_enabled' => $settings['in_app_enabled'] ?? true,
                'email_enabled' => $settings['email_enabled'] ?? false,
                'sms_enabled' => $settings['sms_enabled'] ?? false,
            ];
        }

        return response()->json([
            'preferences' => $preferences,
            'defaultPreferences' => $defaultPreferences
        ]);
    }

    /**
     * Get notification preferences
     */
    public function preferences()
    {
        $user = auth()->user();
        $preferences = NotificationPreference::where('user_id', $user->id)->get()->toArray();
        
        // Convert default preferences to array format
        $defaultPrefs = NotificationPreference::getDefaultPreferences();
        $defaultPreferences = [];
        foreach ($defaultPrefs as $type => $settings) {
            $defaultPreferences[] = [
                'notification_type' => $type,
                'in_app_enabled' => $settings['in_app_enabled'] ?? true,
                'email_enabled' => $settings['email_enabled'] ?? false,
                'sms_enabled' => $settings['sms_enabled'] ?? false,
            ];
        }

        return Inertia::render('Notifications/Preferences', [
            'preferences' => $preferences,
            'defaultPreferences' => $defaultPreferences
        ]);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'preferences' => 'required|array',
            'preferences.*.notification_type' => 'required|string',
            'preferences.*.in_app_enabled' => 'boolean',
            'preferences.*.email_enabled' => 'boolean',
            'preferences.*.sms_enabled' => 'boolean'
        ]);

        $user = auth()->user();

        foreach ($request->preferences as $preference) {
            NotificationPreference::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_type' => $preference['notification_type']
                ],
                [
                    'in_app_enabled' => $preference['in_app_enabled'] ?? true,
                    'email_enabled' => $preference['email_enabled'] ?? false,
                    'sms_enabled' => $preference['sms_enabled'] ?? false
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully'
        ]);
    }

    /**
     * Debug notification system
     */
    public function debugSystem()
    {
        try {
            $user = auth()->user();
            $pharmacyId = $user->isSuperAdmin() ? null : ($user->pharmacy_id ?? null);
            
            // Check expired medicines in database
            $expiredMedicines = \App\Models\Medicine::whereNotNull('expiry_date')
                ->where('expiry_date', '<=', now())
                ->where('stock', '>', 0)
                ->get();
            
            // Check expiring soon medicines
            $expiringSoon = \App\Models\Medicine::whereNotNull('expiry_date')
                ->where('expiry_date', '>', now())
                ->where('expiry_date', '<=', now()->addDays(30))
                ->where('stock', '>', 0)
                ->get();
            
            // Test notification service
            $expiredNotifications = $this->monitorService->getExpiredMedicinesNotifications($pharmacyId);
            $expiringNotifications = $this->monitorService->getExpiryNotifications($pharmacyId);
            $allNotifications = $this->monitorService->getAllNotifications($pharmacyId);
            
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'pharmacy_id' => $user->pharmacy_id,
                    'is_super_admin' => $user->isSuperAdmin(),
                ],
                'pharmacy_filter' => $pharmacyId,
                'database_check' => [
                    'expired_medicines_count' => $expiredMedicines->count(),
                    'expiring_soon_count' => $expiringSoon->count(),
                    'expired_medicines' => $expiredMedicines->map(function($m) {
                        return [
                            'id' => $m->id,
                            'name' => $m->name,
                            'expiry_date' => $m->expiry_date,
                            'stock' => $m->stock,
                            'pharmacy_id' => $m->pharmacy_id,
                        ];
                    }),
                    'expiring_soon' => $expiringSoon->map(function($m) {
                        return [
                            'id' => $m->id,
                            'name' => $m->name,
                            'expiry_date' => $m->expiry_date,
                            'stock' => $m->stock,
                            'pharmacy_id' => $m->pharmacy_id,
                        ];
                    }),
                ],
                'notification_service' => [
                    'expired_notifications_count' => count($expiredNotifications),
                    'expiring_notifications_count' => count($expiringNotifications),
                    'total_notifications_count' => count($allNotifications),
                    'expired_notifications' => $expiredNotifications,
                    'expiring_notifications' => $expiringNotifications,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Get notification statistics
     */
    public function statistics()
    {
        $stats = $this->notificationService->getNotificationStats(auth()->id());
        
        return response()->json($stats);
    }

    /**
     * Test notification system
     */
    public function test(Request $request)
    {
        $type = $request->get('type', 'system_alert');
        
        switch ($type) {
            case 'low_stock':
                $this->notificationService->createSystemAlert(
                    'Test Low Stock Alert',
                    'This is a test low stock notification',
                    'high',
                    auth()->id()
                );
                break;
                
            case 'expiry':
                $this->notificationService->createSystemAlert(
                    'Test Expiry Alert',
                    'This is a test expiry notification',
                    'critical',
                    auth()->id()
                );
                break;
                
            default:
                $this->notificationService->createSystemAlert(
                    'Test Notification',
                    'This is a test system notification',
                    'medium',
                    auth()->id()
                );
        }

        return response()->json([
            'success' => true,
            'message' => 'Test notification sent successfully'
        ]);
    }

    /**
     * Manually trigger cleanup of resolved notifications
     */
    public function cleanup()
    {
        try {
            $user = auth()->user();
            $pharmacyId = $user->isSuperAdmin() ? null : ($user->pharmacy_id ?? null);
            
            // Clear the notification cache to force refresh
            $this->monitorService->clearNotificationCache($pharmacyId);
            
            // Get fresh notifications (this will trigger cleanup)
            $notifications = $this->monitorService->getAllNotifications($pharmacyId);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification cleanup completed',
                'remaining_notifications' => count($notifications)
            ]);
        } catch (\Exception $e) {
            \Log::error('Error during notification cleanup', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup notifications'
            ], 500);
        }
    }
}