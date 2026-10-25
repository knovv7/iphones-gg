import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { STORE } from '../config/store';
import { useDialog } from '../hooks/useDialog';
import { useStore } from '../state/StoreProvider';
import { Roll } from './ui';
import './Header.css';

export const NAV_LINKS = [
  { to: '/loja', label: 'Loja', match: (p: string, s: string) => p === '/loja' && !s.includes('geracao=') },
  { to: '/loja?geracao=18', label: 'iPhone 18 Pro', match: (_: string, s: string) => s === '?geracao=18' },
  { to: '/loja?geracao=17', label: 'iPhone 17 Pro', match: (_: string, s: string) => s === '?geracao=17' },
  { to: '/comparar', label: 'Comparar', match: (p: string) => p === '/comparar' },
];

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark__dot" aria-hidden="true" />
      {STORE.name}
    </span>
  );
}

export function Header() {
  const { count, openCart, openSearch } = useStore();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useDialog(menuOpen, () => setMenuOpen(false), menuRef);
  useEffect(() => setMenuOpen(false), [pathname, search]);

  // Pequeno pulso no contador quando um item entra na sacola.
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 450);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  // Atalho "/" abre a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);

  return (
    <header className="header">
      <div className="header__bar wrap">
        <Link to="/" className="header__logo" aria-label={`${STORE.name}, página inicial`}>
          <Wordmark />
        </Link>

        <nav className="header__nav" aria-label="Categorias">
          {NAV_LINKS.map((l) => {
            const active = l.match(pathname, search);
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={`header__link roll-host${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Roll>{l.label}</Roll>
              </NavLink>
            );
          })}
        </nav>

        <div className="header__actions">
          <button type="button" className="header__link roll-host" onClick={openSearch} aria-keyshortcuts="/">
            <Roll>Buscar</Roll>
          </button>
          <Link
            to="/conta"
            className={`header__link header__link--account roll-host${pathname === '/conta' ? ' is-active' : ''}`}
          >
            <Roll>Conta</Roll>
          </Link>
          <button
            type="button"
            className="header__link header__cart roll-host"
            onClick={openCart}
            aria-label={`Sacola, ${count} ${count === 1 ? 'item' : 'itens'}`}
          >
            <Roll>Sacola</Roll>
            <span className={`header__count tnum${count ? ' has-items' : ''}${bump ? ' is-bump' : ''}`} aria-hidden="true">
              {count}
            </span>
          </button>
          <button
            type="button"
            className={`header__burger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mmenu${menuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!menuOpen}
      >
        <nav className="mmenu__nav wrap" aria-label="Categorias">
          {NAV_LINKS.map((l, i) => (
            <Link key={l.to} to={l.to} className="mmenu__link" style={{ '--i': i } as CSSProperties}>
              {l.label}
            </Link>
          ))}
          <Link to="/conta" className="mmenu__link" style={{ '--i': NAV_LINKS.length } as CSSProperties}>
            Conta
          </Link>
        </nav>
        <div className="mmenu__foot wrap t-caption t-muted">
          <button
            type="button"
            className="link"
            onClick={() => {
              setMenuOpen(false);
              openSearch();
            }}
          >
            Buscar modelo, cor ou capacidade
          </button>
        </div>
      </div>
    </header>
  );
}
