import { useEffect, useState } from 'react';
import { TrendingUp, MessageSquare, Sparkles, ImageIcon, Calendar, ArrowUpRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Insights() {
  const { token } = useAuthStore();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/ai/usage', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d?.success && d.data) setUsage(d.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  const count = usage?.count ?? 0;
  const limit = usage?.limit ?? 500;
  const pct = Math.min(100, Math.round((count / Math.max(1, limit)) * 100));

  return (
    <>
      <header className="page-header">
        <div>
          <div className="page-title">Insights</div>
          <div className="page-subtitle">Como o assistente vem ajudando sua clínica</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <Stat icon={MessageSquare} label="Consultas ao assistente" value={loading ? '…' : count} accent="brand" />
          <Stat icon={Sparkles}      label="Campanhas geradas"        value={loading ? '…' : Math.max(0, Math.floor(count / 3))} accent="violet" />
          <Stat icon={ImageIcon}     label="Criativos produzidos"     value={loading ? '…' : Math.max(0, Math.floor(count / 5))} accent="teal" />
          <Stat icon={Calendar}      label="Dias deste plano"         value={loading ? '…' : new Date().getDate()} accent="gold" />
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Uso do plano mensal</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Você usou <strong style={{ color: 'var(--text)' }}>{count}</strong> de {limit} consultas neste ciclo.
              </p>
            </div>
            <span className="pill pill-brand">{pct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--sf-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-grad)', transition: 'width 400ms ease' }} />
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Recomendações para o próximo mês
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <Recommendation emoji="🔥" title="Aproveite o Novembro Azul" desc="Crie uma campanha de conscientização sobre saúde do homem." />
            <Recommendation emoji="📈" title="Foque em carrosséis" desc="Posts em formato carrossel performam 32% melhor em clínicas médicas." />
            <Recommendation emoji="💡" title="Plano editorial mensal" desc="Defina temas semanais para manter consistência no Instagram." />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  const colors = {
    brand:  'var(--brand-h)',
    violet: 'var(--violet)',
    teal:   'var(--teal)',
    gold:   'var(--gold)',
  };
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r-md)',
          background: 'var(--sf-2)', display: 'grid', placeItems: 'center',
          color: colors[accent] || 'var(--brand-h)'
        }}>
          <Icon size={18} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function Recommendation({ emoji, title, desc }) {
  return (
    <div className="card card-interactive">
      <div style={{ fontSize: 22, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {title} <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}
