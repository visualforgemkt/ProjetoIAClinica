import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Sparkles, FolderOpen, Image as ImageIcon, BarChart3, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const NAV = [
  { to: '/assistente',    label: 'Assistente',    icon: Sparkles },
  { to: '/campanhas',     label: 'Campanhas',     icon: FolderOpen },
  { to: '/criativos',     label: 'Criativos',     icon: ImageIcon },
  { to: '/insights',      label: 'Insights',      icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

function clinicInitial(name) {
  if (!name) return 'M';
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] || '') + (w[1]?.[0] || '')).toUpperCase() || 'M';
}

export default function MainLayout() {
  const { logout, clinic } = useAuthStore();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <button
        type="button"
        className="nav-toggle"
        onClick={() => setNavOpen(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={navOpen}
      >
        <Menu size={18} />
      </button>

      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`sb${navOpen ? ' is-open' : ''}`} aria-label="Navegação principal">
        <button
          type="button"
          className="sb-close"
          onClick={() => setNavOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
        <div className="sb-brand">
          <div className="sb-brand-mark" aria-hidden="true">M</div>
          <span className="sb-brand-text">MedAI</span>
          <span className="sb-brand-text-pro">Pro</span>
        </div>

        <nav className="sb-nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sb-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} className="sb-link-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-clinic">
            <div className="sb-clinic-avatar">{clinicInitial(clinic?.name)}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sb-clinic-name">{clinic?.name || 'Sua clínica'}</div>
              <div className="sb-clinic-role">Plano profissional</div>
            </div>
          </div>
          <button onClick={logout} className="sb-link" style={{ width: '100%', color: 'var(--text-muted)', marginTop: 4 }}>
            <LogOut size={18} className="sb-link-icon" /> Sair
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
