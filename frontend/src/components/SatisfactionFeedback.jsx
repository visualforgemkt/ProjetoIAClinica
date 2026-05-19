import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, CheckCircle2 } from 'lucide-react';

export default function SatisfactionFeedback({ campaignId, onSendFeedback }) {
  const [rating, setRating] = useState(null); // true = 👍, false = 👎
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === null) return;

    setLoading(true);
    try {
      if (onSendFeedback) {
        await onSendFeedback({ rating, comment, campaignId });
      }
      setSubmitted(true);
    } catch (err) {
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ok-d)', border: '1px solid var(--ok)', padding: '10px 15px', borderRadius: 'var(--radius-md)', color: 'var(--ok)', fontSize: '12px', fontWeight: 600 }}>
        <CheckCircle2 size={16} />
        Obrigado por nos ajudar a melhorar o MedAI Pro! Seu feedback foi registrado.
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-lg)', padding: '15px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t1)' }}>
          Esta campanha gerou valor para sua clínica hoje?
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setRating(true)}
            style={{
              padding: '6px 12px',
              background: rating === true ? 'var(--ok-d)' : 'var(--sf3)',
              border: rating === true ? '1px solid var(--ok)' : '1px solid var(--bd)',
              borderRadius: 'var(--radius-md)',
              color: rating === true ? 'var(--ok)' : 'var(--t2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <ThumbsUp size={13} /> Sim, útil
          </button>
          <button
            type="button"
            onClick={() => setRating(false)}
            style={{
              padding: '6px 12px',
              background: rating === false ? 'rgba(239,68,68,0.1)' : 'var(--sf3)',
              border: rating === false ? '1px solid var(--err)' : '1px solid var(--bd)',
              borderRadius: 'var(--radius-md)',
              color: rating === false ? 'var(--err)' : 'var(--t2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <ThumbsDown size={13} /> Não gostei
          </button>
        </div>
      </div>

      {rating !== null && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px', borderTop: '1px solid var(--bd)', paddingTop: '10px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>
            {rating ? 'Excelente! Deseja acrescentar algum comentário?' : 'O que faltou para ficar excelente?'}
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={rating ? "Ex: Adorei o tom de voz..." : "O que deveríamos mudar ou adicionar na campanha?"}
              required={rating === false}
              style={{
                flex: 1,
                padding: '7px 12px',
                background: 'var(--sf3)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--t1)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || (rating === false && !comment.trim())}
              style={{
                background: 'var(--blu)',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                opacity: (loading || (rating === false && !comment.trim())) ? 0.5 : 1
              }}
            >
              <Send size={12} /> {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
