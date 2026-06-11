<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Medicine Expiry Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #dc3545;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #dc3545;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-weight: bold;
            color: #666;
            font-size: 11px;
            text-transform: uppercase;
        }
        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            margin-top: 5px;
        }
        .critical .value { color: #dc3545; }
        .warning .value { color: #ffc107; }
        .notice .value { color: #17a2b8; }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .critical h2 { color: #dc3545; }
        .warning h2 { color: #ffc107; }
        .notice h2 { color: #17a2b8; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            border: 1px solid #dee2e6;
            padding: 8px;
            text-align: left;
        }
        th {
            font-weight: bold;
            font-size: 11px;
            color: white;
        }
        .critical th { background-color: #dc3545; }
        .warning th { background-color: #ffc107; }
        .notice th { background-color: #17a2b8; }
        td {
            font-size: 10px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .urgent {
            background-color: #f8d7da;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #dee2e6;
            padding-top: 10px;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Medicine Expiry Report</h1>
        <p>Generated on {{ $generated_at->format('F j, Y \a\t g:i A') }}</p>
        <p>Analyzing medicines expiring within {{ $summary['days_ahead'] }} days</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item critical">
                <div class="label">Critical (≤7 days)</div>
                <div class="value">{{ number_format($summary['critical_count']) }}</div>
            </div>
            <div class="summary-item warning">
                <div class="label">Warning (≤30 days)</div>
                <div class="value">{{ number_format($summary['warning_count']) }}</div>
            </div>
            <div class="summary-item notice">
                <div class="label">Notice (≤90 days)</div>
                <div class="value">{{ number_format($summary['notice_count']) }}</div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
            <div class="summary-item">
                <div class="label">Total Value at Risk</div>
                <div class="value" style="color: #dc3545;">UGX {{ number_format($summary['total_value_at_risk'], 0) }}</div>
            </div>
        </div>
    </div>

    @if($critical->count() > 0)
    <div class="section critical">
        <h2>🚨 Critical - Expires in 7 Days or Less</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th>Batch Number</th>
                    <th class="text-right">Quantity</th>
                    <th>Expiry Date</th>
                    <th class="text-right">Days Left</th>
                    <th class="text-right">Value at Risk</th>
                </tr>
            </thead>
            <tbody>
                @foreach($critical as $item)
                <tr class="{{ $item['days_to_expiry'] <= 3 ? 'urgent' : '' }}">
                    <td>{{ $item['medicine']->name }}</td>
                    <td>{{ $item['medicine']->brand ?? 'N/A' }}</td>
                    <td>{{ $item['batch']->batch_number ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($item['batch']->quantity ?? 0) }}</td>
                    <td>{{ $item['batch']->expiry_date ? $item['batch']->expiry_date->format('M j, Y') : 'N/A' }}</td>
                    <td class="text-right">{{ $item['days_to_expiry'] }}</td>
                    <td class="text-right">${{ number_format($item['value_at_risk'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($warning->count() > 0)
    <div class="page-break"></div>
    <div class="section warning">
        <h2>⚠️ Warning - Expires in 30 Days or Less</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th>Batch Number</th>
                    <th class="text-right">Quantity</th>
                    <th>Expiry Date</th>
                    <th class="text-right">Days Left</th>
                    <th class="text-right">Value at Risk</th>
                </tr>
            </thead>
            <tbody>
                @foreach($warning->take(50) as $item)
                <tr>
                    <td>{{ $item['medicine']->name }}</td>
                    <td>{{ $item['medicine']->brand ?? 'N/A' }}</td>
                    <td>{{ $item['batch']->batch_number ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($item['batch']->quantity ?? 0) }}</td>
                    <td>{{ $item['batch']->expiry_date ? $item['batch']->expiry_date->format('M j, Y') : 'N/A' }}</td>
                    <td class="text-right">{{ $item['days_to_expiry'] }}</td>
                    <td class="text-right">${{ number_format($item['value_at_risk'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($notice->count() > 0)
    <div class="page-break"></div>
    <div class="section notice">
        <h2>ℹ️ Notice - Expires in 90 Days or Less</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th>Batch Number</th>
                    <th class="text-right">Quantity</th>
                    <th>Expiry Date</th>
                    <th class="text-right">Days Left</th>
                    <th class="text-right">Value at Risk</th>
                </tr>
            </thead>
            <tbody>
                @foreach($notice->take(100) as $item)
                <tr>
                    <td>{{ $item['medicine']->name }}</td>
                    <td>{{ $item['medicine']->brand ?? 'N/A' }}</td>
                    <td>{{ $item['batch']->batch_number ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($item['batch']->quantity ?? 0) }}</td>
                    <td>{{ $item['batch']->expiry_date ? $item['batch']->expiry_date->format('M j, Y') : 'N/A' }}</td>
                    <td class="text-right">{{ $item['days_to_expiry'] }}</td>
                    <td class="text-right">${{ number_format($item['value_at_risk'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>This report was generated automatically by MediTrack Pharmacy Management System</p>
        <p>Total medicines analyzed: {{ number_format($summary['total_medicines_expiring']) }} | Total batches: {{ number_format($summary['total_batches_expiring']) }}</p>
        <p><strong>Immediate Action Required:</strong> {{ number_format($summary['critical_count']) }} items expire within 7 days</p>
    </div>
</body>
</html>