import { useEffect } from 'react';

/**
 * Soft in-app confirmation dialog — replaces native browser confirm().
 *
 * Props:
 *  isOpen   : bool
 *  onConfirm: () => void
 *  onCancel : () => void
 *  title    : string
 *  message  : string
 *  confirmLabel  : string  (default "Delete")
 *  confirmVariant: "danger" | "warning" | "primary"  (default "danger")
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
}) {
  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onCancel(); };
    if (isOpen) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const iconStyles = {
    danger:  { bg: 'bg-red-100', text: 'text-red-600', icon: 'bi-trash3' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'bi-exclamation-triangle' },
    primary: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'bi-info-circle' },
  };

  const { bg, text, icon } = iconStyles[confirmVariant] ?? iconStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-4`}>
            <i className={`bi ${icon} ${text} text-xl`} />
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          <div className="text-sm text-gray-500">{message}</div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variantStyles[confirmVariant] ?? variantStyles.danger}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
