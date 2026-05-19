import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Instagram, Home, Award, HeartHandshake, Eye } from 'lucide-react';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clinicName: '',
    city: '',
    specialty: 'Dermatologia',
    customSpecialty: '',
    objective: 'Atrair novos pacientes',
    instagram: '',
    tone: 'Empático e acolhedor'
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const specialties = ['Dermatologia', 'Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia', 'Psiquiatria', 'Medicina Geral', 'Outro'];
  const objectives = ['Atrair novos pacientes', 'Fidelizar clientes atuais', 'Educação em saúde e prevenção', 'Fortalecer marca pessoal/clínica'];
  const tones = ['Empático e acolhedor', 'Científico e técnico', 'Prático e direto', 'Inspirador e motivacional'];

  const handleNext = () => {
    if (step === 1 && (!formData.clinicName || !formData.city)) return;
    if (step === 4 && !formData.instagram) return;
    
    if (step < 5) {
      setStep(step + 1);
    } else {
      triggerWowMoment();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const triggerWowMoment = async () => {
    setStep(6);
    setLoading(true);
    setLoadingMessage('Analisando especialidade médica...');
    
    setTimeout(() => {
      setLoadingMessage('Formatando tom de voz da clínica...');
    }, 2000);

    setTimeout(() => {
      setLoadingMessage('Criando primeira campanha promocional ética...');
    }, 4000);

    try {
      const selectedSpecialty = formData.specialty === 'Outro' ? formData.customSpecialty : formData.specialty;
      
      // Envia os dados de onboarding de forma integrada para o backend
      // PUT /api/clinic/context
      const contextPayload = {
        name: formData.clinicName,
        specialty: selectedSpecialty,
        city: formData.city,
        target_public: 'Pacientes particulares ou planos premium',
        services: `Consultas e tratamentos em ${selectedSpecialty}`,
        differentials: 'Atendimento humanizado e infraestrutura moderna',
        instagram: formData.instagram.startsWith('@') ? formData.instagram : `@${formData.instagram}`,
        tone: formData.tone,
        onboarding_complete: true
      };

      // Chama o callback de conclusão enviando os dados
      if (onComplete) {
        await onComplete(contextPayload);
      }
    } catch (err) {
      setLoading(false);
      setStep(5);
      alert('Erro ao concluir onboarding. Tente novamente.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={18} style={{ color: 'var(--blu-l)' }} /> Passo 1: Informações Gerais
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--t2)' }}>Conte-nos os dados básicos de identificação da sua clínica.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Nome da Clínica ou Consultório</label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                placeholder="Ex: Clínica MedVida"
                style={{ padding: '9px 12px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Cidade de Atendimento</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: São Paulo - SP"
                style={{ padding: '9px 12px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} style={{ color: 'var(--blu-l)' }} /> Passo 2: Sua Especialidade
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--t2)' }}>Qual é a principal especialidade ou área médica de atuação?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '5px' }}>
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setFormData({ ...formData, specialty: spec })}
                  style={{
                    padding: '10px 8px',
                    background: formData.specialty === spec ? 'var(--blu-d)' : 'var(--sf2)',
                    border: formData.specialty === spec ? '1px solid var(--blu)' : '1px solid var(--bd)',
                    borderRadius: 'var(--radius-md)',
                    color: formData.specialty === spec ? 'var(--blu-l)' : 'var(--t2)',
                    fontSize: '12px',
                    fontWeight: formData.specialty === spec ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {spec}
                </button>
              ))}
            </div>
            {formData.specialty === 'Outro' && (
              <input
                type="text"
                value={formData.customSpecialty}
                onChange={(e) => setFormData({ ...formData, customSpecialty: e.target.value })}
                placeholder="Digite sua especialidade..."
                style={{ padding: '9px 12px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px', marginTop: '5px' }}
              />
            )}
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={18} style={{ color: 'var(--blu-l)' }} /> Passo 3: Objetivo do Marketing
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--t2)' }}>O que você busca conquistar prioritariamente utilizando o MedAI Pro?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
              {objectives.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setFormData({ ...formData, objective: obj })}
                  style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    background: formData.objective === obj ? 'var(--blu-d)' : 'var(--sf2)',
                    border: formData.objective === obj ? '1px solid var(--blu)' : '1px solid var(--bd)',
                    borderRadius: 'var(--radius-md)',
                    color: formData.objective === obj ? 'var(--blu-l)' : 'var(--t2)',
                    fontSize: '12.5px',
                    fontWeight: formData.objective === obj ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Instagram size={18} style={{ color: 'var(--blu-l)' }} /> Passo 4: Redes Sociais
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--t2)' }}>Informe seu perfil profissional do Instagram para refinamento de tom.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Usuário do Instagram</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '9px', color: 'var(--t3)', fontSize: '13px', fontWeight: 700 }}>@</span>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                  placeholder="clinicamedica"
                  style={{ padding: '9px 12px 9px 28px', width: '100%', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartHandshake size={18} style={{ color: 'var(--blu-l)' }} /> Passo 5: Tom de Comunicação
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--t2)' }}>Qual tom melhor descreve a relação da sua clínica com os pacientes?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '5px' }}>
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setFormData({ ...formData, tone: t })}
                  style={{
                    padding: '14px 10px',
                    background: formData.tone === t ? 'var(--blu-d)' : 'var(--sf2)',
                    border: formData.tone === t ? '1px solid var(--blu)' : '1px solid var(--bd)',
                    borderRadius: 'var(--radius-md)',
                    color: formData.tone === t ? 'var(--blu-l)' : 'var(--t2)',
                    fontSize: '12.5px',
                    fontWeight: formData.tone === t ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '15px', textAlign: 'center' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--blu)', animation: 'spin 1.5s linear infinite' }} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sparkles size={18} style={{ color: 'var(--gld)' }} /> Momento WOW Ativado!
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--t2)', maxWidth: '280px' }}>{loadingMessage}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ width: '450px', background: 'var(--sf)', border: '1px solid var(--bd2)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
        {/* Step Indicator */}
        {step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--blu-l)' }}>Onboarding Clínico</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '24px',
                    height: '4px',
                    borderRadius: '2px',
                    background: s <= step ? 'var(--blu)' : 'var(--sf3)',
                    transition: 'background 0.2s ease'
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {renderStepContent()}

        {/* Controls */}
        {step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '22px', borderTop: '1px solid var(--bd)', paddingTop: '15px' }}>
            <button
              onClick={handleBack}
              disabled={step === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: step === 1 ? 'var(--t4)' : 'var(--t2)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: step === 1 ? 'default' : 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={(step === 1 && (!formData.clinicName || !formData.city)) || (step === 4 && !formData.instagram)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--blu)',
                border: 'none',
                padding: '7px 18px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: ((step === 1 && (!formData.clinicName || !formData.city)) || (step === 4 && !formData.instagram)) ? 0.5 : 1
              }}
            >
              {step === 5 ? 'Iniciar MedAI Pro' : 'Avançar'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
