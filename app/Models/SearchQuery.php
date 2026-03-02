<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchQuery extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'query_text',
        'search_type',
        'results_count',
        'clicked_result_id',
        'satisfaction_score',
        'processing_time'
    ];

    protected $casts = [
        'satisfaction_score' => 'decimal:2',
        'processing_time' => 'decimal:4'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('search_type', $type);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('results_count', '>', 0);
    }

    public function scopeWithClicks($query)
    {
        return $query->whereNotNull('clicked_result_id');
    }

    public function scopeHighSatisfaction($query, $threshold = 4.0)
    {
        return $query->where('satisfaction_score', '>=', $threshold);
    }

    public function getClickThroughRateAttribute()
    {
        return $this->clicked_result_id ? 1 : 0;
    }

    public function recordClick($resultId)
    {
        $this->update(['clicked_result_id' => $resultId]);
    }

    public function recordSatisfaction($score)
    {
        $this->update(['satisfaction_score' => $score]);
    }
}