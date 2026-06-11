<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper methods for common preference types
    public function getBooleanValue(): bool
    {
        return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
    }

    public function getIntegerValue(): int
    {
        return (int) $this->value;
    }

    public function getFloatValue(): float
    {
        return (float) $this->value;
    }

    public function getArrayValue(): array
    {
        return json_decode($this->value, true) ?? [];
    }

    public function setArrayValue(array $value): void
    {
        $this->value = json_encode($value);
    }
}