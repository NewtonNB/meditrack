export default function SecondaryButton({
  type = 'button',
  className = '',
  disabled,
  children,
  size = 'md',
  leftIcon = null,
  rightIcon = null,
  block = false,
  color = 'gray', // gray | indigo | green | blue | pink | red
  ...props
}) {
  const sizeClasses =
    {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-sm',
    }[size] || 'px-4 py-2 text-sm';

  const palette = {
    gray: {
      border: 'border-gray-300',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-50',
      ring: 'focus:ring-gray-500',
    },
    indigo: {
      border: 'border-indigo-300',
      text: 'text-indigo-700',
      hover: 'hover:bg-indigo-50',
      ring: 'focus:ring-indigo-500',
    },
    green: {
      border: 'border-green-300',
      text: 'text-green-700',
      hover: 'hover:bg-green-50',
      ring: 'focus:ring-green-500',
    },
    blue: {
      border: 'border-blue-300',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-50',
      ring: 'focus:ring-blue-500',
    },
    pink: {
      border: 'border-pink-300',
      text: 'text-pink-700',
      hover: 'hover:bg-pink-50',
      ring: 'focus:ring-pink-500',
    },
    red: {
      border: 'border-red-300',
      text: 'text-red-700',
      hover: 'hover:bg-red-50',
      ring: 'focus:ring-red-500',
    },
  }[color] || {
    border: 'border-gray-300',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-50',
    ring: 'focus:ring-gray-500',
  };

  return (
    <button
      {...props}
      type={type}
      className={
        `${block ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-md border ${palette.border} bg-white ${sizeClasses} font-semibold ${palette.text} shadow-sm transition duration-150 ease-in-out ${palette.hover} focus:outline-none focus:ring-2 ${palette.ring} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ` +
        className
      }
      disabled={disabled}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
