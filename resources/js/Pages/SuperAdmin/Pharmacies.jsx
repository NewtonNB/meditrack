import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Pharmacies({ pharmacies, subscriptionPlans }) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const statusForm = useForm({
    status: 'active',
  });

  const planForm = useForm({
    subscription_plan: 'free',
    subscription_expires_at: '',
  });

  const openStatusModal = pharmacy => {
    setSelectedPharmacy(pharmacy);
    statusForm.setData('status', pharmacy.status);
    setIsStatusModalOpen(true);
  };

  const openPlanModal = pharmacy => {
    setSelectedPharmacy(pharmacy);
    planForm.setData('subscription_plan', pharmacy.subscription_plan);
    planForm.setData(
      'subscription_expires_at',
      pharmacy.subscription_expires_at ? pharmacy.subscription_expires_at.split('T')[0] : ''
    );
    setIsPlanModalOpen(true);
  };

  const submitStatusUpdate = e => {
    e.preventDefault();
    statusForm.patch(route('superadmin.pharmacies.status', selectedPharmacy.id), {
      onSuccess: () => {
        setIsStatusModalOpen(false);
        setSelectedPharmacy(null);
      },
    });
  };

  const submitPlanUpdate = e => {
    e.preventDefault();
    planForm.patch(route('superadmin.pharmacies.plan', selectedPharmacy.id), {
      onSuccess: () => {
        setIsPlanModalOpen(false);
        setSelectedPharmacy(null);
      },
    });
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = plan => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">Pharmacy Management</h2>
      }
    >
      <Head title="Pharmacy Management" />
      <div className="p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Pharmacies</h1>
          <p className="text-gray-600 mt-2">
            View, manage, and monitor all registered pharmacy clients
          </p>
        </div>

        {/* Pharmacies Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pharmacies.data.map(pharmacy => (
                  <tr key={pharmacy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <i className="bi bi-building text-indigo-600"></i>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{pharmacy.name}</div>
                          <div className="text-sm text-gray-500">ID: {pharmacy.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pharmacy.email}</div>
                      <div className="text-sm text-gray-500">{pharmacy.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pharmacy.status)}`}
                      >
                        {pharmacy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(pharmacy.subscription_plan)}`}
                      >
                        {pharmacy.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Users: {pharmacy.users_count}</div>
                      <div>Medicines: {pharmacy.medicines_count}</div>
                      <div>Sales: {pharmacy.sales_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <SecondaryButton size="sm" onClick={() => openStatusModal(pharmacy)}>
                          Status
                        </SecondaryButton>
                        <SecondaryButton size="sm" onClick={() => openPlanModal(pharmacy)}>
                          Plan
                        </SecondaryButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pharmacies.links && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                {pharmacies.links.prev && (
                  <a
                    href={pharmacies.links.prev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </a>
                )}
                {pharmacies.links.next && (
                  <a
                    href={pharmacies.links.next}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        <Modal show={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Update Status - {selectedPharmacy?.name}
            </h2>
            <form onSubmit={submitStatusUpdate} className="space-y-4">
              <div>
                <InputLabel htmlFor="status" value="Status" />
                <select
                  id="status"
                  value={statusForm.data.status}
                  onChange={e => statusForm.setData('status', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
                <InputError className="mt-2" message={statusForm.errors.status} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <SecondaryButton type="button" onClick={() => setIsStatusModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton disabled={statusForm.processing}>Update Status</PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>

        {/* Plan Update Modal */}
        <Modal show={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Update Plan - {selectedPharmacy?.name}
            </h2>
            <form onSubmit={submitPlanUpdate} className="space-y-4">
              <div>
                <InputLabel htmlFor="subscription_plan" value="Subscription Plan" />
                <select
                  id="subscription_plan"
                  value={planForm.data.subscription_plan}
                  onChange={e => planForm.setData('subscription_plan', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {subscriptionPlans.map(plan => (
                    <option key={plan.slug} value={plan.slug}>
                      {plan.name} - UGX {Number(plan.monthly_price).toLocaleString()}/month
                    </option>
                  ))}
                </select>
                <InputError className="mt-2" message={planForm.errors.subscription_plan} />
              </div>
              <div>
                <InputLabel htmlFor="subscription_expires_at" value="Expires At (Optional)" />
                <TextInput
                  id="subscription_expires_at"
                  type="date"
                  value={planForm.data.subscription_expires_at}
                  onChange={e => planForm.setData('subscription_expires_at', e.target.value)}
                  className="mt-1 block w-full"
                />
                <InputError className="mt-2" message={planForm.errors.subscription_expires_at} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <SecondaryButton type="button" onClick={() => setIsPlanModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton disabled={planForm.processing}>Update Plan</PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
