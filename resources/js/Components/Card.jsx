import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg ${className}`}>
      <div className="p-6">{children}</div>
    </div>
  );
}
