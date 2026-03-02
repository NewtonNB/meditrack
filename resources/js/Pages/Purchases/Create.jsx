import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';

export default function CreatePurchase({ suppliers, medicines }) {
  const { data, setData, post, processing, errors } = useForm({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    tax_amount: 0,
    discount_amount: 0,
    shipping_cost: 0,
    notes: '',
    payment_terms: {},
    items: [
      {
        medicine_id: '',
        quantity: 1,
        unit_cost: 0,
        notes: '',
      },
    ],
  });

  const addItem = () => {
    setData('items', [
      ...data.items,
      {
        medicine_id: '',
        quantity: 1,
        unit_cost: 0,
        notes: '',
      },
    ]);
  };

  const removeItem = index => {
    if (data.items.length > 1) {
      const newItems = data.items.filter((_, i) => i !== index);
      setData('items', newItems);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData('items', newItems);
  };

  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => {
      return sum + parseFloat(item.quantity) * parseFloat(item.unit_cost || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(data.tax_amount || 0);
    const shipping = parseFloat(data.shipping_cost || 0);
    const discount = parseFloat(data.discount_amount || 0);
    return subtotal + tax + shipping - discount;
  };

  const handleSubmit = e => {
    e.preventDefault();
    post(route('purchases.store'));
  };

  const getMedicine = medicineId => {
    return medicines.find(m => m.id == medicineId);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Create Purchase Order
          </h2>
          <Button variant="outline" onClick={() => router.get(route('purchases.index'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchases
          </Button>
        </div>
      }
    >
      <Head title="Create Purchase Order" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Purchase Details */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier *
                    </label>
                    <select
                      value={data.supplier_id}
                      onChange={e => setData('supplier_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.supplier_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      value={data.purchase_date}
                      onChange={e => setData('purchase_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {errors.purchase_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.purchase_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={data.expected_delivery_date}
                      onChange={e => setData('expected_delivery_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.expected_delivery_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.expected_delivery_date}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={data.notes}
                    onChange={e => setData('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes for this purchase order..."
                  />
                  {errors.notes && <p className="text-red-600 text-sm mt-1">{errors.notes}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Purchase Items</CardTitle>
                  <Button type="button" onClick={addItem} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine *
                          </label>
                          <select
                            value={item.medicine_id}
                            onChange={e => updateItem(index, 'medicine_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Medicine</option>
                            {medicines.map(medicine => (
                              <option key={medicine.id} value={medicine.id}>
                                {medicine.name} - {medicine.generic_name}
                              </option>
                            ))}
                          </select>
                          {errors[`items.${index}.medicine_id`] && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors[`items.${index}.medicine_id`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {errors[`items.${index}.quantity`] && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors[`items.${index}.quantity`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Cost *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_cost}
                            onChange={e => updateItem(index, 'unit_cost', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            required
                          />
                          {errors[`items.${index}.unit_cost`] && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors[`items.${index}.unit_cost`]}
                            </p>
                          )}
                        </div>

                        <div className="flex items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                              $
                              {(
                                parseFloat(item.quantity) * parseFloat(item.unit_cost || 0)
                              ).toFixed(2)}
                            </div>
                          </div>
                          {data.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Notes
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={e => updateItem(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional notes for this item..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.tax_amount}
                        onChange={e => setData('tax_amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.discount_amount}
                        onChange={e => setData('discount_amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.shipping_cost}
                        onChange={e => setData('shipping_cost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>UGX {calculateSubtotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>UGX {parseFloat(data.tax_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>UGX {parseFloat(data.shipping_cost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-UGX {parseFloat(data.discount_amount || 0).toLocaleString()}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>UGX {calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.get(route('purchases.index'))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                <Save className="w-4 h-4 mr-2" />
                {processing ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
