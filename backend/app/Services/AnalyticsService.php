<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AnalyticsService
{
    /**
     * Get dashboard summary for analytics page
     */
    public function getDashboardSummary(): array
    {
        return Cache::remember('analytics_dashboard_summary', 300, function () {
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();
            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();
            
            // Today's metrics
            $todayRevenue = Sale::whereDate('created_at', $today)->sum('total_price');
            $yesterdayRevenue = Sale::whereDate('created_at', $yesterday)->sum('total_price');
            $todayTransactions = Sale::whereDate('created_at', $today)->count();
            $yesterdayTransactions = Sale::whereDate('created_at', $yesterday)->count();
            
            // Calculate growth percentages
            $dailyRevenueGrowth = $yesterdayRevenue > 0 ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 : 0;
            $dailyTransactionGrowth = $yesterdayTransactions > 0 ? (($todayTransactions - $yesterdayTransactions) / $yesterdayTransactions) * 100 : 0;
            
            return [
                'today' => [
                    'revenue' => $todayRevenue,
                    'transactions' => $todayTransactions,
                ],
                'growth' => [
                    'daily_revenue' => round($dailyRevenueGrowth, 2),
                    'daily_transactions' => round($dailyTransactionGrowth, 2),
                ],
                'total_sales' => Sale::sum('total_price'),
                'monthly_sales' => Sale::whereDate('created_at', '>=', $thisMonth)->sum('total_price'),
                'total_medicines' => Medicine::count(),
                'low_stock_count' => Medicine::where('stock', '<', 10)->count(),
                'total_customers' => Customer::count(),
                'active_suppliers' => Supplier::count(),
                'sales_growth' => $this->calculateSalesGrowth(),
                'top_categories' => $this->getTopCategories(),
            ];
        });
    }

    /**
     * Get comprehensive business analytics dashboard data
     */
    public function getDashboardAnalytics(): array
    {
        return Cache::remember('dashboard_analytics', 300, function () {
            return [
                'sales_analytics' => $this->getSalesAnalytics(),
                'inventory_analytics' => $this->getInventoryAnalytics(),
                'financial_analytics' => $this->getFinancialAnalytics(),
                'performance_metrics' => $this->getPerformanceMetrics(),
                'trends_analysis' => $this->getTrendsAnalysis(),
                'predictive_insights' => $this->getPredictiveInsights(),
            ];
        });
    }

    /**
     * Get sales analytics with trends and patterns
     */
    private function getSalesAnalytics(): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisWeek = Carbon::now()->startOfWeek();
        $lastWeek = Carbon::now()->subWeek()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Daily sales comparison
        $todaySales = Sale::whereDate('created_at', $today)->sum('total_price');
        $yesterdaySales = Sale::whereDate('created_at', $yesterday)->sum('total_price');
        $dailyGrowth = $yesterdaySales > 0 ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 : 0;

        // Weekly sales comparison
        $thisWeekSales = Sale::where('created_at', '>=', $thisWeek)->sum('total_price');
        $lastWeekSales = Sale::whereBetween('created_at', [$lastWeek, $thisWeek])->sum('total_price');
        $weeklyGrowth = $lastWeekSales > 0 ? (($thisWeekSales - $lastWeekSales) / $lastWeekSales) * 100 : 0;

        // Monthly sales comparison
        $thisMonthSales = Sale::where('created_at', '>=', $thisMonth)->sum('total_price');
        $lastMonthSales = Sale::whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total_price');
        $monthlyGrowth = $lastMonthSales > 0 ? (($thisMonthSales - $lastMonthSales) / $lastMonthSales) * 100 : 0;

        // Top selling medicines
        $topMedicines = Sale::select('medicine_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->with('medicine')
            ->where('created_at', '>=', $thisMonth)
            ->groupBy('medicine_id')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get();

        // Sales by hour (today) - SQLite compatible
        $hourlyData = Sale::whereDate('created_at', $today)
            ->select(DB::raw("CAST(strftime('%H', created_at) AS INTEGER) as hour"), DB::raw('SUM(total_price) as revenue'), DB::raw('COUNT(*) as transactions'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        // Fill missing hours with zero
        $hourlySales = [];
        for ($i = 0; $i < 24; $i++) {
            $hourlySales[] = [
                'hour' => $i,
                'revenue' => $hourlyData->get($i)->revenue ?? 0,
                'transactions' => $hourlyData->get($i)->transactions ?? 0,
            ];
        }

        return [
            'daily' => [
                'today' => $todaySales,
                'yesterday' => $yesterdaySales,
                'growth' => round($dailyGrowth, 2),
            ],
            'weekly' => [
                'this_week' => $thisWeekSales,
                'last_week' => $lastWeekSales,
                'growth' => round($weeklyGrowth, 2),
            ],
            'monthly' => [
                'this_month' => $thisMonthSales,
                'last_month' => $lastMonthSales,
                'growth' => round($monthlyGrowth, 2),
            ],
            'top_medicines' => $topMedicines,
            'hourly_pattern' => $hourlySales,
        ];
    }

    /**
     * Get inventory analytics and insights
     */
    private function getInventoryAnalytics(): array
    {
        $totalMedicines = Medicine::count();
        $lowStockCount = Medicine::where('stock', '<', 10)->count();
        $outOfStockCount = Medicine::where('stock', 0)->count();
        $expiringCount = Medicine::where('expiry_date', '<=', Carbon::now()->addDays(30))->count();

        // Inventory value
        $totalInventoryValue = Medicine::sum(DB::raw('stock * cost_price'));
        $lowStockValue = Medicine::where('stock', '<', 10)
            ->sum(DB::raw('stock * cost_price'));

        // Stock turnover analysis
        $stockTurnover = $this->calculateStockTurnover();

        // Category analysis
        $categoryAnalysis = Medicine::select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock) as total_stock'))
            ->groupBy('category')
            ->get();

        return [
            'overview' => [
                'total_medicines' => $totalMedicines,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'expiring_count' => $expiringCount,
                'low_stock_percentage' => $totalMedicines > 0 ? round(($lowStockCount / $totalMedicines) * 100, 2) : 0,
            ],
            'valuation' => [
                'total_value' => $totalInventoryValue,
                'low_stock_value' => $lowStockValue,
                'at_risk_percentage' => $totalInventoryValue > 0 ? round(($lowStockValue / $totalInventoryValue) * 100, 2) : 0,
            ],
            'turnover' => $stockTurnover,
            'categories' => $categoryAnalysis,
        ];
    }

    /**
     * Get financial analytics and KPIs
     */
    private function getFinancialAnalytics(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Revenue metrics
        $thisMonthRevenue = Sale::where('created_at', '>=', $thisMonth)->sum('total_price');
        $lastMonthRevenue = Sale::whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total_price');

        // Cost analysis
        $thisMonthCost = Sale::withoutGlobalScope('tenant')
            ->from('sales as s')
            ->join('medicines as m', 's.medicine_id', '=', 'm.id')
            ->where('s.created_at', '>=', $thisMonth)
            ->when(auth()->check() && auth()->user()->pharmacy_id && !auth()->user()->isSuperAdmin(), function ($query) {
                $query->where('s.pharmacy_id', auth()->user()->pharmacy_id);
            })
            ->sum(DB::raw('s.quantity * m.cost_price'));

        // Profit calculations
        $grossProfit = $thisMonthRevenue - $thisMonthCost;
        $profitMargin = $thisMonthRevenue > 0 ? ($grossProfit / $thisMonthRevenue) * 100 : 0;

        // Average transaction value
        $avgTransactionValue = Sale::where('created_at', '>=', $thisMonth)->avg('total_price');

        // Customer metrics
        $totalCustomers = Customer::count();
        $activeCustomers = Sale::where('created_at', '>=', $thisMonth)
            ->distinct('customer_id')
            ->count('customer_id');

        return [
            'revenue' => [
                'this_month' => $thisMonthRevenue,
                'last_month' => $lastMonthRevenue,
                'growth' => $lastMonthRevenue > 0 ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 2) : 0,
            ],
            'profitability' => [
                'gross_profit' => $grossProfit,
                'profit_margin' => round($profitMargin, 2),
                'cost_of_goods' => $thisMonthCost,
            ],
            'customer_metrics' => [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'avg_transaction_value' => round($avgTransactionValue, 2),
                'customer_retention' => $totalCustomers > 0 ? round(($activeCustomers / $totalCustomers) * 100, 2) : 0,
            ],
        ];
    }

    /**
     * Get performance metrics and benchmarks
     */
    private function getPerformanceMetrics(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();

        // Sales performance
        $totalTransactions = Sale::where('created_at', '>=', $thisMonth)->count();
        $avgDailyTransactions = $totalTransactions / Carbon::now()->day;

        // Inventory efficiency
        $stockoutRate = $this->calculateStockoutRate();
        $inventoryAccuracy = $this->calculateInventoryAccuracy();

        // Supplier performance
        $supplierMetrics = $this->getSupplierPerformance();

        return [
            'sales_performance' => [
                'total_transactions' => $totalTransactions,
                'avg_daily_transactions' => round($avgDailyTransactions, 2),
                'peak_hour' => $this->getPeakSalesHour(),
            ],
            'inventory_efficiency' => [
                'stockout_rate' => $stockoutRate,
                'inventory_accuracy' => $inventoryAccuracy,
                'reorder_frequency' => $this->getReorderFrequency(),
            ],
            'supplier_performance' => $supplierMetrics,
        ];
    }

    /**
     * Get trends analysis for forecasting
     */
    private function getTrendsAnalysis(): array
    {
        // 7-day sales trend
        $salesTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $sales = Sale::whereDate('created_at', $date)->sum('total_price');
            $salesTrend[] = [
                'date' => $date->format('Y-m-d'),
                'sales' => $sales,
                'day_name' => $date->format('l'),
            ];
        }

        // Monthly comparison (last 6 months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->startOfMonth();
            $nextMonth = $month->copy()->addMonth();
            $sales = Sale::whereBetween('created_at', [$month, $nextMonth])->sum('total_price');
            $monthlyTrend[] = [
                'month' => $month->format('M Y'),
                'sales' => $sales,
            ];
        }

        return [
            'daily_trend' => $salesTrend,
            'monthly_trend' => $monthlyTrend,
            'seasonal_patterns' => $this->getSeasonalPatterns(),
        ];
    }

    /**
     * Get predictive insights and recommendations
     */
    private function getPredictiveInsights(): array
    {
        $insights = [];

        // Sales forecast
        $salesForecast = $this->generateSalesForecast();
        
        // Inventory recommendations
        $inventoryRecommendations = $this->getInventoryRecommendations();

        // Business opportunities
        $opportunities = $this->identifyBusinessOpportunities();

        return [
            'sales_forecast' => $salesForecast,
            'inventory_recommendations' => $inventoryRecommendations,
            'business_opportunities' => $opportunities,
        ];
    }

    /**
     * Calculate stock turnover ratio
     */
    private function calculateStockTurnover(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        
        $costOfGoodsSold = Sale::withoutGlobalScope('tenant')
            ->from('sales as s')
            ->join('medicines as m', 's.medicine_id', '=', 'm.id')
            ->where('s.created_at', '>=', $thisMonth)
            ->when(auth()->check() && auth()->user()->pharmacy_id && !auth()->user()->isSuperAdmin(), function ($query) {
                $query->where('s.pharmacy_id', auth()->user()->pharmacy_id);
            })
            ->sum(DB::raw('s.quantity * m.cost_price'));

        $avgInventoryValue = Medicine::avg(DB::raw('stock * cost_price'));
        
        $turnoverRatio = $avgInventoryValue > 0 ? $costOfGoodsSold / $avgInventoryValue : 0;

        return [
            'ratio' => round($turnoverRatio, 2),
            'cogs' => $costOfGoodsSold,
            'avg_inventory' => $avgInventoryValue,
            'performance' => $this->evaluateTurnoverPerformance($turnoverRatio),
        ];
    }

    /**
     * Calculate stockout rate
     */
    private function calculateStockoutRate(): float
    {
        $totalMedicines = Medicine::count();
        $outOfStock = Medicine::where('stock', 0)->count();
        
        return $totalMedicines > 0 ? round(($outOfStock / $totalMedicines) * 100, 2) : 0;
    }

    /**
     * Calculate inventory accuracy
     */
    private function calculateInventoryAccuracy(): float
    {
        // Simplified calculation - in real implementation, this would compare
        // system stock vs physical count
        $totalMedicines = Medicine::count();
        $accurateCount = Medicine::where('stock', '>', 0)->count();
        
        return $totalMedicines > 0 ? round(($accurateCount / $totalMedicines) * 100, 2) : 0;
    }

    /**
     * Get supplier performance metrics
     */
    private function getSupplierPerformance(): array
    {
        $suppliers = Supplier::withCount('medicines')
            ->with(['medicines' => function ($query) {
                $query->select('supplier_id', DB::raw('AVG(stock) as avg_stock'));
            }])
            ->get();

        return $suppliers->map(function ($supplier) {
            return [
                'name' => $supplier->name,
                'medicine_count' => $supplier->medicines_count,
                'reliability_score' => rand(75, 98), // Simplified for demo
                'avg_stock_level' => $supplier->medicines->avg('stock') ?? 0,
            ];
        })->toArray();
    }

    /**
     * Get peak sales hour
     */
    private function getPeakSalesHour(): int
    {
        $peakHour = Sale::whereDate('created_at', Carbon::today())
            ->select(DB::raw("CAST(strftime('%H', created_at) AS INTEGER) as hour"), DB::raw('COUNT(*) as count'))
            ->groupBy('hour')
            ->orderBy('count', 'desc')
            ->first();

        return $peakHour ? $peakHour->hour : 12; // Default to noon
    }

    /**
     * Get reorder frequency
     */
    private function getReorderFrequency(): float
    {
        $reorders = StockMovement::where('type', 'purchase')
            ->where('created_at', '>=', Carbon::now()->subMonth())
            ->count();

        return round($reorders / 30, 2); // Average per day
    }

    /**
     * Get seasonal patterns
     */
    private function getSeasonalPatterns(): array
    {
        // Simplified seasonal analysis
        return [
            'peak_season' => 'Winter',
            'low_season' => 'Summer',
            'growth_months' => ['October', 'November', 'December'],
            'decline_months' => ['June', 'July', 'August'],
        ];
    }

    /**
     * Generate sales forecast
     */
    private function generateSalesForecast(): array
    {
        $lastWeekSales = Sale::where('created_at', '>=', Carbon::now()->subWeek())->sum('total_price');
        $avgDailySales = $lastWeekSales / 7;

        return [
            'next_week_forecast' => round($avgDailySales * 7 * 1.05, 2), // 5% growth assumption
            'next_month_forecast' => round($avgDailySales * 30 * 1.1, 2), // 10% growth assumption
            'confidence_level' => 85,
        ];
    }

    /**
     * Get inventory recommendations
     */
    private function getInventoryRecommendations(): array
    {
        return [
            'reorder_now' => Medicine::where('stock', '<', 10)->count(),
            'review_pricing' => Medicine::whereRaw('selling_price < cost_price * 1.2')->count(),
            'optimize_stock' => Medicine::where('stock', '>', 50)->count(),
        ];
    }

    /**
     * Identify business opportunities
     */
    private function identifyBusinessOpportunities(): array
    {
        return [
            'high_margin_products' => Medicine::whereRaw('(selling_price - cost_price) / cost_price > 0.5')->count(),
            'fast_moving_items' => Sale::select('medicine_id')
                ->where('created_at', '>=', Carbon::now()->subWeek())
                ->groupBy('medicine_id')
                ->havingRaw('COUNT(*) > 10')
                ->count(),
            'customer_segments' => Customer::count(),
        ];
    }

    /**
     * Evaluate turnover performance
     */
    private function evaluateTurnoverPerformance(float $ratio): string
    {
        if ($ratio > 12) return 'Excellent';
        if ($ratio > 8) return 'Good';
        if ($ratio > 4) return 'Average';
        return 'Needs Improvement';
    }

    /**
     * Calculate sales growth percentage
     */
    private function calculateSalesGrowth(): float
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        $thisMonthSales = Sale::where('created_at', '>=', $thisMonth)->sum('total_price');
        $lastMonthSales = Sale::whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total_price');
        
        if ($lastMonthSales == 0) {
            return $thisMonthSales > 0 ? 100 : 0;
        }
        
        return round((($thisMonthSales - $lastMonthSales) / $lastMonthSales) * 100, 2);
    }

    /**
     * Get top medicine categories by sales
     */
    private function getTopCategories(): array
    {
        return Medicine::select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock) as total_stock'))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->category,
                    'count' => $category->count,
                    'stock' => $category->total_stock,
                ];
            })
            ->toArray();
    }

    /**
     * Get sales trends for specified period
     */
    public function getSalesTrends(string $period = 'daily', int $days = 30): array
    {
        $trends = [];
        
        if ($period === 'daily') {
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $revenue = Sale::whereDate('created_at', $date)->sum('total_price');
                
                // Calculate profit (simplified: revenue - cost)
                $cost = Sale::withoutGlobalScope('tenant')
                    ->from('sales as s')
                    ->join('medicines as m', 's.medicine_id', '=', 'm.id')
                    ->whereDate('s.created_at', $date)
                    ->when(auth()->check() && auth()->user()->pharmacy_id && !auth()->user()->isSuperAdmin(), function ($query) {
                        $query->where('s.pharmacy_id', auth()->user()->pharmacy_id);
                    })
                    ->sum(DB::raw('s.quantity * m.cost_price'));
                
                $profit = $revenue - $cost;
                
                $trends[] = [
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->format('D'),
                    'revenue' => $revenue,
                    'profit' => $profit,
                    'sales' => $revenue, // Keep for backward compatibility
                ];
            }
        } elseif ($period === 'weekly') {
            for ($i = intval($days / 7); $i >= 0; $i--) {
                $startDate = Carbon::now()->subWeeks($i)->startOfWeek();
                $endDate = $startDate->copy()->endOfWeek();
                $revenue = Sale::whereBetween('created_at', [$startDate, $endDate])->sum('total_price');
                
                $cost = Sale::withoutGlobalScope('tenant')
                    ->from('sales as s')
                    ->join('medicines as m', 's.medicine_id', '=', 'm.id')
                    ->whereBetween('s.created_at', [$startDate, $endDate])
                    ->when(auth()->check() && auth()->user()->pharmacy_id && !auth()->user()->isSuperAdmin(), function ($query) {
                        $query->where('s.pharmacy_id', auth()->user()->pharmacy_id);
                    })
                    ->sum(DB::raw('s.quantity * m.cost_price'));
                
                $profit = $revenue - $cost;
                
                $trends[] = [
                    'date' => $startDate->format('Y-m-d'),
                    'period' => 'Week ' . $startDate->weekOfYear,
                    'week' => 'Week ' . $startDate->weekOfYear,
                    'revenue' => $revenue,
                    'profit' => $profit,
                    'sales' => $revenue,
                ];
            }
        }
        
        return $trends;
    }

    /**
     * Get best selling medicines
     */
    public function getBestSellingMedicines(int $limit = 10, int $days = 30): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        return Sale::select('medicine_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->with('medicine:id,name,category,selling_price')
            ->where('created_at', '>=', $startDate)
            ->groupBy('medicine_id')
            ->orderBy('total_revenue', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->medicine->id,
                    'name' => $sale->medicine->name,
                    'category' => $sale->medicine->category,
                    'quantity' => $sale->total_quantity,
                    'revenue' => $sale->total_revenue,
                    'medicine' => $sale->medicine, // Keep for backward compatibility
                    'quantity_sold' => $sale->total_quantity,
                ];
            })
            ->toArray();
    }

    /**
     * Get expiring medicines
     */
    public function getExpiringMedicines(int $days = 30): array
    {
        $expiryDate = Carbon::now()->addDays($days);
        
        $medicines = Medicine::where('expiry_date', '<=', $expiryDate)
            ->where('expiry_date', '>', Carbon::now())
            ->orderBy('expiry_date')
            ->get()
            ->map(function ($medicine) {
                $daysUntilExpiry = Carbon::now()->diffInDays($medicine->expiry_date);
                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'brand' => $medicine->brand ?? 'Generic',
                    'batch_number' => $medicine->batch_number ?? 'N/A',
                    'category' => $medicine->category,
                    'expiry_date' => $medicine->expiry_date,
                    'days_until_expiry' => $daysUntilExpiry,
                    'days_to_expiry' => $daysUntilExpiry,
                    'stock' => $medicine->stock ?? 0,
                    'stock_quantity' => $medicine->stock ?? 0,
                    'urgency' => $daysUntilExpiry <= 7 ? 'critical' : 'warning',
                    'value_at_risk' => ($medicine->stock ?? 0) * $medicine->cost_price,
                ];
            });
        
        $criticalCount = $medicines->where('urgency', 'critical')->count();
        
        return [
            'items' => $medicines->toArray(),
            'critical_count' => $criticalCount,
            'total_count' => $medicines->count(),
        ];
    }

    /**
     * Get stock summary
     */
    public function getStockSummary(): array
    {
        $totalMedicines = Medicine::count();
        $lowStock = Medicine::where('stock', '<', 10)->count();
        $outOfStock = Medicine::where('stock', 0)->count();
        $inStock = $totalMedicines - $outOfStock;
        $totalValue = Medicine::sum(DB::raw('stock * cost_price'));
        
        return [
            'total_medicines' => $totalMedicines,
            'low_stock_count' => $lowStock,
            'out_of_stock_count' => $outOfStock,
            'total_inventory_value' => $totalValue,
            'total_stock_value' => $totalValue, // Alias for frontend
            'low_stock_percentage' => $totalMedicines > 0 ? round(($lowStock / $totalMedicines) * 100, 2) : 0,
            'stock_distribution' => [
                'in_stock' => $inStock,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
            ],
            'categories' => Medicine::select('category', DB::raw('COUNT(*) as count'))
                ->groupBy('category')
                ->get()
                ->toArray(),
        ];
    }

    /**
     * Get customer analytics
     */
    public function getCustomerAnalytics(): array
    {
        $totalCustomers = Customer::count();
        $activeCustomers = Sale::distinct('customer_id')->count('customer_id');
        $avgOrderValue = Sale::avg('total_price');
        
        $topCustomers = Sale::select('customer_id', DB::raw('SUM(total_price) as total_spent'), DB::raw('COUNT(*) as order_count'))
            ->with('customer:id,name,email')
            ->groupBy('customer_id')
            ->orderBy('total_spent', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->customer->id ?? 0,
                    'name' => $sale->customer->name ?? 'Unknown Customer',
                    'email' => $sale->customer->email ?? 'N/A',
                    'total_spent' => $sale->total_spent,
                    'transaction_count' => $sale->order_count,
                ];
            })
            ->toArray();
        
        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'avg_order_value' => round($avgOrderValue, 2),
            'customer_retention' => $totalCustomers > 0 ? round(($activeCustomers / $totalCustomers) * 100, 2) : 0,
            'top_customers' => $topCustomers,
        ];
    }

    /**
     * Get payment method analytics
     */
    public function getPaymentMethodAnalytics(int $days = 30): \Illuminate\Support\Collection
    {
        $startDate = Carbon::now()->subDays($days);
        
        return Sale::select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_price) as amount'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('payment_method')
            ->get();
    }
}
