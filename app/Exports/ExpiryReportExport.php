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

class ExpiryReportExport implements WithMultipleSheets
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            'Expiry Summary' => new ExpirySummarySheet($this->data),
            'Critical (≤7 days)' => new CriticalExpirySheet($this->data),
            'Warning (≤30 days)' => new WarningExpirySheet($this->data),
            'Notice (≤90 days)' => new NoticeExpirySheet($this->data),
        ];
    }
}

class ExpirySummarySheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
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
                'Total Medicines Expiring' => $this->data['summary']['total_medicines_expiring'],
                'Total Batches Expiring' => $this->data['summary']['total_batches_expiring'],
                'Critical Items (≤7 days)' => $this->data['summary']['critical_count'],
                'Warning Items (≤30 days)' => $this->data['summary']['warning_count'],
                'Notice Items (≤90 days)' => $this->data['summary']['notice_count'],
                'Total Value at Risk' => '$' . number_format($this->data['summary']['total_value_at_risk'], 2),
                'Critical Value at Risk' => '$' . number_format($this->data['summary']['critical_value_at_risk'], 2),
                'Days Ahead Analyzed' => $this->data['summary']['days_ahead'],
                'Generated At' => $this->data['generated_at']->format('Y-m-d H:i:s'),
            ]
        ]);
    }

    public function headings(): array
    {
        return [
            'Total Medicines Expiring',
            'Total Batches Expiring',
            'Critical Items (≤7 days)',
            'Warning Items (≤30 days)',
            'Notice Items (≤90 days)',
            'Total Value at Risk',
            'Critical Value at Risk',
            'Days Ahead Analyzed',
            'Generated At',
        ];
    }

    public function title(): string
    {
        return 'Expiry Summary';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

class CriticalExpirySheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['critical'];
    }

    public function map($item): array
    {
        return [
            $item['medicine']->name,
            $item['medicine']->brand ?? 'N/A',
            $item['batch']->batch_number ?? 'N/A',
            $item['batch']->quantity ?? 0,
            $item['batch']->expiry_date ? $item['batch']->expiry_date->format('Y-m-d') : 'N/A',
            $item['days_to_expiry'],
            '$' . number_format($item['medicine']->cost_price, 2),
            '$' . number_format($item['value_at_risk'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Batch Number',
            'Quantity',
            'Expiry Date',
            'Days to Expiry',
            'Unit Cost',
            'Value at Risk',
        ];
    }

    public function title(): string
    {
        return 'Critical (≤7 days)';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => 'DC3545']]],
        ];
    }
}

class WarningExpirySheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['warning'];
    }

    public function map($item): array
    {
        return [
            $item['medicine']->name,
            $item['medicine']->brand ?? 'N/A',
            $item['batch']->batch_number ?? 'N/A',
            $item['batch']->quantity ?? 0,
            $item['batch']->expiry_date ? $item['batch']->expiry_date->format('Y-m-d') : 'N/A',
            $item['days_to_expiry'],
            '$' . number_format($item['medicine']->cost_price, 2),
            '$' . number_format($item['value_at_risk'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Batch Number',
            'Quantity',
            'Expiry Date',
            'Days to Expiry',
            'Unit Cost',
            'Value at Risk',
        ];
    }

    public function title(): string
    {
        return 'Warning (≤30 days)';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => 'FFC107']]],
        ];
    }
}

class NoticeExpirySheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data['notice'];
    }

    public function map($item): array
    {
        return [
            $item['medicine']->name,
            $item['medicine']->brand ?? 'N/A',
            $item['batch']->batch_number ?? 'N/A',
            $item['batch']->quantity ?? 0,
            $item['batch']->expiry_date ? $item['batch']->expiry_date->format('Y-m-d') : 'N/A',
            $item['days_to_expiry'],
            '$' . number_format($item['medicine']->cost_price, 2),
            '$' . number_format($item['value_at_risk'], 2),
        ];
    }

    public function headings(): array
    {
        return [
            'Medicine Name',
            'Brand',
            'Batch Number',
            'Quantity',
            'Expiry Date',
            'Days to Expiry',
            'Unit Cost',
            'Value at Risk',
        ];
    }

    public function title(): string
    {
        return 'Notice (≤90 days)';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => '17A2B8']]],
        ];
    }
}