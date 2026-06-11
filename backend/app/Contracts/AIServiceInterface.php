<?php

namespace App\Contracts;

interface AIServiceInterface
{
    /**
     * Make predictions based on input data
     */
    public function predict(array $data): array;

    /**
     * Train the model with training data
     */
    public function train(array $trainingData): bool;

    /**
     * Evaluate model performance
     */
    public function evaluate(): array;

    /**
     * Get model information and metadata
     */
    public function getModelInfo(): array;

    /**
     * Check if the service is available and ready
     */
    public function isReady(): bool;
}