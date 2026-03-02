<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimit
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->ip();
        
        if (RateLimiter::tooManyAttempts($key, 60)) { // 60 requests per minute
            return response()->json([
                'error' => 'Too many requests. Please try again later.'
            ], 429);
        }
        
        RateLimiter::hit($key, 60);
        
        return $next($request);
    }
}