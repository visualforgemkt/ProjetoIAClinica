export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
    border: 'none',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-text-on-primary)',
    },
    secondary: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-text-on-primary)',
    }
  };

  const sizes = {
    sm: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };

  const combinedStyle = { ...baseStyle, ...variants[variant], ...sizes[size] };

  return (
    <button style={combinedStyle} className={className} {...props}>
      {children}
    </button>
  );
};
