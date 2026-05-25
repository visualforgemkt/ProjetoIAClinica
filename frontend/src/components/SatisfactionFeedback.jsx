import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function SatisfactionFeedback({ campaignId, onSendFeedback }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === null) return;
    setLoading(true); setError('');
    try {
      await onSendFeedback?.({ rating, comment, campaignId });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Não conseguimos enviar seu feedback agora.');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--ok-soft)', border: '1px solid var(--ok)',
        padding: '12px 16px', borderRadius: 'var(--r-md)',
        color: 'var(--ok)', fontSize: 13, fontWeight: 500
      }}>
        <CheckCircle2 size={16} />
        Obrigado pelo feedback — ele nos ajuda a melhorar o MedAI Pro.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
          Esta campanha foi útil?
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <RatingButton active={rating === true}  onClick={() => setRating(true)}  type="ok">
            <ThumbsUp size={13} /> Sim
          </RatingButton>
          <RatingButton active={rating === false} onClick={() => setRating(false)} type="err">
            <ThumbsDown size={13} /> Não
          </RatingButton>
        </div>
      </div>

      {rating !== null && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <label style={{ fontSize: 12, color: 'var(--text-soft)' }}>
            {rating ? 'Quer comentar o que mais gostou? (opcional)' : 'O que faltou para essa campanha ser excelente?'}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text" value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={rating ? 'Ex: adorei o tom de voz' : 'Conte para a gente'}
              required={rating === false}
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={loading || (rating === false && !comment.trim())} className="btn btn-primary">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {loading ? 'Enviando' : 'Enviar'}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--err)' }}>{error}</div>}
        </form>
      )}
    </div>
  );
}

function RatingButton({ active, onClick, type, children }) {
  const colors = type === 'ok'
    ? { bg: 'var(--ok-soft)', border: 'var(--ok)', text: 'var(--ok)' }
    : { bg: 'var(--err-soft)', border: 'var(--err)', text: 'var(--err)' };
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px',
      background: active ? colors.bg : 'var(--sf-2)',
      border: `1px solid ${active ? colors.border : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      color: active ? colors.text : 'var(--text-soft)',
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      transition: 'all 150ms'
    }}>{children}</button>
  );
}
