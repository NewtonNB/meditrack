<?php

namespace App\Services;

use App\Models\Medicine;
use Illuminate\Support\Facades\Log;

class PricingService
{
    /**
     * Pricing guidelines by medicine category
     */
    const PRICING_GUIDELINES = [
        'essential' => [
            'min_markup' => 15,
            'max_markup' => 30,
            'recommended_markup' => 20,
            'description' => 'Essential medicines (antibiotics, pain relief, etc.)'
        ],
        'chronic' => [
            'min_markup' => 20,
            'max_markup' => 35,
            'recommended_markup' => 25,
            'description' => 'Chronic condition medicines (diabetes, hypertension, etc.)'
        ],
        'specialty' => [
            'min_markup' => 30,
            'max_markup' => 50,
            'recommended_markup' => 40,
            'description' => 'Specialty medicines (rare conditions, expensive treatments)'
        ],
        'otc' => [
            'min_markup' => 25,
            'max_markup' => 60,
            'recommended_markup' => 35,
            'description' => 'Over-the-counter medicines (vitamins, supplements, etc.)'
        ],
        'emergency' => [
            'min_markup' => 15,
            'max_markup' => 25,
            'recommended_markup' => 20,
            'description' => 'Emergency medicines (life-saving drugs)'
        ]
    ];

    /**
     * Medicine categories mapping
     */
    const MEDICINE_CATEGORIES = [
        'Pain Relief' => 'essential',
        'Antibiotics' => 'essential',
        'Emergency' => 'emergency',
        'Cardiovascular' => 'chronic',
        'Diabetes' => 'chronic',
        'Mental Health' => 'chronic',
        'Respiratory' => 'essential',
        'Gastrointestinal' => 'essential',
        'Vitamins' => 'otc',
        'Topical' => 'otc',
        'Eye/Ear' => 'specialty',
        'Specialty' => 'specialty'
    ];

    /**
     * Calculate recommended selling price based on cost and category
     */
    public function calculateRecommendedPrice(float $costPrice, string $category = null): array
    {
        $pricingCategory = $this->getPricingCategory($category);
        $guidelines = self::PRICING_GUIDELINES[$pricingCategory];
        
        $recommendedMarkup = $guidelines['recommended_markup'];
        $minMarkup = $guidelines['min_markup'];
        $maxMarkup = $guidelines['max_markup'];
        
        $recommendedPrice = $costPrice * (1 + $recommendedMarkup / 100);
        $minPrice = $costPrice * (1 + $minMarkup / 100);
        $maxPrice = $costPrice * (1 + $maxMarkup / 100);
        
        return [
            'recommended_price' => round($recommendedPrice, 2),
            'min_price' => round($minPrice, 2),
            'max_price' => round($maxPrice, 2),
            'recommended_markup' => $recommendedMarkup,
            'min_markup' => $minMarkup,
            'max_markup' => $maxMarkup,
            'category' => $pricingCategory,
            'guidelines' => $guidelines
        ];
    }

    /**
     * Validate if a selling price is appropriate
     */
    public function validatePrice(float $costPrice, float $sellingPrice, string $category = null): array
    {
        if ($costPrice <= 0) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => 'Cost price must be greater than zero',
                'markup' => 0
            ];
        }

        if ($sellingPrice <= $costPrice) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => 'Selling price must be higher than cost price',
                'markup' => 0
            ];
        }

        $markup = (($sellingPrice - $costPrice) / $costPrice) * 100;
        $pricingCategory = $this->getPricingCategory($category);
        $guidelines = self::PRICING_GUIDELINES[$pricingCategory];

        if ($markup < $guidelines['min_markup']) {
            return [
                'valid' => false,
                'status' => 'warning',
                'message' => "Markup too low. Minimum recommended: {$guidelines['min_markup']}%",
                'markup' => round($markup, 1),
                'recommendation' => $this->calculateRecommendedPrice($costPrice, $category)
            ];
        }

        if ($markup > $guidelines['max_markup']) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => "Markup too high. Maximum allowed: {$guidelines['max_markup']}%",
                'markup' => round($markup, 1),
                'recommendation' => $this->calculateRecommendedPrice($costPrice, $category)
            ];
        }

        return [
            'valid' => true,
            'status' => 'success',
            'message' => 'Price is within acceptable range',
            'markup' => round($markup, 1),
            'category' => $pricingCategory
        ];
    }

    /**
     * Get pricing category from medicine category
     */
    private function getPricingCategory(?string $medicineCategory): string
    {
        if (!$medicineCategory) {
            return 'essential'; // Default to essential
        }

        return self::MEDICINE_CATEGORIES[$medicineCategory] ?? 'essential';
    }

    /**
     * Get all pricing guidelines
     */
    public function getPricingGuidelines(): array
    {
        return self::PRICING_GUIDELINES;
    }

    /**
     * Get medicine categories
     */
    public function getMedicineCategories(): array
    {
        return self::MEDICINE_CATEGORIES;
    }

    /**
     * Bulk update medicine prices based on guidelines
     */
    public function updateMedicinePrices(array $medicineIds = null): array
    {
        $query = Medicine::query();
        
        if ($medicineIds) {
            $query->whereIn('id', $medicineIds);
        }
        
        $medicines = $query->where('cost_price', '>', 0)->get();
        $updated = 0;
        $errors = [];

        foreach ($medicines as $medicine) {
            try {
                $recommendation = $this->calculateRecommendedPrice(
                    $medicine->cost_price, 
                    $medicine->category
                );

                // Only update if current price is outside acceptable range
                $validation = $this->validatePrice(
                    $medicine->cost_price,
                    $medicine->selling_price,
                    $medicine->category
                );

                if (!$validation['valid']) {
                    $medicine->selling_price = $recommendation['recommended_price'];
                    $medicine->save();
                    $updated++;

                    Log::info("Updated pricing for medicine: {$medicine->name}", [
                        'old_price' => $medicine->getOriginal('selling_price'),
                        'new_price' => $medicine->selling_price,
                        'cost_price' => $medicine->cost_price,
                        'category' => $medicine->category
                    ]);
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to update {$medicine->name}: " . $e->getMessage();
            }
        }

        return [
            'updated' => $updated,
            'total' => $medicines->count(),
            'errors' => $errors
        ];
    }

    /**
     * Generate pricing report
     */
    public function generatePricingReport(): array
    {
        $medicines = Medicine::where('cost_price', '>', 0)->get();
        $report = [
            'total_medicines' => $medicines->count(),
            'by_category' => [],
            'pricing_issues' => [],
            'summary' => [
                'valid_pricing' => 0,
                'low_markup' => 0,
                'high_markup' => 0,
                'no_cost_price' => Medicine::where('cost_price', '<=', 0)->count()
            ]
        ];

        foreach ($medicines as $medicine) {
            $validation = $this->validatePrice(
                $medicine->cost_price,
                $medicine->selling_price,
                $medicine->category
            );

            $category = $medicine->category ?? 'Uncategorized';
            
            if (!isset($report['by_category'][$category])) {
                $report['by_category'][$category] = [
                    'count' => 0,
                    'valid' => 0,
                    'issues' => 0
                ];
            }

            $report['by_category'][$category]['count']++;

            if ($validation['valid']) {
                $report['summary']['valid_pricing']++;
                $report['by_category'][$category]['valid']++;
            } else {
                $report['by_category'][$category]['issues']++;
                
                if ($validation['status'] === 'warning') {
                    $report['summary']['low_markup']++;
                } else {
                    $report['summary']['high_markup']++;
                }

                $report['pricing_issues'][] = [
                    'medicine' => $medicine->name,
                    'category' => $category,
                    'cost_price' => $medicine->cost_price,
                    'selling_price' => $medicine->selling_price,
                    'markup' => $validation['markup'],
                    'issue' => $validation['message']
                ];
            }
        }

        return $report;
    }
}