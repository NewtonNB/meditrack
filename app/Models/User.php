<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\HasRoles;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles, Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'pharmacy_id',
        'role',
        'phone',
        'address',
        'bio',
        'date_of_birth',
        'avatar',
        'emergency_contact',
        'last_login_at',
        'login_count',
        'created_by',
        'updated_by',
    ];

    /**
     * Fields to exclude from audit logs.
     */
    protected $auditExcluded = [
        'password',
        'remember_token',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'locked_until' => 'datetime',
            'date_of_birth' => 'date',
            'last_login_at' => 'datetime',
            'emergency_contact' => 'array',
        ];
    }

    public function pharmacy()
    {
        return $this->belongsTo(PharmacyClient::class, 'pharmacy_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin') || $this->role === 'super_admin';
    }

    public function isPharmacyAdmin(): bool
    {
        return $this->hasRole('pharmacy_admin') || $this->role === 'pharmacy_admin';
    }

    public function isPharmacist(): bool
    {
        return $this->hasRole('pharmacist') || $this->role === 'pharmacist';
    }

    public function isCashier(): bool
    {
        return $this->hasRole('cashier') || $this->role === 'cashier';
    }

    /**
     * Log security events
     */
    public function logSecurityEvent(string $event, array $data = []): void
    {
        \Log::channel('security')->info("Security Event: {$event}", [
            'user_id' => $this->id,
            'email' => $this->email,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'data' => $data,
            'timestamp' => now(),
        ]);
    }

    /**
     * Check if user account is locked
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Get records created by this user.
     */
    public function createdRecords(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    /**
     * Get medicines created by this user.
     */
    public function createdMedicines(): HasMany
    {
        return $this->hasMany(Medicine::class, 'created_by');
    }

    /**
     * Get sales processed by this user.
     */
    public function processedSales(): HasMany
    {
        return $this->hasMany(Sale::class, 'created_by');
    }

    /**
     * Get customers created by this user.
     */
    public function createdCustomers(): HasMany
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    /**
     * Get suppliers created by this user.
     */
    public function createdSuppliers(): HasMany
    {
        return $this->hasMany(Supplier::class, 'created_by');
    }

    /**
     * Get user who created this user account.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get user who last updated this user account.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get user preferences.
     */
    public function preferences(): HasMany
    {
        return $this->hasMany(UserPreference::class);
    }

    /**
     * Get avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return \Storage::disk('public')->url($this->avatar);
        }
        
        // Return default avatar or gravatar
        return 'https://www.gravatar.com/avatar/' . md5(strtolower(trim($this->email))) . '?d=identicon&s=200';
    }

    /**
     * Get user's theme preference.
     */
    public function getThemeAttribute(): string
    {
        $preference = $this->preferences()->where('key', 'theme')->first();
        return $preference ? $preference->value : 'light';
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermissionTo($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermissionTo($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get user's primary role (highest priority role).
     */
    public function getPrimaryRole(): ?string
    {
        $roleHierarchy = ['super_admin', 'pharmacy_admin', 'pharmacist', 'cashier'];
        
        foreach ($roleHierarchy as $role) {
            if ($this->hasRole($role)) {
                return $role;
            }
        }
        
        return $this->role; // Fallback to legacy role field
    }

    /**
     * Get user's dashboard route based on their role.
     */
    public function getDashboardRoute(): string
    {
        $primaryRole = $this->getPrimaryRole();
        
        return match($primaryRole) {
            'super_admin', 'pharmacy_admin' => 'dashboard',
            'pharmacist' => 'medicines.index',
            'cashier' => 'sales.index',
            default => 'dashboard',
        };
    }

    /**
     * Check if user can access a specific pharmacy's data.
     */
    public function canAccessPharmacy(int $pharmacyId): bool
    {
        // Super admin can access all pharmacies
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        // Other users can only access their own pharmacy
        return $this->pharmacy_id === $pharmacyId;
    }

    /**
     * Get user's activity summary.
     */
    public function getActivitySummary(int $days = 30): array
    {
        $startDate = now()->subDays($days);
        
        $activities = ActivityLog::where('user_id', $this->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('event, COUNT(*) as count')
            ->groupBy('event')
            ->pluck('count', 'event')
            ->toArray();
            
        return [
            'total_activities' => array_sum($activities),
            'activities_by_type' => $activities,
            'period_days' => $days,
        ];
    }

    /**
     * Lock user account for a specified duration.
     */
    public function lockAccount(int $minutes = 15): void
    {
        $this->update([
            'locked_until' => now()->addMinutes($minutes)
        ]);
        
        $this->logSecurityEvent('account_locked', [
            'locked_until' => $this->locked_until,
            'duration_minutes' => $minutes,
        ]);
    }

    /**
     * Unlock user account.
     */
    public function unlockAccount(): void
    {
        $this->update(['locked_until' => null]);
        
        $this->logSecurityEvent('account_unlocked');
    }

    /**
     * Reset failed login attempts for this user.
     */
    public function resetFailedLoginAttempts(): void
    {
        $cacheKey = "failed_login_attempts:{$this->email}";
        cache()->forget($cacheKey);
    }
}
