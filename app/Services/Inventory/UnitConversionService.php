<?php

namespace App\Services\Inventory;

use App\Models\Medicine;
use Illuminate\Support\Facades\Log;

class UnitConversionService
{
    /**
     * Standard unit conversion definitions
     */
    protected $standardConversions = [
        'tablet' => [
            'strip' => 10,      // 1 strip = 10 tablets
            'box' => 100,       // 1 box = 100 tablets
            'bottle' => 30,     // 1 bottle = 30 tablets (default)
        ],
        'capsule' => [
            'strip' => 10,
            'box' => 100,
            'bottle' => 30,
        ],
        'ml' => [
            'bottle' => 100,    // 1 bottle = 100ml (default)
            'vial' => 10,       // 1 vial = 10ml
        ],
        'mg' => [
            'gram' => 1000,     // 1 gram = 1000mg
            'kg' => 1000000,    // 1 kg = 1,000,000mg
        ]
    ];

    /**
     * Convert quantity from one unit to another
     */
    public function convert($medicineId, $quantity, $fromUnit, $toUnit)
    {
        if ($fromUnit === $toUnit) {
            return $quantity;
        }

        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            throw new \Exception("Medicine not found: {$medicineId}");
        }

        // Get medicine-specific conversions or use standard ones
        $conversions = $medicine->unit_conversions ?? $this->getStandardConversions($medicine->base_unit);
        
        // If unit_conversions is a JSON string, decode it
        if (is_string($conversions)) {
            $conversions = json_decode($conversions, true) ?? [];
        }

        // Convert to base unit first
        $baseQuantity = $this->convertToBaseUnit($quantity, $fromUnit, $conversions, $medicine->base_unit);

        // Convert from base unit to target unit
        $targetQuantity = $this->convertFromBaseUnit($baseQuantity, $toUnit, $conversions, $medicine->base_unit);

        Log::info("Unit conversion: Medicine {$medicineId}, {$quantity} {$fromUnit} = {$targetQuantity} {$toUnit}");

        return $targetQuantity;
    }

    /**
     * Convert quantity to base unit
     */
    protected function convertToBaseUnit($quantity, $fromUnit, $conversions, $baseUnit)
    {
        if ($fromUnit === $baseUnit) {
            return $quantity;
        }

        if (!isset($conversions[$fromUnit])) {
            throw new \Exception("No conversion available from {$fromUnit} to {$baseUnit}");
        }

        // If converting FROM a larger unit TO base unit, divide
        // e.g., 1 strip = 10 tablets, so 1 strip to tablets = 1 * 10 = 10 tablets
        return $quantity * $conversions[$fromUnit];
    }

    /**
     * Convert quantity from base unit to target unit
     */
    protected function convertFromBaseUnit($baseQuantity, $toUnit, $conversions, $baseUnit)
    {
        if ($toUnit === $baseUnit) {
            return $baseQuantity;
        }

        if (!isset($conversions[$toUnit])) {
            throw new \Exception("No conversion available from {$baseUnit} to {$toUnit}");
        }

        // If converting FROM base unit TO a larger unit, divide
        // e.g., 10 tablets to strips = 10 / 10 = 1 strip
        return $baseQuantity / $conversions[$toUnit];
    }

    /**
     * Get standard conversions for a base unit
     */
    protected function getStandardConversions($baseUnit)
    {
        return $this->standardConversions[$baseUnit] ?? [];
    }

    /**
     * Get all available units for a medicine
     */
    public function getAvailableUnits($medicineId)
    {
        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            return [];
        }

        $conversions = $medicine->unit_conversions ?? $this->getStandardConversions($medicine->base_unit);
        
        // If unit_conversions is a JSON string, decode it
        if (is_string($conversions)) {
            $conversions = json_decode($conversions, true) ?? [];
        }
        
        $units = array_keys($conversions);
        
        // Always include the base unit
        if (!in_array($medicine->base_unit, $units)) {
            array_unshift($units, $medicine->base_unit);
        }

        return $units;
    }

    /**
     * Set custom conversion for a medicine
     */
    public function setConversion($medicineId, $unit, $conversionFactor)
    {
        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            throw new \Exception("Medicine not found: {$medicineId}");
        }

        $conversions = $medicine->unit_conversions ?? [];
        $conversions[$unit] = $conversionFactor;

        $medicine->unit_conversions = $conversions;
        $medicine->save();

        Log::info("Custom conversion set: Medicine {$medicineId}, {$unit} = {$conversionFactor} {$medicine->base_unit}");

        return true;
    }

    /**
     * Remove custom conversion for a medicine
     */
    public function removeConversion($medicineId, $unit)
    {
        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            throw new \Exception("Medicine not found: {$medicineId}");
        }

        $conversions = $medicine->unit_conversions ?? [];
        unset($conversions[$unit]);

        $medicine->unit_conversions = $conversions;
        $medicine->save();

        Log::info("Custom conversion removed: Medicine {$medicineId}, unit {$unit}");

        return true;
    }

    /**
     * Get conversion factor between two units
     */
    public function getConversionFactor($medicineId, $fromUnit, $toUnit)
    {
        if ($fromUnit === $toUnit) {
            return 1;
        }

        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            throw new \Exception("Medicine not found: {$medicineId}");
        }

        $conversions = $medicine->unit_conversions ?? $this->getStandardConversions($medicine->base_unit);
        
        // If unit_conversions is a JSON string, decode it
        if (is_string($conversions)) {
            $conversions = json_decode($conversions, true) ?? [];
        }

        // Both units must be available
        if ($fromUnit !== $medicine->base_unit && !isset($conversions[$fromUnit])) {
            throw new \Exception("Unit {$fromUnit} not available for this medicine");
        }

        if ($toUnit !== $medicine->base_unit && !isset($conversions[$toUnit])) {
            throw new \Exception("Unit {$toUnit} not available for this medicine");
        }

        // Calculate conversion factor
        $fromFactor = ($fromUnit === $medicine->base_unit) ? 1 : $conversions[$fromUnit];
        $toFactor = ($toUnit === $medicine->base_unit) ? 1 : $conversions[$toUnit];

        return $fromFactor / $toFactor;
    }

    /**
     * Validate if conversion is possible
     */
    public function canConvert($medicineId, $fromUnit, $toUnit)
    {
        try {
            $this->getConversionFactor($medicineId, $fromUnit, $toUnit);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get unit display information
     */
    public function getUnitInfo($unit)
    {
        $unitInfo = [
            'tablet' => ['name' => 'Tablet', 'abbreviation' => 'tab', 'type' => 'solid'],
            'capsule' => ['name' => 'Capsule', 'abbreviation' => 'cap', 'type' => 'solid'],
            'strip' => ['name' => 'Strip', 'abbreviation' => 'strip', 'type' => 'package'],
            'box' => ['name' => 'Box', 'abbreviation' => 'box', 'type' => 'package'],
            'bottle' => ['name' => 'Bottle', 'abbreviation' => 'btl', 'type' => 'container'],
            'vial' => ['name' => 'Vial', 'abbreviation' => 'vial', 'type' => 'container'],
            'ml' => ['name' => 'Milliliter', 'abbreviation' => 'ml', 'type' => 'liquid'],
            'mg' => ['name' => 'Milligram', 'abbreviation' => 'mg', 'type' => 'weight'],
            'gram' => ['name' => 'Gram', 'abbreviation' => 'g', 'type' => 'weight'],
            'kg' => ['name' => 'Kilogram', 'abbreviation' => 'kg', 'type' => 'weight'],
        ];

        return $unitInfo[$unit] ?? ['name' => ucfirst($unit), 'abbreviation' => $unit, 'type' => 'unknown'];
    }

    /**
     * Format quantity with unit
     */
    public function formatQuantity($quantity, $unit)
    {
        $unitInfo = $this->getUnitInfo($unit);
        
        if ($quantity == 1) {
            return "1 {$unitInfo['name']}";
        }
        
        return "{$quantity} {$unitInfo['name']}s";
    }

    /**
     * Get smallest sellable unit for a medicine
     */
    public function getSmallestUnit($medicineId)
    {
        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            return 'tablet';
        }

        return $medicine->base_unit;
    }

    /**
     * Get largest package unit for a medicine
     */
    public function getLargestUnit($medicineId)
    {
        $medicine = Medicine::find($medicineId);
        if (!$medicine) {
            return 'tablet';
        }

        $conversions = $medicine->unit_conversions ?? $this->getStandardConversions($medicine->base_unit);
        
        if (empty($conversions)) {
            return $medicine->base_unit;
        }

        // Find unit with highest conversion factor
        $largestUnit = array_keys($conversions, max($conversions))[0];
        
        return $largestUnit;
    }
}