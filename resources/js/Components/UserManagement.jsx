import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { usePermissions } from '@/Components/PermissionGate';

/**
 * User Management Component
 *
 * Provides interface for managing users, roles, and permissions
 */
const UserManagement = ({ users = [], roles = [], pharmacies = [], canManageAll = false }) => {
  const { isSuperAdmin, isPharmacyAdmin } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Create user form
  const createForm = useForm({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    pharmacy_id: '',
  });

  // Edit user form
  const editForm = useForm({
    name: '',
    email: '',
    role: '',
    pharmacy_id: '',
  });

  // Password reset form
  const passwordForm = useForm({
    password: '',
  });

  // Handle create user
  const handleCreateUser = e => {
    e.preventDefault();
    createForm.post(route('users.store'), {
      onSuccess: () => {
        setShowCreateModal(false);
        createForm.reset();
      },
    });
  };

  // Handle edit user
  const handleEditUser = e => {
    e.preventDefault();
    editForm.put(route('users.update', selectedUser.id), {
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedUser(null);
        editForm.reset();
      },
    });
  };

  // Handle delete user
  const handleDeleteUser = () => {
    if (selectedUser) {
      editForm.delete(route('users.destroy', selectedUser.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        },
      });
    }
  };

  // Handle password reset
  const handlePasswordReset = e => {
    e.preventDefault();
    passwordForm.post(route('users.reset-password', selectedUser.id), {
      onSuccess: () => {
        setShowPasswordModal(false);
        setSelectedUser(null);
        passwordForm.reset();
      },
    });
  };

  // Handle toggle lock
  const handleToggleLock = user => {
    editForm.post(route('users.toggle-lock', user.id), {
      preserveScroll: true,
    });
  };

  // Open edit modal
  const openEditModal = user => {
    setSelectedUser(user);
    editForm.setData({
      name: user.name,
      email: user.email,
      role: user.role,
      pharmacy_id: user.pharmacy_id || '',
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = user => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Open password modal
  const openPasswordModal = user => {
    setSelectedUser(user);
    passwordForm.reset();
    setShowPasswordModal(true);
  };

  // Get role badge color
  const getRoleBadgeColor = role => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800 border-red-200',
      pharmacy_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      pharmacist: 'bg-blue-100 text-blue-800 border-blue-200',
      cashier: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get available roles for current user
  const getAvailableRoles = () => {
    if (isSuperAdmin()) {
      return roles;
    } else if (isPharmacyAdmin()) {
      return roles.filter(role => ['pharmacist', 'cashier'].includes(role.name));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <PrimaryButton onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-person-plus mr-2"></i>
          Add User
        </PrimaryButton>
      </div>

      {/* Users table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 border border-indigo-200 flex items-center justify-center">
                          <span className="text-indigo-700 text-sm font-semibold">
                            {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{String(user.name || 'Unknown')}</div>
                        <div className="text-sm text-gray-500">{String(user.email || 'No email')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.pharmacy?.name || 'No Pharmacy'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.locked_until ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <i className="bi bi-lock mr-1"></i>
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <i className="bi bi-check-circle mr-1"></i>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Edit User"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Reset Password"
                      >
                        <i className="bi bi-key"></i>
                      </button>
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`p-1 rounded ${user.locked_until ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                        title={user.locked_until ? 'Unlock User' : 'Lock User'}
                      >
                        <i className={`bi bi-${user.locked_until ? 'unlock' : 'lock'}`}></i>
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete User"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <form onSubmit={handleCreateUser} className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>

          <div className="space-y-4">
            <div>
              <InputLabel htmlFor="name" value="Name" />
              <TextInput
                id="name"
                type="text"
                className="mt-1 block w-full"
                value={createForm.data.name}
                onChange={e => createForm.setData('name', e.target.value)}
                required
              />
              <InputError message={createForm.errors.name} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="email" value="Email" />
              <TextInput
                id="email"
                type="email"
                className="mt-1 block w-full"
                value={createForm.data.email}
                onChange={e => createForm.setData('email', e.target.value)}
                required
              />
              <InputError message={createForm.errors.email} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="password" value="Password" />
              <TextInput
                id="password"
                type="password"
                className="mt-1 block w-full"
                value={createForm.data.password}
                onChange={e => createForm.setData('password', e.target.value)}
                required
              />
              <InputError message={createForm.errors.password} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="role" value="Role" />
              <select
                id="role"
                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                value={createForm.data.role}
                onChange={e => createForm.setData('role', e.target.value)}
                required
              >
                {getAvailableRoles().map(role => (
                  <option key={role.name} value={role.name}>
                    {role.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <InputError message={createForm.errors.role} className="mt-2" />
            </div>

            {canManageAll && (
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
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <SecondaryButton onClick={() => setShowCreateModal(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={createForm.processing}>
              {createForm.processing ? 'Creating...' : 'Create User'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <form onSubmit={handleEditUser} className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Edit User: {selectedUser?.name}
          </h2>

          <div className="space-y-4">
            <div>
              <InputLabel htmlFor="edit_name" value="Name" />
              <TextInput
                id="edit_name"
                type="text"
                className="mt-1 block w-full"
                value={editForm.data.name}
                onChange={e => editForm.setData('name', e.target.value)}
                required
              />
              <InputError message={editForm.errors.name} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="edit_email" value="Email" />
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

            <div>
              <InputLabel htmlFor="edit_role" value="Role" />
              <select
                id="edit_role"
                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                value={editForm.data.role}
                onChange={e => editForm.setData('role', e.target.value)}
                required
              >
                {getAvailableRoles().map(role => (
                  <option key={role.name} value={role.name}>
                    {role.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <InputError message={editForm.errors.role} className="mt-2" />
            </div>

            {canManageAll && (
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
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <SecondaryButton onClick={() => setShowEditModal(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={editForm.processing}>
              {editForm.processing ? 'Updating...' : 'Update User'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal show={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <form onSubmit={handlePasswordReset} className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Reset Password: {selectedUser?.name}
          </h2>

          <div>
            <InputLabel htmlFor="new_password" value="New Password" />
            <TextInput
              id="new_password"
              type="password"
              className="mt-1 block w-full"
              value={passwordForm.data.password}
              onChange={e => passwordForm.setData('password', e.target.value)}
              required
            />
            <InputError message={passwordForm.errors.password} className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <SecondaryButton onClick={() => setShowPasswordModal(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={passwordForm.processing}>
              {passwordForm.processing ? 'Resetting...' : 'Reset Password'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Delete User: {selectedUser?.name}
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this user? This action cannot be undone. The user will
            lose access to the system immediately.
          </p>

          <div className="flex justify-end space-x-3">
            <SecondaryButton onClick={() => setShowDeleteModal(false)}>Cancel</SecondaryButton>
            <DangerButton onClick={handleDeleteUser} disabled={editForm.processing}>
              {editForm.processing ? 'Deleting...' : 'Delete User'}
            </DangerButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
