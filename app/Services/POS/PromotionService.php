<?php

namespace App\Services\POS;

use App\Models\Promotion;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\CustomerLoyalty;
use App\Models\Medicine;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PromotionService
{
    /**
     * Calculate discounts for a transaction
     */
    public function calculateDiscounts($items, $customerId = null, $subtotal = 0)
    {
        $totalDiscount = 0;
        $appliedPromotions = [];
        $appliedCoupons = [];
        
        try {
            // Get active promotions
            $promotions = $this->getActivePromotions();
            
            // Apply automatic promotions
            foreach ($promotions as $promotion) {
                if ($this->isPromotionApplicable($promotion, $items, $customerId, $subtotal)) {
                    $discount = $this->calculatePromotionDiscount($promotion, $items, $subtotal);
                    
                    if ($discount > 0) {
                        $totalDiscount += $discount;
                        $appliedPromotions[] = [
                            'id' => $promotion->id,
                            'name' => $promotion->name,
                            'type' => $promotion->type,
                            'discount_amount' => $discount
                        ];
                    }
                }
            }
            
            // Apply tier-based discounts
            if ($customerId) {
                $tierDiscount = $this->calculateTierDiscount($customerId, $subtotal);
                if ($tierDiscount > 0) {
                    $totalDiscount += $tierDiscount;
                    $appliedPromotions[] = [
                        'id' => 'tier_discount',
                        'name' => 'Loyalty Tier Discount',
                        'type' => 'tier_discount',
                        'discount_amount' => $tierDiscount
                    ];
                }
            }
            
            return [
                'discount_amount' => $totalDiscount,
                'applied_promotions' => $appliedPromotions,
                'applied_coupons' => $appliedCoupons
            ];
            
        } catch (\Exception $e) {
            Log::error("Error calculating discounts: " . $e->getMessage());
            
            return [
                'discount_amount' => 0,
                'applied_promotions' => [],
                'applied_coupons' => []
            ];
        }
    }

    /**
     * Apply coupon to transaction
     */
    public function applyCoupon($couponCode, $items, $customerId = null, $subtotal = 0)
    {
        $coupon = Coupon::where('code', $couponCode)
            ->where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>=', now())
            ->first();
            
        if (!$coupon) {
            throw new \Exception('Invalid or expired coupon code');
        }
        
        if ($coupon->usage_count >= $coupon->usage_limit) {
            throw new \Exception('Coupon usage limit exceeded');
        }
        
        if ($coupon->customer_id && $coupon->customer_id != $customerId) {
            throw new \Exception('This coupon is not valid for this customer');
        }
        
        if ($subtotal < $coupon->minimum_amount) {
            throw new \Exception("Minimum purchase amount of {$coupon->minimum_amount} required");
        }
        
        $discount = $this->calculateCouponDiscount($coupon, $items, $subtotal);
        
        // Update coupon usage
        $coupon->increment('usage_count');
        
        Log::info("Coupon applied", [
            'coupon_code' => $couponCode,
            'customer_id' => $customerId,
            'discount_amount' => $discount
        ]);
        
        return [
            'coupon' => $coupon,
            'discount_amount' => $discount
        ];
    }

    /**
     * Get active promotions
     */
    protected function getActivePromotions()
    {
        return Promotion::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->orderBy('priority', 'desc')
            ->get();
    }

    /**
     * Check if promotion is applicable
     */
    protected function isPromotionApplicable($promotion, $items, $customerId, $subtotal)
    {
        // Check minimum amount
        if ($promotion->minimum_amount && $subtotal < $promotion->minimum_amount) {
            return false;
        }
        
        // Check customer eligibility
        if ($promotion->customer_eligibility) {
            $eligibility = json_decode($promotion->customer_eligibility, true);
            
            if (isset($eligibility['customer_ids']) && $customerId) {
                if (!in_array($customerId, $eligibility['customer_ids'])) {
                    return false;
                }
            }
            
            if (isset($eligibility['tiers']) && $customerId) {
                $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
                if (!$customerLoyalty || !in_array($customerLoyalty->tier, $eligibility['tiers'])) {
                    return false;
                }
            }
        }
        
        // Check applicable items
        if ($promotion->applicable_items) {
            $applicableItems = json_decode($promotion->applicable_items, true);
            
            if (isset($applicableItems['medicine_ids'])) {
                $itemMedicineIds = collect($items)->pluck('medicine_id')->toArray();
                $hasApplicableItem = !empty(array_intersect($itemMedicineIds, $applicableItems['medicine_ids']));
                
                if (!$hasApplicableItem) {
                    return false;
                }
            }
            
            if (isset($applicableItems['categories'])) {
                $itemCategories = Medicine::whereIn('id', collect($items)->pluck('medicine_id'))
                    ->pluck('category')
                    ->unique()
                    ->toArray();
                    
                $hasApplicableCategory = !empty(array_intersect($itemCategories, $applicableItems['categories']));
                
                if (!$hasApplicableCategory) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Calculate promotion discount
     */
    protected function calculatePromotionDiscount($promotion, $items, $subtotal)
    {
        switch ($promotion->type) {
            case 'percentage':
                $discount = $subtotal * ($promotion->discount_value / 100);
                break;
                
            case 'fixed_amount':
                $discount = $promotion->discount_value;
                break;
                
            case 'buy_x_get_y':
                $discount = $this->calculateBuyXGetYDiscount($promotion, $items);
                break;
                
            case 'bulk_discount':
                $discount = $this->calculateBulkDiscount($promotion, $items);
                break;
                
            default:
                $discount = 0;
        }
        
        // Apply maximum discount limit
        if ($promotion->max_discount_amount && $discount > $promotion->max_discount_amount) {
            $discount = $promotion->max_discount_amount;
        }
        
        return $discount;
    }

    /**
     * Calculate Buy X Get Y discount
     */
    protected function calculateBuyXGetYDiscount($promotion, $items)
    {
        $rules = json_decode($promotion->discount_rules, true);
        $buyQuantity = $rules['buy_quantity'] ?? 1;
        $getQuantity = $rules['get_quantity'] ?? 1;
        $getDiscount = $rules['get_discount_percentage'] ?? 100; // 100% = free
        
        $totalDiscount = 0;
        
        foreach ($items as $item) {
            if ($item['quantity'] >= $buyQuantity) {
                $freeItems = floor($item['quantity'] / $buyQuantity) * $getQuantity;
                $freeItems = min($freeItems, $item['quantity']); // Can't get more free than purchased
                
                $itemDiscount = $freeItems * $item['unit_price'] * ($getDiscount / 100);
                $totalDiscount += $itemDiscount;
            }
        }
        
        return $totalDiscount;
    }

    /**
     * Calculate bulk discount
     */
    protected function calculateBulkDiscount($promotion, $items)
    {
        $rules = json_decode($promotion->discount_rules, true);
        $tiers = $rules['tiers'] ?? [];
        
        $totalDiscount = 0;
        
        foreach ($items as $item) {
            $applicableTier = null;
            
            // Find the highest applicable tier
            foreach ($tiers as $tier) {
                if ($item['quantity'] >= $tier['min_quantity']) {
                    $applicableTier = $tier;
                }
            }
            
            if ($applicableTier) {
                $discountPercentage = $applicableTier['discount_percentage'];
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $itemDiscount = $itemTotal * ($discountPercentage / 100);
                $totalDiscount += $itemDiscount;
            }
        }
        
        return $totalDiscount;
    }

    /**
     * Calculate coupon discount
     */
    protected function calculateCouponDiscount($coupon, $items, $subtotal)
    {
        switch ($coupon->discount_type) {
            case 'percentage':
                $discount = $subtotal * ($coupon->discount_value / 100);
                break;
                
            case 'fixed_amount':
                $discount = $coupon->discount_value;
                break;
                
            default:
                $discount = 0;
        }
        
        // Apply maximum discount limit
        if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
            $discount = $coupon->max_discount_amount;
        }
        
        return $discount;
    }

    /**
     * Calculate tier-based discount
     */
    protected function calculateTierDiscount($customerId, $subtotal)
    {
        $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
        
        if (!$customerLoyalty) {
            return 0;
        }
        
        $tierBenefits = $customerLoyalty->getTierBenefits();
        $discountPercentage = $tierBenefits['discount_percentage'] ?? 0;
        
        return $subtotal * ($discountPercentage / 100);
    }

    /**
     * Get available promotions for display
     */
    public function getAvailablePromotions($customerId = null)
    {
        $query = Promotion::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->orderBy('priority', 'desc');
            
        $promotions = $query->get()->map(function ($promotion) use ($customerId) {
            return [
                'id' => $promotion->id,
                'name' => $promotion->name,
                'description' => $promotion->description,
                'type' => $promotion->type,
                'discount_value' => $promotion->discount_value,
                'minimum_amount' => $promotion->minimum_amount,
                'max_discount_amount' => $promotion->max_discount_amount,
                'start_date' => $promotion->start_date,
                'end_date' => $promotion->end_date,
                'is_applicable' => $this->isPromotionApplicableToCustomer($promotion, $customerId)
            ];
        });
        
        return $promotions;
    }

    /**
     * Check if promotion is applicable to customer
     */
    protected function isPromotionApplicableToCustomer($promotion, $customerId)
    {
        if (!$promotion->customer_eligibility) {
            return true;
        }
        
        if (!$customerId) {
            return false;
        }
        
        $eligibility = json_decode($promotion->customer_eligibility, true);
        
        if (isset($eligibility['customer_ids'])) {
            return in_array($customerId, $eligibility['customer_ids']);
        }
        
        if (isset($eligibility['tiers'])) {
            $customerLoyalty = CustomerLoyalty::where('customer_id', $customerId)->first();
            return $customerLoyalty && in_array($customerLoyalty->tier, $eligibility['tiers']);
        }
        
        return true;
    }

    /**
     * Create a new promotion
     */
    public function createPromotion($data)
    {
        return Promotion::create([
            'name' => $data['name'],
            'description' => $data['description'],
            'type' => $data['type'],
            'discount_value' => $data['discount_value'],
            'discount_rules' => isset($data['discount_rules']) ? json_encode($data['discount_rules']) : null,
            'minimum_amount' => $data['minimum_amount'] ?? null,
            'max_discount_amount' => $data['max_discount_amount'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'customer_eligibility' => isset($data['customer_eligibility']) ? json_encode($data['customer_eligibility']) : null,
            'applicable_items' => isset($data['applicable_items']) ? json_encode($data['applicable_items']) : null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'priority' => $data['priority'] ?? 1,
            'is_active' => $data['is_active'] ?? true
        ]);
    }

    /**
     * Create a new coupon
     */
    public function createCoupon($data)
    {
        return Coupon::create([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'],
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'minimum_amount' => $data['minimum_amount'] ?? null,
            'max_discount_amount' => $data['max_discount_amount'] ?? null,
            'valid_from' => $data['valid_from'],
            'valid_until' => $data['valid_until'],
            'usage_limit' => $data['usage_limit'] ?? null,
            'customer_id' => $data['customer_id'] ?? null,
            'is_active' => $data['is_active'] ?? true
        ]);
    }
}