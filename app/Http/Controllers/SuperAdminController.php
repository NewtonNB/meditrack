<?php

namespace App\Http\Controllers;

use App\Models\PharmacyClient;
use App\Models\SubscriptionPlan;
use App\Models\Payment;
use App\Models\User;
use App\Models\Sale;
use App\Models\Medicine;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    public function dashboard(): Response
    {
        // Get system-wide statistics
        $stats = [
            'total_pharmacies' => PharmacyClient::count(),
            'active_pharmacies' => PharmacyClient::where('status', 'active')->count(),
            'suspended_pharmacies' => PharmacyClient::where('status', 'suspended')->count(),
            'total_users' => User::where('role', '!=', 'super_admin')->count(),
            'total_sales' => Sale::sum('total_price'),
            'total_medicines' => Medicine::count(),
            'total_customers' => Customer::count(),
            'monthly_revenue' => Payment::where('status', 'completed')
                ->whereMonth('paid_at', now()->month)
                ->sum('amount'),
        ];

        // Get recent pharmacy registrations
        $recentPharmacies = PharmacyClient::with('users')
            ->latest()
            ->limit(5)
            ->get();

        // Get overdue payments
        $overduePayments = Payment::with('pharmacy')
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->latest('due_date')
            ->limit(5)
            ->get();

        // Get top performing pharmacies
        $topPharmacies = PharmacyClient::withSum('sales', 'total_price')
            ->orderBy('sales_sum_total_price', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'recentPharmacies' => $recentPharmacies,
            'overduePayments' => $overduePayments,
            'topPharmacies' => $topPharmacies,
        ]);
    }

    public function pharmacies(): Response
    {
        $pharmacies = PharmacyClient::with(['users', 'subscriptionPlan'])
            ->withCount(['users', 'medicines', 'customers', 'sales'])
            ->latest()
            ->paginate(15);

        $subscriptionPlans = SubscriptionPlan::where('is_active', true)->get();

        return Inertia::render('SuperAdmin/Pharmacies', [
            'pharmacies' => $pharmacies,
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    public function updatePharmacyStatus(Request $request, PharmacyClient $pharmacy): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:active,suspended,inactive',
        ]);

        $pharmacy->update(['status' => $request->status]);

        return back()->with('success', 'Pharmacy status updated successfully.');
    }

    public function updatePharmacyPlan(Request $request, PharmacyClient $pharmacy): RedirectResponse
    {
        $request->validate([
            'subscription_plan' => 'required|exists:subscription_plans,slug',
            'subscription_expires_at' => 'nullable|date|after:now',
        ]);

        $pharmacy->update([
            'subscription_plan' => $request->subscription_plan,
            'subscription_expires_at' => $request->subscription_expires_at,
        ]);

        return back()->with('success', 'Pharmacy subscription plan updated successfully.');
    }

    public function payments(): Response
    {
        $payments = Payment::with(['pharmacy', 'subscriptionPlan'])
            ->latest()
            ->paginate(15);

        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        $pendingPayments = Payment::where('status', 'pending')->sum('amount');
        $overduePayments = Payment::where('status', 'pending')
            ->where('due_date', '<', now())
            ->sum('amount');

        return Inertia::render('SuperAdmin/Payments', [
            'payments' => $payments,
            'totalRevenue' => $totalRevenue,
            'pendingPayments' => $pendingPayments,
            'overduePayments' => $overduePayments,
        ]);
    }

    public function analytics(): Response
    {
        // Monthly revenue chart data - SQLite compatible
        $monthlyRevenue = Payment::where('status', 'completed')
            ->selectRaw("CAST(strftime('%Y', paid_at) AS INTEGER) as year, CAST(strftime('%m', paid_at) AS INTEGER) as month, SUM(amount) as total")
            ->whereRaw("strftime('%Y', paid_at) = ?", [now()->year])
            ->groupBy('year', 'month')
            ->orderBy('month')
            ->get();

        // Pharmacy registrations over time - SQLite compatible
        $pharmacyRegistrations = PharmacyClient::selectRaw("CAST(strftime('%Y', created_at) AS INTEGER) as year, CAST(strftime('%m', created_at) AS INTEGER) as month, COUNT(*) as count")
            ->whereRaw("strftime('%Y', created_at) = ?", [now()->year])
            ->groupBy('year', 'month')
            ->orderBy('month')
            ->get();

        // Subscription plan distribution
        $planDistribution = PharmacyClient::selectRaw('subscription_plan, COUNT(*) as count')
            ->groupBy('subscription_plan')
            ->get();

        return Inertia::render('SuperAdmin/Analytics', [
            'monthlyRevenue' => $monthlyRevenue,
            'pharmacyRegistrations' => $pharmacyRegistrations,
            'planDistribution' => $planDistribution,
        ]);
    }

    public function settings(): Response
    {
        $subscriptionPlans = SubscriptionPlan::latest()->get();

        return Inertia::render('SuperAdmin/Settings', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    public function createSubscriptionPlan(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_plans',
            'description' => 'nullable|string',
            'monthly_price' => 'required|numeric|min:0',
            'max_users' => 'required|integer|min:1',
            'max_medicines' => 'required|integer|min:1',
            'max_customers' => 'required|integer|min:1',
            'features' => 'nullable|array',
        ]);

        SubscriptionPlan::create($request->all());

        return back()->with('success', 'Subscription plan created successfully.');
    }

    public function updateSubscriptionPlan(Request $request, SubscriptionPlan $plan): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'monthly_price' => 'required|numeric|min:0',
            'max_users' => 'required|integer|min:1',
            'max_medicines' => 'required|integer|min:1',
            'max_customers' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $plan->update($request->all());

        return back()->with('success', 'Subscription plan updated successfully.');
    }
}
