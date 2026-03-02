<?php

namespace App\Listeners;

use App\Events\LowStockDetected;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendLowStockNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(LowStockDetected $event)
    {
        $this->notificationService->createLowStockAlert(
            $event->medicine,
            $event->currentStock,
            $event->reorderLevel
        );
    }
}