<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\AuditTrailService;
use Illuminate\Support\Str;

class AuditTrailMiddleware
{
    protected AuditTrailService $auditService;

    public function __construct(AuditTrailService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        
        // Process the request
        $response = $next($request);
        
        // Log the request after processing
        $this->logRequest($request, $response, $startTime);
        
        return $response;
    }

    /**
     * Log the request details.
     */
    protected function logRequest(Request $request, Response $response, float $startTime): void
    {
        // Skip logging for certain routes to avoid noise
        if ($this->shouldSkipLogging($request)) {
            return;
        }

        try {
            $duration = round((microtime(true) - $startTime) * 1000, 2); // Duration in milliseconds
            
            $event = $this->determineEventType($request, $response);
            $description = $this->generateDescription($request, $response);
            
            $properties = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'route' => $request->route()?->getName(),
                'status_code' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'user_agent' => $request->userAgent(),
                'referer' => $request->header('referer'),
            ];

            // Add request data for certain methods (excluding sensitive data)
            if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                $requestData = $this->sanitizeRequestData($request->all());
                if (!empty($requestData)) {
                    $properties['request_data'] = $requestData;
                }
            }

            // Add response data for API requests
            if ($request->expectsJson() && $response->getStatusCode() >= 400) {
                $properties['response_data'] = $this->getResponseData($response);
            }

            // Log different events based on the request type
            $this->auditService->logCustomActivity($event, $description, $properties);

        } catch (\Exception $e) {
            // Log the error but don't break the application
            \Log::error('Failed to log audit trail', [
                'error' => $e->getMessage(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
            ]);
        }
    }

    /**
     * Determine if this request should be logged.
     */
    protected function shouldSkipLogging(Request $request): bool
    {
        $skipRoutes = [
            'ziggy',
            'debugbar.*',
            '_ignition.*',
            'horizon.*',
            'telescope.*',
        ];

        $skipPaths = [
            '/up', // Health check
            '/favicon.ico',
            '/robots.txt',
            '/build/*', // Vite assets
            '/storage/*', // Public storage
        ];

        $routeName = $request->route()?->getName();
        $path = $request->path();

        // Skip certain route names
        foreach ($skipRoutes as $pattern) {
            if ($routeName && Str::is($pattern, $routeName)) {
                return true;
            }
        }

        // Skip certain paths
        foreach ($skipPaths as $pattern) {
            if (Str::is($pattern, $path)) {
                return true;
            }
        }

        // Skip GET requests to asset files
        if ($request->isMethod('GET') && $this->isAssetRequest($request)) {
            return true;
        }

        return false;
    }

    /**
     * Check if the request is for an asset file.
     */
    protected function isAssetRequest(Request $request): bool
    {
        $assetExtensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
        $extension = pathinfo($request->path(), PATHINFO_EXTENSION);
        
        return in_array(strtolower($extension), $assetExtensions);
    }

    /**
     * Determine the event type based on the request.
     */
    protected function determineEventType(Request $request, Response $response): string
    {
        $method = $request->method();
        $statusCode = $response->getStatusCode();
        
        // Authentication events
        if (Str::contains($request->path(), 'login')) {
            return $statusCode < 400 ? 'login' : 'failed_login';
        }
        
        if (Str::contains($request->path(), 'logout')) {
            return 'logout';
        }

        // Error events
        if ($statusCode >= 500) {
            return 'server_error';
        }
        
        if ($statusCode >= 400) {
            return 'client_error';
        }

        // CRUD events
        return match($method) {
            'POST' => 'create_request',
            'PUT', 'PATCH' => 'update_request',
            'DELETE' => 'delete_request',
            'GET' => 'view_request',
            default => 'request',
        };
    }

    /**
     * Generate a human-readable description.
     */
    protected function generateDescription(Request $request, Response $response): string
    {
        $method = $request->method();
        $path = $request->path();
        $statusCode = $response->getStatusCode();
        $user = auth()->user();
        $userName = $user ? $user->name : 'Guest';

        // Special cases for authentication
        if (Str::contains($path, 'login')) {
            return $statusCode < 400 
                ? "User '{$userName}' logged in successfully"
                : "Failed login attempt" . ($user ? " for '{$userName}'" : '');
        }

        if (Str::contains($path, 'logout')) {
            return "User '{$userName}' logged out";
        }

        // General request description
        $action = match($method) {
            'POST' => 'created',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            'GET' => 'viewed',
            default => 'accessed',
        };

        $resource = $this->extractResourceFromPath($path);
        
        if ($statusCode >= 400) {
            return "User '{$userName}' failed to {$action} {$resource} (HTTP {$statusCode})";
        }

        return "User '{$userName}' {$action} {$resource}";
    }

    /**
     * Extract resource name from URL path.
     */
    protected function extractResourceFromPath(string $path): string
    {
        $segments = explode('/', trim($path, '/'));
        
        // Remove common prefixes
        $segments = array_filter($segments, function($segment) {
            return !in_array($segment, ['api', 'v1', 'admin']);
        });

        if (empty($segments)) {
            return 'homepage';
        }

        // Get the first meaningful segment
        $resource = $segments[0];
        
        // Humanize the resource name
        return Str::title(str_replace(['-', '_'], ' ', $resource));
    }

    /**
     * Sanitize request data by removing sensitive information.
     */
    protected function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'api_token',
            '_token',
            'remember_token',
            'credit_card',
            'ssn',
            'social_security',
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        // Remove empty values and limit array size
        $data = array_filter($data, function($value) {
            return $value !== null && $value !== '';
        });

        // Limit the size of the data to prevent huge logs
        if (count($data) > 50) {
            $data = array_slice($data, 0, 50, true);
            $data['_truncated'] = 'Data truncated - too many fields';
        }

        return $data;
    }

    /**
     * Get response data for logging.
     */
    protected function getResponseData(Response $response): array
    {
        $content = $response->getContent();
        
        if (!$content) {
            return [];
        }

        // Try to decode JSON response
        $decoded = json_decode($content, true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            // Remove sensitive data from response
            if (isset($decoded['password'])) {
                $decoded['password'] = '[REDACTED]';
            }
            
            // Limit response size
            if (strlen($content) > 1000) {
                return ['message' => 'Response too large to log'];
            }
            
            return $decoded;
        }

        // For non-JSON responses, just return basic info
        return [
            'content_type' => $response->headers->get('content-type'),
            'content_length' => strlen($content),
        ];
    }
}