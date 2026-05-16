import { Outlet, Link } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function MainLayout() {
  const { logout, clinic } = useAuthStore();

  const sidebarStyle = {
    width: '260px',
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-4)'
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: 'var(--space-2)'
  };

  return (
    <div className="app-container">
      <aside style={sidebarStyle}>
        <div style={{ paddingBottom: 'var(--space-6)', fontWeight: 700 }}>MedAI Pro</div>
        
        <nav style={{ flex: 1 }}>
          <Link to="/chat" style={linkStyle}><MessageSquare size={18} /> Chat de IA</Link>
          <Link to="/dashboard" style={linkStyle}><LayoutDashboard size={18} /> Dashboard</Link>
        </nav>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            {clinic?.name || 'Clínica'}
          </div>
          <button 
            onClick={logout}
            style={{ ...linkStyle, width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--color-error)' }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>
      
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
}
