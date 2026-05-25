import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Loader2, ArrowUp, Sparkles, ImagePlus, Calendar, Megaphone, HelpCircle, TrendingUp, Lightbulb, FileText, CreditCard, ShieldAlert, ExternalLink } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import CampaignRenderer from '../components/CampaignRenderer';
import OnboardingWizard from '../components/OnboardingWizard';
import SatisfactionFeedback from '../components/SatisfactionFeedback';

const QUICK_ACTIONS = [
  { icon: Megaphone,  title: 'Criar campanha',        desc: 'Plano completo para Instagram, Stories e WhatsApp', prompt: 'Crie uma campanha de marketing ética para minha clínica este mês.' },
  { icon: ImagePlus,  title: 'Gerar imagem',          desc: 'Crie criativos visuais com IA',                     prompt: 'Gere uma imagem para um post sobre prevenção em saúde.' },
  { icon: TrendingUp, title: 'Atrair pacientes',      desc: 'Estratégia para crescer sua base',                  prompt: 'Quais ações posso fazer este mês para atrair novos pacientes?' },
  { icon: Calendar,   title: 'Planejar o mês',        desc: 'Calendário de conteúdo completo',                   prompt: 'Monte um calendário editorial para os próximos 30 dias.' },
  { icon: FileText,   title: 'Criar anúncio',         desc: 'Copy para Instagram Ads e Meta',                    prompt: 'Crie um anúncio para captação de novos pacientes.' },
  { icon: HelpCircle, title: 'Tirar dúvidas',         desc: 'Marketing médico ético e CFM',                      prompt: 'Quais práticas de marketing são permitidas pelo CFM?' },
];

const SMART_PILLS = [
  { emoji: '🔥', text: 'Novembro Azul está chegando' },
  { emoji: '📈', text: 'Carrosséis geram +32% engajamento' },
  { emoji: '💡', text: 'Reels institucional para autoridade' },
  { emoji: '🎯', text: 'Campanha de check-up anual' },
];

export default function Assistant() {
  const { token, clinic, user, setAuth } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [billing, setBilling] = useState({ blocked: false, url: '' });
  const [usage, setUsage] = useState({ count: 0, limit: 500 });

  const streamRef = useRef(null);
  const taRef = useRef(null);
  const drawerCloseRef = useRef(null);

  useEffect(() => {
    if (clinic && !clinic.onboarding_complete) {
      setShowOnboarding(true);
    } else if (clinic) {
      loadInitial(conversationParam);
    }
  }, [clinic?.id, conversationParam]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    drawerCloseRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const autoResize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  }, []);

  useEffect(autoResize, [input, autoResize]);

  const loadInitial = async (requestedId) => {
    try {
      const r = await fetch('/api/ai/conversations', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d?.success && d.data?.length) {
        const requested = requestedId && d.data.find(c => String(c.id) === String(requestedId));
        const activeId = requested ? requested.id : d.data[0].id;
        const rm = await fetch(`/api/ai/conversations/${activeId}`, { headers: { Authorization: `Bearer ${token}` } });
        const dm = await rm.json();
        if (dm?.success && dm.data) {
          const formatted = dm.data.map(m => ({
            role: m.role, content: m.content,
            campaign: m.structured_data ? safeParse(m.structured_data) : null
          }));
          setMessages(formatted);
          const last = [...formatted].reverse().find(m => m.campaign);
          if (last) {
            setActiveCampaign(last.campaign);
            if (requestedId) setDrawerOpen(true);
          }
        }
      }
      const ru = await fetch('/api/ai/usage', { headers: { Authorization: `Bearer ${token}` } });
      const du = await ru.json();
      if (du?.success && du.data) setUsage({ count: du.data.count ?? 0, limit: du.data.limit ?? 500 });
    } catch (err) {
      console.error('Falha ao carregar dados iniciais:', err);
    }
  };

  const sendMessage = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: value }]);
    setInput('');
    setLoading(true);
    setBilling({ blocked: false, url: '' });

    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: value })
      });
      const d = await r.json();

      if (r.status === 402 || r.status === 403 || d?.code === 'LIMIT_EXCEEDED' || d?.code === 'BILLING_REQUIRED') {
        const c = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planName: 'professional' })
        }).then(x => x.json()).catch(() => null);
        setBilling({ blocked: true, url: c?.success ? c.data.checkoutUrl : '' });
        throw new Error(d?.error || 'Limite do plano atingido.');
      }

      if (!r.ok || !d?.success) throw new Error(d?.error || 'Erro de conexão com o assistente.');

      const reply = d.data;
      const isCampaign = reply.type === 'campaign';
      const isImage = reply.type === 'image';
      const parsedCampaign = isCampaign ? reply.data : null;

      let displayContent;
      if (isCampaign) {
        displayContent = reply.data?.copyPrincipal
          ? `**${reply.data.nome || 'Campanha'}**\n\n${reply.data.copyPrincipal}`
          : (reply.data?.nome || 'Campanha gerada com sucesso.');
      } else if (isImage) {
        displayContent = reply.data?.imageUrl ? `![Imagem](${reply.data.imageUrl})` : 'Imagem gerada com sucesso.';
      } else {
        displayContent = typeof reply.data === 'string' ? reply.data : JSON.stringify(reply.data);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: displayContent, campaign: parsedCampaign, type: reply.type }]);
      if (parsedCampaign) {
        setActiveCampaign(parsedCampaign);
        setDrawerOpen(true);
      }
      setUsage(u => ({ ...u, count: u.count + 1 }));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Algo deu errado: ${err.message || 'tente novamente.'}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (contextPayload) => {
    const r = await fetch('/api/clinic/context', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(contextPayload)
    });
    const d = await r.json();
    if (!r.ok || !d.success) throw new Error(d.error || 'Não foi possível salvar.');
    setAuth({ user, token, clinic: { ...clinic, onboarding_complete: true, ...contextPayload } });
    setShowOnboarding(false);
    const firstMsg = `Gere a minha primeira campanha promocional ética de ${contextPayload.specialty} com tom ${contextPayload.tone} para a clínica ${contextPayload.name} em ${contextPayload.city}.`;
    await sendMessage(firstMsg);
  };

  const handlePilotFeedback = async (payload) => {
    const r = await fetch('/api/user/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (!r.ok || !d.success) throw new Error(d.error);
    return d;
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;
  const firstName = (user?.name || clinic?.name || '').split(' ')[0];

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <header className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: 'var(--brand-h)' }} /> Assistente
          </div>
          <div className="page-subtitle">{clinic?.name || 'Sua clínica'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UsageBar count={usage.count} limit={usage.limit} />
          {activeCampaign && !drawerOpen && (
            <button className="btn btn-outline btn-sm" onClick={() => setDrawerOpen(true)}>
              <FileText size={14} /> Ver campanha
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} ref={streamRef}>
        {isEmpty ? (
          <Welcome firstName={firstName} onPick={(p) => sendMessage(p)} />
        ) : (
          <div className="chat-stream">
            {messages.map((m, i) => (
              <Message key={i} msg={m} onOpenCampaign={() => { if (m.campaign) { setActiveCampaign(m.campaign); setDrawerOpen(true); } }} />
            ))}
            {loading && (
              <div className="msg">
                <div className="msg-avatar msg-avatar-ai"><Sparkles size={15} /></div>
                <div className="msg-body">
                  <div className="msg-author">MedAI</div>
                  <div className="typing"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Composer
        input={input}
        setInput={setInput}
        onSend={() => sendMessage()}
        onKey={onKey}
        taRef={taRef}
        loading={loading}
        billing={billing}
        isEmpty={isEmpty}
      />

      {drawerOpen && activeCampaign && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Detalhes da campanha">
            <CampaignRenderer
              campaign={activeCampaign}
              onClose={() => setDrawerOpen(false)}
              onRefine={(txt) => { setInput(txt); setDrawerOpen(false); }}
              closeRef={drawerCloseRef}
            />
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border)' }}>
              <SatisfactionFeedback campaignId={activeCampaign.nome} onSendFeedback={handlePilotFeedback} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function Welcome({ firstName, onPick }) {
  const greeting = greetingFor(new Date().getHours(), firstName);
  return (
    <div style={{ maxWidth: 720, width: '100%', margin: 'auto', padding: 'var(--s-10) var(--s-6)' }}>
      <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>
          {greeting} <span style={{ background: 'var(--brand-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>👋</span>
        </h1>
        <p style={{ fontSize: 'var(--fs-md)', color: 'var(--text-muted)' }}>
          O que vamos criar para a sua clínica hoje?
        </p>
      </div>

      <div className="quick-grid animate-fadeUp" style={{ animationDelay: '60ms', marginBottom: 28 }}>
        {QUICK_ACTIONS.map(({ icon: Icon, title, desc, prompt }) => (
          <button key={title} className="quick-card" onClick={() => onPick(prompt)}>
            <div className="quick-card-icon"><Icon size={18} /></div>
            <div>
              <div className="quick-card-title">{title}</div>
              <div className="quick-card-desc">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="animate-fadeUp" style={{ animationDelay: '120ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
          <Lightbulb size={14} /> Sugestões inteligentes para você
        </div>
        <div className="insights-row">
          {SMART_PILLS.map(p => (
            <button key={p.text} className="insight-pill" onClick={() => onPick(`Me fale sobre: ${p.text}`)}>
              <span className="insight-pill-emoji">{p.emoji}</span> {p.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({ msg, onOpenCampaign }) {
  const isUser = msg.role === 'user';
  return (
    <div className="msg">
      <div className={`msg-avatar ${isUser ? 'msg-avatar-user' : 'msg-avatar-ai'}`}>
        {isUser ? initials(msg.author) : <Sparkles size={15} />}
      </div>
      <div className="msg-body">
        <div className="msg-author">{isUser ? 'Você' : 'MedAI'}</div>
        <div className={`msg-content${msg.isError ? ' is-error' : ''}`}>{msg.content}</div>
        {msg.campaign && (
          <button onClick={onOpenCampaign} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
            <FileText size={13} /> Ver campanha completa
          </button>
        )}
      </div>
    </div>
  );
}

function Composer({ input, setInput, onSend, onKey, taRef, loading, billing, isEmpty }) {
  return (
    <div style={{ padding: '0 var(--s-6) var(--s-6)', maxWidth: 'var(--maxw-chat)', width: '100%', margin: '0 auto' }}>
      {billing.blocked ? (
        <div style={{
          background: 'var(--gold-soft)', border: '1px solid var(--gold)',
          padding: 16, borderRadius: 'var(--r-lg)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ShieldAlert size={20} style={{ color: 'var(--gold)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>Limite do plano atingido</div>
              <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>Ative sua assinatura para continuar usando o assistente.</div>
            </div>
          </div>
          {billing.url && (
            <a href={billing.url} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--gold)', color: '#1A1300' }}>
              <CreditCard size={14} /> Ativar assinatura <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <div className="composer">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={isEmpty ? 'Descreva o que você precisa para sua clínica…' : 'Mensagem para o assistente…'}
            className="composer-input"
            rows={1}
            disabled={loading}
            aria-label="Mensagem para o assistente"
          />
          <div className="composer-actions">
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 'auto' }}>
              Enter para enviar · Shift+Enter para nova linha
            </span>
            <button
              type="button"
              onClick={onSend}
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-icon"
              aria-label="Enviar mensagem"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({ count, limit }) {
  const pct = Math.min(100, Math.round((count / Math.max(1, limit)) * 100));
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>Plano mensal</span>
        <span style={{ color: 'var(--text-soft)', fontWeight: 600 }}>{count} / {limit}</span>
      </div>
      <div style={{ height: 4, background: 'var(--sf-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-grad)', transition: 'width 300ms ease' }} />
      </div>
    </div>
  );
}

function greetingFor(h, name) {
  const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${part}, ${name}` : `${part}`;
}

function initials(name) {
  if (!name) return 'V';
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] || '') + (w[1]?.[0] || '')).toUpperCase() || 'V';
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
