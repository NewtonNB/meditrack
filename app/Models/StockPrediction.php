<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockPrediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'prediction_date',
        'predicted_demand',
        'confidence_score',
        'prediction_horizon',
        'model_version',
        'actual_demand',
        'accuracy_score'
    ];

    protected $casts = [
        'prediction_date' => 'date',
        'predicted_demand' => 'decimal:2',
        'confidence_score' => 'decimal:4',
        'actual_demand' => 'decimal:2',
        'accuracy_score' => 'decimal:4'
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function scopeForMedicine($query, $medicineId)
    {
        return $query->where('medicine_id', $medicineId);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('prediction_date', [$startDate, $endDate]);
    }

    public function scopeHighConfidence($query, $threshold = 0.8)
    {
        return $query->where('confidence_score', '>=', $threshold);
    }

    public function getAccuracyPercentageAttribute()
    {
        return $this->accuracy_score ? round($this->accuracy_score * 100, 2) : null;
    }

    public function getConfidencePercentageAttribute()
    {
        return round($this->confidence_score * 100, 2);
    }
}