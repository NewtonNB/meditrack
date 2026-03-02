<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\PharmacyClient;

class SetPharmacyContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            
            // Set pharmacy context for non-super-admin users
            if ($user->pharmacy_id && !$user->isSuperAdmin()) {
                $pharmacy = PharmacyClient::find($user->pharmacy_id);
                
                if ($pharmacy) {
                    // Add pharmacy info to the request
                    $request->merge(['pharmacy' => $pharmacy]);
                    
                    // Share pharmacy context with Inertia
                    if ($request->header('X-Inertia')) {
                        $request->merge([
                            'pharmacy_context' => [
                                'id' => $pharmacy->id,
                                'name' => $pharmacy->name,
                                'slug' => $pharmacy->slug,
                                'subscription_plan' => $pharmacy->subscription_plan,
                                'status' => $pharmacy->status,
                            ]
                        ]);
                    }
                }
            }
        }

        return $next($request);
    }
}
