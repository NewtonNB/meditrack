<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\AutomationService;
use App\Services\AnalyticsService;
use App\Services\ActivityTrackingService;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Supplier;
use Carbon\Carbon;

class DashboardController extends Controller
{
    protected $automationService;
    protected $analyticsService;
    protected $activityTrackingService;

    public function __construct(
        AutomationService $automationService, 
        AnalyticsService $analyticsService,
        ActivityTrackingService $activityTrackingService
    ) {
        $this->automationService = $automationService;
        $this->analyticsService = $analyticsService;
        $this->activityTrackingService = $activityTrackingService;
    }

    /**
     * Display the main dashboard.
     * Returns JSON for API requests, Inertia for web.
     */
    public function index(Request $request)
    {
        try {
            $stats             = $this->getBasicStats();
            $automationSummary = $this->automationService->getDashboardSummary();
            $recentActivities  = $this->getRecentActivities();
            $quickInsights     = $this->getQuickInsights();

            $data = [
                'stats'             => $stats,
                'automationSummary' => $automationSummary,
                'recentActivities'  => $recentActivities,
                'quickInsights'     => $quickInsights,
            ];

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($data);
            }

            return Inertia::render('Dashboard', $data);

        } catch (\Exception $e) {
            \Log::error('Dashboard error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user'  => auth()->id(),
            ]);

            $fallback = [
                'stats'             => [
                    'medicines' => ['total' => 0, 'low_stock' => 0, 'expiring_soon' => 0],
                    'sales'     => ['today' => 0, 'today_revenue' => 0, 'this_month' => 0, 'this_month_revenue' => 0],
                    'customers' => ['total' => 0, 'new_this_month' => 0],
                    'suppliers' => ['total' => 0, 'active' => 0],
                ],
                'automationSummary' => [],
                'recentActivities'  => [],
                'quickInsights'     => [[
                    'type'    => 'danger',
                    'title'   => 'Dashboard Error',
                    'message' => 'There was an issue loading dashboard data. Please refresh.',
                    'icon'    => 'exclamation-triangle',
                ]],
                'error' => 'Dashboard data could not be loaded.',
            ];

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($fallback, 500);
            }

            return Inertia::render('Dashboard', $fallback);
        }
    }

    /**
     * Enhanced analytics dashboard.
     */
    public function enhanced(Request $request)
    {
        $data = [
            'analytics'   => $this->analyticsService->getDashboardAnalytics(),
            'automation'  => $this->automationService->getDashboardSummary(),
            'performance' => $this->getPerformanceMetrics(),
            'trends'      => $this->getTrendAnalysis(),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Dashboard/Enhanced', $data);
    }

    /**
     * Get basic dashboard statistics
     */
    private function getBasicStats(): array
    {
        $today = Carbon::today();
        
        try {
            return [
                'medicines' => [
                    'total' => Medicine::count() ?? 0,
                    'low_stock' => Medicine::where('stock', '<', 10)->count() ?? 0,
                    'expiring_soon' => Medicine::where('expiry_date', '<=', Carbon::now()->addDays(30))
                        ->where('expiry_date', '>', Carbon::now())
                        ->count() ?? 0,
                ],
                'sales' => [
                    'today' => Sale::whereDate('created_at', $today)->count() ?? 0,
                    'today_revenue' => Sale::whereDate('created_at', $today)->sum('total_price') ?? 0,
                    'this_month' => Sale::whereMonth('created_at', Carbon::now()->month)->count() ?? 0,
                    'this_month_revenue' => Sale::whereMonth('created_at', Carbon::now()->month)->sum('total_price') ?? 0,
                ],
                'customers' => [
                    'total' => Customer::count() ?? 0,
                    'new_this_month' => Customer::whereMonth('created_at', Carbon::now()->month)->count() ?? 0,
                ],
                'suppliers' => [
                    'total' => Supplier::count() ?? 0,
                    'active' => Supplier::whereHas('medicines')->count() ?? 0,
                ],
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting basic stats: ' . $e->getMessage());
            
            // Return safe defaults
            return [
                'medicines' => ['total' => 0, 'low_stock' => 0, 'expiring_soon' => 0],
                'sales' => ['today' => 0, 'today_revenue' => 0, 'this_month' => 0, 'this_month_revenue' => 0],
                'customers' => ['total' => 0, 'new_this_month' => 0],
                'suppliers' => ['total' => 0, 'active' => 0],
            ];
        }
    }

    /**
     * Get recent activities for the dashboard
     */
    private function getRecentActivities(): array
    {
        $activities = collect();

        // Recent sales with detailed information
        $recentSales = Sale::with(['medicine', 'customer'])
            ->latest()
            ->take(8)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'type' => 'sale',
                    'title' => 'Sale Completed',
                    'description' => "{$sale->medicine->name} sold to " . ($sale->customer->name ?? 'Walk-in Customer'),
                    'details' => "Qty: {$sale->quantity} • Invoice: #{$sale->id}",
                    'amount' => $sale->total_price,
                    'time' => $sale->created_at->diffForHumans(),
                    'timestamp' => $sale->created_at->timestamp,
                    'icon' => 'bi-receipt',
                    'color' => 'green',
                    'bg_color' => 'bg-green-100',
                    'text_color' => 'text-green-700',
                    'route' => '/sales/' . $sale->id,
                ];
            });

        // Recent medicine additions/updates
        $recentMedicines = Medicine::with('supplier')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($medicine) {
                return [
                    'id' => $medicine->id,
                    'type' => 'medicine',
                    'title' => 'Medicine Added',
                    'description' => "{$medicine->name} from " . ($medicine->supplier->name ?? 'Unknown Supplier'),
                    'details' => "Stock: {$medicine->stock} • Batch: " . ($medicine->batch_number ?? 'N/A'),
                    'amount' => null,
                    'time' => $medicine->created_at->diffForHumans(),
                    'timestamp' => $medicine->created_at->timestamp,
                    'icon' => 'bi-capsule',
                    'color' => 'blue',
                    'bg_color' => 'bg-blue-100',
                    'text_color' => 'text-blue-700',
                    'route' => '/medicines/' . $medicine->id,
                ];
            });

        // Recent customers
        $recentCustomers = Customer::latest()
            ->take(4)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'type' => 'customer',
                    'title' => 'New Customer',
                    'description' => "{$customer->name} registered",
                    'details' => "Email: " . ($customer->email ?? 'N/A') . " • Phone: " . ($customer->phone ?? 'N/A'),
                    'amount' => null,
                    'time' => $customer->created_at->diffForHumans(),
                    'timestamp' => $customer->created_at->timestamp,
                    'icon' => 'bi-person-plus',
                    'color' => 'purple',
                    'bg_color' => 'bg-purple-100',
                    'text_color' => 'text-purple-700',
                    'route' => '/customers/' . $customer->id,
                ];
            });

        // Recent suppliers
        $recentSuppliers = Supplier::latest()
            ->take(3)
            ->get()
            ->map(function ($supplier) {
                return [
                    'id' => $supplier->id,
                    'type' => 'supplier',
                    'title' => 'Supplier Added',
                    'description' => "{$supplier->name} registered",
                    'details' => "Contact: " . ($supplier->phone ?? $supplier->email ?? 'N/A'),
                    'amount' => null,
                    'time' => $supplier->created_at->diffForHumans(),
                    'timestamp' => $supplier->created_at->timestamp,
                    'icon' => 'bi-building',
                    'color' => 'orange',
                    'bg_color' => 'bg-orange-100',
                    'text_color' => 'text-orange-700',
                    'route' => '/suppliers/' . $supplier->id,
                ];
            });

        // System activities (low stock alerts, expiry warnings)
        $systemActivities = collect();
        
        // Low stock alerts
        $lowStockMedicines = Medicine::where('stock', '<', 10)
            ->latest('updated_at')
            ->take(3)
            ->get()
            ->map(function ($medicine) {
                return [
                    'id' => 'low-stock-' . $medicine->id,
                    'type' => 'alert',
                    'title' => 'Low Stock Alert',
                    'description' => "{$medicine->name} is running low",
                    'details' => "Current stock: {$medicine->stock} units",
                    'amount' => null,
                    'time' => $medicine->updated_at->diffForHumans(),
                    'timestamp' => $medicine->updated_at->timestamp,
                    'icon' => 'bi-exclamation-triangle',
                    'color' => 'red',
                    'bg_color' => 'bg-red-100',
                    'text_color' => 'text-red-700',
                    'route' => '/medicines/' . $medicine->id,
                ];
            });

        // Expiry warnings
        $expiringMedicines = Medicine::where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->where('expiry_date', '>', Carbon::now())
            ->latest('expiry_date')
            ->take(2)
            ->get()
            ->map(function ($medicine) {
                $daysToExpiry = Carbon::now()->diffInDays($medicine->expiry_date);
                return [
                    'id' => 'expiry-' . $medicine->id,
                    'type' => 'warning',
                    'title' => 'Expiry Warning',
                    'description' => "{$medicine->name} expires soon",
                    'details' => "Expires in {$daysToExpiry} days • Stock: {$medicine->stock}",
                    'amount' => null,
                    'time' => "Expires " . $medicine->expiry_date->diffForHumans(),
                    'timestamp' => $medicine->expiry_date->timestamp,
                    'icon' => 'bi-clock',
                    'color' => 'yellow',
                    'bg_color' => 'bg-yellow-100',
                    'text_color' => 'text-yellow-700',
                    'route' => '/medicines/' . $medicine->id,
                ];
            });

        // Merge all activities
        $activities = $activities
            ->merge($recentSales)
            ->merge($recentMedicines)
            ->merge($recentCustomers)
            ->merge($recentSuppliers)
            ->merge($lowStockMedicines)
            ->merge($expiringMedicines);

        // Sort by timestamp (most recent first) and take top 15
        $sortedActivities = $activities
            ->sortByDesc('timestamp')
            ->take(15)
            ->values()
            ->toArray();

        return $sortedActivities;
    }

    /**
     * Get quick insights for the dashboard
     */
    private function getQuickInsights(): array
    {
        $insights = [];

        // Stock insights
        $lowStockCount = Medicine::where('stock', '<', 10)->count();
        if ($lowStockCount > 0) {
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Low Stock Alert',
                'message' => "{$lowStockCount} medicines are running low on stock",
                'action'  => 'View Reorder Suggestions',
                'route'   => '/automation',
                'icon'    => 'exclamation-triangle',
            ];
        }

        // Expiry insights
        $expiringCount = Medicine::where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->where('expiry_date', '>', Carbon::now())
            ->count();
        if ($expiringCount > 0) {
            $insights[] = [
                'type'    => 'danger',
                'title'   => 'Expiry Alert',
                'message' => "{$expiringCount} medicines expiring within 30 days",
                'action'  => 'View Expiry Alerts',
                'route'   => '/medicines',
                'icon'    => 'clock',
            ];
        }

        // Sales insights
        $todayRevenue = Sale::whereDate('created_at', Carbon::today())->sum('total_price');
        $yesterdayRevenue = Sale::whereDate('created_at', Carbon::yesterday())->sum('total_price');
        
        if ($todayRevenue > $yesterdayRevenue) {
            $increase = (($todayRevenue - $yesterdayRevenue) / max($yesterdayRevenue, 1)) * 100;
            $insights[] = [
                'type'    => 'success',
                'title'   => 'Sales Growth',
                'message' => "Revenue increased by " . number_format($increase, 1) . "% from yesterday",
                'action'  => 'View Sales Report',
                'route'   => '/reports',
                'icon'    => 'trending-up',
            ];
        }

        // Automation insights
        $automationSummary = $this->automationService->getDashboardSummary();
        if (!empty($automationSummary['quick_actions'])) {
            foreach ($automationSummary['quick_actions'] as $action) {
                $insights[] = [
                    'type'    => $action['priority'] === 'critical' ? 'danger' : 'warning',
                    'title'   => 'Smart Automation',
                    'message' => $action['title'],
                    'action'  => $action['action'],
                    'route'   => $action['route'],
                    'icon'    => 'robot',
                ];
            }
        }

        return array_slice($insights, 0, 5); // Limit to 5 insights
    }

    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        $thisMonthSales = Sale::where('created_at', '>=', $thisMonth)->sum('total_price');
        $lastMonthSales = Sale::whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total_price');
        
        $salesGrowth = $lastMonthSales > 0 
            ? (($thisMonthSales - $lastMonthSales) / $lastMonthSales) * 100 
            : 0;

        return [
            'sales_growth' => round($salesGrowth, 2),
            'inventory_turnover' => $this->calculateInventoryTurnover(),
            'customer_satisfaction' => 95, // Placeholder - could be calculated from reviews/feedback
            'automation_efficiency' => $this->calculateAutomationEfficiency(),
        ];
    }

    /**
     * Get trend analysis data
     */
    private function getTrendAnalysis(): array
    {
        $last30Days = collect(range(0, 29))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo);
            return [
                'date' => $date->format('Y-m-d'),
                'sales' => Sale::whereDate('created_at', $date)->sum('total_price'),
                'transactions' => Sale::whereDate('created_at', $date)->count(),
            ];
        })->reverse()->values();

        return [
            'daily_sales' => $last30Days->toArray(),
            'top_selling_medicines' => $this->getTopSellingMedicines(),
            'seasonal_trends' => $this->getSeasonalTrends(),
        ];
    }

    /**
     * Calculate inventory turnover ratio
     */
    private function calculateInventoryTurnover(): float
    {
        $totalInventoryValue = Medicine::sum(\DB::raw('stock * cost_price'));
        $monthlySales = Sale::whereMonth('created_at', Carbon::now()->month)->sum('total_price');
        
        return $totalInventoryValue > 0 ? round($monthlySales / $totalInventoryValue, 2) : 0;
    }

    /**
     * Calculate automation efficiency score
     */
    private function calculateAutomationEfficiency(): int
    {
        $reorderSuggestions = $this->automationService->getReorderSuggestions();
        $expiryReminders = $this->automationService->getExpiryReminders();
        
        $totalIssues = $reorderSuggestions->count() + $expiryReminders->count();
        $criticalIssues = $reorderSuggestions->where('urgency_level', 'critical')->count() + 
                         $expiryReminders->where('urgency_level', 'critical')->count();
        
        // Higher efficiency when fewer critical issues
        $efficiency = $totalIssues > 0 ? (1 - ($criticalIssues / $totalIssues)) * 100 : 100;
        
        return max(0, min(100, round($efficiency)));
    }

    /**
     * Get top selling medicines
     */
    private function getTopSellingMedicines(): array
    {
        return Sale::select('medicine_id', \DB::raw('SUM(quantity) as total_sold'), \DB::raw('SUM(total_price) as total_revenue'))
            ->with('medicine')
            ->whereMonth('created_at', Carbon::now()->month)
            ->groupBy('medicine_id')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'name' => $sale->medicine->name,
                    'quantity_sold' => $sale->total_sold,
                    'revenue' => $sale->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Get seasonal trends (placeholder)
     */
    private function getSeasonalTrends(): array
    {
        // This could be enhanced with actual seasonal analysis
        return [
            'current_season' => 'Autumn',
            'trending_categories' => ['Cold & Flu', 'Vitamins', 'Pain Relief'],
            'seasonal_growth' => 15.5,
        ];
    }
}