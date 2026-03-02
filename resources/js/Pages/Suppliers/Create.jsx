import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Create() {
  return (
    <AuthenticatedLayout header={<h2>New Supplier</h2>}>
      <Head title="Add Supplier" />
      <div className="p-6">
        <h3 className="font-semibold text-lg">Create supplier (placeholder)</h3>
        <p className="text-sm text-gray-500 mt-2">
          If you prefer modals on the index page you can remove this file and redirect the
          controller instead.
        </p>
      </div>
    </AuthenticatedLayout>
  );
}
