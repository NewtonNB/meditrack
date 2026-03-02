<?php

namespace App\Listeners;

use App\Events\SaleCompleted;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendSaleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(SaleCompleted $event)
    {
        $this->notificationService->createSaleNotification($event->sale);
    }
}