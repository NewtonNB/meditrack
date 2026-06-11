<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\PharmacyClient;

class CheckSubscriptionExpiry
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            
            // Skip check for super admin
            if ($user->isSuperAdmin()) {
                return $next($request);
            }
            
            // Check if user has a pharmacy
            if ($user->pharmacy_id) {
                $pharmacy = PharmacyClient::find($user->pharmacy_id);
                
                if ($pharmacy && $pharmacy->subscription_expires_at) {
                    // Check if subscription is expired
                    if ($pharmacy->subscription_expires_at->isPast()) {
                        // Logout user and redirect to subscription expired page
                        auth()->logout();
                        
                        return redirect()->route('subscription.expired')
                            ->with('error', 'Your subscription has expired. Please renew to continue using the service.');
                    }
                    
                    // Check if subscription expires in 3 days (warning)
                    if ($pharmacy->subscription_expires_at->diffInDays(now()) <= 3) {
                        $request->session()->flash('subscription_warning', [
                            'message' => 'Your subscription expires in ' . $pharmacy->subscription_expires_at->diffInDays(now()) . ' days.',
                            'expires_at' => $pharmacy->subscription_expires_at->format('M d, Y'),
                            'pharmacy_id' => $pharmacy->id
                        ]);
                    }
                }
            }
        }

        return $next($request);
    }
}
