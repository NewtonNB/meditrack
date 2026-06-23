<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SystemOverviewController extends Controller
{
    public function index(Request $request)
    {
        $data = [
            'stats'        => $this->getSystemStats(),
            'systemHealth' => $this->getSystemHealth(),
            'lastUpdated'  => now()->toISOString(),
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('SystemOverview', $data);
    }

    private function getSystemStats()
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        // Total medicines
        $totalMedicines = Medicine::count();
        $lastMonthMedicines = Medicine::where('created_at', '<', $currentMonth)->count();
        $medicinesGrowth = $lastMonthMedicines > 0 ? 
            (($totalMedicines - $lastMonthMedicines) / $lastMonthMedicines) * 100 : 0;

        // Total customers
        $totalCustomers = Customer::count();
        $lastMonthCustomers = Customer::where('created_at', '<', $currentMonth)->count();
        $customersGrowth = $lastMonthCustomers > 0 ? 
            (($totalCustomers - $lastMonthCustomers) / $lastMonthCustomers) * 100 : 0;

        // Total sales
        $totalSales = Sale::count();
        $lastMonthSales = Sale::where('created_at', '<', $currentMonth)->count();
        $salesGrowth = $lastMonthSales > 0 ? 
            (($totalSales - $lastMonthSales) / $lastMonthSales) * 100 : 0;

        // Total revenue
        $totalRevenue = Sale::sum('total_price') ?? 0;
        $lastMonthRevenue = Sale::where('created_at', '<', $currentMonth)->sum('total_price') ?? 0;
        $revenueGrowth = $lastMonthRevenue > 0 ? 
            (($totalRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0;

        // Additional metrics
        $lowStockMedicines = Medicine::where('stock', '<=', 10)->count();
        $newCustomersThisMonth = Customer::where('created_at', '>=', $currentMonth)->count();
        $activeSuppliers = Supplier::count();
        $todaySales = Sale::whereDate('created_at', today())->count();
        $todayRevenue = Sale::whereDate('created_at', today())->sum('total_price') ?? 0;

        return [
            'totalMedicines' => $totalMedicines,
            'totalCustomers' => $totalCustomers,
            'totalSales' => $totalSales,
            'totalRevenue' => $totalRevenue,
            'medicinesGrowth' => round($medicinesGrowth, 1),
            'customersGrowth' => round($customersGrowth, 1),
            'salesGrowth' => round($salesGrowth, 1),
            'revenueGrowth' => round($revenueGrowth, 1),
            'lowStockMedicines' => $lowStockMedicines,
            'newCustomersThisMonth' => $newCustomersThisMonth,
            'activeSuppliers' => $activeSuppliers,
            'todaySales' => $todaySales,
            'todayRevenue' => $todayRevenue,
        ];
    }

    private function getSystemHealth()
    {
        // Calculate system health based on various metrics
        $healthScore = 100;
        
        // Check for low stock medicines
        $lowStockCount = Medicine::where('stock', '<=', 10)->count();
        $totalMedicines = Medicine::count();
        
        if ($totalMedicines > 0) {
            $lowStockPercentage = ($lowStockCount / $totalMedicines) * 100;
            if ($lowStockPercentage > 20) {
                $healthScore -= 15;
            } elseif ($lowStockPercentage > 10) {
                $healthScore -= 8;
            }
        }
        
        // Check recent activity
        $recentSales = Sale::where('created_at', '>=', Carbon::now()->subDays(7))->count();
        if ($recentSales < 10) {
            $healthScore -= 10;
        }
        
        // Determine health status
        if ($healthScore >= 95) {
            return 'excellent';
        } elseif ($healthScore >= 85) {
            return 'good';
        } elseif ($healthScore >= 70) {
            return 'fair';
        } else {
            return 'poor';
        }
    }

    public function getStats()
    {
        // API endpoint for real-time stats updates
        return response()->json([
            'stats' => $this->getSystemStats(),
            'systemHealth' => $this->getSystemHealth(),
            'lastUpdated' => now()->toISOString(),
        ]);
    }
}