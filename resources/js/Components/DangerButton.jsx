export default function DangerButton({
  className = '',
  disabled,
  children,
  size = 'md',
  leftIcon = null,
  rightIcon = null,
  block = false,
  color = 'red', // red | rose | orange
  ...props
}) {
  const sizeClasses =
    {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-sm',
    }[size] || 'px-4 py-2 text-sm';

  const palette = {
    red: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-500',
      active: 'active:bg-red-700',
      ring: 'focus:ring-red-500',
    },
    rose: {
      bg: 'bg-rose-600',
      hover: 'hover:bg-rose-500',
      active: 'active:bg-rose-700',
      ring: 'focus:ring-rose-500',
    },
    orange: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-500',
      active: 'active:bg-orange-700',
      ring: 'focus:ring-orange-500',
    },
  }[color] || {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-500',
    active: 'active:bg-red-700',
    ring: 'focus:ring-red-500',
  };

  return (
    <button
      {...props}
      className={
        `${block ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-md border border-transparent ${palette.bg} ${sizeClasses} font-semibold text-white shadow-sm transition duration-150 ease-in-out ${palette.hover} focus:outline-none focus:ring-2 ${palette.ring} focus:ring-offset-2 ${palette.active} disabled:opacity-50 disabled:cursor-not-allowed ` +
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
