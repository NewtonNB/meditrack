<?php

namespace App\Listeners;

use App\Events\MedicineExpiring;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendExpiryNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(MedicineExpiring $event)
    {
        $this->notificationService->createExpiryAlert(
            $event->medicine,
            $event->daysToExpiry
        );
    }
}