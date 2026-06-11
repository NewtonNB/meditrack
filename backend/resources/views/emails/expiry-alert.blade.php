<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Expiry Alert - {{ $medicine->name }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #ff7b7b 0%, #ff6b6b 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .alert-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .critical {
            background: #f8d7da;
            border-color: #f5c6cb;
        }
        .countdown {
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .days-left {
            font-size: 48px;
            font-weight: bold;
            color: #e74c3c;
        }
        .financial-impact {
            background: #ffe6e6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .action-button {
            background: #e74c3c;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 10px 5px;
        }
        .secondary {
            background: #95a5a6;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #e74c3c, #c0392b);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Medicine Expiry Alert</h1>
        <p>{{ $medicine->name }} is expiring soon!</p>
    </div>
    
    <div class="content">
        <div class="countdown">
            <div class="days-left">{{ $days_until_expiry }}</div>
            <p><strong>Days Until Expiry</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {{ 100 - (($days_until_expiry / 90) * 100) }}%"></div>
            </div>
        </div>

        <div class="alert-box {{ $days_until_expiry <= 7 ? 'critical' : '' }}">
            <h2>Medicine Details</h2>
            <p><strong>Medicine:</strong> {{ $medicine->name }}</p>
            <p><strong>Batch Number:</strong> {{ $medicine->batch_number ?? 'N/A' }}</p>
            <p><strong>Expiry Date:</strong> {{ $expiry_date->format('F j, Y') }}</p>
            <p><strong>Current Stock:</strong> {{ $current_stock }} units</p>
        </div>

        <div class="financial-impact">
            <h3>💰 Financial Impact</h3>
            <p><strong>Potential Loss:</strong> UGX {{ number_format($potential_loss, 0) }}</p>
            <p><strong>Suggested Discount:</strong> {{ $suggested_discount }}%</p>
            <p><strong>Recovery Value:</strong> UGX {{ number_format($potential_loss * (100 - $suggested_discount) / 100, 0) }}</p>
        </div>

        <h3>Recommended Actions:</h3>
        <ul>
            @if($days_until_expiry <= 7)
                <li>🔴 <strong>URGENT:</strong> Apply {{ $suggested_discount }}% discount immediately</li>
                <li>📞 Contact supplier about return policy</li>
                <li>🏷️ Create promotional campaign</li>
            @elseif($days_until_expiry <= 30)
                <li>🟡 Apply {{ $suggested_discount }}% discount to move stock</li>
                <li>📢 Promote to regular customers</li>
                <li>📊 Monitor daily sales closely</li>
            @else
                <li>🟢 Plan promotional activities</li>
                <li>📈 Track sales velocity</li>
                <li>🔄 Consider bundling with other products</li>
            @endif
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/automation/expiry-reminders" class="action-button">
                View All Expiry Alerts
            </a>
            <a href="{{ config('app.url') }}/medicines/{{ $medicine->id }}" class="action-button secondary">
                View Medicine Details
            </a>
        </div>

        <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>🤖 AI Recommendation:</h4>
            <p>Based on historical data, applying a {{ $suggested_discount }}% discount now could help you recover {{ round((100 - $suggested_discount) * 0.8) }}% of the product value.</p>
        </div>
    </div>

    <div class="footer">
        <p>This alert was generated by MediTrack Smart Automation System</p>
        <p>{{ now()->format('F j, Y \a\t g:i A') }}</p>
        <p>💡 Enable automatic discounting to maximize recovery value</p>
    </div>
</body>
</html>