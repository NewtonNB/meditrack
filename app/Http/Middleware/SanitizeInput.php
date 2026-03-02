<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$input) {
            if (is_string($input)) {
                // Remove potentially dangerous characters
                $input = strip_tags($input);
                $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
            }
        });
        
        $request->merge($input);
        
        return $next($request);
    }
}