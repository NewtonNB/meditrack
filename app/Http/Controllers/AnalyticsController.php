<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Display the analytics dashboard - redirect to enhanced dashboard
     */
    public function index(Request $request)
    {
        $data = ['summary' => $this->analyticsService->getDashboardSummary()];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return redirect()->route('dashboard.enhanced');
    }

    /**
     * Get sales trends data
     */
    public function getSalesTrends(Request $request)
    {
        $period = $request->get('period', 'daily');
        $days = $request->get('days', 30);

        return response()->json([
            'trends' => $this->analyticsService->getSalesTrends($period, $days)
        ]);
    }

    /**
     * Get best selling medicines
     */
    public function getBestSellingMedicines(Request $request)
    {
        $limit = $request->get('limit', 10);
        $days = $request->get('days', 30);

        return response()->json([
            'medicines' => $this->analyticsService->getBestSellingMedicines($limit, $days)
        ]);
    }

    /**
     * Get expiring medicines
     */
    public function getExpiringMedicines(Request $request)
    {
        $days = $request->get('days', 30);

        return response()->json([
            'expiring' => $this->analyticsService->getExpiringMedicines($days)
        ]);
    }

    /**
     * Get stock summary
     */
    public function getStockSummary()
    {
        return response()->json([
            'stock' => $this->analyticsService->getStockSummary()
        ]);
    }

    /**
     * Get customer analytics
     */
    public function getCustomerAnalytics()
    {
        return response()->json([
            'customers' => $this->analyticsService->getCustomerAnalytics()
        ]);
    }

    /**
     * Get payment method analytics
     */
    public function getPaymentMethodAnalytics(Request $request)
    {
        $days = $request->get('days', 30);
        $paymentMethods = $this->analyticsService->getPaymentMethodAnalytics($days);

        return response()->json([
            'payment_methods' => $this->calculatePaymentMethodPercentages($paymentMethods)
        ]);
    }

    /**
     * Get dashboard summary
     */
    public function getDashboardSummary()
    {
        return response()->json([
            'summary' => $this->analyticsService->getDashboardSummary()
        ]);
    }

    /**
     * Calculate payment method percentages
     */
    protected function calculatePaymentMethodPercentages($paymentMethods)
    {
        $totalAmount = $paymentMethods->sum('amount');
        
        return $paymentMethods->map(function ($method) use ($totalAmount) {
            $method['percentage'] = $totalAmount > 0 ? ($method['amount'] / $totalAmount) * 100 : 0;
            return $method;
        });
    }
}