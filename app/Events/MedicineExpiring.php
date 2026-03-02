<?php

namespace App\Events;

use App\Models\Medicine;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MedicineExpiring implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $medicine;
    public $daysToExpiry;

    public function __construct(Medicine $medicine, $daysToExpiry)
    {
        $this->medicine = $medicine;
        $this->daysToExpiry = $daysToExpiry;
    }

    public function broadcastOn()
    {
        return new Channel('notifications');
    }

    public function broadcastAs()
    {
        return 'medicine-expiring';
    }

    public function broadcastWith()
    {
        return [
            'medicine_id' => $this->medicine->id,
            'medicine_name' => $this->medicine->name,
            'expiry_date' => $this->medicine->expiry_date->format('Y-m-d'),
            'days_to_expiry' => $this->daysToExpiry,
            'priority' => $this->daysToExpiry <= 7 ? 'critical' : ($this->daysToExpiry <= 30 ? 'high' : 'medium')
        ];
    }
}