import { ImageIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Creatives() {
  return (
    <>
      <header className="page-header">
        <div>
          <div className="page-title">Criativos</div>
          <div className="page-subtitle">Suas imagens e artes geradas com IA</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s-8)' }}>
        <div className="empty" style={{ marginTop: 80 }}>
          <div className="empty-icon"><ImageIcon size={22} /></div>
          <div className="empty-title">Galeria ainda vazia</div>
          <div className="empty-desc">
            Quando você gerar imagens com o assistente, elas vão aparecer aqui em uma galeria visual para você
            organizar, baixar e compartilhar.
          </div>
          <Link to="/assistente" className="btn btn-primary" style={{ marginTop: 16 }}>
            <Sparkles size={14} /> Gerar primeira imagem
          </Link>
        </div>
      </div>
    </>
  );
}
