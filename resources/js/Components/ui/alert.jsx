import React from 'react';

export const Alert = ({ className = '', variant = 'default', children, ...props }) => {
  const baseClasses = 'relative w-full rounded-lg border p-4';
  
  const variants = {
    default: 'bg-white border-gray-200 text-gray-900',
    destructive: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };
  
  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ className = '', children, ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);