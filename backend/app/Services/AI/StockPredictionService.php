<?php

namespace App\Services\AI;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\StockPrediction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StockPredictionService extends BaseAIService
{
    protected string $modelType = 'stock_prediction';

    /**
     * Predict demand for a specific medicine
     */
    public function predictDemand(int $medicineId, int $days = 30): array
    {
        $cacheKey = $this->generateCacheKey(['medicine_id' => $medicineId, 'days' => $days]);
        
        if ($cached = $this->getCachedResult($cacheKey)) {
            return $cached;
        }

        $medicine = Medicine::findOrFail($medicineId);
        $historicalData = $this->getHistoricalSalesData($medicineId);
        
        if ($historicalData->isEmpty()) {
            return $this->handleNoHistoricalData($medicine, $days);
        }

        try {
            $features = $this->prepareFeatures($medicine, $historicalData, $days);
            $prediction = $this->makeAIRequest('predict/stock', $features);
            
            $result = $this->processPredictionResult($medicine, $prediction, $days);
            $this->storePrediction($medicineId, $result, $days);
            
            $this->logPrediction($features, $result);
            
            return $this->cacheResult($cacheKey, $result);
        } catch (\Exception $e) {
            return $this->fallbackPrediction($medicine, $historicalData, $days);
        }
    }

    /**
     * Get reorder recommendations based on predictions
     */
    public function getReorderRecommendations(): array
    {
        $cacheKey = 'reorder_recommendations';
        
        if ($cached = $this->getCachedResult($cacheKey)) {
            return $cached;
        }

        $medicines = Medicine::all();
        $recommendations = [];

        foreach ($medicines as $medicine) {
            $prediction = $this->predictDemand($medicine->id, 30);
            $currentStock    = $medicine->stock ?? 0;
            $predictedDemand = $prediction['predicted_demand'] ?? 0;
            $safetyStock     = $this->calculateSafetyStock($medicine);
            
            if ($currentStock < ($predictedDemand + $safetyStock)) {
                $recommendations[] = [
                    'medicine_id' => $medicine->id,
                    'medicine_name' => $medicine->name,
                    'current_stock' => $currentStock,
                    'predicted_demand' => $predictedDemand,
                    'safety_stock' => $safetyStock,
                    'recommended_order' => max(0, ($predictedDemand + $safetyStock) - $currentStock),
                    'urgency' => $this->calculateUrgency($currentStock, $predictedDemand, $safetyStock),
                    'confidence' => $prediction['confidence'] ?? 0.5
                ];
            }
        }

        // Sort by urgency (highest first)
        usort($recommendations, fn($a, $b) => $b['urgency'] <=> $a['urgency']);

        return $this->cacheResult($cacheKey, $recommendations);
    }

    /**
     * Analyze seasonal trends for a medicine
     */
    public function analyzeSeasonalTrends(int $medicineId): array
    {
        $cacheKey = $this->generateCacheKey(['seasonal_trends', $medicineId]);
        
        if ($cached = $this->getCachedResult($cacheKey)) {
            return $cached;
        }

        $salesData = $this->getHistoricalSalesData($medicineId, 365 * 2); // 2 years
        
        if ($salesData->count() < 52) { // Need at least 1 year of weekly data
            return ['error' => 'Insufficient data for seasonal analysis'];
        }

        $trends = [
            'monthly_trends' => $this->calculateMonthlyTrends($salesData),
            'weekly_trends' => $this->calculateWeeklyTrends($salesData),
            'seasonal_factors' => $this->calculateSeasonalFactors($salesData),
            'peak_periods' => $this->identifyPeakPeriods($salesData),
            'low_periods' => $this->identifyLowPeriods($salesData)
        ];

        return $this->cacheResult($cacheKey, $trends);
    }

    /**
     * Prepare features for ML model
     */
    protected function prepareFeatures(Medicine $medicine, Collection $salesData, int $days): array
    {
        $recentSales    = $salesData->take(30);
        $avgDailySales  = $recentSales->avg('daily_quantity') ?? 0;
        $salesTrend     = $this->calculateTrend($recentSales);
        $seasonalFactor = $this->getSeasonalFactor($medicine->id);

        return [
            'medicine_id'      => $medicine->id,
            'avg_daily_sales'  => $avgDailySales,
            'sales_trend'      => $salesTrend,
            'seasonal_factor'  => $seasonalFactor,
            'current_stock'    => $medicine->stock ?? 0,
            'price'            => $medicine->selling_price ?? $medicine->unit_price ?? 0,
            'category'         => $medicine->category ?? 'general',
            'days_ahead'       => $days,
            'historical_sales' => $salesData->pluck('daily_quantity')->toArray(),
            'dates'            => $salesData->pluck('date')->toArray(),
        ];
    }

    /**
     * Get historical sales data for a medicine
     * Uses the sales table directly (no sale_items — each row is one line item)
     */
    protected function getHistoricalSalesData(int $medicineId, int $days = 90): Collection
    {
        return DB::table('sales')
            ->where('medicine_id', $medicineId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(quantity) as daily_quantity'),
                DB::raw('SUM(total_price) as daily_revenue')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'), 'desc')
            ->get();
    }

    /**
     * Handle case when no historical data is available
     */
    protected function handleNoHistoricalData(Medicine $medicine, int $days): array
    {
        $categoryAvg     = $this->getCategoryAverageSales($medicine->category ?? 'general');
        $safetyStock     = $medicine->reorder_level ?? 5;
        $currentStock    = $medicine->stock ?? 0;
        $predictedDemand = $categoryAvg * $days;

        return [
            'predicted_demand'   => round($predictedDemand, 1),
            'confidence'         => 0.3,
            'method'             => 'category_average',
            'recommended_action' => $currentStock < $safetyStock ? 'order_immediately' : 'monitor',
            'safety_stock'       => $safetyStock,
            'message'            => 'No sales history found. Prediction based on category average.',
        ];
    }

    /**
     * Fallback prediction when AI service is unavailable
     */
    protected function fallbackPrediction(Medicine $medicine, Collection $salesData, int $days): array
    {
        $avgDailySales  = (float)($salesData->avg('daily_quantity') ?? 0);
        $trend          = $this->calculateTrend($salesData);
        $predictedDemand = max(0, ($avgDailySales * $days) * (1 + $trend));
        $safetyStock     = $this->calculateSafetyStock($medicine);
        $currentStock    = $medicine->stock ?? 0;

        $recommended = 'maintain_stock';
        if ($currentStock < $safetyStock) {
            $recommended = 'order_immediately';
        } elseif ($currentStock < ($predictedDemand + $safetyStock)) {
            $recommended = 'reorder_soon';
        }

        return [
            'predicted_demand'   => round($predictedDemand, 1),
            'confidence'         => 0.6,
            'method'             => 'statistical_fallback',
            'recommended_action' => $recommended,
            'safety_stock'       => round($safetyStock, 1),
            'message'            => 'Prediction calculated from historical sales data.',
        ];
    }

    /**
     * Process AI model prediction result
     */
    protected function processPredictionResult(Medicine $medicine, array $prediction, int $days): array
    {
        $predictedDemand = $prediction['demand'] ?? 0;
        $safetyStock     = $this->calculateSafetyStock($medicine);
        $currentStock    = $medicine->stock ?? 0;

        $recommended = 'maintain_stock';
        if ($currentStock < $safetyStock) {
            $recommended = 'order_immediately';
        } elseif ($currentStock < ($predictedDemand + $safetyStock)) {
            $recommended = 'reorder_soon';
        }

        return [
            'predicted_demand'    => round($predictedDemand, 1),
            'confidence'          => $prediction['confidence'] ?? 0.5,
            'method'              => 'ai_model',
            'recommended_action'  => $recommended,
            'safety_stock'        => round($safetyStock, 1),
            'breakdown'           => $prediction['daily_breakdown'] ?? [],
            'factors'             => $prediction['influencing_factors'] ?? [],
            'model_version'       => $this->currentModel?->version ?? 'unknown',
        ];
    }

    /**
     * Store prediction in database
     */
    protected function storePrediction(int $medicineId, array $result, int $days): void
    {
        StockPrediction::create([
            'medicine_id' => $medicineId,
            'prediction_date' => now()->toDateString(),
            'predicted_demand' => $result['predicted_demand'],
            'confidence_score' => $result['confidence'],
            'prediction_horizon' => $days,
            'model_version' => $result['model_version'] ?? 'unknown'
        ]);
    }

    /**
     * Calculate safety stock for a medicine
     */
    protected function calculateSafetyStock(Medicine $medicine): float
    {
        $salesData = $this->getHistoricalSalesData($medicine->id, 30);

        if ($salesData->isEmpty()) {
            return $medicine->reorder_level ?? 5;
        }

        $stdDev = $this->calculateStandardDeviation(
            $salesData->pluck('daily_quantity')->map(fn($v) => (float)$v)->toArray()
        );

        // Z=1.65 for 95% service level, lead time = 7 days
        return ceil(1.65 * $stdDev * sqrt(7));
    }

    /**
     * Calculate urgency score for reorder recommendations
     */
    protected function calculateUrgency(float $currentStock, float $predictedDemand, float $safetyStock): float
    {
        $totalNeeded = $predictedDemand + $safetyStock;
        
        if ($totalNeeded <= 0) {
            return 0;
        }
        
        $stockRatio = $currentStock / $totalNeeded;
        
        // Urgency increases as stock ratio decreases
        return max(0, min(1, 1 - $stockRatio));
    }

    // Additional helper methods...
    
    protected function calculateTrend(Collection $salesData): float
    {
        if ($salesData->count() < 2) {
            return 0;
        }
        
        $values = $salesData->pluck('daily_quantity')->toArray();
        $n = count($values);
        $x = range(1, $n);
        
        $sumX = array_sum($x);
        $sumY = array_sum($values);
        $sumXY = array_sum(array_map(fn($i) => $x[$i] * $values[$i], range(0, $n - 1)));
        $sumX2 = array_sum(array_map(fn($val) => $val * $val, $x));
        
        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        
        return $slope / (array_sum($values) / $n); // Normalize by average
    }

    protected function calculateStandardDeviation(array $values): float
    {
        if (empty($values)) {
            return 0;
        }
        
        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(fn($val) => pow($val - $mean, 2), $values)) / count($values);
        
        return sqrt($variance);
    }

    protected function getCategoryAverageSales(string $category): float
    {
        return DB::table('sales')
            ->join('medicines', 'sales.medicine_id', '=', 'medicines.id')
            ->where('medicines.category', $category)
            ->where('sales.created_at', '>=', now()->subDays(30))
            ->avg('sales.quantity') ?? 1;
    }

    protected function getSeasonalFactor(int $medicineId): float
    {
        $currentMonth = now()->month;

        $currentMonthSales = DB::table('sales')
            ->where('medicine_id', $medicineId)
            ->whereMonth('created_at', $currentMonth)
            ->avg('quantity') ?? 0;

        $overallAvg = DB::table('sales')
            ->where('medicine_id', $medicineId)
            ->avg('quantity') ?? 1;

        return $overallAvg > 0 ? $currentMonthSales / $overallAvg : 1;
    }

    // Implementation methods for BaseAIService
    
    public function predict(array $data): array
    {
        return $this->predictDemand($data['medicine_id'], $data['days'] ?? 30);
    }

    public function train(array $trainingData): bool
    {
        try {
            $response = $this->makeAIRequest('train/stock', $trainingData);
            return $response['success'] ?? false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function evaluate(): array
    {
        try {
            return $this->makeAIRequest('evaluate/stock', []);
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    protected function calculateMonthlyTrends(Collection $salesData): array
    {
        return $salesData->groupBy(fn($item) => Carbon::parse($item->date)->format('m'))
            ->map(fn($group) => $group->avg('daily_quantity'))
            ->toArray();
    }

    protected function calculateWeeklyTrends(Collection $salesData): array
    {
        return $salesData->groupBy(fn($item) => Carbon::parse($item->date)->dayOfWeek)
            ->map(fn($group) => $group->avg('daily_quantity'))
            ->toArray();
    }

    protected function calculateSeasonalFactors(Collection $salesData): array
    {
        $overallAvg = $salesData->avg('daily_quantity');
        
        return $salesData->groupBy(fn($item) => Carbon::parse($item->date)->quarter)
            ->map(fn($group) => ($group->avg('daily_quantity') / $overallAvg))
            ->toArray();
    }

    protected function identifyPeakPeriods(Collection $salesData): array
    {
        $monthlyAvg = $salesData->groupBy(fn($item) => Carbon::parse($item->date)->format('Y-m'))
            ->map(fn($group) => [
                'period' => $group->first()->date,
                'avg_sales' => $group->avg('daily_quantity')
            ])
            ->sortByDesc('avg_sales')
            ->take(3)
            ->values()
            ->toArray();
            
        return $monthlyAvg;
    }

    protected function identifyLowPeriods(Collection $salesData): array
    {
        $monthlyAvg = $salesData->groupBy(fn($item) => Carbon::parse($item->date)->format('Y-m'))
            ->map(fn($group) => [
                'period' => $group->first()->date,
                'avg_sales' => $group->avg('daily_quantity')
            ])
            ->sortBy('avg_sales')
            ->take(3)
            ->values()
            ->toArray();
            
        return $monthlyAvg;
    }
}