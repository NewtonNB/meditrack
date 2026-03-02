<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MLModel extends Model
{
    use HasFactory;

    protected $table = 'ml_models';

    protected $fillable = [
        'name',
        'version',
        'type',
        'status',
        'accuracy_metrics',
        'training_data_size',
        'deployed_at',
        'model_path',
        'hyperparameters'
    ];

    protected $casts = [
        'accuracy_metrics' => 'array',
        'hyperparameters' => 'array',
        'deployed_at' => 'datetime'
    ];

    public function scopeDeployed($query)
    {
        return $query->where('status', 'deployed');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeLatestVersion($query)
    {
        return $query->orderBy('version', 'desc');
    }

    public function getAccuracyAttribute()
    {
        return $this->accuracy_metrics['accuracy'] ?? null;
    }

    public function getPrecisionAttribute()
    {
        return $this->accuracy_metrics['precision'] ?? null;
    }

    public function getRecallAttribute()
    {
        return $this->accuracy_metrics['recall'] ?? null;
    }

    public function getF1ScoreAttribute()
    {
        return $this->accuracy_metrics['f1_score'] ?? null;
    }

    public function deploy()
    {
        // Set all other models of same type to deprecated
        static::where('type', $this->type)
            ->where('id', '!=', $this->id)
            ->update(['status' => 'deprecated']);

        // Deploy this model
        $this->update([
            'status' => 'deployed',
            'deployed_at' => now()
        ]);
    }

    public function deprecate()
    {
        $this->update(['status' => 'deprecated']);
    }

    public function updateMetrics(array $metrics)
    {
        $this->update(['accuracy_metrics' => $metrics]);
    }
}