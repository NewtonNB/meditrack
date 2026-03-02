import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Camera,
  Trash2,
  Download,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Bell,
  Globe,
  Clock,
  DollarSign,
  Layout,
  LogOut,
} from 'lucide-react';

export default function EditProfile({ mustVerifyEmail, status, user, preferences, userStats }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Profile form
  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    date_of_birth: user.date_of_birth || '',
    emergency_contact: user.emergency_contact || {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  // Password form
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Preferences form
  const preferencesForm = useForm({
    theme: preferences.theme || 'light',
    language: preferences.language || 'en',
    timezone: preferences.timezone || 'UTC',
    date_format: preferences.date_format || 'Y-m-d',
    time_format: preferences.time_format || '24h',
    currency: preferences.currency || 'UGX',
    notifications_email: preferences.notifications_email ?? true,
    notifications_browser: preferences.notifications_browser ?? true,
    notifications_sms: preferences.notifications_sms ?? false,
    dashboard_layout: preferences.dashboard_layout || 'default',
    items_per_page: preferences.items_per_page || 15,
    auto_logout: preferences.auto_logout || 30,
  });

  // Avatar form
  const avatarForm = useForm({
    avatar: null,
  });

  const tabs = [
    { key: 'profile', label: 'Profile Information', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'preferences', label: 'Preferences', icon: Settings },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleProfileSubmit = e => {
    e.preventDefault();
    profileForm.patch(route('profile.update'));
  };

  const handlePasswordSubmit = e => {
    e.preventDefault();
    passwordForm.patch(route('profile.password.update'), {
      onSuccess: () => passwordForm.reset(),
    });
  };

  const handlePreferencesSubmit = e => {
    e.preventDefault();
    preferencesForm.patch(route('profile.preferences.update'));
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      avatarForm.setData('avatar', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = () => {
    avatarForm.post(route('profile.avatar.upload'), {
      onSuccess: () => {
        avatarForm.reset();
        setAvatarPreview(null);
      },
    });
  };

  const handleAvatarDelete = () => {
    if (confirm('Are you sure you want to delete your avatar?')) {
      avatarForm.delete(route('profile.avatar.delete'));
    }
  };

  const handleThemeChange = theme => {
    preferencesForm.setData('theme', theme);
    // Immediately apply theme
    fetch(route('profile.theme.set'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ theme }),
    }).then(() => {
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      if (theme !== 'auto') {
        document.documentElement.classList.add(theme);
      }
    });
  };

  const exportUserData = () => {
    window.open(route('profile.export'), '_blank');
  };

  const resetPreferences = () => {
    if (confirm('Are you sure you want to reset all preferences to default?')) {
      preferencesForm.post(route('profile.preferences.reset'));
    }
  };

  const formatDate = date => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">Profile Settings</h2>
          <div className="flex space-x-2">
            <Button onClick={exportUserData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      }
    >
      <Head title="Profile Settings" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={avatarPreview || user.avatar_url}
                        alt={user.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                      />
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {avatarPreview && (
                      <div className="flex space-x-2 justify-center mb-4">
                        <Button
                          onClick={handleAvatarUpload}
                          size="sm"
                          disabled={avatarForm.processing}
                        >
                          Upload
                        </Button>
                        <Button onClick={() => setAvatarPreview(null)} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    )}

                    {user.avatar && !avatarPreview && (
                      <Button
                        onClick={handleAvatarDelete}
                        variant="outline"
                        size="sm"
                        className="mb-4"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Avatar
                      </Button>
                    )}

                    <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>

                    <div className="mt-4 space-y-2">
                      {user.roles?.map(role => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Profile Completion</span>
                        <span className="font-medium">{userStats.profile_completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${userStats.profile_completion}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Member Since</span>
                        <span>{formatDate(userStats.member_since)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last Login</span>
                        <span>{formatDate(userStats.last_login)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.data.name}
                            onChange={e => profileForm.setData('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {profileForm.errors.name && (
                            <p className="text-red-600 text-sm mt-1">{profileForm.errors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileForm.data.email}
                            onChange={e => profileForm.setData('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {profileForm.errors.email && (
                            <p className="text-red-600 text-sm mt-1">{profileForm.errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileForm.data.phone}
                            onChange={e => profileForm.setData('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {profileForm.errors.phone && (
                            <p className="text-red-600 text-sm mt-1">{profileForm.errors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={profileForm.data.date_of_birth}
                            onChange={e => profileForm.setData('date_of_birth', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {profileForm.errors.date_of_birth && (
                            <p className="text-red-600 text-sm mt-1">
                              {profileForm.errors.date_of_birth}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Address
                        </label>
                        <textarea
                          value={profileForm.data.address}
                          onChange={e => profileForm.setData('address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {profileForm.errors.address && (
                          <p className="text-red-600 text-sm mt-1">{profileForm.errors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={profileForm.data.bio}
                          onChange={e => profileForm.setData('bio', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell us about yourself..."
                        />
                        {profileForm.errors.bio && (
                          <p className="text-red-600 text-sm mt-1">{profileForm.errors.bio}</p>
                        )}
                      </div>

                      {/* Emergency Contact */}
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                          Emergency Contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.data.emergency_contact.name}
                              onChange={e =>
                                profileForm.setData('emergency_contact', {
                                  ...profileForm.data.emergency_contact,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={profileForm.data.emergency_contact.phone}
                              onChange={e =>
                                profileForm.setData('emergency_contact', {
                                  ...profileForm.data.emergency_contact,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Relationship
                            </label>
                            <input
                              type="text"
                              value={profileForm.data.emergency_contact.relationship}
                              onChange={e =>
                                profileForm.setData('emergency_contact', {
                                  ...profileForm.data.emergency_contact,
                                  relationship: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Spouse, Parent, Sibling"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={profileForm.processing}>
                          {profileForm.processing ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.data.current_password}
                          onChange={e => passwordForm.setData('current_password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {passwordForm.errors.current_password && (
                          <p className="text-red-600 text-sm mt-1">
                            {passwordForm.errors.current_password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.data.password}
                          onChange={e => passwordForm.setData('password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {passwordForm.errors.password && (
                          <p className="text-red-600 text-sm mt-1">
                            {passwordForm.errors.password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.data.password_confirmation}
                          onChange={e =>
                            passwordForm.setData('password_confirmation', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={passwordForm.processing}>
                          {passwordForm.processing ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>

                    {/* Account Deletion */}
                    <div className="border-t pt-6 mt-8">
                      <h4 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h4>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-700 mb-4">
                          Once you delete your account, all of its resources and data will be
                          permanently deleted.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete your account? This action cannot be undone.'
                              )
                            ) {
                              const password = prompt('Please enter your password to confirm:');
                              if (password) {
                                passwordForm.setData('password', password);
                                passwordForm.delete(route('profile.destroy'));
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      User Preferences
                      <Button onClick={resetPreferences} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset to Default
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePreferencesSubmit} className="space-y-8">
                      {/* Theme Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          <Sun className="w-4 h-4 inline mr-2" />
                          Theme Preference
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'auto', label: 'Auto', icon: Monitor },
                          ].map(theme => (
                            <button
                              key={theme.value}
                              type="button"
                              onClick={() => handleThemeChange(theme.value)}
                              className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                                preferencesForm.data.theme === theme.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <theme.icon className="w-6 h-6" />
                              <span className="text-sm font-medium">{theme.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Localization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4 inline mr-2" />
                            Language
                          </label>
                          <select
                            value={preferencesForm.data.language}
                            onChange={e => preferencesForm.setData('language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="it">Italian</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Timezone
                          </label>
                          <select
                            value={preferencesForm.data.timezone}
                            onChange={e => preferencesForm.setData('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Format
                          </label>
                          <select
                            value={preferencesForm.data.date_format}
                            onChange={e => preferencesForm.setData('date_format', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Y-m-d">YYYY-MM-DD</option>
                            <option value="m/d/Y">MM/DD/YYYY</option>
                            <option value="d/m/Y">DD/MM/YYYY</option>
                            <option value="M j, Y">Month DD, YYYY</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Format
                          </label>
                          <select
                            value={preferencesForm.data.time_format}
                            onChange={e => preferencesForm.setData('time_format', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="24h">24 Hour</option>
                            <option value="12h">12 Hour (AM/PM)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-2" />
                            Currency
                          </label>
                          <select
                            value={preferencesForm.data.currency}
                            onChange={e => preferencesForm.setData('currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="UGX">UGX (Uganda Shillings)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                            <option value="CAD">CAD (C$)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Layout className="w-4 h-4 inline mr-2" />
                            Dashboard Layout
                          </label>
                          <select
                            value={preferencesForm.data.dashboard_layout}
                            onChange={e =>
                              preferencesForm.setData('dashboard_layout', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="default">Default</option>
                            <option value="compact">Compact</option>
                            <option value="expanded">Expanded</option>
                          </select>
                        </div>
                      </div>

                      {/* Display Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Items Per Page
                          </label>
                          <select
                            value={preferencesForm.data.items_per_page}
                            onChange={e =>
                              preferencesForm.setData('items_per_page', parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <LogOut className="w-4 h-4 inline mr-2" />
                            Auto Logout (minutes)
                          </label>
                          <select
                            value={preferencesForm.data.auto_logout}
                            onChange={e =>
                              preferencesForm.setData('auto_logout', parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={240}>4 hours</option>
                            <option value={480}>8 hours</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={preferencesForm.processing}>
                          {preferencesForm.processing ? 'Saving...' : 'Save Preferences'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Email Notifications
                            </h4>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferencesForm.data.notifications_email}
                              onChange={e =>
                                preferencesForm.setData('notifications_email', e.target.checked)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Browser Notifications
                            </h4>
                            <p className="text-sm text-gray-500">
                              Receive push notifications in your browser
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferencesForm.data.notifications_browser}
                              onChange={e =>
                                preferencesForm.setData('notifications_browser', e.target.checked)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                            <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferencesForm.data.notifications_sms}
                              onChange={e =>
                                preferencesForm.setData('notifications_sms', e.target.checked)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={preferencesForm.processing}>
                          {preferencesForm.processing ? 'Saving...' : 'Save Notification Settings'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
