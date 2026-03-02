<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Notification extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'priority',
        'status',
        'user_id',
        'icon',
        'color',
        'action_url',
        'expires_at'
    ];

    protected $casts = [
        'data' => 'array',
        'expires_at' => 'datetime'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->orWhereNull('user_id'); // Include system-wide notifications
        });
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Methods
    public function markAsRead()
    {
        $this->update(['status' => 'read']);
    }

    public function markAsDismissed()
    {
        $this->update(['status' => 'dismissed']);
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at < now();
    }

    public function isCritical()
    {
        return $this->priority === 'critical';
    }

    public function isSystemWide()
    {
        return $this->user_id === null;
    }

    public function getPriorityColor()
    {
        $colors = [
            'low' => 'gray',
            'medium' => 'blue',
            'high' => 'orange',
            'critical' => 'red'
        ];

        return $colors[$this->priority] ?? 'blue';
    }

    public function getPriorityIcon()
    {
        $icons = [
            'low' => 'information-circle',
            'medium' => 'bell',
            'high' => 'exclamation-triangle',
            'critical' => 'exclamation-circle'
        ];

        return $icons[$this->priority] ?? 'bell';
    }

    public function getFormattedCreatedAt()
    {
        return $this->created_at->diffForHumans();
    }

    // Static methods for creating notifications
    public static function createLowStockAlert($medicine, $currentStock, $reorderLevel)
    {
        return self::create([
            'type' => 'low_stock',
            'title' => 'Low Stock Alert',
            'message' => "Stock for {$medicine->name} is below reorder level ({$currentStock} units remaining)",
            'data' => [
                'medicine_id' => $medicine->id,
                'medicine_name' => $medicine->name,
                'current_stock' => $currentStock,
                'reorder_level' => $reorderLevel
            ],
            'priority' => $currentStock <= ($reorderLevel * 0.5) ? 'critical' : 'high',
            'icon' => 'cube',
            'color' => 'orange',
            'action_url' => route('medicines.index')
        ]);
    }

    public static function createExpiryAlert($medicine, $daysToExpiry)
    {
        $priority = $daysToExpiry <= 7 ? 'critical' : ($daysToExpiry <= 30 ? 'high' : 'medium');
        
        return self::create([
            'type' => 'expiry_alert',
            'title' => 'Medicine Expiry Alert',
            'message' => "{$medicine->name} expires in {$daysToExpiry} days",
            'data' => [
                'medicine_id' => $medicine->id,
                'medicine_name' => $medicine->name,
                'expiry_date' => $medicine->expiry_date,
                'days_to_expiry' => $daysToExpiry
            ],
            'priority' => $priority,
            'icon' => 'clock',
            'color' => $priority === 'critical' ? 'red' : 'yellow',
            'action_url' => route('medicines.index')
        ]);
    }

    public static function createSaleAlert($sale)
    {
        return self::create([
            'type' => 'sale_completed',
            'title' => 'Sale Completed',
            'message' => "Sale #{$sale->transaction_id} completed for $" . number_format($sale->total_price, 2),
            'data' => [
                'sale_id' => $sale->id,
                'transaction_id' => $sale->transaction_id,
                'amount' => $sale->total_price
            ],
            'priority' => 'low',
            'icon' => 'shopping-cart',
            'color' => 'green',
            'action_url' => route('sales.show', $sale->id)
        ]);
    }

    public static function createSystemAlert($title, $message, $priority = 'medium')
    {
        return self::create([
            'type' => 'system_alert',
            'title' => $title,
            'message' => $message,
            'priority' => $priority,
            'icon' => 'cog',
            'color' => 'blue'
        ]);
    }
}