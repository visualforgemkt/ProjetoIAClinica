import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // O FRONTEND NÃO FAZ MAIS PARSING DE INTENT OU GERAÇÃO DE PROMPT.
      // O frontend é BURRO. Apenas envia o texto cru.
      // const response = await api.post('/ai/chat', { message: userMsg.content });
      
      // Mock para visualização:
      setTimeout(() => {
        setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: 'Simulando resposta da IA focada apenas na renderização.', disclaimer: 'Aviso Legal...' }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', error: true, content: 'Erro ao conectar com servidor.' }]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <header style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Assistente IA</h2>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Como posso ajudar sua clínica hoje?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: msg.role === 'user' ? 'var(--color-text-on-primary)' : 'var(--color-text)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '80%',
                border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none'
              }}
            >
              <div>{msg.content}</div>
              {msg.disclaimer && (
                <div style={{ fontSize: '0.7rem', marginTop: 'var(--space-2)', opacity: 0.7, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 'var(--space-1)' }}>
                  {msg.disclaimer}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
            Digitando...
          </div>
        )}
      </div>

      {/* Input Form */}
      <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem para a IA..."
            style={{ 
              flex: 1, 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--color-border-strong)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          />
          <Button type="submit" variant="primary" style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', padding: 0 }}>
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
