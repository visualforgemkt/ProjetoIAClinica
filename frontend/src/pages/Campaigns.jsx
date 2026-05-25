import { useEffect, useState } from 'react';
import { FolderOpen, Sparkles, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function Campaigns() {
  const { token } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/ai/conversations', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d?.success && Array.isArray(d.data)) setItems(d.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="page-title">Campanhas</div>
          <div className="page-subtitle">Tudo que o assistente já criou para você</div>
        </div>
        <Link to="/assistente" className="btn btn-primary">
          <Plus size={14} /> Nova campanha
        </Link>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s-8)' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty" style={{ marginTop: 80 }}>
            <div className="empty-icon"><FolderOpen size={22} /></div>
            <div className="empty-title">Nenhuma campanha ainda</div>
            <div className="empty-desc">Converse com o assistente para gerar a primeira campanha da sua clínica.</div>
            <Link to="/assistente" className="btn btn-primary" style={{ marginTop: 16 }}>
              <Sparkles size={14} /> Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {items.map(item => (
              <Link key={item.id} to={`/assistente?conversation=${item.id}`} className="card card-interactive" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Sparkles size={14} style={{ color: 'var(--brand-h)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(item.created_at || item.updated_at)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {item.title || item.first_message || 'Conversa sem título'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Toque para reabrir no assistente
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}
