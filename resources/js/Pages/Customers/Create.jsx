import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Create() {
  return (
    <AuthenticatedLayout header={<h2>New Customer</h2>}>
      <Head title="Add Customer" />
      <div className="p-6">
        <h3 className="font-semibold text-lg">Create customer (placeholder)</h3>
      </div>
    </AuthenticatedLayout>
  );
}
