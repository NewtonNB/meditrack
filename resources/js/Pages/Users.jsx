import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Users() {
  // Redirect to proper UserManagement page
  useEffect(() => {
    router.visit(route('users.management'));
  }, []);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Redirecting...</h2>}
    >
      <Head title="Users" />
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to User Management...</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
