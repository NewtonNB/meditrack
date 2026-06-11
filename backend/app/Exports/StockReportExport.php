<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockReportExport implements WithMultipleSheets
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            'Stock Summary' => new StockSummarySheet($this->data),
            'All Medicines' => new AllMedicinesSheet($this->data),
            'Out of Stock' => new OutOfStockSheet($this->data),
            'Low Stock' => new LowStockSheet($this->data),
            'Overstock' => new OverstockSheet($this->data),
            'Stock Movements' => new StockMovementsSheet($this->data),
        ];
    }
}

class StockSummarySheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect([
            [
                'Total Medicines' => $this->data['summary']['total_medicines'],
                'Out of Stock Count' => $this->data['summary']['out_of_stock_count'],
                'Low Stock Count' => $this->data['summary']['low_stock_count'],
                'Adequate Stock Count' => $this->data['summary']['adequate_stock_count'],
                'Overstock Count' => $this->data['summary']['overstock_count'],
                'Total Inventory Value' => '$' . number_format($this->data['summary']['total_inventory_value'], 2),
                'Total Stock Units' => $this->data['summary']['total_stock_units'],
                'Average Stock Value' => '$' . number_format($this->data['summary']['average_stock_value'], 2),
                'Generated At' => $this->data['generated_at']->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    public function headings(): array
    {
        return [
            'Total Medicines',
            'Out of Stock Count',
            'Low Stock Count',
            'Adequate Stock Count',
            'Overstock Count',
            'Total Inventory Value',
            'Total Stock Units',
            'Average Stock Value',
            'Generated At',
        ];
    }

    public function title(): string
    {
        return 'Stock Summary';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class AllMedicinesSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['medicines'];
    }

    public function map($medicine): array
    {
        $stockStatus = 'Adequate';
        if ($medicine->stock <= 0) {
            $stockStatus = 'Out of Stock';
        } elseif ($medicine->stock <= $medicine->reorder_level) {
            $stockStatus = 'Low Stock';
        } elseif ($medicine->stock > ($medicine->reorder_level * 3)) {
            $stockStatus = 'Overstock';
        }

        return [
            $medicine->name,
            $medicine->brand ?? 'N/A',
            $medicine->batch_number ?? 'N/A',
            $medicine->stock,
            $medicine->reorder_level,
            '$' . number_format($medicine->cost_price, 2),
            '$' . number_format($medicine->selling_price, 2),
            '$' . number_format($medicine->stock * $medicine->cost_price, 2),
            $stockStatus,
            $medicine->supplier ? $medicine->supplier->name : 'N/A',
            $medicine->expiry_date ? $medicine->expiry_date->format('Y-m-d') : 'N/A',
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Batch Number',
            'Current Stock',
            'Reorder Level',
            'Cost Price',
            'Selling Price',
            'Stock Value',
            'Stock Status',
            'Supplier',
            'Expiry Date',
        ];
    }

    public function title(): string
    {
        return 'All Medicines';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class OutOfStockSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['out_of_stock'];
    }

    public function map($medicine): array
    {
        return [
            $medicine->name,
            $medicine->brand ?? 'N/A',
            $medicine->stock,
            $medicine->reorder_level,
            '$' . number_format($medicine->cost_price, 2),
            '$' . number_format($medicine->selling_price, 2),
            $medicine->supplier ? $medicine->supplier->name : 'N/A',
            $medicine->expiry_date ? $medicine->expiry_date->format('Y-m-d') : 'N/A',
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Current Stock',
            'Reorder Level',
            'Cost Price',
            'Selling Price',
            'Supplier',
            'Expiry Date',
        ];
    }

    public function title(): string
    {
        return 'Out of Stock';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => 'DC3545']]],
        ];
    }
}

class LowStockSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['low_stock'];
    }

    public function map($medicine): array
    {
        return [
            $medicine->name,
            $medicine->brand ?? 'N/A',
            $medicine->stock,
            $medicine->reorder_level,
            $medicine->reorder_level - $medicine->stock,
            '$' . number_format($medicine->cost_price, 2),
            '$' . number_format($medicine->selling_price, 2),
            '$' . number_format($medicine->stock * $medicine->cost_price, 2),
            $medicine->supplier ? $medicine->supplier->name : 'N/A',
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Current Stock',
            'Reorder Level',
            'Shortage',
            'Cost Price',
            'Selling Price',
            'Stock Value',
            'Supplier',
        ];
    }

    public function title(): string
    {
        return 'Low Stock';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => 'FFC107']]],
        ];
    }
}

class OverstockSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['overstock'];
    }

    public function map($medicine): array
    {
        return [
            $medicine->name,
            $medicine->brand ?? 'N/A',
            $medicine->stock,
            $medicine->reorder_level,
            $medicine->reorder_level * 3,
            $medicine->stock - ($medicine->reorder_level * 3),
            '$' . number_format($medicine->cost_price, 2),
            '$' . number_format($medicine->stock * $medicine->cost_price, 2),
            $medicine->supplier ? $medicine->supplier->name : 'N/A',
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Current Stock',
            'Reorder Level',
            'Optimal Max Stock',
            'Excess Stock',
            'Cost Price',
            'Stock Value',
            'Supplier',
        ];
    }

    public function title(): string
    {
        return 'Overstock';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => '17A2B8']]],
        ];
    }
}

class StockMovementsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['stock_movements'];
    }

    public function map($movement): array
    {
        return [
            ucfirst($movement['type']),
            $movement['count'],
            $movement['total_quantity'],
            $movement['total_quantity'] > 0 ? '+' . $movement['total_quantity'] : $movement['total_quantity'],
        ];
    }

    public function headings(): array
    {
        return [
            'Movement Type',
            'Transaction Count',
            'Total Quantity',
            'Net Change',
        ];
    }

    public function title(): string
    {
        return 'Stock Movements (Last 30 Days)';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}