import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  const layoutStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-surface-muted)'
  };

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    padding: 'var(--space-8)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    width: '100%',
    maxWidth: '400px'
  };

  return (
    <div style={layoutStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>MedAI Pro</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Acesse sua clínica</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
