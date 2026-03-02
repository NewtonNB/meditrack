export default function PrimaryButton({
  className = '',
  disabled,
  children,
  size = 'md', // sm | md | lg
  loading = false,
  leftIcon = null,
  rightIcon = null,
  block = false,
  color = 'indigo', // indigo | green | blue | pink | gray | red
  ...props
}) {
  const sizeClasses =
    {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-sm',
    }[size] || 'px-4 py-2 text-sm';

  const palette = {
    indigo: {
      bg: 'bg-indigo-600',
      hover: 'hover:bg-indigo-500',
      active: 'active:bg-indigo-700',
      ring: 'focus:ring-indigo-500',
    },
    green: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-500',
      active: 'active:bg-green-700',
      ring: 'focus:ring-green-500',
    },
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-500',
      active: 'active:bg-blue-700',
      ring: 'focus:ring-blue-500',
    },
    pink: {
      bg: 'bg-pink-600',
      hover: 'hover:bg-pink-500',
      active: 'active:bg-pink-700',
      ring: 'focus:ring-pink-500',
    },
    gray: {
      bg: 'bg-gray-700',
      hover: 'hover:bg-gray-600',
      active: 'active:bg-gray-800',
      ring: 'focus:ring-gray-500',
    },
    red: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-500',
      active: 'active:bg-red-700',
      ring: 'focus:ring-red-500',
    },
  }[color] || {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-500',
    active: 'active:bg-indigo-700',
    ring: 'focus:ring-indigo-500',
  };

  return (
    <button
      {...props}
      className={
        `${block ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-md border border-transparent ${palette.bg} ${sizeClasses} font-semibold text-white shadow-sm transition duration-150 ease-in-out ${palette.hover} focus:outline-none focus:ring-2 ${palette.ring} focus:ring-offset-2 ${palette.active} disabled:opacity-50 disabled:cursor-not-allowed ` +
        className
      }
      disabled={disabled || loading}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
