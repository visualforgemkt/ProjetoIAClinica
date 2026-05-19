import React, { useState } from 'react';
import { Clipboard, Check, Calendar, MessageSquare, Award, RefreshCw, Palette, Users, TrendingUp } from 'lucide-react';

export default function CampaignRenderer({ campaign, topic, onRefine, onGenerateImage }) {
  const [activeTab, setActiveTab] = useState('estrategia');
  const [copiedStates, setCopiedStates] = useState({});

  if (!campaign || !campaign.nome) {
    return (
      <div className="cp-blk" style={{ padding: '20px', color: 'var(--t2)', textAlign: 'center' }}>
        Carregando dados da campanha...
      </div>
    );
  }

  const handleCopy = (key, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const tabs = [
    { id: 'estrategia', lbl: '📋 Estratégia' },
    { id: 'copy', lbl: '✍️ Copy' },
    { id: 'posts', lbl: '📱 Posts' },
    { id: 'stories', lbl: '📲 Stories' },
    { id: 'whatsapp', lbl: '💬 WhatsApp' },
    { id: 'calendario', lbl: '📅 Calendário' },
    { id: 'visual', lbl: '🎨 Visual' },
    { id: 'versoes', lbl: '🔀 Versões' },
    { id: 'metricas', lbl: '📊 Métricas' }
  ];

  const strategy = campaign.estrategia || {};
  const briefingVisual = campaign.briefingVisual || {};

  const getFieldValue = (obj, keys) => {
    for (let k of keys) {
      if (obj[k]) return obj[k];
    }
    return '—';
  };

  const renderEstrategia = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Estratégia de Marketing
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: '🎯 Objetivo Principal', val: getFieldValue(strategy, ['objetivo', 'goal', 'objective']) },
          { label: '👥 Público-Alvo', val: getFieldValue(strategy, ['publicoAlvo', 'publico_alvo', 'target', 'audience']) },
          { label: '💡 Abordagem Prática', val: getFieldValue(strategy, ['abordagem', 'approach']) },
          { label: '📣 Chamada de Ação (CTA)', val: getFieldValue(strategy, ['ctaPrincipal', 'cta_principal', 'cta']) },
          { label: '🏥 Posicionamento da Clínica', val: getFieldValue(strategy, ['posicionamento', 'positioning']) }
        ].map((item, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--t1)', lineHeight: '1.5' }}>{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCopy = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Copy Principal (Instagram/Facebook)
      </h4>
      <div style={{ position: 'relative', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
        <button
          onClick={() => handleCopy('copyPrincipal', campaign.copyPrincipal || '')}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--sf3)', border: '1px solid var(--bd)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', color: copiedStates.copyPrincipal ? 'var(--ok)' : 'var(--t3)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {copiedStates.copyPrincipal ? <Check size={12} /> : <Clipboard size={12} />}
          {copiedStates.copyPrincipal ? 'Copiado' : 'Copiar'}
        </button>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--t1)', fontSize: '13px', lineHeight: '1.7', marginRight: '70px' }}>
          {campaign.copyPrincipal || '—'}
        </div>
      </div>

      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginTop: '10px' }}>Hashtags Sugeridas</h4>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(campaign.hashtags || []).map((h, i) => (
          <span
            key={i}
            onClick={() => handleCopy(`ht_${i}`, `#${h}`)}
            style={{ padding: '4px 10px', background: 'var(--blu-d)', border: '1px solid var(--bda)', color: 'var(--blu-l)', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
          >
            #{h} {copiedStates[`ht_${i}`] && '✓'}
          </span>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Planejamento de Feed / Carrossel
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(campaign.posts || []).map((post, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blu-l)' }}>Post {post.num || idx + 1}</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--blu-d)', border: '1px solid var(--bda)', borderRadius: '20px', color: 'var(--blu-l)', fontWeight: 600 }}>
                {post.tipo || 'Feed'}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>{post.titulo}</div>
            <div style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{post.legenda}</div>

            {post.slides && post.slides.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--bd)', paddingTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '6px' }}>Roteiro do Carrossel</div>
                {post.slides.map((slide, sIdx) => (
                  <div key={sIdx} style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--sf3)', borderRadius: 'var(--radius-sm)', marginBottom: '4px', display: 'flex', alignItems: 'flex-start' }}>
                    <strong style={{ color: 'var(--blu-l)', marginRight: '8px', minWidth: '22px' }}>S{sIdx + 1}</strong>
                    <span style={{ color: 'var(--t1)' }}>{slide}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStories = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Roteiro e Conteúdo para Stories
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {(campaign.stories || []).map((story, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--blu-l)' }}>Story {story.num || idx + 1}</span>
                <span style={{ color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>{story.tipo || 'Imagem'}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--t1)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {story.conteudo}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWhatsapp = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Mensagem de WhatsApp / Lista de Transmissão
      </h4>
      <div style={{ position: 'relative', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
        <button
          onClick={() => handleCopy('whatsapp', campaign.whatsapp || '')}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--sf3)', border: '1px solid var(--bd)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', color: copiedStates.whatsapp ? 'var(--ok)' : 'var(--t3)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {copiedStates.whatsapp ? <Check size={12} /> : <Clipboard size={12} />}
          {copiedStates.whatsapp ? 'Copiado' : 'Copiar'}
        </button>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--t1)', fontSize: '13px', lineHeight: '1.7', marginRight: '70px' }}>
          {campaign.whatsapp || '—'}
        </div>
      </div>
    </div>
  );

  const renderCalendario = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Cronograma e Frequência de Postagens
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(campaign.calendario || []).map((cal, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: 'var(--sf3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              <Calendar size={18} style={{ color: 'var(--blu-l)', marginBottom: '2px' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t1)' }}>{cal.dia || `Dia ${idx + 1}`}</span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)' }}>{cal.acao}</div>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                ⏰ {cal.horario || '—'} {cal.obs ? `· 💡 ${cal.obs}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVisual = () => {
    const imgPrompts = [];
    if (briefingVisual.promptImagem) {
      imgPrompts.push({ lbl: 'Imagem Principal (Feed)', prompt: briefingVisual.promptImagem });
    }
    if (campaign.posts && campaign.posts[0]) {
      imgPrompts.push({ lbl: 'Imagem do Post 1', prompt: `${campaign.posts[0].tipo || 'photo'} about: ${campaign.posts[0].titulo || topic}. ${briefingVisual.estilo || 'clean professional medical photography'}.` });
    }
    if (campaign.stories && campaign.stories[0]) {
      imgPrompts.push({ lbl: 'Imagem Story Abertura', prompt: `Vertical composition, ${topic}. ${briefingVisual.conceito || ''}. Minimal style.` });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
          Identidade Visual & Direcionamento de Arte
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {[
            { label: '💡 Conceito', val: briefingVisual.conceito || '—' },
            { label: '📐 Composição', val: briefingVisual.composicao || '—' },
            { label: '🎨 Estilo Gráfico', val: briefingVisual.estilo || '—' },
            { label: '🧠 Emoção Transmitida', val: briefingVisual.emocao || '—' },
            { label: '🌈 Cores Sugeridas', val: briefingVisual.cores || '—' }
          ].map((item, idx) => (
            <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--t1)', fontWeight: 500 }}>{item.val}</div>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginTop: '10px' }}>
          Gerador Dinâmico de Prompts de Imagem
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {imgPrompts.map((ip, idx) => (
            <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blu-l)' }}>{ip.lbl}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleCopy(`prompt_${idx}`, ip.prompt)}
                    style={{ background: 'var(--sf3)', border: '1px solid var(--bd)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', color: copiedStates[`prompt_${idx}`] ? 'var(--ok)' : 'var(--t2)', fontSize: '10.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedStates[`prompt_${idx}`] ? <Check size={11} /> : <Clipboard size={11} />}
                    {copiedStates[`prompt_${idx}`] ? 'Copiado' : 'Copiar Prompt'}
                  </button>
                  <button
                    onClick={() => onGenerateImage && onGenerateImage(ip.prompt)}
                    style={{ background: 'var(--blu)', border: 'none', padding: '3px 10px', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🎨 Gerar com IA
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--t2)', background: 'var(--sf3)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--blu)', fontStyle: 'italic' }}>
                {ip.prompt}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVersoes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Variações do Tom de Voz
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(campaign.versoes || []).map((version, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--blu-d)', border: '1px solid var(--bda)', borderRadius: '20px', color: 'var(--blu-l)', fontWeight: 600, textTransform: 'uppercase' }}>
                {version.tag || version.tipo || 'Alternativa'}
              </span>
              <button
                onClick={() => handleCopy(`version_${idx}`, version.copy || '')}
                style={{ background: 'var(--sf3)', border: '1px solid var(--bd)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', color: copiedStates[`version_${idx}`] ? 'var(--ok)' : 'var(--t3)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedStates[`version_${idx}`] ? <Check size={11} /> : <Clipboard size={11} />}
                {copiedStates[`version_${idx}`] ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--t1)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{version.copy}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetricas = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--bd)', paddingBottom: '6px' }}>
        Métricas e KPIs de Sucesso
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {(campaign.metricas || []).map((m, idx) => (
          <div key={idx} style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '15px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '20px', background: 'var(--sf3)', border: '1px solid var(--bd)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.icone || '📈'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)', marginBottom: '2px' }}>{m.titulo}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--t2)', lineHeight: '1.5' }}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'estrategia': return renderEstrategia();
      case 'copy': return renderCopy();
      case 'posts': return renderPosts();
      case 'stories': return renderStories();
      case 'whatsapp': return renderWhatsapp();
      case 'calendario': return renderCalendario();
      case 'visual': return renderVisual();
      case 'versoes': return renderVersoes();
      case 'metricas': return renderMetricas();
      default: return renderEstrategia();
    }
  };

  return (
    <div className="camp-doc" style={{ background: 'var(--sf)', border: '1px solid var(--bd2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', width: '100%' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--bd)', background: 'linear-gradient(135deg, var(--sf2) 0%, var(--sf3) 100%)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--blu-l)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blu)', display: 'inline-block' }}></span>
          Campanha Gerada para sua Clínica
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)', marginBottom: '4px' }}>
          {campaign.nome || topic}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--t2)', fontStyle: 'italic' }}>
          {campaign.slogan || 'Foco em marketing ético médico.'}
        </div>
        <div style={{ display: 'flex', gap: '7px', marginTop: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: 'var(--blu-d)', color: 'var(--blu-l)', border: '1px solid var(--bda)' }}>9 seções</span>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: 'var(--gld-d)', color: 'var(--gld)', border: '1px solid var(--gld-b)' }}>Pronto para publicar</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--bd)', background: 'var(--sf)' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '11px 15px',
              fontSize: '12px',
              fontWeight: 600,
              color: activeTab === tab.id ? 'var(--blu-l)' : 'var(--t3)',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--blu)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              userSelect: 'none'
            }}
          >
            {tab.lbl}
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={{ padding: '18px 22px', minHeight: '180px' }}>
        {renderContent()}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 22px', borderTop: '1px solid var(--bd)', background: 'var(--sf2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
          Campanha baseada em inteligência contextual e diretrizes LGPD.
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onRefine && onRefine('Refine esta campanha')}
            style={{ background: 'transparent', border: '1px solid var(--bd)', padding: '5px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--t2)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
          >
            Refinar Campanha
          </button>
        </div>
      </div>
    </div>
  );
}
