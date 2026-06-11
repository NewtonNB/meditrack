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

class SalesReportExport implements WithMultipleSheets
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            'Sales Summary' => new SalesSummarySheet($this->data),
            'Sales Details' => new SalesDetailsSheet($this->data),
            'Top Medicines' => new TopMedicinesSheet($this->data),
            'Customer Analysis' => new CustomerAnalysisSheet($this->data),
            'Daily Trends' => new DailyTrendsSheet($this->data),
        ];
    }
}

class SalesSummarySheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
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
                'Total Sales' => $this->data['summary']['total_sales'],
                'Total Revenue' => '$' . number_format($this->data['summary']['total_revenue'], 2),
                'Average Sale Amount' => '$' . number_format($this->data['summary']['average_sale_amount'], 2),
                'Total Quantity Sold' => $this->data['summary']['total_quantity_sold'],
                'Date From' => $this->data['summary']['date_range']['from'],
                'Date To' => $this->data['summary']['date_range']['to'],
                'Generated At' => $this->data['generated_at']->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    public function headings(): array
    {
        return [
            'Total Sales',
            'Total Revenue',
            'Average Sale Amount',
            'Total Quantity Sold',
            'Date From',
            'Date To',
            'Generated At',
        ];
    }

    public function title(): string
    {
        return 'Sales Summary';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class SalesDetailsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['sales'];
    }

    public function map($sale): array
    {
        return [
            $sale->id,
            $sale->sold_at->format('Y-m-d H:i:s'),
            $sale->customer ? $sale->customer->name : 'Walk-in Customer',
            $sale->medicine->name,
            $sale->quantity,
            '$' . number_format($sale->unit_price, 2),
            '$' . number_format($sale->total_price, 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Sale ID',
            'Date & Time',
            'Customer',
            'Medicine',
            'Quantity',
            'Unit Price',
            'Total Price',
        ];
    }

    public function title(): string
    {
        return 'Sales Details';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class TopMedicinesSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['top_medicines'];
    }

    public function map($item): array
    {
        return [
            $item['medicine']->name,
            $item['medicine']->brand ?? 'N/A',
            $item['quantity_sold'],
            '$' . number_format($item['revenue'], 2),
            $item['sales_count'],
            '$' . number_format($item['revenue'] / $item['sales_count'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Quantity Sold',
            'Total Revenue',
            'Sales Count',
            'Average Sale Value',
        ];
    }

    public function title(): string
    {
        return 'Top Medicines';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class CustomerAnalysisSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['customer_sales'];
    }

    public function map($item): array
    {
        return [
            $item['customer'] ? $item['customer']->name : 'Walk-in Customer',
            $item['customer'] ? $item['customer']->email : 'N/A',
            $item['customer'] ? $item['customer']->phone : 'N/A',
            '$' . number_format($item['total_purchases'], 2),
            $item['purchase_count'],
            '$' . number_format($item['average_purchase'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Customer Name',
            'Email',
            'Phone',
            'Total Purchases',
            'Purchase Count',
            'Average Purchase',
        ];
    }

    public function title(): string
    {
        return 'Customer Analysis';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class DailyTrendsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['daily_sales'];
    }

    public function map($item): array
    {
        return [
            $item['date'],
            $item['sales_count'],
            '$' . number_format($item['revenue'], 2),
            $item['quantity'],
            '$' . number_format($item['revenue'] / $item['sales_count'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Date',
            'Sales Count',
            'Revenue',
            'Quantity Sold',
            'Average Sale Value',
        ];
    }

    public function title(): string
    {
        return 'Daily Trends';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}