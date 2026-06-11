<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MLModel;
use App\Models\StockPrediction;
use App\Models\ExpiryAlert;
use App\Models\AnomalyDetection;
use App\Models\Medicine;
use App\Models\User;
use Carbon\Carbon;

class AISystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create ML Models
        $this->createMLModels();
        
        // Create sample predictions and alerts if medicines exist
        if (Medicine::count() > 0) {
            $this->createStockPredictions();
            $this->createExpiryAlerts();
            $this->createAnomalyDetections();
        }
    }

    private function createMLModels(): void
    {
        $models = [
            [
                'name' => 'Stock Demand Forecaster',
                'version' => '1.0.0',
                'type' => 'stock_prediction',
                'status' => 'deployed',
                'accuracy_metrics' => [
                    'accuracy' => 0.85,
                    'precision' => 0.82,
                    'recall' => 0.88,
                    'f1_score' => 0.85,
                    'mae' => 2.3,
                    'rmse' => 3.1
                ],
                'training_data_size' => 10000,
                'deployed_at' => now()->subDays(7),
                'hyperparameters' => [
                    'seasonality_mode' => 'multiplicative',
                    'yearly_seasonality' => true,
                    'weekly_seasonality' => true,
                    'daily_seasonality' => false,
                    'changepoint_prior_scale' => 0.05
                ]
            ],
            [
                'name' => 'Expiry Risk Classifier',
                'version' => '1.0.0',
                'type' => 'expiry_prediction',
                'status' => 'deployed',
                'accuracy_metrics' => [
                    'accuracy' => 0.92,
                    'precision' => 0.89,
                    'recall' => 0.94,
                    'f1_score' => 0.91,
                    'auc_roc' => 0.96
                ],
                'training_data_size' => 5000,
                'deployed_at' => now()->subDays(5),
                'hyperparameters' => [
                    'n_estimators' => 100,
                    'max_depth' => 6,
                    'learning_rate' => 0.1,
                    'subsample' => 0.8
                ]
            ],
            [
                'name' => 'Transaction Anomaly Detector',
                'version' => '1.0.0',
                'type' => 'anomaly_detection',
                'status' => 'deployed',
                'accuracy_metrics' => [
                    'accuracy' => 0.88,
                    'precision' => 0.85,
                    'recall' => 0.91,
                    'f1_score' => 0.88,
                    'false_positive_rate' => 0.05
                ],
                'training_data_size' => 15000,
                'deployed_at' => now()->subDays(3),
                'hyperparameters' => [
                    'contamination' => 0.1,
                    'n_neighbors' => 20,
                    'algorithm' => 'auto'
                ]
            ]
        ];

        foreach ($models as $modelData) {
            MLModel::create($modelData);
        }
    }

    private function createStockPredictions(): void
    {
        $medicines = Medicine::take(10)->get();
        
        foreach ($medicines as $medicine) {
            // Create predictions for the next 30 days
            for ($i = 0; $i < 5; $i++) {
                $predictionDate = now()->addDays($i);
                $baseDemand = rand(5, 50);
                $confidence = 0.6 + (rand(0, 30) / 100); // 0.6 to 0.9
                
                StockPrediction::create([
                    'medicine_id' => $medicine->id,
                    'prediction_date' => $predictionDate->toDateString(),
                    'predicted_demand' => $baseDemand + rand(-5, 10),
                    'confidence_score' => $confidence,
                    'prediction_horizon' => 30,
                    'model_version' => '1.0.0',
                    'actual_demand' => $i < 2 ? $baseDemand + rand(-3, 3) : null, // Only past predictions have actual values
                    'accuracy_score' => $i < 2 ? 0.8 + (rand(0, 15) / 100) : null
                ]);
            }
        }
    }

    private function createExpiryAlerts(): void
    {
        $medicines = Medicine::take(8)->get();
        
        foreach ($medicines as $medicine) {
            $expiryDate = now()->addDays(rand(7, 180)); // 7 days to 6 months
            $daysToExpiry = now()->diffInDays($expiryDate);
            
            // Calculate risk score based on days to expiry
            $riskScore = 0.1;
            if ($daysToExpiry <= 7) {
                $riskScore = 0.9 + (rand(0, 10) / 100);
            } elseif ($daysToExpiry <= 30) {
                $riskScore = 0.6 + (rand(0, 20) / 100);
            } elseif ($daysToExpiry <= 90) {
                $riskScore = 0.3 + (rand(0, 20) / 100);
            }
            
            $recommendations = [
                'Consider promotional pricing to increase sales velocity',
                'Contact regular customers about upcoming expiry',
                'Bundle with popular items to move inventory',
                'Donate to charity if approaching expiry',
                'Return to supplier if within return policy'
            ];
            
            ExpiryAlert::create([
                'medicine_id' => $medicine->id,
                'batch_number' => 'BATCH-' . strtoupper(substr(md5($medicine->id . time()), 0, 8)),
                'expiry_date' => $expiryDate->toDateString(),
                'alert_date' => now()->toDateString(),
                'risk_score' => $riskScore,
                'recommended_action' => $recommendations[array_rand($recommendations)],
                'status' => rand(0, 10) < 7 ? 'pending' : (rand(0, 1) ? 'acknowledged' : 'resolved'),
                'resolved_at' => rand(0, 10) < 3 ? now()->subDays(rand(1, 5)) : null
            ]);
        }
    }

    private function createAnomalyDetections(): void
    {
        $users = User::all();
        $anomalyTypes = [
            'Unusual transaction amount',
            'High quantity purchase',
            'Suspicious prescription pattern',
            'Off-hours transaction',
            'New customer high-value purchase',
            'Rapid successive transactions',
            'Prescription validation failure',
            'Inventory discrepancy'
        ];
        
        $descriptions = [
            'Transaction amount significantly higher than customer average',
            'Quantity purchased exceeds normal patterns for this medicine',
            'Prescription shows signs of potential forgery or alteration',
            'Transaction occurred outside normal business hours',
            'New customer making unusually large purchase',
            'Multiple transactions in short time period',
            'Prescription failed automated validation checks',
            'Stock levels don\'t match expected quantities'
        ];

        for ($i = 0; $i < 15; $i++) {
            $typeIndex = array_rand($anomalyTypes);
            $riskScore = 0.3 + (rand(0, 70) / 100); // 0.3 to 1.0
            $status = 'pending';
            $reviewedBy = null;
            $resolutionNotes = null;
            
            // Some anomalies are already reviewed
            if (rand(0, 10) < 4) {
                $status = ['investigating', 'resolved', 'false_positive'][rand(0, 2)];
                $reviewedBy = $users->random()->id;
                
                if ($status === 'resolved') {
                    $resolutionNotes = 'Investigation completed. Issue resolved through additional verification.';
                } elseif ($status === 'false_positive') {
                    $resolutionNotes = 'Determined to be normal business activity after review.';
                }
            }
            
            AnomalyDetection::create([
                'transaction_type' => ['sale', 'purchase', 'prescription'][rand(0, 2)],
                'transaction_id' => rand(1000, 9999),
                'anomaly_type' => $anomalyTypes[$typeIndex],
                'risk_score' => $riskScore,
                'description' => $descriptions[$typeIndex],
                'detected_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                'status' => $status,
                'reviewed_by' => $reviewedBy,
                'resolution_notes' => $resolutionNotes
            ]);
        }
    }
}