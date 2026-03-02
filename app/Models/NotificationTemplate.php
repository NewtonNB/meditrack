<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title_template',
        'message_template',
        'icon',
        'color',
        'default_priority',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Methods
    public function renderTitle($data = [])
    {
        return $this->replaceVariables($this->title_template, $data);
    }

    public function renderMessage($data = [])
    {
        return $this->replaceVariables($this->message_template, $data);
    }

    protected function replaceVariables($template, $data)
    {
        foreach ($data as $key => $value) {
            $template = str_replace("{{$key}}", $value, $template);
        }
        
        return $template;
    }

    public static function getDefaultTemplates()
    {
        return [
            [
                'type' => 'low_stock',
                'title_template' => 'Low Stock Alert',
                'message_template' => 'Stock for {medicine_name} is below reorder level ({current_stock} units remaining)',
                'icon' => 'cube',
                'color' => 'orange',
                'default_priority' => 'high'
            ],
            [
                'type' => 'expiry_alert',
                'title_template' => 'Medicine Expiry Alert',
                'message_template' => '{medicine_name} expires in {days_to_expiry} days',
                'icon' => 'clock',
                'color' => 'yellow',
                'default_priority' => 'medium'
            ],
            [
                'type' => 'sale_completed',
                'title_template' => 'Sale Completed',
                'message_template' => 'Sale #{transaction_id} completed for ${amount}',
                'icon' => 'shopping-cart',
                'color' => 'green',
                'default_priority' => 'low'
            ],
            [
                'type' => 'system_alert',
                'title_template' => 'System Alert',
                'message_template' => '{message}',
                'icon' => 'cog',
                'color' => 'blue',
                'default_priority' => 'medium'
            ],
            [
                'type' => 'customer_registered',
                'title_template' => 'New Customer Registration',
                'message_template' => 'New customer {customer_name} has registered',
                'icon' => 'user-plus',
                'color' => 'green',
                'default_priority' => 'low'
            ]
        ];
    }
}