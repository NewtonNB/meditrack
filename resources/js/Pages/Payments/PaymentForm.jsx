import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';

export default function PaymentForm({
  pharmacy,
  subscriptionPlan,
  billingCycle,
  amount,
  paymentMethods,
}) {
  const { data, setData, post, processing, errors } = useForm({
    plan_id: subscriptionPlan.id,
    payment_method: '',
    billing_cycle: billingCycle,
    amount: amount,
  });

  const [selectedMethod, setSelectedMethod] = useState(null);

  const submit = e => {
    e.preventDefault();
    post(route('payments.process'));
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSavings = () => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = subscriptionPlan.monthly_price * 12;
      const yearlyPrice = subscriptionPlan.yearly_price;
      return monthlyTotal - yearlyPrice;
    }
    return 0;
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Payment</h2>}
    >
      <Head title="Payment" />
      <div className="max-w-4xl mx-auto">
        {/* Plan Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{subscriptionPlan.name}</h4>
              <p className="text-gray-600">{subscriptionPlan.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(amount)}</div>
              <div className="text-sm text-gray-500">
                per {billingCycle === 'yearly' ? 'year' : 'month'}
              </div>
            </div>
          </div>

          {billingCycle === 'yearly' && getSavings() > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <i className="bi bi-gift text-green-600 text-xl mr-3"></i>
                <div>
                  <div className="font-semibold text-green-800">
                    You save {formatCurrency(getSavings())}!
                  </div>
                  <div className="text-sm text-green-600">By choosing yearly billing</div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Payment Method</h3>

          <form onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(paymentMethods).map(([key, method]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    data.payment_method === key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.enabled && setData('payment_method', key)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value={key}
                      checked={data.payment_method === key}
                      onChange={e => setData('payment_method', e.target.value)}
                      disabled={!method.enabled}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <i
                          className={`bi ${method.icon} text-xl mr-3 ${
                            data.payment_method === key ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        ></i>
                        <div>
                          <div className="font-semibold text-gray-900">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                    </div>
                    {!method.enabled && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <InputError message={errors.payment_method} className="mt-2" />

            {/* Payment Method Specific Fields */}
            {data.payment_method === 'stripe' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Card Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="card_number" value="Card Number" />
                    <TextInput
                      id="card_number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor="expiry_date" value="Expiry Date" />
                    <TextInput
                      id="expiry_date"
                      type="text"
                      placeholder="MM/YY"
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor="cvv" value="CVV" />
                    <TextInput
                      id="cvv"
                      type="text"
                      placeholder="123"
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor="cardholder_name" value="Cardholder Name" />
                    <TextInput
                      id="cardholder_name"
                      type="text"
                      placeholder="John Doe"
                      className="mt-1 block w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {data.payment_method === 'momo' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Mobile Money Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="momo_provider" value="Provider" />
                    <select
                      id="momo_provider"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Provider</option>
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="orange">Orange Money</option>
                    </select>
                  </div>
                  <div>
                    <InputLabel htmlFor="momo_number" value="Mobile Number" />
                    <TextInput
                      id="momo_number"
                      type="tel"
                      placeholder="+256 700 000 000"
                      className="mt-1 block w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {data.payment_method === 'bank_transfer' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-4">Bank Transfer Instructions</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>Bank:</strong> MediTrack Bank
                  </p>
                  <p>
                    <strong>Account Number:</strong> 1234567890
                  </p>
                  <p>
                    <strong>Account Name:</strong> MediTrack Ltd
                  </p>
                  <p>
                    <strong>Reference:</strong> {pharmacy.slug}-{subscriptionPlan.slug}
                  </p>
                  <p>
                    <strong>Amount:</strong> {formatCurrency(amount)}
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-3">
                  Please include the reference number when making the transfer. Your subscription
                  will be activated within 24 hours of payment confirmation.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <Link href={route('subscription.management')}>
                <SecondaryButton>
                  <i className="bi bi-arrow-left mr-2"></i>
                  Back to Subscription
                </SecondaryButton>
              </Link>

              <PrimaryButton disabled={processing || !data.payment_method}>
                {processing ? (
                  <>
                    <i className="bi bi-hourglass-split mr-2 animate-spin"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card mr-2"></i>
                    Pay {formatCurrency(amount)}
                  </>
                )}
              </PrimaryButton>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <i className="bi bi-shield-check mr-2"></i>
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
