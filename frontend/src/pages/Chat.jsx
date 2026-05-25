import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, CreditCard, ShieldAlert, Award } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import CampaignRenderer from '../components/CampaignRenderer';
import OnboardingWizard from '../components/OnboardingWizard';
import SatisfactionFeedback from '../components/SatisfactionFeedback';

export default function Chat() {
  const { token, clinic, user, setAuth } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [billingLimitExceeded, setBillingLimitExceeded] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [usageStats, setUsageStats] = useState({ count: 0, limit: 500 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Se a clínica ainda não concluiu o onboarding, mostra o wizard guiado
    if (clinic && !clinic.onboarding_complete) {
      setShowOnboarding(true);
    } else {
      loadInitialData();
    }
  }, [clinic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInitialData = async () => {
    try {
      // 1. Carrega histórico do chat
      const resConv = await fetch('/api/ai/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataConv = await resConv.json();
      if (dataConv.success && dataConv.data && dataConv.data.length > 0) {
        // Carrega mensagens da conversa ativa mais recente
        const activeId = dataConv.data[0].id;
        const resMsgs = await fetch(`/api/ai/conversations/${activeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataMsgs = await resMsgs.json();
        if (dataMsgs.success && dataMsgs.data) {
          const formatted = dataMsgs.data.map(m => ({
            role: m.role,
            content: m.content,
            campaign: m.structured_data ? JSON.parse(m.structured_data) : null
          }));
          setMessages(formatted);
          
          // Se houver campanha estruturada na última mensagem, ativa no painel direito
          const lastWithCamp = [...formatted].reverse().find(m => m.campaign);
          if (lastWithCamp) {
            setActiveCampaign(lastWithCamp.campaign);
          }
        }
      } else {
        // Chat inicial do bot
        setMessages([
          { role: 'assistant', content: `Olá, ${user?.name || 'Doutor(a)'}! Sou o assistente de inteligência contextual do MedAI Pro. Como posso ajudar com o marketing ético da sua clínica hoje?` }
        ]);
      }

      // 2. Carrega estatísticas de consumo
      const resUsage = await fetch('/api/ai/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataUsage = await resUsage.json();
      if (dataUsage.success && dataUsage.data) {
        setUsageStats({ count: dataUsage.data.count ?? 0, limit: dataUsage.data.limit ?? 500 });
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais do chat', err);
    }
  };

  const handleSend = async (e, customText = '') => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);
    setBillingLimitExceeded(false);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await response.json();

      if (response.status === 402 || response.status === 403 || data.code === 'LIMIT_EXCEEDED' || data.code === 'BILLING_REQUIRED') {
        setBillingLimitExceeded(true);
        // Gera link de checkout MercadoPago de forma dinâmica
        const resCheckout = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planName: 'professional' })
        });
        const dataCheckout = await resCheckout.json();
        if (dataCheckout.success) {
          setCheckoutUrl(dataCheckout.data.checkoutUrl);
        }
        throw new Error(data.error || 'Limite de plano atingido.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro de conexão com assistente.');
      }

      const reply = data.data;
      // reply = { type, data, intent, conversationId, campaignId, usage, disclaimer }
      const isCampaign = reply.type === 'campaign';
      const isImage    = reply.type === 'image';
      const parsedCampaign = isCampaign ? reply.data : null;

      // Monta o conteúdo de exibição conforme o tipo de resposta
      let displayContent;
      if (isCampaign) {
        displayContent = reply.data?.copyPrincipal
          ? `**${reply.data.nome || 'Campanha'}**\n\n${reply.data.copyPrincipal}`
          : (reply.data?.nome || 'Campanha gerada com sucesso.');
      } else if (isImage) {
        displayContent = reply.data?.imageUrl
          ? `![Imagem Gerada](${reply.data.imageUrl})`
          : 'Imagem gerada com sucesso.';
      } else {
        displayContent = typeof reply.data === 'string' ? reply.data : JSON.stringify(reply.data);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: displayContent, campaign: parsedCampaign, type: reply.type }
      ]);

      if (parsedCampaign) {
        setActiveCampaign(parsedCampaign);
      }

      // Atualiza contador de uso
      setUsageStats((prev) => ({ ...prev, count: prev.count + 1 }));
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Ops! Ocorreu um problema: ${err.message || 'Erro ao processar mensagem.'}`, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (contextPayload) => {
    try {
      // 1. PUT /api/clinic/context para salvar o perfil da clínica
      const res = await fetch('/api/clinic/context', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contextPayload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      // Atualiza a clínica local no Zustand store
      const updatedClinic = { ...clinic, onboarding_complete: true, ...contextPayload };
      setAuth({ user, token, clinic: updatedClinic });
      setShowOnboarding(false);

      // 2. WOW MOMENT: Dispara a criação automática da primeira campanha promocional do médico
      const firstCampMsg = `Gere a minha primeira campanha promocional ética de ${contextPayload.specialty} focada em ${contextPayload.tone} para a minha clínica ${contextPayload.name} na cidade de ${contextPayload.city}. Meu Instagram é ${contextPayload.instagram}.`;
      await handleSend(null, firstCampMsg);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar onboarding: ' + err.message);
    }
  };

  const handleSendPilotFeedback = async (feedbackData) => {
    // POST /api/user/feedback
    const res = await fetch('/api/user/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(feedbackData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg)' }}>
      {/* Onboarding Wizard Modal Overlay */}
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Conversational AI Chat */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--bd2)', background: 'var(--sf)' }}>
          {/* Header */}
          <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, var(--sf) 0%, var(--sf2) 100%)' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--blu)' }} /> Assistente IA MedAI Pro
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Consultório: {clinic?.name || 'Carregando...'}</span>
            </div>
            {/* Consumo do Plano */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t3)' }}>USO DO PLANO MENSAL</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blu-l)' }}>
                {usageStats.count} / {usageStats.limit} <span style={{ color: 'var(--t3)', fontWeight: 500 }}>consultas</span>
              </div>
            </div>
          </header>

          {/* Messages List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--blu)' : 'var(--sf2)',
                  color: msg.role === 'user' ? '#ffffff' : 'var(--t1)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '75%',
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--bd)',
                  borderLeft: msg.isError ? '4px solid var(--err)' : (msg.role === 'user' ? 'none' : '1px solid var(--bd)')
                }}
              >
                <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.campaign && (
                  <div style={{ marginTop: '10px', fontSize: '11.5px', background: 'var(--blu-d)', border: '1px solid var(--bda)', borderRadius: 'var(--radius-md)', padding: '6px 12px', color: 'var(--blu-l)', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }} onClick={() => setActiveCampaign(msg.campaign)}>
                    📋 Exibir Campanha no Painel Direito
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--sf2)', border: '1px solid var(--bd)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--t2)', fontSize: '13px' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--blu)', animation: 'spin 1.5s linear infinite' }} />
                IA processando sua campanha médica...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <div style={{ padding: '15px 20px', borderTop: '1px solid var(--bd2)', background: 'var(--sf)' }}>
            {billingLimitExceeded ? (
              <div style={{ background: 'var(--gld-d)', border: '1px solid var(--gld)', padding: '12px 15px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--gld)' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)' }}>Limite do Plano Atingido</h4>
                    <p style={{ fontSize: '11px', color: 'var(--t2)' }}>Sua clínica atingiu a cota limite. Regularize sua assinatura de forma segura no MercadoPago.</p>
                  </div>
                </div>
                {checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: 'var(--gld)', color: '#07090F', fontWeight: 800, padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <CreditCard size={13} /> Ativar Assinatura
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => handleSend(e)} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Instrua a IA: 'Crie um post sobre acne' ou 'Desenvolva campanha de check-up cardiologia'..."
                  disabled={loading}
                  style={{ flex: 1, padding: '11px 16px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{ background: 'var(--blu)', border: 'none', padding: '10px 18px', borderRadius: 'var(--radius-md)', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: (loading || !input.trim()) ? 0.6 : 1 }}
                >
                  Enviar <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Tabular Campaign Document Strategizer (P0 UI Wow) */}
        <div style={{ flex: '1.2', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg)' }}>
          {activeCampaign ? (
            <>
              {/* Campaign Table Strategizer */}
              <CampaignRenderer
                campaign={activeCampaign}
                topic={activeCampaign.nome || 'Estratégia Médica'}
                onRefine={(txt) => setInput(txt)}
              />
              {/* Satisfaction Feedback (Pilot P1 👍 👎) */}
              <SatisfactionFeedback
                campaignId={activeCampaign.nome}
                onSendFeedback={handleSendPilotFeedback}
              />
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--t3)', maxWidth: '300px' }}>
              <Award size={48} style={{ margin: '0 auto 12px auto', color: 'var(--sf4)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t2)', marginBottom: '5px' }}>Nenhuma Campanha Ativa</h3>
              <p style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: '1.5' }}>Digite uma instrução de marketing ao assistente no chat ao lado para ver a renderização completa da sua campanha promocional aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
