import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Edit, Shield, Clock, Activity } from 'lucide-react';

export default function ShowProfile({ user, userStats, preferences }) {
  const formatDate = date => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  const getProfileCompletionColor = percentage => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">My Profile</h2>
          <Link href={route('profile.edit')}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      }
    >
      <Head title="My Profile" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                    />

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h3>
                    <p className="text-gray-600 mb-4">{user.email}</p>

                    <div className="space-y-2 mb-6">
                      {user.roles?.map(role => (
                        <Badge key={role.id} variant="secondary" className="mr-2">
                          <Shield className="w-3 h-3 mr-1" />
                          {role.name}
                        </Badge>
                      ))}
                    </div>

                    {user.bio && (
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 mb-2">About</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Profile Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                      <span className="text-sm font-bold text-gray-900">
                        {userStats.profile_completion}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProfileCompletionColor(userStats.profile_completion)}`}
                        style={{ width: `${userStats.profile_completion}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Member Since</span>
                      <p className="font-medium">{formatDate(userStats.member_since)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Login</span>
                      <p className="font-medium">{formatDate(userStats.last_login)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Logins</span>
                      <p className="font-medium">{userStats.total_logins || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Active Sessions</span>
                      <p className="font-medium">{userStats.active_sessions || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{user.phone}</p>
                        </div>
                      </div>
                    )}

                    {user.address && (
                      <div className="flex items-start space-x-3 md:col-span-2">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{user.address}</p>
                        </div>
                      </div>
                    )}

                    {user.date_of_birth && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="font-medium">{formatDate(user.date_of_birth)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              {user.emergency_contact && (
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {user.emergency_contact.name && (
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{user.emergency_contact.name}</p>
                        </div>
                      )}
                      {user.emergency_contact.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{user.emergency_contact.phone}</p>
                        </div>
                      )}
                      {user.emergency_contact.relationship && (
                        <div>
                          <p className="text-sm text-gray-500">Relationship</p>
                          <p className="font-medium">{user.emergency_contact.relationship}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Theme</p>
                      <p className="font-medium capitalize">{preferences.theme}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Language</p>
                      <p className="font-medium">{preferences.language?.toUpperCase() || 'EN'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Timezone</p>
                      <p className="font-medium">{preferences.timezone || 'UTC'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Currency</p>
                      <p className="font-medium">{preferences.currency || 'UGX'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">Profile Updated</p>
                        <p className="text-sm text-gray-500">
                          Last updated your profile information
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">{formatDate(user.updated_at)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-gray-500">Joined the platform</p>
                      </div>
                      <span className="text-sm text-gray-400">{formatDate(user.created_at)}</span>
                    </div>

                    {userStats.last_login && (
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">Last Login</p>
                          <p className="text-sm text-gray-500">Most recent login session</p>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatDate(userStats.last_login)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
