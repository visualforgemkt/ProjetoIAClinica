import { useState } from 'react';
import { Clipboard, Check, X, FileText, Layers, Palette, Calendar, BarChart3, RefreshCw, Sparkles, Hash } from 'lucide-react';

const SECTIONS = [
  { id: 'resumo',       label: 'Resumo',       icon: FileText },
  { id: 'conteudo',     label: 'Conteúdo',     icon: Layers },
  { id: 'criativos',    label: 'Criativos',    icon: Palette },
  { id: 'planejamento', label: 'Planejamento', icon: Calendar },
  { id: 'resultados',   label: 'Resultados',   icon: BarChart3 },
];

export default function CampaignRenderer({ campaign, onClose, onRefine, onGenerateImage, closeRef }) {
  const [active, setActive] = useState('resumo');
  const [copied, setCopied] = useState({});

  if (!campaign?.nome) {
    return (
      <div className="empty" style={{ padding: 40 }}>
        <Sparkles size={20} /> Carregando campanha…
      </div>
    );
  }

  const copyTo = (key, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(c => ({ ...c, [key]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1800);
  };

  const strategy = campaign.estrategia || {};
  const visual = campaign.briefingVisual || {};
  const get = (obj, keys) => { for (const k of keys) if (obj?.[k]) return obj[k]; return null; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span className="pill pill-brand"><Sparkles size={11} /> Campanha gerada</span>
              <span className="pill pill-ok">Pronto para publicar</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {campaign.nome}
            </h2>
            {campaign.slogan && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>{campaign.slogan}</p>
            )}
          </div>
          {onClose && (
            <button ref={closeRef} onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Fechar painel da campanha">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="tabs" style={{ marginTop: 12 }}>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id)} className={`tab${active === id ? ' is-active' : ''}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {active === 'resumo' && (
          <Section title="Visão geral da estratégia">
            <Grid>
              <InfoCard label="🎯 Objetivo"        value={get(strategy, ['objetivo', 'goal', 'objective'])} />
              <InfoCard label="👥 Público-alvo"    value={get(strategy, ['publicoAlvo', 'publico_alvo', 'target', 'audience'])} />
              <InfoCard label="💡 Abordagem"        value={get(strategy, ['abordagem', 'approach'])} />
              <InfoCard label="📣 CTA principal"    value={get(strategy, ['ctaPrincipal', 'cta_principal', 'cta'])} />
              <InfoCard label="🏥 Posicionamento"  value={get(strategy, ['posicionamento', 'positioning'])} span={2} />
            </Grid>
          </Section>
        )}

        {active === 'conteudo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {campaign.copyPrincipal && (
              <Section title="Copy principal (Instagram/Facebook)">
                <CopyBlock text={campaign.copyPrincipal} onCopy={() => copyTo('copyPrincipal', campaign.copyPrincipal)} copied={copied.copyPrincipal} />
              </Section>
            )}
            {campaign.hashtags?.length > 0 && (
              <Section title="Hashtags sugeridas">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {campaign.hashtags.map((h, i) => (
                    <button key={i} className="pill pill-brand" onClick={() => copyTo(`ht_${i}`, `#${h}`)} style={{ cursor: 'pointer' }}>
                      <Hash size={10} /> {h} {copied[`ht_${i}`] && '✓'}
                    </button>
                  ))}
                </div>
              </Section>
            )}
            {campaign.posts?.length > 0 && (
              <Section title="Posts do feed">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {campaign.posts.map((post, i) => (
                    <div key={i} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="pill pill-brand">Post {post.num || i + 1}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.tipo || 'Feed'}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{post.titulo}</div>
                      <div style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.legenda}</div>
                      {post.slides?.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Roteiro do carrossel</div>
                          {post.slides.map((s, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: 13 }}>
                              <strong style={{ color: 'var(--brand-h)', minWidth: 22 }}>S{sIdx + 1}</strong>
                              <span style={{ color: 'var(--text-soft)' }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {campaign.stories?.length > 0 && (
              <Section title="Stories">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {campaign.stories.map((story, i) => (
                    <div key={i} className="card" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                        <span style={{ color: 'var(--brand-h)', fontWeight: 700 }}>Story {story.num || i + 1}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{story.tipo || 'Imagem'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{story.conteudo}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {campaign.whatsapp && (
              <Section title="WhatsApp / Lista de transmissão">
                <CopyBlock text={campaign.whatsapp} onCopy={() => copyTo('wpp', campaign.whatsapp)} copied={copied.wpp} />
              </Section>
            )}
            {campaign.versoes?.length > 0 && (
              <Section title="Variações de tom">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {campaign.versoes.map((v, i) => (
                    <div key={i} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="pill pill-brand">{v.tag || v.tipo || `Alternativa ${i + 1}`}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyTo(`v_${i}`, v.copy)}>
                          {copied[`v_${i}`] ? <Check size={12} /> : <Clipboard size={12} />} {copied[`v_${i}`] ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <div style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{v.copy}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {active === 'criativos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Section title="Direção de arte">
              <Grid cols={3}>
                <InfoCard label="💡 Conceito" value={visual.conceito} />
                <InfoCard label="📐 Composição" value={visual.composicao} />
                <InfoCard label="🎨 Estilo" value={visual.estilo} />
                <InfoCard label="🧠 Emoção" value={visual.emocao} />
                <InfoCard label="🌈 Cores" value={visual.cores} />
              </Grid>
            </Section>

            <Section title="Prompts para geração de imagem">
              {buildPrompts(campaign, visual).map((p, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-h)' }}>{p.label}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => copyTo(`p_${i}`, p.prompt)}>
                        {copied[`p_${i}`] ? <Check size={12} /> : <Clipboard size={12} />} {copied[`p_${i}`] ? 'Copiado' : 'Copiar'}
                      </button>
                      {onGenerateImage && (
                        <button className="btn btn-primary btn-sm" onClick={() => onGenerateImage(p.prompt)}>
                          <Sparkles size={12} /> Gerar
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-soft)',
                    background: 'var(--sf-2)', padding: '12px 14px',
                    borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--brand)',
                    fontStyle: 'italic', lineHeight: 1.55
                  }}>{p.prompt}</div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {active === 'planejamento' && (
          <Section title="Cronograma de publicação">
            {campaign.calendario?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campaign.calendario.map((cal, i) => (
                  <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--r-md)',
                      background: 'var(--brand-soft)', border: '1px solid var(--border-brand)',
                      display: 'grid', placeItems: 'center', flexShrink: 0
                    }}>
                      <Calendar size={16} style={{ color: 'var(--brand-h)' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-h)', marginTop: 2 }}>{cal.dia || `D${i + 1}`}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{cal.acao}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        ⏰ {cal.horario || '—'}{cal.obs ? ` · 💡 ${cal.obs}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Nenhum cronograma definido para esta campanha.</div>
            )}
          </Section>
        )}

        {active === 'resultados' && (
          <Section title="Métricas e resultados esperados">
            {campaign.metricas?.length > 0 ? (
              <Grid cols={3}>
                {campaign.metricas.map((m, i) => (
                  <div key={i} className="card" style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      fontSize: 20, width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--brand-soft)', display: 'grid', placeItems: 'center', flexShrink: 0
                    }}>{m.icone || '📈'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{m.titulo}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </Grid>
            ) : (
              <div className="empty">Métricas serão definidas após publicação inicial.</div>
            )}
          </Section>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Conformidade CFM · LGPD
        </span>
        <button onClick={() => onRefine && onRefine('Refine esta campanha mantendo o tom, ajustando...')} className="btn btn-outline btn-sm">
          <RefreshCw size={13} /> Refinar com IA
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>{title}</h3>
      {children}
    </section>
  );
}

function Grid({ children, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12 }}>
      {children}
    </div>
  );
}

function InfoCard({ label, value, span }) {
  if (!value) return null;
  return (
    <div className="card" style={{ padding: 16, gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

function CopyBlock({ text, onCopy, copied }) {
  return (
    <div className="card" style={{ position: 'relative' }}>
      <button onClick={onCopy} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 10, right: 10 }}>
        {copied ? <Check size={13} style={{ color: 'var(--ok)' }} /> : <Clipboard size={13} />} {copied ? 'Copiado' : 'Copiar'}
      </button>
      <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', paddingRight: 90 }}>{text}</div>
    </div>
  );
}

function buildPrompts(campaign, visual) {
  const out = [];
  if (visual.promptImagem) out.push({ label: 'Imagem principal (feed)', prompt: visual.promptImagem });
  if (campaign.posts?.[0]) {
    out.push({
      label: 'Imagem do Post 1',
      prompt: `${campaign.posts[0].tipo || 'photo'} about: ${campaign.posts[0].titulo || campaign.nome}. ${visual.estilo || 'clean professional medical photography'}.`
    });
  }
  if (campaign.stories?.[0]) {
    out.push({
      label: 'Story de abertura',
      prompt: `Vertical composition, ${campaign.nome}. ${visual.conceito || ''}. Minimal style.`
    });
  }
  return out;
}
