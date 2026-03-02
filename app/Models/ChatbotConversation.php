<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatbotConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'message',
        'response',
        'intent',
        'confidence_score',
        'escalated',
        'helpful'
    ];

    protected $casts = [
        'confidence_score' => 'decimal:4',
        'escalated' => 'boolean',
        'helpful' => 'boolean'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeBySession($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeByIntent($query, $intent)
    {
        return $query->where('intent', $intent);
    }

    public function scopeEscalated($query)
    {
        return $query->where('escalated', true);
    }

    public function scopeHighConfidence($query, $threshold = 0.8)
    {
        return $query->where('confidence_score', '>=', $threshold);
    }

    public function scopeHelpful($query)
    {
        return $query->where('helpful', true);
    }

    public function getConfidencePercentageAttribute()
    {
        return $this->confidence_score ? round($this->confidence_score * 100, 2) : null;
    }

    public function markAsHelpful()
    {
        $this->update(['helpful' => true]);
    }

    public function markAsNotHelpful()
    {
        $this->update(['helpful' => false]);
    }

    public function escalate()
    {
        $this->update(['escalated' => true]);
    }
}