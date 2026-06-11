<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Stock Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #28a745;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #28a745;
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
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-weight: bold;
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
        }
        .summary-item .value {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
        }
        .out-of-stock .value { color: #dc3545; }
        .low-stock .value { color: #ffc107; }
        .adequate-stock .value { color: #28a745; }
        .overstock .value { color: #17a2b8; }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .out-of-stock h2 { color: #dc3545; }
        .low-stock h2 { color: #ffc107; }
        .adequate-stock h2 { color: #28a745; }
        .overstock h2 { color: #17a2b8; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
        }
        th, td {
            border: 1px solid #dee2e6;
            padding: 6px;
            text-align: left;
        }
        th {
            font-weight: bold;
            font-size: 9px;
            color: white;
        }
        .out-of-stock th { background-color: #dc3545; }
        .low-stock th { background-color: #ffc107; }
        .adequate-stock th { background-color: #28a745; }
        .overstock th { background-color: #17a2b8; }
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
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Stock Report</h1>
        <p>Generated on {{ $generated_at->format('F j, Y \a\t g:i A') }}</p>
        <p>Complete inventory analysis and stock status</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item out-of-stock">
                <div class="label">Out of Stock</div>
                <div class="value">{{ number_format($summary['out_of_stock_count']) }}</div>
            </div>
            <div class="summary-item low-stock">
                <div class="label">Low Stock</div>
                <div class="value">{{ number_format($summary['low_stock_count']) }}</div>
            </div>
            <div class="summary-item adequate-stock">
                <div class="label">Adequate Stock</div>
                <div class="value">{{ number_format($summary['adequate_stock_count']) }}</div>
            </div>
            <div class="summary-item overstock">
                <div class="label">Overstock</div>
                <div class="value">{{ number_format($summary['overstock_count']) }}</div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
            <div class="summary-item">
                <div class="label">Total Inventory Value</div>
                <div class="value" style="color: #28a745;">${{ number_format($summary['total_inventory_value'], 2) }}</div>
            </div>
        </div>
    </div>

    @if($out_of_stock->count() > 0)
    <div class="section out-of-stock">
        <h2>🚨 Out of Stock Items</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th class="text-right">Current Stock</th>
                    <th class="text-right">Reorder Level</th>
                    <th class="text-right">Cost Price</th>
                    <th class="text-right">Selling Price</th>
                    <th>Supplier</th>
                </tr>
            </thead>
            <tbody>
                @foreach($out_of_stock as $medicine)
                <tr>
                    <td>{{ $medicine->name }}</td>
                    <td>{{ $medicine->brand ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($medicine->stock) }}</td>
                    <td class="text-right">{{ number_format($medicine->reorder_level) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->cost_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->selling_price, 0) }}</td>
                    <td>{{ $medicine->supplier ? $medicine->supplier->name : 'N/A' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($low_stock->count() > 0)
    <div class="section low-stock">
        <h2>⚠️ Low Stock Items</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th class="text-right">Current Stock</th>
                    <th class="text-right">Reorder Level</th>
                    <th class="text-right">Shortage</th>
                    <th class="text-right">Cost Price</th>
                    <th class="text-right">Stock Value</th>
                    <th>Supplier</th>
                </tr>
            </thead>
            <tbody>
                @foreach($low_stock->take(50) as $medicine)
                <tr>
                    <td>{{ $medicine->name }}</td>
                    <td>{{ $medicine->brand ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($medicine->stock) }}</td>
                    <td class="text-right">{{ number_format($medicine->reorder_level) }}</td>
                    <td class="text-right">{{ number_format($medicine->reorder_level - $medicine->stock) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->cost_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->stock * $medicine->cost_price, 0) }}</td>
                    <td>{{ $medicine->supplier ? $medicine->supplier->name : 'N/A' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($overstock->count() > 0)
    <div class="page-break"></div>
    <div class="section overstock">
        <h2>📦 Overstock Items</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th class="text-right">Current Stock</th>
                    <th class="text-right">Reorder Level</th>
                    <th class="text-right">Optimal Max</th>
                    <th class="text-right">Excess Stock</th>
                    <th class="text-right">Excess Value</th>
                    <th>Supplier</th>
                </tr>
            </thead>
            <tbody>
                @foreach($overstock->take(50) as $medicine)
                <tr>
                    <td>{{ $medicine->name }}</td>
                    <td>{{ $medicine->brand ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($medicine->stock) }}</td>
                    <td class="text-right">{{ number_format($medicine->reorder_level) }}</td>
                    <td class="text-right">{{ number_format($medicine->reorder_level * 3) }}</td>
                    <td class="text-right">{{ number_format($medicine->stock - ($medicine->reorder_level * 3)) }}</td>
                    <td class="text-right">UGX {{ number_format(($medicine->stock - ($medicine->reorder_level * 3)) * $medicine->cost_price, 0) }}</td>
                    <td>{{ $medicine->supplier ? $medicine->supplier->name : 'N/A' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="page-break"></div>
    <div class="section">
        <h2>📊 Stock Movement Analysis (Last 30 Days)</h2>
        <div class="two-column">
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Movement Type</th>
                            <th class="text-right">Count</th>
                            <th class="text-right">Total Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($stock_movements as $movement)
                        <tr>
                            <td>{{ ucfirst($movement['type']) }}</td>
                            <td class="text-right">{{ number_format($movement['count']) }}</td>
                            <td class="text-right">{{ number_format($movement['total_quantity']) }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div>
                <div class="summary-item">
                    <div class="label">Total Stock Units</div>
                    <div class="value">{{ number_format($summary['total_stock_units']) }}</div>
                </div>
                <div class="summary-item" style="margin-top: 15px;">
                    <div class="label">Average Stock Value per Medicine</div>
                    <div class="value">${{ number_format($summary['average_stock_value'], 2) }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section adequate-stock">
        <h2>✅ Top 20 Medicines by Stock Value</h2>
        <table>
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th class="text-right">Stock</th>
                    <th class="text-right">Cost Price</th>
                    <th class="text-right">Stock Value</th>
                    <th class="text-right">Selling Price</th>
                    <th class="text-right">Potential Revenue</th>
                </tr>
            </thead>
            <tbody>
                @foreach($medicines->sortByDesc(function($m) { return $m->stock * $m->cost_price; })->take(20) as $medicine)
                <tr>
                    <td>{{ $medicine->name }}</td>
                    <td>{{ $medicine->brand ?? 'N/A' }}</td>
                    <td class="text-right">{{ number_format($medicine->stock) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->cost_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->stock * $medicine->cost_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->selling_price, 0) }}</td>
                    <td class="text-right">UGX {{ number_format($medicine->stock * $medicine->selling_price, 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated automatically by MediTrack Pharmacy Management System</p>
        <p>Total medicines analyzed: {{ number_format($summary['total_medicines']) }} | Total inventory value: ${{ number_format($summary['total_inventory_value'], 2) }}</p>
        <p><strong>Action Required:</strong> {{ number_format($summary['out_of_stock_count']) }} out of stock, {{ number_format($summary['low_stock_count']) }} low stock items</p>
    </div>
</body>
</html>