<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use App\Services\AuditTrailService;

class AuthEventListener
{
    protected AuditTrailService $auditService;

    public function __construct(AuditTrailService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Handle user login events.
     */
    public function handleLogin(Login $event): void
    {
        $user = $event->user;
        
        $this->auditService->logAuthEvent('login', $user, [
            'guard' => $event->guard,
            'remember' => request()->has('remember'),
            'user_agent' => request()->userAgent(),
            'ip_address' => request()->ip(),
        ]);

        // Reset failed login attempts on successful login
        if (method_exists($user, 'resetFailedLoginAttempts')) {
            $user->resetFailedLoginAttempts();
        }
    }

    /**
     * Handle user logout events.
     */
    public function handleLogout(Logout $event): void
    {
        $user = $event->user;
        
        if ($user) {
            $this->auditService->logAuthEvent('logout', $user, [
                'guard' => $event->guard,
            ]);
        }
    }

    /**
     * Handle failed login attempts.
     */
    public function handleFailedLogin(Failed $event): void
    {
        $credentials = $event->credentials;
        $email = $credentials['email'] ?? 'unknown';
        
        $this->auditService->logAuthEvent('failed_login', null, [
            'email' => $email,
            'guard' => $event->guard,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        // Track failed attempts for potential account locking
        $this->trackFailedLoginAttempt($email);
    }

    /**
     * Handle password reset events.
     */
    public function handlePasswordReset(PasswordReset $event): void
    {
        $user = $event->user;
        
        $this->auditService->logAuthEvent('password_reset', $user, [
            'reset_method' => 'email',
        ]);
    }

    /**
     * Handle user registration events.
     */
    public function handleRegistered(Registered $event): void
    {
        $user = $event->user;
        
        $this->auditService->logAuthEvent('user_registered', $user, [
            'registration_method' => 'web',
        ]);
    }

    /**
     * Handle email verification events.
     */
    public function handleVerified(Verified $event): void
    {
        $user = $event->user;
        
        $this->auditService->logAuthEvent('email_verified', $user);
    }

    /**
     * Track failed login attempts and potentially lock accounts.
     */
    protected function trackFailedLoginAttempt(string $email): void
    {
        $cacheKey = "failed_login_attempts:{$email}";
        $attempts = cache()->get($cacheKey, 0) + 1;
        
        // Store failed attempts for 1 hour
        cache()->put($cacheKey, $attempts, 3600);
        
        // Lock account after 5 failed attempts
        if ($attempts >= 5) {
            $user = \App\Models\User::where('email', $email)->first();
            if ($user && !$user->isLocked()) {
                $user->lockAccount(15); // Lock for 15 minutes
                
                $this->auditService->logAuthEvent('account_locked', $user, [
                    'reason' => 'too_many_failed_attempts',
                    'failed_attempts' => $attempts,
                    'locked_until' => $user->locked_until,
                ]);
            }
        }
    }

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe($events): void
    {
        $events->listen(Login::class, [AuthEventListener::class, 'handleLogin']);
        $events->listen(Logout::class, [AuthEventListener::class, 'handleLogout']);
        $events->listen(Failed::class, [AuthEventListener::class, 'handleFailedLogin']);
        $events->listen(PasswordReset::class, [AuthEventListener::class, 'handlePasswordReset']);
        $events->listen(Registered::class, [AuthEventListener::class, 'handleRegistered']);
        $events->listen(Verified::class, [AuthEventListener::class, 'handleVerified']);
    }
}