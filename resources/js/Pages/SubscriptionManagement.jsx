import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function SubscriptionManagement({ pharmacy, subscriptionPlan, payments, usage }) {
  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'trial':
        return 'Trial';
      default:
        return 'Unknown';
    }
  };

  const isExpiringSoon = () => {
    if (!pharmacy.subscription_expires_at) return false;
    const daysUntilExpiry =
      new Date(pharmacy.subscription_expires_at).getTime() - new Date().getTime();
    return daysUntilExpiry <= 7 * 24 * 60 * 60 * 1000; // 7 days
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Subscription Management
        </h2>
      }
    >
      <Head title="Subscription Management" />
      <div className="space-y-6">
        {/* Current Subscription Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Current Subscription</h3>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(pharmacy.status)}`}
            >
              {getStatusText(pharmacy.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{subscriptionPlan.name}</h4>
              <p className="text-gray-600 mb-4">{subscriptionPlan.description}</p>
              <div className="text-3xl font-bold text-indigo-600">
                UGX {Number(subscriptionPlan.monthly_price).toLocaleString()}
                <span className="text-lg text-gray-500">/month</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Expires On</h4>
              <p className="text-lg font-semibold text-gray-900">
                {pharmacy.subscription_expires_at
                  ? formatDate(pharmacy.subscription_expires_at)
                  : 'N/A'}
              </p>
              {isExpiringSoon() && (
                <p className="text-sm text-orange-600 mt-1">
                  <i className="bi bi-exclamation-triangle mr-1"></i>
                  Expires soon!
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Fee</h4>
              <p className="text-lg font-semibold text-gray-900">${pharmacy.monthly_fee}</p>
              <p className="text-sm text-gray-500">Billed monthly</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={route('subscription.upgrade')}>
              <PrimaryButton>
                <i className="bi bi-arrow-up mr-2"></i>
                Upgrade Plan
              </PrimaryButton>
            </Link>
            <Link href={route('subscription.renew')}>
              <SecondaryButton>
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Renew Subscription
              </SecondaryButton>
            </Link>
            <Link href={route('subscription.billing')}>
              <SecondaryButton>
                <i className="bi bi-receipt mr-2"></i>
                View Billing
              </SecondaryButton>
            </Link>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Usage Statistics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{usage.users}</div>
              <div className="text-sm text-gray-500">Users</div>
              <div className="text-xs text-gray-400">
                {subscriptionPlan.max_users === -1
                  ? 'Unlimited'
                  : `of ${subscriptionPlan.max_users}`}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{usage.medicines}</div>
              <div className="text-sm text-gray-500">Medicines</div>
              <div className="text-xs text-gray-400">
                {subscriptionPlan.max_medicines === -1
                  ? 'Unlimited'
                  : `of ${subscriptionPlan.max_medicines}`}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{usage.customers}</div>
              <div className="text-sm text-gray-500">Customers</div>
              <div className="text-xs text-gray-400">
                {subscriptionPlan.max_customers === -1
                  ? 'Unlimited'
                  : `of ${subscriptionPlan.max_customers}`}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {usage.sales_this_month}
              </div>
              <div className="text-sm text-gray-500">Sales This Month</div>
              <div className="text-xs text-gray-400">
                {subscriptionPlan.max_sales_per_month === -1
                  ? 'Unlimited'
                  : `of ${subscriptionPlan.max_sales_per_month}`}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Plan Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h4>
              <ul className="space-y-2">
                {subscriptionPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <i className="bi bi-check-circle text-green-600 mr-3"></i>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Limits</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-semibold">
                    {subscriptionPlan.max_users === -1 ? 'Unlimited' : subscriptionPlan.max_users}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medicines:</span>
                  <span className="font-semibold">
                    {subscriptionPlan.max_medicines === -1
                      ? 'Unlimited'
                      : subscriptionPlan.max_medicines}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customers:</span>
                  <span className="font-semibold">
                    {subscriptionPlan.max_customers === -1
                      ? 'Unlimited'
                      : subscriptionPlan.max_customers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sales/Month:</span>
                  <span className="font-semibold">
                    {subscriptionPlan.max_sales_per_month === -1
                      ? 'Unlimited'
                      : subscriptionPlan.max_sales_per_month}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Payments</h3>

          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        UGX {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.invoice_number || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="bi bi-receipt text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
