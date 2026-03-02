import React from 'react';

export default function PageHeader({
  color = 'indigo',
  icon = null,
  title,
  actions = null,
  children = null,
}) {
  const accent =
    {
      indigo: 'bg-indigo-600 text-indigo-700',
      green: 'bg-green-600 text-green-700',
      blue: 'bg-blue-500 text-blue-700',
      pink: 'bg-pink-500 text-pink-700',
    }[color] || 'bg-indigo-600 text-indigo-700';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded ${accent.split(' ')[0]}`}></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 flex items-center gap-2">
            {icon}
            {title}
          </h1>
        </div>
        {actions}
      </div>
      {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
    </div>
  );
}
