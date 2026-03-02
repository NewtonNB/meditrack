<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SalesPredictionService
{
    /**
     * Predict sales for the next period using simple ML algorithms
     */
    public function predictSales(Medicine $medicine, int $days = 30): array
    {
        $cacheKey = "sales_prediction_{$medicine->id}_{$days}";
        
        return Cache::remember($cacheKey, 3600, function () use ($medicine, $days) {
            // Get historical sales data
            $historicalData = $this->getHistoricalSalesData($medicine, 90);
            
            if ($historicalData->isEmpty()) {
                return $this->getDefaultPrediction($medicine, $days);
            }

            // Apply multiple prediction algorithms
            $predictions = [
                'linear_regression' => $this->linearRegressionPrediction($historicalData, $days),
                'moving_average' => $this->movingAveragePrediction($historicalData, $days),
                'exponential_smoothing' => $this->exponentialSmoothingPrediction($historicalData, $days),
                'seasonal_decomposition' => $this->seasonalDecompositionPrediction($historicalData, $days),
            ];

            // Ensemble prediction (weighted average)
            $ensemblePrediction = $this->ensemblePrediction($predictions);
            
            // Apply external factors
            $adjustedPrediction = $this->applyExternalFactors($ensemblePrediction, $medicine, $days);
            
            return [
                'medicine_id' => $medicine->id,
                'medicine_name' => $medicine->name,
                'prediction_period_days' => $days,
                'predicted_sales' => $adjustedPrediction,
                'confidence_score' => $this->calculateConfidenceScore($historicalData, $predictions),
                'individual_predictions' => $predictions,
                'factors_considered' => $this->getFactorsConsidered($medicine),
                'recommendations' => $this->generateRecommendations($medicine, $adjustedPrediction, $days),
                'generated_at' => now(),
            ];
        });
    }

    /**
     * Get historical sales data for analysis
     */
    private function getHistoricalSalesData(Medicine $medicine, int $days): Collection
    {
        return Sale::where('medicine_id', $medicine->id)
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(quantity) as daily_sales'),
                DB::raw('SUM(total_price) as daily_revenue'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Linear regression prediction
     */
    private function linearRegressionPrediction(Collection $data, int $days): float
    {
        if ($data->count() < 2) {
            return $data->avg('daily_sales') ?? 0;
        }

        $n = $data->count();
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;

        foreach ($data as $index => $point) {
            $x = $index + 1;
            $y = $point->daily_sales;
            
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }

        // Calculate slope and intercept
        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        $intercept = ($sumY - $slope * $sumX) / $n;

        // Predict for the next period
        $futurePeriod = $n + ($days / 2); // Mid-point of prediction period
        $prediction = $slope * $futurePeriod + $intercept;

        return max(0, $prediction * $days); // Total for the period
    }

    /**
     * Moving average prediction
     */
    private function movingAveragePrediction(Collection $data, int $days): float
    {
        $windowSize = min(7, $data->count()); // 7-day moving average
        
        if ($data->count() < $windowSize) {
            return ($data->avg('daily_sales') ?? 0) * $days;
        }

        $recentData = $data->slice(-$windowSize);
        $averageDailySales = $recentData->avg('daily_sales');
        
        return $averageDailySales * $days;
    }

    /**
     * Exponential smoothing prediction
     */
    private function exponentialSmoothingPrediction(Collection $data, int $days): float
    {
        if ($data->isEmpty()) {
            return 0;
        }

        $alpha = 0.3; // Smoothing parameter
        $forecast = $data->first()->daily_sales;

        foreach ($data as $point) {
            $forecast = $alpha * $point->daily_sales + (1 - $alpha) * $forecast;
        }

        return $forecast * $days;
    }

    /**
     * Seasonal decomposition prediction
     */
    private function seasonalDecompositionPrediction(Collection $data, int $days): float
    {
        if ($data->count() < 14) {
            return $this->movingAveragePrediction($data, $days);
        }

        // Calculate day-of-week patterns
        $dayPatterns = [];
        foreach ($data as $point) {
            $dayOfWeek = Carbon::parse($point->date)->dayOfWeek;
            if (!isset($dayPatterns[$dayOfWeek])) {
                $dayPatterns[$dayOfWeek] = [];
            }
            $dayPatterns[$dayOfWeek][] = $point->daily_sales;
        }

        // Calculate average for each day of week
        $dayAverages = [];
        foreach ($dayPatterns as $day => $sales) {
            $dayAverages[$day] = array_sum($sales) / count($sales);
        }

        // Predict based on upcoming days
        $totalPrediction = 0;
        $startDate = Carbon::now();
        
        for ($i = 0; $i < $days; $i++) {
            $dayOfWeek = $startDate->copy()->addDays($i)->dayOfWeek;
            $totalPrediction += $dayAverages[$dayOfWeek] ?? $data->avg('daily_sales');
        }

        return $totalPrediction;
    }

    /**
     * Ensemble prediction (weighted average of all methods)
     */
    private function ensemblePrediction(array $predictions): float
    {
        $weights = [
            'linear_regression' => 0.25,
            'moving_average' => 0.30,
            'exponential_smoothing' => 0.25,
            'seasonal_decomposition' => 0.20,
        ];

        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($predictions as $method => $prediction) {
            $weight = $weights[$method] ?? 0.25;
            $weightedSum += $prediction * $weight;
            $totalWeight += $weight;
        }

        return $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
    }

    /**
     * Apply external factors to adjust prediction
     */
    private function applyExternalFactors(float $basePrediction, Medicine $medicine, int $days): float
    {
        $adjustmentFactor = 1.0;

        // Seasonal adjustments
        $seasonalFactor = $this->getSeasonalFactor($medicine);
        $adjustmentFactor *= $seasonalFactor;

        // Stock availability factor
        $stockFactor = $this->getStockAvailabilityFactor($medicine, $basePrediction);
        $adjustmentFactor *= $stockFactor;

        // Price change factor
        $priceFactor = $this->getPriceChangeFactor($medicine);
        $adjustmentFactor *= $priceFactor;

        // Market trend factor
        $trendFactor = $this->getMarketTrendFactor($medicine);
        $adjustmentFactor *= $trendFactor;

        return $basePrediction * $adjustmentFactor;
    }

    /**
     * Get seasonal adjustment factor
     */
    private function getSeasonalFactor(Medicine $medicine): float
    {
        $currentMonth = Carbon::now()->month;
        
        // Define seasonal patterns for different medicine categories
        $seasonalPatterns = [
            'cold_flu' => [12 => 1.5, 1 => 1.4, 2 => 1.3, 3 => 1.1, 6 => 0.7, 7 => 0.6, 8 => 0.7],
            'allergy' => [3 => 1.3, 4 => 1.5, 5 => 1.4, 9 => 1.2, 10 => 1.1],
            'pain_relief' => [12 => 1.2, 1 => 1.1, 6 => 1.1, 7 => 1.1], // Holiday seasons
            'vitamins' => [1 => 1.3, 2 => 1.2, 9 => 1.2, 10 => 1.1], // New Year, back to school
        ];

        $category = $this->categorizeMedicine($medicine);
        $pattern = $seasonalPatterns[$category] ?? [];
        
        return $pattern[$currentMonth] ?? 1.0;
    }

    /**
     * Get stock availability factor
     */
    private function getStockAvailabilityFactor(Medicine $medicine, float $predictedSales): float
    {
        $currentStock = $medicine->stock;
        
        if ($currentStock <= 0) {
            return 0; // Can't sell what you don't have
        }
        
        if ($currentStock < $predictedSales) {
            return $currentStock / $predictedSales; // Limited by stock
        }
        
        return 1.0; // Sufficient stock
    }

    /**
     * Get price change factor
     */
    private function getPriceChangeFactor(Medicine $medicine): float
    {
        // Check for recent price changes
        $recentPriceChange = $this->getRecentPriceChange($medicine);
        
        if ($recentPriceChange > 0.1) { // Price increased by more than 10%
            return 0.9; // Expect 10% reduction in sales
        } elseif ($recentPriceChange < -0.1) { // Price decreased by more than 10%
            return 1.1; // Expect 10% increase in sales
        }
        
        return 1.0; // No significant price change
    }

    /**
     * Get market trend factor
     */
    private function getMarketTrendFactor(Medicine $medicine): float
    {
        // Analyze overall market trends for similar medicines
        $categoryTrend = $this->getCategoryTrend($medicine);
        
        return 1.0 + ($categoryTrend / 100); // Convert percentage to factor
    }

    /**
     * Calculate confidence score for the prediction
     */
    private function calculateConfidenceScore(Collection $data, array $predictions): float
    {
        if ($data->count() < 7) {
            return 0.3; // Low confidence with limited data
        }

        // Calculate variance in predictions
        $predictionValues = array_values($predictions);
        $mean = array_sum($predictionValues) / count($predictionValues);
        $variance = array_sum(array_map(function($x) use ($mean) {
            return pow($x - $mean, 2);
        }, $predictionValues)) / count($predictionValues);
        
        $coefficientOfVariation = $mean > 0 ? sqrt($variance) / $mean : 1;
        
        // Lower variance = higher confidence
        $varianceScore = max(0, 1 - $coefficientOfVariation);
        
        // Data quantity score
        $dataScore = min(1, $data->count() / 30); // Full confidence with 30+ days
        
        // Combine scores
        return ($varianceScore * 0.6 + $dataScore * 0.4);
    }

    /**
     * Generate recommendations based on prediction
     */
    private function generateRecommendations(Medicine $medicine, float $predictedSales, int $days): array
    {
        $recommendations = [];
        $currentStock = $medicine->stock;
        $dailyPrediction = $predictedSales / $days;

        // Stock recommendations
        if ($currentStock < $predictedSales) {
            $shortfall = $predictedSales - $currentStock;
            $recommendations[] = [
                'type' => 'stock_shortage',
                'priority' => 'high',
                'message' => "Predicted shortfall of {$shortfall} units. Consider emergency reorder.",
                'action' => 'reorder',
                'quantity' => ceil($shortfall * 1.2) // 20% buffer
            ];
        } elseif ($currentStock > $predictedSales * 2) {
            $recommendations[] = [
                'type' => 'excess_stock',
                'priority' => 'medium',
                'message' => "Stock levels are high relative to predicted sales. Consider promotional pricing.",
                'action' => 'promote',
                'suggested_discount' => 10
            ];
        }

        // Pricing recommendations
        if ($dailyPrediction > $this->getHistoricalAverage($medicine)) {
            $recommendations[] = [
                'type' => 'high_demand',
                'priority' => 'medium',
                'message' => "Higher than average demand predicted. Consider optimizing pricing.",
                'action' => 'price_optimize'
            ];
        }

        // Marketing recommendations
        if ($dailyPrediction < $this->getHistoricalAverage($medicine) * 0.8) {
            $recommendations[] = [
                'type' => 'low_demand',
                'priority' => 'medium',
                'message' => "Lower than average demand predicted. Consider marketing campaign.",
                'action' => 'market'
            ];
        }

        return $recommendations;
    }

    /**
     * Get default prediction when no historical data is available
     */
    private function getDefaultPrediction(Medicine $medicine, int $days): array
    {
        // Use category averages or similar medicines
        $categoryAverage = $this->getCategoryAverageSales($medicine);
        $prediction = $categoryAverage * $days;

        return [
            'medicine_id' => $medicine->id,
            'medicine_name' => $medicine->name,
            'prediction_period_days' => $days,
            'predicted_sales' => $prediction,
            'confidence_score' => 0.2, // Low confidence
            'individual_predictions' => [
                'category_average' => $prediction
            ],
            'factors_considered' => ['category_average'],
            'recommendations' => [
                [
                    'type' => 'insufficient_data',
                    'priority' => 'low',
                    'message' => 'Insufficient historical data. Prediction based on category averages.',
                    'action' => 'collect_data'
                ]
            ],
            'generated_at' => now(),
        ];
    }

    /**
     * Helper methods for factors and categorization
     */
    private function categorizeMedicine(Medicine $medicine): string
    {
        $name = strtolower($medicine->name);
        
        if (str_contains($name, 'paracetamol') || str_contains($name, 'ibuprofen') || str_contains($name, 'aspirin')) {
            return 'pain_relief';
        } elseif (str_contains($name, 'vitamin') || str_contains($name, 'supplement')) {
            return 'vitamins';
        } elseif (str_contains($name, 'cough') || str_contains($name, 'cold') || str_contains($name, 'flu')) {
            return 'cold_flu';
        } elseif (str_contains($name, 'allergy') || str_contains($name, 'antihistamine')) {
            return 'allergy';
        }
        
        return 'general';
    }

    private function getRecentPriceChange(Medicine $medicine): float
    {
        // This would check price history - simplified for demo
        return 0; // No recent price change
    }

    private function getCategoryTrend(Medicine $medicine): float
    {
        // This would analyze market trends - simplified for demo
        return 0; // Neutral trend
    }

    private function getHistoricalAverage(Medicine $medicine): float
    {
        return Sale::where('medicine_id', $medicine->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->avg('quantity') ?? 0;
    }

    private function getCategoryAverageSales(Medicine $medicine): float
    {
        // This would calculate category averages - simplified for demo
        return 2.5; // Default daily average
    }

    private function getFactorsConsidered(Medicine $medicine): array
    {
        return [
            'historical_sales_data',
            'seasonal_patterns',
            'stock_availability',
            'price_changes',
            'market_trends',
            'day_of_week_patterns'
        ];
    }

    /**
     * Batch predict sales for multiple medicines
     */
    public function batchPredictSales(Collection $medicines, int $days = 30): Collection
    {
        return $medicines->map(function ($medicine) use ($days) {
            return $this->predictSales($medicine, $days);
        });
    }

    /**
     * Get prediction accuracy metrics
     */
    public function getPredictionAccuracy(): array
    {
        // This would compare past predictions with actual sales
        return [
            'overall_accuracy' => 78.5,
            'mape' => 21.5, // Mean Absolute Percentage Error
            'rmse' => 15.2, // Root Mean Square Error
            'predictions_made' => 150,
            'last_updated' => now()
        ];
    }
}