<?php

namespace App\Http\Controllers;

use App\Models\AnomalyDetection;
use App\Models\ExpiryAlert;
use App\Models\Medicine;
use App\Models\StockPrediction;
use App\Services\AI\StockPredictionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class AIController extends Controller
{
    protected StockPredictionService $stockPredictionService;

    public function __construct(StockPredictionService $stockPredictionService)
    {
        $this->stockPredictionService = $stockPredictionService;
    }

    /**
     * Get stock prediction for a specific medicine
     */
    public function getStockPrediction(Request $request, Medicine $medicine): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'days' => 'integer|min:1|max:365'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $days = $request->get('days', 30);

        try {
            $prediction = $this->stockPredictionService->predictDemand($medicine->id, $days);
            
            return response()->json([
                'success' => true,
                'medicine' => [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'current_stock' => $medicine->stock_quantity ?? 0
                ],
                'prediction' => $prediction,
                'generated_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate prediction',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get reorder recommendations
     */
    public function getReorderRecommendations(): JsonResponse
    {
        try {
            $recommendations = $this->stockPredictionService->getReorderRecommendations();
            
            return response()->json([
                'success' => true,
                'recommendations' => $recommendations,
                'total_items' => count($recommendations),
                'generated_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate recommendations',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get seasonal trends for a medicine
     */
    public function getSeasonalTrends(Medicine $medicine): JsonResponse
    {
        try {
            $trends = $this->stockPredictionService->analyzeSeasonalTrends($medicine->id);
            
            return response()->json([
                'success' => true,
                'medicine' => [
                    'id' => $medicine->id,
                    'name' => $medicine->name
                ],
                'trends' => $trends,
                'generated_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to analyze trends',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get expiry alerts
     */
    public function getExpiryAlerts(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'string|in:pending,acknowledged,resolved',
            'risk_level' => 'string|in:low,medium,high,critical',
            'days_ahead' => 'integer|min:1|max:365'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = ExpiryAlert::with('medicine');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('risk_level')) {
            $riskThresholds = [
                'low' => [0, 0.4],
                'medium' => [0.4, 0.6],
                'high' => [0.6, 0.8],
                'critical' => [0.8, 1.0]
            ];
            
            $threshold = $riskThresholds[$request->risk_level];
            $query->whereBetween('risk_score', $threshold);
        }

        if ($request->has('days_ahead')) {
            $query->where('expiry_date', '<=', now()->addDays($request->days_ahead));
        }

        $alerts = $query->orderBy('risk_score', 'desc')
            ->orderBy('expiry_date', 'asc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'alerts' => $alerts->items(),
            'pagination' => [
                'current_page' => $alerts->currentPage(),
                'total_pages' => $alerts->lastPage(),
                'total_items' => $alerts->total(),
                'per_page' => $alerts->perPage()
            ]
        ]);
    }

    /**
     * Acknowledge an expiry alert
     */
    public function acknowledgeExpiryAlert(ExpiryAlert $alert): JsonResponse
    {
        try {
            $alert->acknowledge();
            
            return response()->json([
                'success' => true,
                'message' => 'Alert acknowledged successfully',
                'alert' => $alert->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to acknowledge alert',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get anomaly detections
     */
    public function getAnomalies(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'string|in:pending,investigating,resolved,false_positive',
            'transaction_type' => 'string|in:sale,purchase,prescription',
            'risk_level' => 'string|in:low,medium,high,critical',
            'date_from' => 'date',
            'date_to' => 'date'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = AnomalyDetection::with('reviewer');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->has('risk_level')) {
            $riskThresholds = [
                'low' => [0, 0.4],
                'medium' => [0.4, 0.6],
                'high' => [0.6, 0.8],
                'critical' => [0.8, 1.0]
            ];
            
            $threshold = $riskThresholds[$request->risk_level];
            $query->whereBetween('risk_score', $threshold);
        }

        if ($request->has('date_from')) {
            $query->where('detected_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('detected_at', '<=', $request->date_to);
        }

        $anomalies = $query->orderBy('risk_score', 'desc')
            ->orderBy('detected_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'anomalies' => $anomalies->items(),
            'pagination' => [
                'current_page' => $anomalies->currentPage(),
                'total_pages' => $anomalies->lastPage(),
                'total_items' => $anomalies->total(),
                'per_page' => $anomalies->perPage()
            ]
        ]);
    }

    /**
     * Review an anomaly detection
     */
    public function reviewAnomaly(Request $request, AnomalyDetection $anomaly): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:investigating,resolved,false_positive',
            'notes' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();
            
            switch ($request->status) {
                case 'investigating':
                    $anomaly->markAsInvestigating($user);
                    break;
                case 'resolved':
                    $anomaly->resolve($user, $request->notes);
                    break;
                case 'false_positive':
                    $anomaly->markAsFalsePositive($user, $request->notes);
                    break;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Anomaly reviewed successfully',
                'anomaly' => $anomaly->fresh(['reviewer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to review anomaly',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get anomaly detection dashboard data
     */
    public function getAnomalyDashboard(): JsonResponse
    {
        $cacheKey = 'anomaly_dashboard';
        
        $data = Cache::remember($cacheKey, 300, function () { // 5 minutes cache
            return [
                'summary' => [
                    'total_anomalies' => AnomalyDetection::count(),
                    'pending_review' => AnomalyDetection::where('status', 'pending')->count(),
                    'high_risk' => AnomalyDetection::where('risk_score', '>=', 0.7)->count(),
                    'resolved_today' => AnomalyDetection::where('status', 'resolved')
                        ->whereDate('updated_at', today())->count()
                ],
                'by_type' => AnomalyDetection::selectRaw('anomaly_type, COUNT(*) as count')
                    ->groupBy('anomaly_type')
                    ->pluck('count', 'anomaly_type'),
                'by_transaction_type' => AnomalyDetection::selectRaw('transaction_type, COUNT(*) as count')
                    ->groupBy('transaction_type')
                    ->pluck('count', 'transaction_type'),
                'recent_high_risk' => AnomalyDetection::where('risk_score', '>=', 0.8)
                    ->where('status', 'pending')
                    ->orderBy('detected_at', 'desc')
                    ->limit(5)
                    ->get(),
                'trends' => $this->getAnomalyTrends()
            ];
        });

        return response()->json([
            'success' => true,
            'dashboard' => $data,
            'generated_at' => now()->toISOString()
        ]);
    }

    /**
     * Retrain stock prediction model
     */
    public function retrainStockModel(Request $request): JsonResponse
    {
        try {
            // This would typically be handled by a queue job
            $success = $this->stockPredictionService->train([
                'retrain_all' => $request->boolean('retrain_all', false),
                'medicine_ids' => $request->get('medicine_ids', [])
            ]);
            
            return response()->json([
                'success' => $success,
                'message' => $success ? 'Model retraining initiated' : 'Failed to initiate retraining',
                'initiated_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to initiate model retraining',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get AI service health status
     */
    public function getServiceHealth(): JsonResponse
    {
        $services = [
            'stock_prediction' => $this->stockPredictionService->isReady(),
            // Add other services when implemented
        ];

        $allHealthy = !in_array(false, $services);

        return response()->json([
            'success' => true,
            'overall_health' => $allHealthy ? 'healthy' : 'degraded',
            'services' => $services,
            'checked_at' => now()->toISOString()
        ]);
    }

    /**
     * Get anomaly trends for dashboard
     */
    protected function getAnomalyTrends(): array
    {
        $last30Days = collect(range(0, 29))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();
            return [
                'date' => $date,
                'count' => AnomalyDetection::whereDate('detected_at', $date)->count()
            ];
        })->reverse()->values();

        return $last30Days->toArray();
    }
}