export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const base =
    'btn-interactive inline-flex items-center justify-center gap-2 font-sans font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-canopy-600 focus-visible:ring-offset-2 focus-visible:ring-offset-linen disabled:cursor-not-allowed disabled:opacity-50';
  const sizes = {
    sm: 'rounded-pill px-[18px] py-[9px] text-[13px]',
    md: 'rounded-pill px-[26px] py-[13px] text-[15px]',
    lg: 'rounded-pill px-8 py-4 text-[15px]',
  };
  const variants = {
    primary: 'bg-canopy-600 text-white enabled:hover:bg-canopy',
    secondary:
      'border-[1.5px] border-linen-sunken bg-transparent text-ink-soft enabled:hover:border-fern enabled:hover:text-canopy',
    ember: 'bg-ember text-white enabled:hover:bg-[#b56c34]',
    ghost: 'rounded-pill bg-transparent px-2 text-canopy-600 enabled:hover:bg-fern-tint/60',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
