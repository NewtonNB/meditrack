<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Sale;

class PricingConsistencyService
{
    /**
     * Get the correct selling price for a medicine
     */
    public function getMedicineSellingPrice(Medicine $medicine): float
    {
        // Primary: Use selling_price if available
        if ($medicine->selling_price && $medicine->selling_price > 0) {
            return (float) $medicine->selling_price;
        }
        
        // Fallback: Use price field if available
        if ($medicine->price && $medicine->price > 0) {
            return (float) $medicine->price;
        }
        
        // Last resort: Calculate from cost_price with default markup
        if ($medicine->cost_price && $medicine->cost_price > 0) {
            return (float) ($medicine->cost_price * 1.5); // 50% markup
        }
        
        // If all else fails, return 0 (should trigger validation error)
        return 0.0;
    }
    
    /**
     * Validate medicine pricing
     */
    public function validateMedicinePricing(Medicine $medicine): array
    {
        $issues = [];
        
        if (!$medicine->selling_price || $medicine->selling_price <= 0) {
            $issues[] = "Missing selling price";
        }
        
        if (!$medicine->cost_price || $medicine->cost_price <= 0) {
            $issues[] = "Missing cost price";
        }
        
        if ($medicine->selling_price && $medicine->cost_price) {
            if ($medicine->selling_price < $medicine->cost_price) {
                $issues[] = "Selling price is lower than cost price";
            }
            
            $margin = (($medicine->selling_price - $medicine->cost_price) / $medicine->cost_price) * 100;
            if ($margin > 500) {
                $issues[] = "Markup is unusually high (" . round($margin, 1) . "%)";
            }
        }
        
        return $issues;
    }
    
    /**
     * Fix medicine pricing issues
     */
    public function fixMedicinePricing(Medicine $medicine): bool
    {
        $updated = false;
        
        // Fix missing selling price
        if ((!$medicine->selling_price || $medicine->selling_price <= 0) && $medicine->cost_price > 0) {
            $medicine->selling_price = $medicine->cost_price * 1.5; // 50% markup
            $updated = true;
        }
        
        // Fix missing cost price
        if ((!$medicine->cost_price || $medicine->cost_price <= 0) && $medicine->selling_price > 0) {
            $medicine->cost_price = $medicine->selling_price / 1.5; // Estimate cost
            $updated = true;
        }
        
        if ($updated) {
            $medicine->save();
        }
        
        return $updated;
    }
    
    /**
     * Ensure sale uses correct pricing
     */
    public function validateSalePricing(Sale $sale): array
    {
        $issues = [];
        
        if (!$sale->medicine) {
            $issues[] = "Medicine not found";
            return $issues;
        }
        
        $expectedPrice = $this->getMedicineSellingPrice($sale->medicine);
        $actualPrice = (float) $sale->unit_price;
        
        if (abs($expectedPrice - $actualPrice) > 0.01) {
            $issues[] = sprintf(
                "Price mismatch: Expected UGX %s, got UGX %s",
                number_format($expectedPrice, 2),
                number_format($actualPrice, 2)
            );
        }
        
        return $issues;
    }
    
    /**
     * Get pricing summary for all medicines
     */
    public function getPricingSummary(): array
    {
        $medicines = Medicine::all();
        $summary = [
            "total_medicines" => $medicines->count(),
            "with_selling_price" => 0,
            "with_cost_price" => 0,
            "pricing_issues" => 0,
            "issues" => []
        ];
        
        foreach ($medicines as $medicine) {
            if ($medicine->selling_price && $medicine->selling_price > 0) {
                $summary["with_selling_price"]++;
            }
            
            if ($medicine->cost_price && $medicine->cost_price > 0) {
                $summary["with_cost_price"]++;
            }
            
            $issues = $this->validateMedicinePricing($medicine);
            if (!empty($issues)) {
                $summary["pricing_issues"]++;
                $summary["issues"][] = [
                    "medicine_id" => $medicine->id,
                    "medicine_name" => $medicine->name,
                    "issues" => $issues
                ];
            }
        }
        
        return $summary;
    }
}