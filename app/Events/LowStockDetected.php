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

class LowStockDetected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $medicine;
    public $currentStock;
    public $reorderLevel;

    public function __construct(Medicine $medicine, $currentStock, $reorderLevel = 50)
    {
        $this->medicine = $medicine;
        $this->currentStock = $currentStock;
        $this->reorderLevel = $reorderLevel;
    }

    public function broadcastOn()
    {
        return new Channel('notifications');
    }

    public function broadcastAs()
    {
        return 'low-stock-detected';
    }

    public function broadcastWith()
    {
        return [
            'medicine_id' => $this->medicine->id,
            'medicine_name' => $this->medicine->name,
            'current_stock' => $this->currentStock,
            'reorder_level' => $this->reorderLevel,
            'priority' => $this->currentStock <= ($this->reorderLevel * 0.5) ? 'critical' : 'high'
        ];
    }
}