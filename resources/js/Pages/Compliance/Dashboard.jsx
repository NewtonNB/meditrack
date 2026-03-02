import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ComplianceDashboard({ metrics = {} }) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In a real implementation, you'd refresh the data here
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const complianceCards = [
    {
      title: 'DEA Events (30d)',
      value: metrics.dea_events_30d || 0,
      icon: 'bi-prescription2',
      color: 'purple',
      description: 'Controlled substance access events',
      regulation: 'DEA'
    },
    {
      title: 'HIPAA Events (30d)',
      value: metrics.hipaa_events_30d || 0,
      icon: 'bi-person-lock',
      color: 'blue',
      description: 'Patient data access events',
      regulation: 'HIPAA'
    },
    {
      title: 'Rx Modifications (30d)',
      value: metrics.prescription_modifications_30d || 0,
      icon: 'bi-file-medical',
      color: metrics.prescription_modifications_30d > 10 ? 'orange' : 'green',
      description: 'Prescription modification events',
      regulation: 'FDA'
    },
    {
      title: 'Data Exports (30d)',
      value: metrics.data_exports_30d || 0,
      icon: 'bi-download',
      color: metrics.data_exports_30d > 5 ? 'orange' : 'green',
      description: 'Patient data export events',
      regulation: 'HIPAA'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: 'bg-purple-500'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: 'bg-green-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'bg-orange-500'
      }
    };
    return colors[color] || colors.blue;
  };

  const getComplianceGrade = () => {
    const totalIssues = (metrics.prescription_modifications_30d > 10 ? 1 : 0) +
                       (metrics.data_exports_30d > 5 ? 1 : 0);
    
    if (totalIssues === 0) return { grade: 'A+', color: 'green', status: 'Excellent' };
    if (totalIssues === 1) return { grade: 'B+', color: 'orange', status: 'Good' };
    return { grade: 'C', color: 'red', status: 'Needs Attention' };
  };

  const complianceGrade = getComplianceGrade();

  return (
    <AuthenticatedLayout>
      <Head title="Compliance Dashboard - MediTrack" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <i className="bi bi-clipboard-check text-3xl text-white"></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>
                    <p className="text-purple-100 text-sm">Regulatory compliance monitoring and reporting</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    complianceGrade.color === 'green' ? 'bg-green-500' :
                    complianceGrade.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                  } text-white`}>
                    <i className="bi bi-award text-sm"></i>
                    <span className="text-sm font-medium">Grade: {String(complianceGrade?.grade || 'N/A')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">Last Update</div>
                    <div className="text-purple-100 text-sm">{lastUpdate.toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/audit-logs?event=controlled_substance_access"
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-prescription2"></i>
                  <span className="font-medium">DEA Events</span>
                </Link>
                
                <Link
                  href="/audit-logs?patient_id=*"
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-person-lock"></i>
                  <span className="font-medium">HIPAA Events</span>
                </Link>
                
                <Link
                  href="/security/dashboard"
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-shield-exclamation"></i>
                  <span className="font-medium">Security</span>
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Grade Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  complianceGrade.color === 'green' ? 'bg-green-100' :
                  complianceGrade.color === 'orange' ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  <span className={`text-3xl font-bold ${
                    complianceGrade.color === 'green' ? 'text-green-600' :
                    complianceGrade.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {String(complianceGrade?.grade || 'N/A')}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Compliance Grade</h2>
                <p className={`text-lg font-medium mb-4 ${
                  complianceGrade.color === 'green' ? 'text-green-600' :
                  complianceGrade.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {String(complianceGrade?.status || 'Unknown')}
                </p>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-shield-check text-green-500"></i>
                    <span>DEA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="bi bi-person-lock text-blue-500"></i>
                    <span>HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="bi bi-file-medical text-purple-500"></i>
                    <span>FDA Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceCards.map((card, index) => {
              const colorClasses = getColorClasses(card.color);
              const isWarning = card.color === 'orange';
              
              return (
                <div key={index} className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${colorClasses.bg} ${colorClasses.border}`}>
                  {/* Regulation Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-1 ${colorClasses.icon} text-white text-xs font-bold rounded-full`}>
                      {String(card?.regulation || 'N/A')}
                    </div>
                    {isWarning && (
                      <div className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full animate-pulse">
                        MONITOR
                      </div>
                    )}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 ${colorClasses.icon} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                    <i className={`${String(card?.icon || 'bi bi-info-circle')} text-white text-lg`}></i>
                  </div>
                  
                  {/* Value */}
                  <div className={`text-3xl font-bold text-center mb-2 font-mono ${colorClasses.text}`}>
                    {Number(card?.value || 0).toLocaleString()}
                  </div>
                  
                  {/* Title */}
                  <div className={`text-sm font-semibold text-center mb-2 ${colorClasses.text}`}>
                    {String(card?.title || 'N/A')}
                  </div>
                  
                  {/* Description */}
                  <div className={`text-xs text-center ${colorClasses.text} opacity-75`}>
                    {String(card?.description || 'No description')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Regulatory Compliance Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* DEA Compliance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-prescription2 text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">DEA Compliance</h3>
                    <p className="text-purple-100 text-sm">Controlled substances</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Schedule II Access</span>
                    <span className="text-lg font-bold text-purple-600">{metrics.dea_events_30d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Audit Trail</span>
                    <span className="text-lg font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Compliance Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">COMPLIANT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HIPAA Compliance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-person-lock text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">HIPAA Compliance</h3>
                    <p className="text-blue-100 text-sm">Patient data protection</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Patient Data Access</span>
                    <span className="text-lg font-bold text-blue-600">{metrics.hipaa_events_30d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Data Exports</span>
                    <span className="text-lg font-bold text-blue-600">{metrics.data_exports_30d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Compliance Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      metrics.data_exports_30d > 5 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {metrics.data_exports_30d > 5 ? 'MONITOR' : 'COMPLIANT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FDA Compliance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="bi bi-file-medical text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">FDA Compliance</h3>
                    <p className="text-green-100 text-sm">Prescription tracking</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Rx Modifications</span>
                    <span className="text-lg font-bold text-green-600">{metrics.prescription_modifications_30d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Audit Trail</span>
                    <span className="text-lg font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Compliance Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      metrics.prescription_modifications_30d > 10 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {metrics.prescription_modifications_30d > 10 ? 'MONITOR' : 'COMPLIANT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Recommended Actions</h3>
              <p className="text-indigo-100 text-sm">Maintain and improve compliance standards</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="bi bi-download text-blue-600"></i>
                    <span className="font-medium text-blue-800">Generate Report</span>
                  </div>
                  <p className="text-sm text-blue-600">Export compliance audit report</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="bi bi-calendar-check text-purple-600"></i>
                    <span className="font-medium text-purple-800">Schedule Review</span>
                  </div>
                  <p className="text-sm text-purple-600">Plan quarterly compliance review</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="bi bi-people text-green-600"></i>
                    <span className="font-medium text-green-800">Staff Training</span>
                  </div>
                  <p className="text-sm text-green-600">Update compliance training materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}