import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function Preferences({ auth, preferences, defaultPreferences }) {
  // Ensure settings is always an array
  const [settings, setSettings] = useState(() => {
    const prefs = Array.isArray(preferences) && preferences.length > 0 
      ? preferences 
      : Array.isArray(defaultPreferences) && defaultPreferences.length > 0
      ? defaultPreferences
      : [];
    return prefs;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const notificationTypes = [
    {
      type: 'low_stock',
      title: 'Low Stock Alerts',
      description: 'Get notified when medicine stock is running low',
      icon: '📦',
    },
    {
      type: 'out_of_stock',
      title: 'Out of Stock Alerts',
      description: 'Critical alerts when medicines are completely out of stock',
      icon: '🚫',
    },
    {
      type: 'medicine_expiry',
      title: 'Expiry Alerts',
      description: 'Notifications for medicines approaching expiry date',
      icon: '⏰',
    },
    {
      type: 'expired_medicine',
      title: 'Expired Medicine Alerts',
      description: 'Critical alerts for expired medicines',
      icon: '☠️',
    },
    {
      type: 'pending_purchase',
      title: 'Purchase Updates',
      description: 'Updates on pending and ordered purchases',
      icon: '📋',
    },
    {
      type: 'system_alert',
      title: 'System Alerts',
      description: 'Important system notifications and updates',
      icon: '⚙️',
    },
  ];

  const handleToggle = (type, channel) => {
    setSettings(prevSettings => {
      // Ensure prevSettings is an array
      const settingsArray = Array.isArray(prevSettings) ? prevSettings : [];
      const existingIndex = settingsArray.findIndex(s => s.notification_type === type);
      
      if (existingIndex >= 0) {
        const updated = [...settingsArray];
        updated[existingIndex] = {
          ...updated[existingIndex],
          [`${channel}_enabled`]: !updated[existingIndex][`${channel}_enabled`],
        };
        return updated;
      } else {
        return [
          ...settingsArray,
          {
            notification_type: type,
            in_app_enabled: channel === 'in_app',
            email_enabled: channel === 'email',
            sms_enabled: channel === 'sms',
          },
        ];
      }
    });
  };

  const isEnabled = (type, channel) => {
    // Ensure settings is an array before calling find
    const settingsArray = Array.isArray(settings) ? settings : [];
    const setting = settingsArray.find(s => s.notification_type === type);
    return setting ? setting[`${channel}_enabled`] : true; // Default to enabled
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content'),
        },
        body: JSON.stringify({ preferences: settings }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Notification Preferences" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BellIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">
                    Notification Preferences
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Customize how you receive notifications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Channels Info */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Notification Channels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <BellIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900">In-App</h3>
                    <p className="text-sm text-gray-600">
                      Notifications appear in the notification bell
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <EnvelopeIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900">SMS</h3>
                    <p className="text-sm text-gray-600">
                      Get text messages for critical alerts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Notification Types
              </h2>

              <div className="space-y-6">
                {notificationTypes.map(notif => (
                  <div
                    key={notif.type}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{String(notif?.icon || '🔔')}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {String(notif?.title || 'Notification')}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {String(notif?.description || 'No description')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {/* In-App Toggle */}
                      <button
                        onClick={() => handleToggle(notif.type, 'in_app')}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isEnabled(notif.type, 'in_app')
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BellIcon className="h-5 w-5 text-gray-700" />
                          <span className="font-medium text-gray-900">In-App</span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            isEnabled(notif.type, 'in_app')
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              isEnabled(notif.type, 'in_app')
                                ? 'translate-x-6'
                                : 'translate-x-0.5'
                            } mt-0.5`}
                          />
                        </div>
                      </button>

                      {/* Email Toggle */}
                      <button
                        onClick={() => handleToggle(notif.type, 'email')}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isEnabled(notif.type, 'email')
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-5 w-5 text-gray-700" />
                          <span className="font-medium text-gray-900">Email</span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            isEnabled(notif.type, 'email')
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              isEnabled(notif.type, 'email')
                                ? 'translate-x-6'
                                : 'translate-x-0.5'
                            } mt-0.5`}
                          />
                        </div>
                      </button>

                      {/* SMS Toggle */}
                      <button
                        onClick={() => handleToggle(notif.type, 'sms')}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isEnabled(notif.type, 'sms')
                            ? 'bg-purple-50 border-purple-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-700" />
                          <span className="font-medium text-gray-900">SMS</span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            isEnabled(notif.type, 'sms')
                              ? 'bg-purple-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              isEnabled(notif.type, 'sms')
                                ? 'translate-x-6'
                                : 'translate-x-0.5'
                            } mt-0.5`}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-8 flex items-center justify-between">
                <div>
                  {saved && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckIcon className="h-5 w-5" />
                      <span className="font-medium">Preferences saved successfully!</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle mr-2"></i>
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
