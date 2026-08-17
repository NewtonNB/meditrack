<?php

namespace App\Services\AI;

use App\Contracts\AIServiceInterface;
use App\Models\MLModel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class BaseAIService implements AIServiceInterface
{
    protected string $modelType;
    protected string $apiEndpoint;
    protected int $cacheTimeout = 3600; // 1 hour
    protected MLModel $currentModel;

    public function __construct()
    {
        $this->apiEndpoint = config('ai.api_endpoint', 'http://localhost:5000');
        $this->loadCurrentModel();
    }

    /**
     * Load the current deployed model for this service type
     */
    protected function loadCurrentModel(): void
    {
        $this->currentModel = MLModel::where('type', $this->modelType)
            ->where('status', 'deployed')
            ->latest('deployed_at')
            ->first();

        if (!$this->currentModel) {
            Log::warning("No deployed model found for type: {$this->modelType}");
        }
    }

    /**
     * Make HTTP request to AI service
     */
    protected function makeAIRequest(string $endpoint, array $data): array
    {
        try {
            $response = Http::timeout(3) // Fast fail — no external AI server in this environment
                ->connectTimeout(2)
                ->post("{$this->apiEndpoint}/{$endpoint}", [
                    'data' => $data,
                    'model_version' => $this->currentModel?->version ?? 'latest'
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            throw new \Exception("AI service request failed: " . $response->body());
        } catch (\Exception $e) {
            Log::debug("AI service unavailable, using fallback: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cache prediction results
     */
    protected function cacheResult(string $key, array $result): array
    {
        Cache::put($key, $result, $this->cacheTimeout);
        return $result;
    }

    /**
     * Get cached result if available
     */
    protected function getCachedResult(string $key): ?array
    {
        return Cache::get($key);
    }

    /**
     * Generate cache key for predictions
     */
    protected function generateCacheKey(array $data): string
    {
        return $this->modelType . '_' . md5(serialize($data));
    }

    public function isReady(): bool
    {
        try {
            $response = Http::timeout(2)->connectTimeout(1)->get("{$this->apiEndpoint}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false; // External AI server not available — statistical fallback is used instead
        }
    }

    public function getModelInfo(): array
    {
        if (!$this->currentModel) {
            return ['error' => 'No model deployed'];
        }

        return [
            'name' => $this->currentModel->name,
            'version' => $this->currentModel->version,
            'type' => $this->currentModel->type,
            'status' => $this->currentModel->status,
            'accuracy_metrics' => $this->currentModel->accuracy_metrics,
            'deployed_at' => $this->currentModel->deployed_at,
        ];
    }

    /**
     * Log prediction for monitoring and improvement
     */
    protected function logPrediction(array $input, array $output): void
    {
        Log::info("AI Prediction", [
            'service' => $this->modelType,
            'model_version' => $this->currentModel?->version,
            'input_size' => count($input),
            'output_size' => count($output),
            'timestamp' => now()
        ]);
    }
}