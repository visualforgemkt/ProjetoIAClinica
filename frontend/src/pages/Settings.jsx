import useAuthStore from '../store/useAuthStore';
import { Mail, User, Building2, MapPin, Instagram, MessageCircle } from 'lucide-react';

export default function Settings() {
  const { user, clinic } = useAuthStore();

  return (
    <>
      <header className="page-header">
        <div>
          <div className="page-title">Configurações</div>
          <div className="page-subtitle">Perfil, clínica e preferências</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, maxWidth: 900 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Sua conta
            </h3>
            <Row icon={User}  label="Nome"  value={user?.name || '—'} />
            <Row icon={Mail}  label="E-mail" value={user?.email || '—'} />
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Sua clínica
            </h3>
            <Row icon={Building2}     label="Nome"          value={clinic?.name || '—'} />
            <Row icon={MapPin}        label="Cidade"        value={clinic?.city || '—'} />
            <Row icon={MessageCircle} label="Especialidade" value={clinic?.specialty || '—'} />
            <Row icon={Instagram}     label="Instagram"     value={clinic?.instagram || '—'} />
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}
