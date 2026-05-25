import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { ArrowRight, KeyRound, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [stage, setStage] = useState(1); // 1 = Credenciais, 2 = OTP de 6 dígitos
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const { setAuth } = useAuthStore();

  const maskEmail = (em) => {
    const parts = em.split('@');
    if (parts.length !== 2) return em;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `**@${domain}`;
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const handleStage1 = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique seus dados.');
      }

      // Sucesso na etapa 1: Transita para o OTP
      setMaskedEmail(maskEmail(email.trim().toLowerCase()));
      setStage(2);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStage2 = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailKey: email.trim().toLowerCase(), accessCode: otpCode.trim() })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        // Trata erro ou lockout temporário de 15 minutos
        throw new Error(data.error || 'Código incorreto ou expirado.');
      }

      const d = data.data;
      // Salva sessão autenticada no Zustand store
      setAuth({
        user: d.user,
        clinic: d.clinic,
        token: d.accessToken,
        refreshToken: d.refreshToken
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStage1 = () => {
    setStage(1);
    setOtpCode('');
    setErrorMsg('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '380px', background: 'var(--sf)', border: '1px solid var(--bd2)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-lg)' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-.04em', color: 'var(--t1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ background: 'linear-gradient(135deg, var(--blu) 0%, var(--blu-l) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MedAI</span>
          <span style={{ fontWeight: 500, color: 'var(--t2)', fontSize: '15px' }}>Pro</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px' }}>Plataforma Inteligente de Marketing para Médicos</p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--err)', color: 'var(--err)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '12.5px', marginBottom: '16px', lineHeight: '1.4' }}>
          {errorMsg}
        </div>
      )}

      {stage === 1 ? (
        <form onSubmit={handleStage1} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>E-mail de Acesso</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--t3)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@clinicamedica.com"
                required
                style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Senha de Acesso</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--t3)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '10px', background: 'var(--blu)', border: 'none', padding: '10px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : null}
            Continuar <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleStage2} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--sf2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd)', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--t2)', marginBottom: '2px' }}>Insira o código enviado para</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--blu-l)' }}>{maskedEmail}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Código OTP (6 dígitos)</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--t3)' }} />
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 483271"
                required
                style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', color: 'var(--t1)', outline: 'none', fontSize: '14px', letterSpacing: '0.2em', fontWeight: 700 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            style={{ marginTop: '10px', background: 'var(--blu)', border: 'none', padding: '10px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (loading || otpCode.length !== 6) ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : null}
            Autenticar <ShieldCheck size={16} />
          </button>

          <button
            type="button"
            onClick={handleBackToStage1}
            style={{ background: 'transparent', border: 'none', color: 'var(--t3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center', marginTop: '4px' }}
          >
            Voltar e corrigir e-mail
          </button>
        </form>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
