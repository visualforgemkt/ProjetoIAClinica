import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { ArrowRight, KeyRound, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const { setAuth } = useAuthStore();

  const maskEmail = (em) => {
    const [name, domain] = em.split('@');
    if (!domain) return em;
    if (name.length <= 2) return `**@${domain}`;
    return `${name.substring(0, 2)}•••@${domain}`;
  };

  const handleStage1 = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setErrorMsg('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Credenciais inválidas. Verifique seus dados.');

      // Login já completo (usuário recorrente) — emite tokens direto
      if (d.data?.authenticated && d.data?.accessToken) {
        setAuth({
          user: d.data.user,
          clinic: d.data.clinic,
          token: d.data.accessToken,
          refreshToken: d.data.refreshToken
        });
        return;
      }

      // Primeiro login — precisa do código de acesso
      setMaskedEmail(maskEmail(email.trim().toLowerCase()));
      setStage(2);
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleStage2 = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true); setErrorMsg('');
    try {
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailKey: email.trim().toLowerCase(), accessCode: otpCode.trim() })
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Código incorreto ou expirado.');
      setAuth({
        user: d.data.user,
        clinic: d.data.clinic,
        token: d.data.accessToken,
        refreshToken: d.data.refreshToken
      });
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 320ms both' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
          background: 'var(--brand-grad)', display: 'grid', placeItems: 'center',
          color: '#fff', fontWeight: 800, fontSize: 22,
          boxShadow: 'var(--shadow-brand)'
        }}>M</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
          Bem-vindo ao MedAI Pro
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Seu assistente inteligente de marketing médico
        </p>
      </div>

      <div style={{
        background: 'var(--sf-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 28,
        boxShadow: 'var(--shadow-lg)'
      }}>
        {errorMsg && (
          <div style={{
            background: 'var(--err-soft)',
            border: '1px solid var(--err)',
            color: 'var(--err)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16
          }}>{errorMsg}</div>
        )}

        {stage === 1 ? (
          <form onSubmit={handleStage1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="E-mail" icon={Mail}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@suaclinica.com" required autoComplete="email"
                className="input" style={{ paddingLeft: 40 }}
              />
            </Field>
            <Field label="Senha" icon={Lock}>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="input" style={{ paddingLeft: 40 }}
              />
            </Field>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Continuar <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleStage2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              textAlign: 'center', padding: 14,
              background: 'var(--brand-soft)',
              border: '1px solid var(--border-brand)',
              borderRadius: 'var(--r-md)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 4 }}>Primeiro acesso de</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-h)' }}>{maskedEmail}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Use o código de ativação que você recebeu. Ele só é solicitado uma vez.
              </div>
            </div>

            <Field label="Código de ativação" icon={KeyRound}>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" required autoComplete="one-time-code"
                className="input"
                style={{ paddingLeft: 40, fontSize: 18, letterSpacing: '0.4em', fontWeight: 700, textAlign: 'center' }}
              />
            </Field>

            <button type="submit" disabled={loading || otpCode.length !== 6} className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Entrar <ShieldCheck size={16} />
            </button>
            <button type="button" onClick={() => { setStage(1); setOtpCode(''); setErrorMsg(''); }} className="btn btn-ghost btn-sm">
              ← Usar outro e-mail
            </button>
          </form>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-dim)' }}>
        Plataforma em conformidade com o CFM e a LGPD
      </p>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />}
        {children}
      </div>
    </div>
  );
}
