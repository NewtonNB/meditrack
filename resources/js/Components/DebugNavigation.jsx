import React from 'react';
import { usePage } from '@inertiajs/react';

const DebugNavigation = () => {
  const { props } = usePage();
  const user = props.auth?.user;
  const userPermissions = props.auth?.permissions || [];

  console.log('Debug Navigation Data:', {
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    permissionCount: userPermissions.length,
  });

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      <strong>Debug Info:</strong>
      <div>
        User: {user?.name} ({user?.email})
      </div>
      <div>Role: {user?.role}</div>
      <div>Permissions: {userPermissions.length}</div>
      <div>Permission Names: {userPermissions.map(p => p?.name || 'Unknown').join(', ')}</div>
    </div>
  );
};

export default DebugNavigation;
