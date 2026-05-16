export const Input = ({ label, error, ...props }) => {
  const containerStyle = { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };
  const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' };
  const inputStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    fontSize: '0.875rem'
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input style={inputStyle} {...props} />
      {error && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
};
