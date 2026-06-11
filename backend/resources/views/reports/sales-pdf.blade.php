<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Report</title>
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
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
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
            grid-template-columns: repeat(2, 1fr);
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
            color: #007bff;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-size: 16px;
        }
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
            background-color: #007bff;
            color: white;
            font-weight: bold;
            font-size: 11px;
        }
        td {
            font-size: 10px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
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
        <h1>Sales Report</h1>
        <p>Generated on {{ $generated_at->format('F j, Y \a\t g:i A') }}</p>
        <p>Period: {{ $summary['date_range']['from'] }} to {{ $summary['date_range']['to'] }}</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total Sales</div>
                <div class="value">{{ number_format($summary['total_sales']) }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Revenue</div>
                <div class="value">UGX {{ number_format($summary['total_revenue'], 0) }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Average Sale</div>
                <div class="value">UGX {{ number_format($summary['average_sale_amount'], 0) }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Quantity</div>
                <div class="value">{{ number_format($summary['total_quantity_sold']) }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Top Selling Medicines</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th class="text-right">Quantity Sold</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Sales Count</th>
                </tr>
            </thead>
            <tbody>
                @foreach($top_medicines->take(10) as $item)
                <tr>
                    <td>{{ $item['medicine']->name }}</td>
                    <td>{{ $item['medicine']->brand ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($item['quantity_sold']) }}</td>
                    <td class="text-right">UGX {{ number_format($item['revenue'], 0) }}</td>
                    <td class="text-right">{{ number_format($item['sales_count']) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Top Customers</h2>
        <table>
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th class="text-right">Total Purchases</th>
                    <th class="text-right">Purchase Count</th>
                    <th class="text-right">Average Purchase</th>
                </tr>
            </thead>
            <tbody>
                @foreach($customer_sales->take(10) as $item)
                <tr>
                    <td>{{ $item['customer'] ? $item['customer']->name : 'Walk-in Customer' }}</td>
                    <td>{{ $item['customer'] ? $item['customer']->email : 'N/A' }}</td>
                    <td class="text-right">UGX {{ number_format($item['total_purchases'], 0) }}</td>
                    <td class="text-right">{{ number_format($item['purchase_count']) }}</td>
                    <td class="text-right">UGX {{ number_format($item['average_purchase'], 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <h2>Daily Sales Trend</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th class="text-right">Sales Count</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Quantity Sold</th>
                    <th class="text-right">Average Sale</th>
                </tr>
            </thead>
            <tbody>
                @foreach($daily_sales->take(30) as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td class="text-right">{{ number_format($item['sales_count']) }}</td>
                    <td class="text-right">UGX {{ number_format($item['revenue'], 0) }}</td>
                    <td class="text-right">{{ number_format($item['quantity']) }}</td>
                    <td class="text-right">UGX {{ number_format($item['revenue'] / max($item['sales_count'], 1), 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recent Sales Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Medicine</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sales->take(50) as $sale)
                <tr>
                    <td>{{ $sale->sold_at->format('M j, Y') }}</td>
                    <td>{{ $sale->customer ? $sale->customer->name : 'Walk-in' }}</td>
                    <td>{{ $sale->medicine->name }}</td>
                    <td class="text-right">{{ number_format($sale->quantity) }}</td>
                    <td class="text-right">UGX {{ number_format($sale->unit_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($sale->total_price, 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated automatically by MediTrack Pharmacy Management System</p>
        <p>Report contains {{ number_format($sales->count()) }} sales transactions</p>
    </div>
</body>
</html>