<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PermissionService;
use App\Services\AuditTrailService;

class PermissionMiddleware
{
    protected PermissionService $permissionService;
    protected AuditTrailService $auditService;

    public function __construct(PermissionService $permissionService, AuditTrailService $auditService)
    {
        $this->permissionService = $permissionService;
        $this->auditService = $auditService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission = null, string $guard = null): Response
    {
        $guard = $guard ?: config('auth.defaults.guard');

        // Check if user is authenticated
        if (!auth($guard)->check()) {
            return $this->handleUnauthorized($request, 'User not authenticated');
        }

        $user = auth($guard)->user();

        // If no specific permission is required, just check authentication
        if (!$permission) {
            return $next($request);
        }

        // Check if user has the required permission
        if (!$this->permissionService->checkUserPermission($user, $permission)) {
            // Log unauthorized access attempt
            $this->auditService->logCustomActivity(
                'unauthorized_access_attempt',
                "User '{$user->name}' attempted to access resource requiring '{$permission}' permission",
                [
                    'required_permission' => $permission,
                    'user_permissions' => $user->getRoleNames()->toArray(),
                    'requested_url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]
            );

            return $this->handleUnauthorized($request, "Missing required permission: {$permission}");
        }

        // Log successful access for sensitive operations
        if ($this->isSensitivePermission($permission)) {
            $this->auditService->logCustomActivity(
                'sensitive_access',
                "User '{$user->name}' accessed resource requiring '{$permission}' permission",
                [
                    'permission' => $permission,
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]
            );
        }

        return $next($request);
    }

    /**
     * Handle unauthorized access.
     */
    protected function handleUnauthorized(Request $request, string $reason): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Access denied.',
                'error' => 'Insufficient permissions',
                'required_permission' => $request->route()?->getAction('permission'),
            ], 403);
        }

        // For web requests, redirect based on user role
        if (auth()->check()) {
            $user = auth()->user();
            
            // Redirect to appropriate dashboard based on role
            if ($user->isSuperAdmin() || $user->isPharmacyAdmin()) {
                return redirect()->route('dashboard')->with('error', 'Access denied. ' . $reason);
            } elseif ($user->isPharmacist()) {
                return redirect()->route('medicines.index')->with('error', 'Access denied. ' . $reason);
            } elseif ($user->isCashier()) {
                return redirect()->route('sales.index')->with('error', 'Access denied. ' . $reason);
            }
        }

        // Default redirect
        return redirect()->route('dashboard')->with('error', 'Access denied. ' . $reason);
    }

    /**
     * Check if a permission is considered sensitive and should be logged.
     */
    protected function isSensitivePermission(string $permission): bool
    {
        $sensitivePermissions = [
            'manage_users',
            'manage_settings',
            'export_data',
            'view_audit_logs',
        ];

        return in_array($permission, $sensitivePermissions);
    }
}