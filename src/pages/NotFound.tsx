import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFound() {
  useDocumentTitle('Página não encontrada');
  return (
    <section className="wrap" style={{ paddingBlock: 'clamp(64px, 10vw, 160px)', display: 'grid', gap: 24 }}>
      <h1 className="t-display-xl">Página não encontrada.</h1>
      <p className="t-sub t-muted" style={{ maxWidth: '40ch' }}>
        O endereço pode ter mudado ou o modelo saiu do catálogo.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Link to="/loja" className="btn btn--primary">
          Ver todos os iPhones
        </Link>
        <Link to="/" className="btn btn--ghost">
          Página inicial
        </Link>
      </div>
    </section>
  );
}
