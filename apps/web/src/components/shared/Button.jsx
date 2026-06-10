export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const base =
    'btn-interactive inline-flex items-center justify-center gap-2 font-sans font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed enabled:hover:scale-[1.02] enabled:active:scale-[0.98]';
  const sizes = {
    md: 'rounded-full px-8 py-3.5 text-body-md',
    lg: 'rounded-full px-10 py-4 text-body-md lg:text-body-lg',
  };
  const variants = {
    primary:
      'bg-primary text-on-primary enabled:hover:bg-primary-container disabled:bg-outline-variant/40 disabled:text-on-surface-variant/50',
    secondary:
      'bg-secondary-container text-primary enabled:hover:bg-secondary-container/80 disabled:opacity-50',
    ghost: 'rounded-full text-primary enabled:hover:bg-primary/5',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
