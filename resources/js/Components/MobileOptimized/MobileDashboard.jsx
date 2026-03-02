import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Menu,
    X,
    Bell,
    Search,
    Plus,
    TrendingUp,
    Package,
    AlertTriangle,
    DollarSign,
    Users,
    ShoppingCart,
    Clock,
    Zap,
    BarChart3,
    Settings,
    Scan
} from 'lucide-react';

export default function MobileDashboard({ stats, automationSummary, quickInsights }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showScanner, setShowScanner] = useState(false);

    // Detect mobile device
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const quickActions = [
        {
            name: 'New Sale',
            icon: ShoppingCart,
            route: 'sales.create',
            color: 'bg-green-500',
            description: 'Process a sale'
        },
        {
            name: 'Add Medicine',
            icon: Plus,
            route: 'medicines.create',
            color: 'bg-blue-500',
            description: 'Add new medicine'
        },
        {
            name: 'Scan Barcode',
            icon: Scan,
            action: () => setShowScanner(true),
            color: 'bg-purple-500',
            description: 'Scan product'
        },
        {
            name: 'Reports',
            icon: BarChart3,
            route: 'reports.index',
            color: 'bg-orange-500',
            description: 'View analytics'
        }
    ];

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
        { key: 'actions', label: 'Actions', icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            MediTrack
                        </h1>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                            <Bell className="w-5 h-5" />
                            {automationSummary?.quick_actions?.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                        <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 rounded-md text-gray-600 dark:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <nav className="p-4 space-y-2">
                            <Link href={route('dashboard')} className="flex items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                <BarChart3 className="w-5 h-5 mr-3" />
                                Dashboard
                            </Link>
                            <Link href={route('medicines.index')} className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Package className="w-5 h-5 mr-3" />
                                Medicines
                            </Link>
                            <Link href={route('sales.index')} className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ShoppingCart className="w-5 h-5 mr-3" />
                                Sales
                            </Link>
                            <Link href={route('automation.reorder-suggestions')} className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Zap className="w-5 h-5 mr-3" />
                                Automation
                            </Link>
                            <Link href={route('reports.index')} className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <BarChart3 className="w-5 h-5 mr-3" />
                                Reports
                            </Link>
                        </nav>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {quickActions.map((action, index) => (
                        <Card key={index} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                {action.route ? (
                                    <Link href={route(action.route)} className="block">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className={`p-3 rounded-full ${action.color} text-white`}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {action.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <button onClick={action.action} className="w-full">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className={`p-3 rounded-full ${action.color} text-white`}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {action.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Today's Sales</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {stats?.sales?.today || 0}
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Low Stock</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {stats?.medicines?.low_stock || 0}
                                            </p>
                                        </div>
                                        <Package className="w-8 h-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Expiring Soon</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {stats?.medicines?.expiring_soon || 0}
                                            </p>
                                        </div>
                                        <Clock className="w-8 h-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Customers</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {stats?.customers?.total || 0}
                                            </p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Revenue Chart Placeholder */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Revenue Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg flex items-end justify-center p-4">
                                    <div className="flex items-end space-x-2 h-full w-full">
                                        {[40, 65, 45, 80, 55, 90, 70].map((height, index) => (
                                            <div
                                                key={index}
                                                className="bg-blue-500 rounded-t flex-1"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-3">
                        {quickInsights?.map((insight, index) => (
                            <Card key={index} className={`border-l-4 ${
                                insight.type === 'danger' ? 'border-l-red-500' :
                                insight.type === 'warning' ? 'border-l-orange-500' :
                                'border-l-green-500'
                            }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-full ${
                                            insight.type === 'danger' ? 'bg-red-100 dark:bg-red-900' :
                                            insight.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900' :
                                            'bg-green-100 dark:bg-green-900'
                                        }`}>
                                            <AlertTriangle className={`w-4 h-4 ${
                                                insight.type === 'danger' ? 'text-red-600 dark:text-red-400' :
                                                insight.type === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                                                'text-green-600 dark:text-green-400'
                                            }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                {insight.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {insight.message}
                                            </p>
                                            {insight.route && (
                                                <Link href={route(insight.route)} className="inline-block mt-2">
                                                    <Button size="sm" variant="outline" className="text-xs">
                                                        {insight.action}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )) || (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">All systems running smoothly!</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div className="space-y-3">
                        <Card>
                            <CardContent className="p-4">
                                <Link href={route('automation.reorder-suggestions')} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                Reorder Suggestions
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {automationSummary?.reorder_suggestions?.total || 0} items need attention
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">
                                        {automationSummary?.reorder_suggestions?.critical || 0}
                                    </Badge>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <Link href={route('automation.expiry-reminders')} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                Expiry Alerts
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {automationSummary?.expiry_reminders?.total || 0} items expiring soon
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">
                                        {automationSummary?.expiry_reminders?.critical || 0}
                                    </Badge>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <Link href={route('reports.index')} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                            <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                Generate Reports
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Export analytics and insights
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    isOpen={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScan={(code, type) => {
                        console.log('Scanned:', code, type);
                        // Handle scan result
                    }}
                />
            )}
        </div>
    );
}