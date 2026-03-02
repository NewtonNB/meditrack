<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AuditLoggerService;
use Illuminate\Support\Facades\Auth;

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only log for authenticated users
        if (Auth::check()) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    private function logActivity(Request $request, $response)
    {
        $method = $request->method();
        $path = $request->path();
        $statusCode = $response->getStatusCode();

        // Skip logging for certain routes
        if ($this->shouldSkipLogging($path)) {
            return;
        }

        // Determine event type based on route and method
        $event = $this->determineEvent($method, $path, $statusCode);
        
        if ($event) {
            AuditLoggerService::log([
                'event' => $event,
                'description' => $this->generateDescription($method, $path, $statusCode),
                'properties' => [
                    'method' => $method,
                    'path' => $path,
                    'status_code' => $statusCode,
                    'user_agent' => $request->userAgent(),
                ],
            ]);
        }
    }

    private function shouldSkipLogging(string $path): bool
    {
        $skipPaths = [
            'api/notifications',
            'api/search',
            'ziggy',
            'dashboard',
            'profile',
        ];

        foreach ($skipPaths as $skipPath) {
            if (str_contains($path, $skipPath)) {
                return true;
            }
        }

        return false;
    }

    private function determineEvent(string $method, string $path, int $statusCode): ?string
    {
        // Failed requests
        if ($statusCode >= 400) {
            if ($statusCode === 401 || $statusCode === 403) {
                return 'unauthorized_access_attempt';
            }
            return 'system_error';
        }

        // Pharmacy-specific events
        if (str_contains($path, 'medicines')) {
            return match($method) {
                'POST' => 'medicine_created',
                'PUT', 'PATCH' => 'medicine_updated',
                'DELETE' => 'medicine_deleted',
                'GET' => str_contains($path, 'controlled') ? 'controlled_substance_access' : null,
                default => null,
            };
        }

        if (str_contains($path, 'sales')) {
            return match($method) {
                'POST' => 'sale_processed',
                'GET' => str_contains($path, 'prescription') ? 'prescription_accessed' : null,
                default => null,
            };
        }

        if (str_contains($path, 'customers') && str_contains($path, 'patient')) {
            return 'patient_data_accessed';
        }

        if (str_contains($path, 'export')) {
            return 'data_export';
        }

        return null;
    }

    private function generateDescription(string $method, string $path, int $statusCode): string
    {
        $action = match($method) {
            'GET' => 'accessed',
            'POST' => 'created',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            default => 'interacted with',
        };

        $resource = $this->extractResource($path);
        
        return "User {$action} {$resource} (Status: {$statusCode})";
    }

    private function extractResource(string $path): string
    {
        $segments = explode('/', $path);
        return $segments[0] ?? 'system';
    }
}