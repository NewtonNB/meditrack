import React, { useEffect, useState } from 'react';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
} from 'recharts';

export default function SalesTrendsCard({ period = 'daily', days = 30, dark = false }) {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/analytics/sales-trends?period=${encodeURIComponent(period)}&days=${encodeURIComponent(days)}`);
			const json = await res.json();
			setData(json.trends || []);
		} catch (e) {
			setError('Failed to load sales trends');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [period, days]);

	return (
		<div className={`rounded-2xl border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow p-6`}>
			<div className="flex items-center justify-between mb-4">
				<h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Sales Trends</h3>
				<span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Last {days} days</span>
			</div>
			{loading ? (
				<div className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-500'}`}>Loading...</div>
			) : error ? (
				<div className="text-sm text-red-600">{error}</div>
			) : (
				<div style={{ width: '100%', height: 300 }}>
					<ResponsiveContainer>
						<AreaChart data={data}>
							<defs>
								<linearGradient id="revenueGradientDash" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="profitGradientDash" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#10B981" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
							<XAxis dataKey={period === 'daily' ? 'day' : 'period'} stroke={dark ? '#9CA3AF' : '#6b7280'} fontSize={12} />
							<YAxis stroke={dark ? '#9CA3AF' : '#6b7280'} fontSize={12} />
							<Tooltip />
							<Legend />
							<Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#revenueGradientDash)" name="Revenue" strokeWidth={2} />
							<Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#profitGradientDash)" name="Profit" strokeWidth={2} />
						</AreaChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}
