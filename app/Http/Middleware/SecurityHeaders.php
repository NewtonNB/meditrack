<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Apply in all environments; some headers vary by env
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'no-referrer-when-downgrade');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Permissions-Policy', "geolocation=(), camera=(), microphone=(), interest-cohort=()");

        // Only set a conservative CSP in production to avoid blocking Vite dev
        if (app()->environment('production')) {
            $csp = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; font-src 'self' https: data:; connect-src 'self' https:";
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}