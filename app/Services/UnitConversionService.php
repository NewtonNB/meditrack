<?php

namespace App\Services;

use App\Models\Medicine;

class UnitConversionService
{
    /**
     * Convert quantity from any unit to base units (pieces)
     */
    public function convertToBaseUnits(Medicine $medicine, float $quantity, string $unitType): float
    {
        switch ($unitType) {
            case 'piece':
            case 'tablet':
            case 'capsule':
                return $quantity; // Already in base units
                
            case 'strip':
            case 'package':
                return $quantity * ($medicine->units_per_package ?? 1);
                
            case 'box':
                // Assuming box contains multiple strips
                $stripsPerBox = 10; // Default, can be made configurable
                return $quantity * $stripsPerBox * ($medicine->units_per_package ?? 1);
                
            default:
                return $quantity;
        }
    }

    /**
     * Calculate price based on unit type
     */
    public function calculatePrice(Medicine $medicine, float $quantity, string $unitType): float
    {
        switch ($unitType) {
            case 'piece':
            case 'tablet':
            case 'capsule':
                // Use piece price if available, otherwise use selling price
                $pricePerPiece = $medicine->price_per_piece ?? $medicine->selling_price;
                return $quantity * $pricePerPiece;
                
            case 'strip':
            case 'package':
                // Use package price if available, otherwise calculate from pieces
                if ($medicine->price_per_package) {
                    return $quantity * $medicine->price_per_package;
                }
                $pricePerPiece = $medicine->price_per_piece ?? $medicine->selling_price;
                $piecesInPackage = $medicine->units_per_package ?? 1;
                return $quantity * $pricePerPiece * $piecesInPackage;
                
            case 'box':
                // Calculate box price (10 strips per box by default)
                $stripsPerBox = 10;
                if ($medicine->price_per_package) {
                    return $quantity * $medicine->price_per_package * $stripsPerBox;
                }
                $pricePerPiece = $medicine->price_per_piece ?? $medicine->selling_price;
                $piecesInBox = $stripsPerBox * ($medicine->units_per_package ?? 1);
                return $quantity * $pricePerPiece * $piecesInBox;
                
            default:
                return $quantity * $medicine->selling_price;
        }
    }

    /**
     * Get available unit types for a medicine
     */
    public function getAvailableUnits(Medicine $medicine): array
    {
        $units = [
            [
                'type' => 'piece',
                'label' => ucfirst($medicine->base_unit ?? 'Piece'),
                'quantity' => 1,
                'price' => $medicine->price_per_piece ?? $medicine->selling_price,
                'description' => 'Single ' . ($medicine->base_unit ?? 'piece'),
            ]
        ];

        // Add package option if configured
        if ($medicine->package_type && $medicine->units_per_package) {
            $packagePrice = $medicine->price_per_package ?? 
                           ($medicine->price_per_piece ?? $medicine->selling_price) * $medicine->units_per_package;
            
            $units[] = [
                'type' => 'package',
                'label' => ucfirst($medicine->package_type),
                'quantity' => $medicine->units_per_package,
                'price' => $packagePrice,
                'description' => "1 {$medicine->package_type} ({$medicine->units_per_package} {$medicine->base_unit}s)",
            ];
        }

        return $units;
    }

    /**
     * Format unit display for UI
     */
    public function formatUnitDisplay(Medicine $medicine, float $quantity, string $unitType): string
    {
        $baseUnits = $this->convertToBaseUnits($medicine, $quantity, $unitType);
        
        if ($unitType === 'piece') {
            return "{$quantity} " . ($medicine->base_unit ?? 'piece') . ($quantity > 1 ? 's' : '');
        }
        
        if ($unitType === 'package' || $unitType === 'strip') {
            $packageName = $medicine->package_type ?? 'package';
            return "{$quantity} {$packageName}" . ($quantity > 1 ? 's' : '') . " ({$baseUnits} {$medicine->base_unit}s)";
        }
        
        return "{$quantity} {$unitType}(s)";
    }

    /**
     * Check if sufficient stock is available
     */
    public function hasS ufficientStock(Medicine $medicine, float $quantity, string $unitType): bool
    {
        $requiredBaseUnits = $this->convertToBaseUnits($medicine, $quantity, $unitType);
        return $medicine->stock >= $requiredBaseUnits;
    }

    /**
     * Get suggested unit type based on quantity
     */
    public function suggestUnitType(Medicine $medicine, float $baseQuantity): string
    {
        if (!$medicine->units_per_package) {
            return 'piece';
        }

        // If quantity is a multiple of package size, suggest package
        if ($baseQuantity % $medicine->units_per_package === 0 && $baseQuantity >= $medicine->units_per_package) {
            return 'package';
        }

        return 'piece';
    }
}
