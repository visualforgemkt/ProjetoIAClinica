import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Instagram, Building2, Stethoscope, Target, Heart } from 'lucide-react';

const SPECIALTIES = ['Dermatologia', 'Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia', 'Psiquiatria', 'Medicina Geral', 'Outro'];
const OBJECTIVES = ['Atrair novos pacientes', 'Fidelizar pacientes atuais', 'Educar em saúde e prevenção', 'Fortalecer minha marca'];
const TONES = ['Empático e acolhedor', 'Científico e técnico', 'Prático e direto', 'Inspirador e motivacional'];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [data, setData] = useState({
    clinicName: '', city: '',
    specialty: 'Dermatologia', customSpecialty: '',
    objective: 'Atrair novos pacientes',
    instagram: '', tone: 'Empático e acolhedor'
  });

  const canAdvance = () => {
    if (step === 1) return data.clinicName.trim() && data.city.trim();
    if (step === 2 && data.specialty === 'Outro') return data.customSpecialty.trim();
    if (step === 4) return data.instagram.trim();
    return true;
  };

  const next = () => {
    setError('');
    if (!canAdvance()) return;
    if (step < 5) setStep(step + 1); else finish();
  };

  const finish = async () => {
    setStep(6);
    setLoadingMsg('Analisando sua especialidade…');
    setTimeout(() => setLoadingMsg('Ajustando o tom da sua clínica…'), 1500);
    setTimeout(() => setLoadingMsg('Preparando sua primeira campanha…'), 3000);
    try {
      const specialty = data.specialty === 'Outro' ? data.customSpecialty : data.specialty;
      const payload = {
        name: data.clinicName.trim(),
        specialty,
        city: data.city.trim(),
        target_public: 'Pacientes particulares ou planos premium',
        services: `Consultas e tratamentos em ${specialty}`,
        differentials: 'Atendimento humanizado e infraestrutura moderna',
        instagram: data.instagram.startsWith('@') ? data.instagram : `@${data.instagram.trim()}`,
        tone: data.tone,
        onboarding_complete: true
      };
      await onComplete?.(payload);
    } catch (err) {
      setError(err?.message || 'Não conseguimos finalizar. Tente novamente.');
      setStep(5);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="onb-title" style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(8,10,14,0.78)', backdropFilter: 'blur(10px)',
      display: 'grid', placeItems: 'center', padding: 20
    }}>
      <div className="animate-fadeUp" style={{
        width: '100%', maxWidth: 500,
        background: 'var(--sf-1)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: 32
      }}>
        {step < 6 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span className="pill pill-brand"><Sparkles size={11} /> Bem-vindo</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} style={{
                    width: 22, height: 4, borderRadius: 2,
                    background: s <= step ? 'var(--brand)' : 'var(--sf-3)',
                    transition: 'background 200ms'
                  }} />
                ))}
              </div>
            </div>

            <Step n={step} data={data} setData={setData} />

            {error && <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--err-soft)', border: '1px solid var(--err)', color: 'var(--err)', fontSize: 12, borderRadius: 'var(--r-md)' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1} className="btn btn-ghost btn-sm">
                <ArrowLeft size={14} /> Voltar
              </button>
              <button onClick={next} disabled={!canAdvance()} className="btn btn-primary">
                {step === 5 ? 'Começar' : 'Continuar'} <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {step === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, textAlign: 'center', gap: 18 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--brand-grad-soft)',
              border: '1px solid var(--border-brand)',
              display: 'grid', placeItems: 'center'
            }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand-h)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--gold)' }} /> Preparando tudo para você
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 320 }}>{loadingMsg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, data, setData }) {
  if (n === 1) return (
    <StepContent icon={Building2} title="Vamos começar com sua clínica" desc="Só precisamos do nome e da cidade para personalizar tudo para você.">
      <FieldText label="Nome da clínica" value={data.clinicName} onChange={(v) => setData({ ...data, clinicName: v })} placeholder="Ex: Clínica MedVida" />
      <FieldText label="Cidade" value={data.city} onChange={(v) => setData({ ...data, city: v })} placeholder="Ex: São Paulo - SP" />
    </StepContent>
  );

  if (n === 2) return (
    <StepContent icon={Stethoscope} title="Qual é a sua especialidade?" desc="Isso ajuda o assistente a falar a linguagem certa para seus pacientes.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {SPECIALTIES.map(s => (
          <ChipButton key={s} active={data.specialty === s} onClick={() => setData({ ...data, specialty: s })}>{s}</ChipButton>
        ))}
      </div>
      {data.specialty === 'Outro' && (
        <input className="input" value={data.customSpecialty} onChange={(e) => setData({ ...data, customSpecialty: e.target.value })} placeholder="Digite sua especialidade" style={{ marginTop: 10 }} />
      )}
    </StepContent>
  );

  if (n === 3) return (
    <StepContent icon={Target} title="O que você quer alcançar?" desc="O foco principal do seu marketing com a gente.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OBJECTIVES.map(o => (
          <BigChipButton key={o} active={data.objective === o} onClick={() => setData({ ...data, objective: o })}>{o}</BigChipButton>
        ))}
      </div>
    </StepContent>
  );

  if (n === 4) return (
    <StepContent icon={Instagram} title="Qual é o seu Instagram?" desc="Vamos refinar o tom de voz a partir do seu perfil.">
      <FieldText label="Usuário" prefix="@" value={data.instagram.replace(/^@/, '')} onChange={(v) => setData({ ...data, instagram: v.replace('@', '') })} placeholder="clinicamedvida" />
    </StepContent>
  );

  if (n === 5) return (
    <StepContent icon={Heart} title="Como você fala com seus pacientes?" desc="Escolha o tom que mais combina com você.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TONES.map(t => (
          <ChipButton key={t} active={data.tone === t} onClick={() => setData({ ...data, tone: t })} style={{ padding: '14px 10px' }}>{t}</ChipButton>
        ))}
      </div>
    </StepContent>
  );

  return null;
}

function StepContent({ icon: Icon, title, desc, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-md)',
          background: 'var(--brand-soft)', display: 'grid', placeItems: 'center',
          color: 'var(--brand-h)', marginBottom: 12
        }}>
          <Icon size={20} />
        </div>
        <h3 id="onb-title" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {children}
      </div>
    </div>
  );
}

function FieldText({ label, value, onChange, placeholder, prefix }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>{prefix}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input"
          style={prefix ? { paddingLeft: 30 } : undefined}
        />
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, children, style }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 8px',
      background: active ? 'var(--brand-soft)' : 'var(--sf-2)',
      border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      color: active ? 'var(--brand-h)' : 'var(--text-soft)',
      fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
      transition: 'all 150ms', ...style
    }}>{children}</button>
  );
}

function BigChipButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 16px', textAlign: 'left',
      background: active ? 'var(--brand-soft)' : 'var(--sf-2)',
      border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      color: active ? 'var(--brand-h)' : 'var(--text-soft)',
      fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer',
      transition: 'all 150ms'
    }}>{children}</button>
  );
}
