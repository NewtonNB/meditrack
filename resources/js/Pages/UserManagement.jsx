import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ImageUploadModal from '@/Components/ImageUploadModal';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function UserManagement(props) {
  // Safely extract props with fallbacks
  const users = props.users || { data: [] };
  const roles = props.roles || [];
  const pharmacies = props.pharmacies || [];
  const canManageAll = props.canManageAll || false;
  const filters = props.filters || {};

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [roleFilter, setRoleFilter] = useState(filters.role || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms
  const createForm = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'cashier',
    pharmacy_id: '',
    is_active: true,
    phone: '',
    address: '',
  });

  const editForm = useForm({
    name: '',
    email: '',
    role: '',
    pharmacy_id: '',
    is_active: true,
    phone: '',
    address: '',
  });

  const deleteForm = useForm({});

  // Debug logging to help identify issues - safely stringify objects
  console.log('UserManagement props:', JSON.stringify({
    usersCount: users.data?.length || 0,
    rolesCount: roles.length || 0,
    pharmaciesCount: pharmacies.length || 0,
    canManageAll,
    filters
  }, null, 2));

  // Debug avatar URLs - safely stringify objects
  if (users.data?.length > 0) {
    console.log('User avatars:', JSON.stringify(users.data.map(user => ({
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url
    })), null, 2));
  }

  // Format role name - safely handle any input type
  const formatRoleName = (role) => {
    // Ensure role is a string
    const roleStr = typeof role === 'string' ? role : String(role || 'user');
    return roleStr.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status badge
  const getStatusBadge = (user) => {
    if (!user.is_active) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800 border-red-200',
      pharmacy_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      pharmacist: 'bg-blue-100 text-blue-800 border-blue-200',
      cashier: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Modal handlers
  const openCreateModal = () => {
    // Close any other open modals first
    setIsEditOpen(false);
    setIsViewOpen(false);
    setIsDeleteOpen(false);
    setSelectedUser(null);

    createForm.reset();
    setIsCreateOpen(true);
  };

  const openEditModal = (user) => {
    // Close any other open modals first
    setIsCreateOpen(false);
    setIsViewOpen(false);
    setIsDeleteOpen(false);

    setSelectedUser(user);
    editForm.setData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'cashier',
      pharmacy_id: user.pharmacy_id || '',
      is_active: user.is_active !== false,
      phone: user.phone || '',
      address: user.address || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user) => {
    // Close any other open modals first
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);

    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const openViewModal = (user) => {
    // Close any other open modals first
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);

    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const openImageUploadModal = (user) => {
    console.log('Opening image upload modal for user:', JSON.stringify({
      id: user?.id,
      name: user?.name,
      email: user?.email
    }, null, 2));
    // Close any other open modals first
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsViewOpen(false);

    setSelectedUser(user);
    setIsImageUploadOpen(true);
  };

  const closeImageUploadModal = () => {
    setIsImageUploadOpen(false);
    setSelectedUser(null);
  };

  const handleImageUploadSuccess = () => {
    // Refresh the user data with a slight delay to ensure backend processing is complete
    setTimeout(() => {
      router.reload({ only: ['users'] });
    }, 500);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();

    createForm.post(route('users.store'), {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
        setLastUpdated(new Date());
      },
      onError: (errors) => {
        console.error('Create user errors:', errors);
      }
    });
  };

  const handleEditUser = (e) => {
    e.preventDefault();

    editForm.put(route('users.update', selectedUser.id), {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedUser(null);
        setLastUpdated(new Date());
      },
      onError: (errors) => {
        console.error('Update user errors:', errors);
      }
    });
  };

  const handleDeleteUser = () => {
    deleteForm.delete(route('users.destroy', selectedUser.id), {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedUser(null);
        setLastUpdated(new Date());
      },
      onError: (errors) => {
        console.error('Delete user errors:', errors);
      }
    });
  };

  // Enhanced filtering with role and status filters
  const filteredUsers = (Array.isArray(users.data) ? users.data : []).filter(user => {
    const matchesSearch = !searchTerm || [
      user.name || '',
      user.email || '',
      user.role || ''
    ].some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update timestamp every minute
    
    return () => clearInterval(interval);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search || roleFilter !== filters.role || statusFilter !== filters.status) {
        router.get(route('users.management'), {
          search: searchTerm,
          role: roleFilter,
          status: statusFilter
        }, {
          preserveState: true,
          preserveScroll: true,
          only: ['users']
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, statusFilter]);

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          User Management
        </h2>
      }
    >
      <Head title="User Management" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Professional Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <i className="bi bi-people-fill text-3xl text-white"></i>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-lg text-slate-600 mt-2">
                    Manage user accounts, roles, and permissions for your pharmacy
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">{filteredUsers.length} Users Active</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full">
                      <span className="text-sm font-mono-numbers">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <SecondaryButton 
                  onClick={() => router.reload({ only: ['users'] })}
                  disabled={isLoading}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <i className={`bi bi-arrow-clockwise text-lg ${isLoading ? 'animate-spin' : ''}`}></i>
                  <span className="ml-2">Refresh</span>
                </SecondaryButton>
                
                <PrimaryButton 
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-primary-500 to-accent-600 hover:from-primary-600 hover:to-accent-700 hover:scale-105 transition-all duration-200"
                >
                  <i className="bi bi-person-plus text-lg"></i>
                  <span className="ml-2">Add User</span>
                </PrimaryButton>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Users',
                value: filteredUsers.length,
                subtitle: `${users.data?.length || 0} total in system`,
                icon: 'bi-people-fill',
                gradient: 'from-accent-500 to-primary-600',
                bgGradient: 'from-accent-50 to-primary-50',
                iconBg: 'bg-accent-100',
                iconColor: 'text-accent-600'
              },
              {
                title: 'Active Users',
                value: filteredUsers.filter(user => user.is_active).length || 0,
                subtitle: `${filteredUsers.filter(user => !user.is_active).length || 0} inactive`,
                icon: 'bi-check-circle-fill',
                gradient: 'from-green-500 to-emerald-600',
                bgGradient: 'from-green-50 to-emerald-50',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600'
              },
              {
                title: 'Administrators',
                value: filteredUsers.filter(user => String(user.role || '').includes('admin')).length || 0,
                subtitle: 'System & pharmacy admins',
                icon: 'bi-shield-check-fill',
                gradient: 'from-primary-500 to-neutral-600',
                bgGradient: 'from-primary-50 to-neutral-50',
                iconBg: 'bg-primary-100',
                iconColor: 'text-primary-600'
              },
              {
                title: 'Pharmacists',
                value: filteredUsers.filter(user => String(user.role || '') === 'pharmacist').length || 0,
                subtitle: 'Licensed pharmacists',
                icon: 'bi-person-badge-fill',
                gradient: 'from-orange-500 to-red-600',
                bgGradient: 'from-orange-50 to-red-50',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600'
              }
            ].map((card, index) => (
              <div
                key={card.title}
                className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 backdrop-blur-sm`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-1 font-mono-numbers">{card.value}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <i className="bi bi-info-circle"></i>
                      <span className="font-mono-numbers">{card.subtitle}</span>
                    </p>
                  </div>
                  <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${card.icon} text-2xl ${card.iconColor}`}></i>
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            ))}
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="bi bi-search text-slate-400 text-lg"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <i className="bi bi-x-circle text-lg"></i>
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                {/* Role Filter */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="appearance-none bg-white/60 border border-white/40 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900"
                  >
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="pharmacy_admin">Pharmacy Admin</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="cashier">Cashier</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="bi bi-chevron-down text-slate-400"></i>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white/60 border border-white/40 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="bi bi-chevron-down text-slate-400"></i>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || roleFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      setStatusFilter('');
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors duration-200 font-medium"
                  >
                    <i className="bi bi-x-lg"></i>
                    <span className="ml-2">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {filteredUsers.length} of {Array.isArray(users.data) ? users.data.length : 0} users
                {searchTerm && ` matching "${searchTerm}"`}
                {roleFilter && ` with role "${formatRoleName(roleFilter)}"`}
                {statusFilter && ` that are ${statusFilter}`}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live data
                </span>
              </div>
            </div>
          </div>

          {/* Professional Users Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="bi bi-table text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Users Directory ({filteredUsers.length})
                    </h3>
                    <p className="text-slate-600">Manage your pharmacy team members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/40">
                    <span className="text-sm text-slate-600 font-medium">
                      {filteredUsers.filter(user => user.is_active).length} Active
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full">
                    <span className="text-sm font-medium">Live Data</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-person-circle text-lg"></i>
                        Profile
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-envelope text-lg"></i>
                        Contact
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-shield-check text-lg"></i>
                        Role
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-activity text-lg"></i>
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-clock text-lg"></i>
                        Last Login
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-2">
                        <i className="bi bi-gear text-lg"></i>
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-accent-50/50 transition-all duration-300 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Profile Column with Enhanced Avatar */}
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="relative group/avatar">
                              {user.avatar_url && !user.avatar_url.includes('gravatar.com') ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.name}
                                  className="h-14 w-14 rounded-2xl shadow-lg object-cover"
                                  onError={(e) => {
                                    // Fallback to gradient avatar if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center ${
                                  user.role === 'super_admin' ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                                  user.role === 'pharmacy_admin' ? 'bg-gradient-to-br from-primary-400 to-accent-500' :
                                  user.role === 'pharmacist' ? 'bg-gradient-to-br from-accent-400 to-primary-500' :
                                  'bg-gradient-to-br from-green-400 to-emerald-500'
                                }`}
                                style={{ display: user.avatar_url && !user.avatar_url.includes('gravatar.com') ? 'none' : 'flex' }}
                              >
                                <span className="text-white text-lg font-bold">
                                  {user.name ? String(user.name).charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                              
                              {/* Camera Button - appears on hover */}
                              <button
                                onClick={() => openImageUploadModal(user)}
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                                title="Update profile image"
                              >
                                <i className="bi bi-camera text-xs text-gray-600 hover:text-blue-600"></i>
                              </button>
                              
                              {/* Online Status Indicator */}
                              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${
                                user.is_active ? 'bg-green-500' : 'bg-slate-400'
                              }`}>
                                {user.is_active && (
                                  <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                {String(user.name || 'Unknown')}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                ID: #{user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Column */}
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                              <i className="bi bi-envelope text-slate-400"></i>
                              {String(user.email || 'No email')}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <i className="bi bi-telephone text-slate-400"></i>
                                {user.phone}
                              </div>
                            )}
                            {!user.phone && (
                              <div className="text-xs text-slate-400 italic">No phone number</div>
                            )}
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                              user.role === 'super_admin' ? 'bg-red-100 text-red-600' :
                              user.role === 'pharmacy_admin' ? 'bg-purple-100 text-purple-600' :
                              user.role === 'pharmacist' ? 'bg-blue-100 text-blue-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              <i className={`bi ${
                                user.role === 'super_admin' ? 'bi-crown-fill' :
                                user.role === 'pharmacy_admin' ? 'bi-shield-fill-check' :
                                user.role === 'pharmacist' ? 'bi-capsule-pill' :
                                'bi-calculator'
                              } text-lg`}></i>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-bold border-2 ${getRoleBadgeColor(user.role)}`}>
                                {formatRoleName(user.role || 'user')}
                              </span>
                              <div className="text-xs text-slate-500 mt-1">
                                {user.role === 'super_admin' ? 'Full System Access' :
                                 user.role === 'pharmacy_admin' ? 'Pharmacy Management' :
                                 user.role === 'pharmacist' ? 'Medicine Expert' :
                                 'Sales & POS'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            <div>
                              {user.is_active ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200">
                                  <i className="bi bi-check-circle-fill mr-1"></i>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200">
                                  <i className="bi bi-x-circle-fill mr-1"></i>
                                  Inactive
                                </span>
                              )}
                              <div className="text-xs text-slate-500 mt-1">
                                {user.is_active ? 'Can access system' : 'Access disabled'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Last Login Column */}
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="text-sm text-slate-900 font-medium">
                            {user.last_login_at ? (
                              <>
                                <div>{new Date(user.last_login_at).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500">
                                  {new Date(user.last_login_at).toLocaleTimeString()}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-slate-500">Never</div>
                                <div className="text-xs text-slate-400">No login recorded</div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(user)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                              title="View Details"
                            >
                              <i className="bi bi-eye text-lg group-hover/btn:scale-110 transition-transform"></i>
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                              title="Edit User"
                            >
                              <i className="bi bi-pencil text-lg group-hover/btn:scale-110 transition-transform"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                              title="Delete User"
                            >
                              <i className="bi bi-trash text-lg group-hover/btn:scale-110 transition-transform"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <i className="bi bi-people text-3xl text-slate-400"></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                              {searchTerm || roleFilter || statusFilter ? 'No users match your filters' : 'No users found'}
                            </h3>
                            <p className="text-slate-600 mb-4">
                              {searchTerm || roleFilter || statusFilter 
                                ? 'Try adjusting your search terms or filters to find users.'
                                : 'Get started by adding your first user to the system.'
                              }
                            </p>
                            {(searchTerm || roleFilter || statusFilter) ? (
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setRoleFilter('');
                                  setStatusFilter('');
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                                Reset Filters
                              </button>
                            ) : (
                              <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-600 text-white rounded-xl hover:from-primary-600 hover:to-accent-700 transition-all duration-200 font-semibold"
                              >
                                <i className="bi bi-person-plus"></i>
                                Add First User
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-white/50">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <span>Total: {filteredUsers.length} users</span>
                  <span className="text-slate-400">•</span>
                  <span>Active: {filteredUsers.filter(user => user.is_active).length}</span>
                  <span className="text-slate-400">•</span>
                  <span>Inactive: {filteredUsers.filter(user => !user.is_active).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
          <div className="p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="bi bi-person-plus"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                  <p className="text-xs text-gray-500">Create a new user account for your pharmacy.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="name" value="Full Name" />
                  <TextInput
                    id="name"
                    className="mt-1 block w-full"
                    value={createForm.data.name}
                    onChange={e => createForm.setData('name', e.target.value)}
                    required
                    placeholder="Enter full name"
                  />
                  <InputError message={createForm.errors.name} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="email" value="Email Address" />
                  <TextInput
                    id="email"
                    type="email"
                    className="mt-1 block w-full"
                    value={createForm.data.email}
                    onChange={e => createForm.setData('email', e.target.value)}
                    required
                    placeholder="user@example.com"
                  />
                  <InputError message={createForm.errors.email} className="mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="password" value="Password" />
                  <TextInput
                    id="password"
                    type="password"
                    className="mt-1 block w-full"
                    value={createForm.data.password}
                    onChange={e => createForm.setData('password', e.target.value)}
                    required
                    placeholder="Enter password"
                  />
                  <InputError message={createForm.errors.password} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                  <TextInput
                    id="password_confirmation"
                    type="password"
                    className="mt-1 block w-full"
                    value={createForm.data.password_confirmation}
                    onChange={e => createForm.setData('password_confirmation', e.target.value)}
                    required
                    placeholder="Confirm password"
                  />
                  <InputError message={createForm.errors.password_confirmation} className="mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="role" value="Role" />
                  <select
                    id="role"
                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    value={createForm.data.role}
                    onChange={e => createForm.setData('role', e.target.value)}
                    required
                  >
                    <option value="cashier">Cashier</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="pharmacy_admin">Pharmacy Admin</option>
                    {canManageAll && <option value="super_admin">Super Admin</option>}
                  </select>
                  <InputError message={createForm.errors.role} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="pharmacy_id" value="Pharmacy" />
                  <select
                    id="pharmacy_id"
                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    value={createForm.data.pharmacy_id}
                    onChange={e => createForm.setData('pharmacy_id', e.target.value)}
                  >
                    <option value="">Select Pharmacy</option>
                    {pharmacies.map(pharmacy => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={createForm.errors.pharmacy_id} className="mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="phone" value="Phone Number (Optional)" />
                  <TextInput
                    id="phone"
                    className="mt-1 block w-full"
                    value={createForm.data.phone}
                    onChange={e => createForm.setData('phone', e.target.value)}
                    placeholder="+256 700 000 000"
                  />
                  <InputError message={createForm.errors.phone} className="mt-2" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                      checked={createForm.data.is_active}
                      onChange={e => createForm.setData('is_active', e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600">Active User</span>
                  </label>
                </div>
              </div>

              <div>
                <InputLabel htmlFor="address" value="Address (Optional)" />
                <textarea
                  id="address"
                  rows="2"
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                  value={createForm.data.address}
                  onChange={e => createForm.setData('address', e.target.value)}
                  placeholder="Enter address"
                />
                <InputError message={createForm.errors.address} className="mt-2" />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton disabled={createForm.processing}>
                  Create User
                </PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)}>
          <div className="p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <i className="bi bi-pencil"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                  <p className="text-xs text-gray-500">Update user information and settings.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsEditOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedUser && (
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="edit_name" value="Full Name" />
                    <TextInput
                      id="edit_name"
                      className="mt-1 block w-full"
                      value={editForm.data.name}
                      onChange={e => editForm.setData('name', e.target.value)}
                      required
                    />
                    <InputError message={editForm.errors.name} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="edit_email" value="Email Address" />
                    <TextInput
                      id="edit_email"
                      type="email"
                      className="mt-1 block w-full"
                      value={editForm.data.email}
                      onChange={e => editForm.setData('email', e.target.value)}
                      required
                    />
                    <InputError message={editForm.errors.email} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="edit_role" value="Role" />
                    <select
                      id="edit_role"
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      value={editForm.data.role}
                      onChange={e => editForm.setData('role', e.target.value)}
                      required
                    >
                      <option value="cashier">Cashier</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="pharmacy_admin">Pharmacy Admin</option>
                      {canManageAll && <option value="super_admin">Super Admin</option>}
                    </select>
                    <InputError message={editForm.errors.role} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="edit_pharmacy_id" value="Pharmacy" />
                    <select
                      id="edit_pharmacy_id"
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      value={editForm.data.pharmacy_id}
                      onChange={e => editForm.setData('pharmacy_id', e.target.value)}
                    >
                      <option value="">Select Pharmacy</option>
                      {pharmacies.map(pharmacy => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.name}
                        </option>
                      ))}
                    </select>
                    <InputError message={editForm.errors.pharmacy_id} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="edit_phone" value="Phone Number" />
                    <TextInput
                      id="edit_phone"
                      className="mt-1 block w-full"
                      value={editForm.data.phone}
                      onChange={e => editForm.setData('phone', e.target.value)}
                    />
                    <InputError message={editForm.errors.phone} className="mt-2" />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        checked={editForm.data.is_active}
                        onChange={e => editForm.setData('is_active', e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-600">Active User</span>
                    </label>
                  </div>
                </div>

                <div>
                  <InputLabel htmlFor="edit_address" value="Address" />
                  <textarea
                    id="edit_address"
                    rows="2"
                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    value={editForm.data.address}
                    onChange={e => editForm.setData('address', e.target.value)}
                  />
                  <InputError message={editForm.errors.address} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <SecondaryButton type="button" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton disabled={editForm.processing}>
                    Update User
                  </PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* View User Modal */}
        <Modal show={isViewOpen} onClose={() => setIsViewOpen(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <i className="bi bi-person"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <p className="text-xs text-gray-500">View user information and activity.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsViewOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedUser && (
              <div className="space-y-4">
                {/* User Avatar and Basic Info */}
                <div className="text-center pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 border border-accent-200 flex items-center justify-center mx-auto mb-3">
                    <span className="text-accent-700 text-xl font-semibold">
                      {selectedUser.name ? String(selectedUser.name).charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {formatRoleName(selectedUser.role || 'user')}
                    </span>
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
                    <div className="mt-1">
                      {getStatusBadge(selectedUser)}
                    </div>
                  </div>

                  {selectedUser.phone && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
                      <div className="font-medium text-gray-800">{selectedUser.phone}</div>
                    </div>
                  )}

                  {selectedUser.address && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Address</div>
                      <div className="text-sm text-gray-700">{selectedUser.address}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Last Login</div>
                    <div className="font-medium text-gray-800">
                      {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Member Since</div>
                    <div className="font-medium text-gray-800">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <SecondaryButton
                      className="flex-1"
                      onClick={() => {
                        setIsViewOpen(false);
                        openEditModal(selectedUser);
                      }}
                    >
                      <i className="bi bi-pencil mr-1"></i>Edit
                    </SecondaryButton>
                    <DangerButton
                      className="flex-1"
                      onClick={() => {
                        setIsViewOpen(false);
                        openDeleteModal(selectedUser);
                      }}
                    >
                      <i className="bi bi-trash mr-1"></i>Delete
                    </DangerButton>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <SecondaryButton onClick={() => setIsViewOpen(false)}>
                Close
              </SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Delete User Modal */}
        <Modal show={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsDeleteOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedUser && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="bi bi-exclamation-triangle text-red-400"></i>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        Are you sure you want to delete this user?
                      </h4>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You are about to permanently delete <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                          This will remove all their data and cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">User Information:</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Role:</strong> {formatRoleName(selectedUser.role || 'user')}</div>
                    <div><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={handleDeleteUser} disabled={deleteForm.processing}>
                Delete User
              </DangerButton>
            </div>
          </div>
        </Modal>

        {/* Image Upload Modal */}
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={closeImageUploadModal}
          user={selectedUser}
          onSuccess={handleImageUploadSuccess}
          title={`Update ${selectedUser?.name || 'User'}'s Profile Image`}
          uploadRoute="users.avatar.upload"
          deleteRoute="users.avatar.delete"
        />
      </div>
    </AuthenticatedLayout>
  );
}