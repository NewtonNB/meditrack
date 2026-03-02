<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AI\StockPredictionService;
use App\Models\Medicine;
use App\Models\MLModel;
use App\Models\StockPrediction;
use App\Models\ExpiryAlert;
use App\Models\AnomalyDetection;

class TestAISystem extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ai:test {--service=all : Which service to test (all, stock, expiry, anomaly)}';

    /**
     * The console command description.
     */
    protected $description = 'Test AI system functionality and display results';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $service = $this->option('service');
        
        $this->info('🤖 Testing AI System Components');
        $this->newLine();

        // Test AI service health
        $this->testServiceHealth();
        
        // Test specific services
        if ($service === 'all' || $service === 'stock') {
            $this->testStockPrediction();
        }
        
        if ($service === 'all' || $service === 'expiry') {
            $this->testExpiryAlerts();
        }
        
        if ($service === 'all' || $service === 'anomaly') {
            $this->testAnomalyDetection();
        }
        
        // Display ML Models
        $this->displayMLModels();
        
        $this->newLine();
        $this->info('✅ AI System test completed!');
        
        return Command::SUCCESS;
    }

    private function testServiceHealth(): void
    {
        $this->info('🔍 Testing AI Service Health...');
        
        try {
            $stockService = app(StockPredictionService::class);
            $isReady = $stockService->isReady();
            
            if ($isReady) {
                $this->line('   ✅ AI Service is healthy and responding');
            } else {
                $this->warn('   ⚠️  AI Service is not responding (this is expected if not running)');
                $this->line('   💡 To start the AI service: cd ai_service && python app.py');
            }
        } catch (\Exception $e) {
            $this->error('   ❌ Error testing AI service: ' . $e->getMessage());
        }
        
        $this->newLine();
    }

    private function testStockPrediction(): void
    {
        $this->info('📈 Testing Stock Prediction System...');
        
        try {
            $stockService = app(StockPredictionService::class);
            $medicine = Medicine::first();
            
            if (!$medicine) {
                $this->warn('   ⚠️  No medicines found. Please add some medicines first.');
                return;
            }
            
            $this->line("   Testing prediction for: {$medicine->name}");
            
            // Test prediction
            $prediction = $stockService->predictDemand($medicine->id, 30);
            
            $this->line("   📊 Predicted 30-day demand: {$prediction['predicted_demand']}");
            $this->line("   🎯 Confidence: " . round($prediction['confidence'] * 100, 1) . '%');
            $this->line("   🔧 Method: {$prediction['method']}");
            
            // Test reorder recommendations
            $recommendations = $stockService->getReorderRecommendations();
            $this->line("   📋 Reorder recommendations: " . count($recommendations) . ' items');
            
            // Display stored predictions
            $storedPredictions = StockPrediction::count();
            $this->line("   💾 Stored predictions in database: {$storedPredictions}");
            
        } catch (\Exception $e) {
            $this->error('   ❌ Error testing stock prediction: ' . $e->getMessage());
        }
        
        $this->newLine();
    }

    private function testExpiryAlerts(): void
    {
        $this->info('📅 Testing Expiry Alert System...');
        
        try {
            $totalAlerts = ExpiryAlert::count();
            $pendingAlerts = ExpiryAlert::where('status', 'pending')->count();
            $highRiskAlerts = ExpiryAlert::where('risk_score', '>=', 0.7)->count();
            
            $this->line("   📊 Total expiry alerts: {$totalAlerts}");
            $this->line("   ⏰ Pending alerts: {$pendingAlerts}");
            $this->line("   🚨 High risk alerts: {$highRiskAlerts}");
            
            // Show recent high-risk alert
            $recentAlert = ExpiryAlert::where('risk_score', '>=', 0.7)
                ->with('medicine')
                ->latest()
                ->first();
                
            if ($recentAlert) {
                $this->line("   🔍 Latest high-risk alert:");
                $this->line("      Medicine: {$recentAlert->medicine->name}");
                $this->line("      Risk Score: " . round($recentAlert->risk_score * 100, 1) . '%');
                $this->line("      Expiry Date: {$recentAlert->expiry_date}");
            }
            
        } catch (\Exception $e) {
            $this->error('   ❌ Error testing expiry alerts: ' . $e->getMessage());
        }
        
        $this->newLine();
    }

    private function testAnomalyDetection(): void
    {
        $this->info('🛡️  Testing Anomaly Detection System...');
        
        try {
            $totalAnomalies = AnomalyDetection::count();
            $pendingAnomalies = AnomalyDetection::where('status', 'pending')->count();
            $highRiskAnomalies = AnomalyDetection::where('risk_score', '>=', 0.7)->count();
            $resolvedAnomalies = AnomalyDetection::where('status', 'resolved')->count();
            
            $this->line("   📊 Total anomalies detected: {$totalAnomalies}");
            $this->line("   ⏰ Pending review: {$pendingAnomalies}");
            $this->line("   🚨 High risk: {$highRiskAnomalies}");
            $this->line("   ✅ Resolved: {$resolvedAnomalies}");
            
            // Show recent high-risk anomaly
            $recentAnomaly = AnomalyDetection::where('risk_score', '>=', 0.7)
                ->latest('detected_at')
                ->first();
                
            if ($recentAnomaly) {
                $this->line("   🔍 Latest high-risk anomaly:");
                $this->line("      Type: {$recentAnomaly->anomaly_type}");
                $this->line("      Risk Score: " . round($recentAnomaly->risk_score * 100, 1) . '%');
                $this->line("      Status: {$recentAnomaly->status}");
            }
            
        } catch (\Exception $e) {
            $this->error('   ❌ Error testing anomaly detection: ' . $e->getMessage());
        }
        
        $this->newLine();
    }

    private function displayMLModels(): void
    {
        $this->info('🧠 ML Models Status...');
        
        try {
            $models = MLModel::all();
            
            if ($models->isEmpty()) {
                $this->warn('   ⚠️  No ML models found in database');
                return;
            }
            
            foreach ($models as $model) {
                $accuracy = $model->accuracy_metrics['accuracy'] ?? 'N/A';
                $accuracyPercent = is_numeric($accuracy) ? round($accuracy * 100, 1) . '%' : $accuracy;
                
                $this->line("   🤖 {$model->name} (v{$model->version})");
                $this->line("      Type: {$model->type}");
                $this->line("      Status: {$model->status}");
                $this->line("      Accuracy: {$accuracyPercent}");
                $this->line("      Training Data: " . number_format($model->training_data_size ?? 0) . ' samples');
                $this->newLine();
            }
            
        } catch (\Exception $e) {
            $this->error('   ❌ Error displaying ML models: ' . $e->getMessage());
        }
    }
}