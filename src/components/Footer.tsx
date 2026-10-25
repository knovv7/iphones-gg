import { Link } from 'react-router-dom';
import { STORE } from '../config/store';
import { PRODUCTS } from '../data/products';
import { useStore } from '../state/StoreProvider';
import { NAV_LINKS } from './Header';
import { DemoNote } from './ui';
import './Footer.css';

export function Footer() {
  const { openCart } = useStore();
  const sources = [...new Set(PRODUCTS.flatMap((p) => p.sources))];
  return (
    <footer className="footer">
      <div className="footer__grid wrap">
        <nav aria-label="Loja">
          <h2 className="footer__title">Loja</h2>
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Modelos">
          <h2 className="footer__title">Modelos</h2>
          <ul>
            {PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link to={`/iphone/${p.slug}`} className="link">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Sua conta">
          <h2 className="footer__title">Sua conta</h2>
          <ul>
            <li>
              <Link to="/conta" className="link">
                Conta e favoritos
              </Link>
            </li>
            <li>
              <button type="button" className="link" onClick={openCart}>
                Sacola
              </button>
            </li>
            <li>
              <Link to="/checkout" className="link">
                Checkout
              </Link>
            </li>
          </ul>
        </nav>
        <div className="footer__about">
          <h2 className="footer__title">Sobre os dados</h2>
          <p className="t-caption t-muted">
            Especificações conferidas nas páginas técnicas oficiais da Apple Brasil (
            {sources.map((s, i) => (
              <span key={s}>
                <a href={s} className="link" target="_blank" rel="noreferrer">
                  {i + 1}
                </a>
                {i < sources.length - 1 ? ', ' : ''}
              </span>
            ))}
            ). Nos modelos sem foto, as imagens são ilustrações vetoriais feitas a partir das dimensões oficiais.
          </p>
          <DemoNote />
          {STORE.demoMode && <DemoNote>Pagamentos ainda não integrados: nenhum pedido é processado nesta versão.</DemoNote>}
        </div>
      </div>

      <div className="footer__brand wrap" aria-hidden="true">
        <span className="footer__word">{STORE.name.toLowerCase()}</span>
        <span className="footer__dot" />
      </div>

      <div className="footer__legal wrap t-caption t-faint">
        <p>{STORE.legalNote}</p>
        <p>© {new Date().getFullYear()} {STORE.name}</p>
      </div>
    </footer>
  );
}
