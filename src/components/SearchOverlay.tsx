import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useDialog } from '../hooks/useDialog';
import { finishFromQuery, matchesQuery, startingPrice } from '../lib/catalog';
import { formatPrice } from '../lib/format';
import { useStore } from '../state/StoreProvider';
import { Device } from './Device';
import { Marquee } from './ui';
import './SearchOverlay.css';

const SUGGESTIONS = ['18 Pro', 'Pro Max', '2 TB', 'Bordô', 'Glacial', 'Laranja-cósmico'];

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();
  const [q, setQ] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useDialog(searchOpen, closeSearch, panelRef);

  useEffect(() => {
    if (!searchOpen) setQ('');
  }, [searchOpen]);

  const results = useMemo(() => (q.trim() ? PRODUCTS.filter((p) => matchesQuery(p, q)) : []), [q]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    closeSearch();
    navigate(`/loja?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className={`search${searchOpen ? ' is-open' : ''}`} aria-hidden={!searchOpen}>
      <button type="button" className="search__scrim" tabIndex={-1} aria-label="Fechar busca" onClick={closeSearch} />
      <div
        ref={panelRef}
        className="search__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar na loja"
        hidden={!searchOpen}
      >
        <form className="search__form wrap" onSubmit={submit} role="search">
          <label htmlFor="search-input" className="sr-only">
            Buscar modelo, cor ou capacidade
          </label>
          <input
            id="search-input"
            data-autofocus
            className="search__input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar iPhone"
            autoComplete="off"
            spellCheck={false}
            aria-controls="search-results"
          />
          <button type="button" className="search__close btn btn--ghost btn--sm" onClick={closeSearch}>
            Fechar
          </button>
        </form>

        <div className="search__body wrap" id="search-results" aria-live="polite">
          {!q.trim() && (
            <div className="search__suggest">
              <p className="t-caption t-faint">Experimente</p>
              <ul>
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button type="button" className="pill search__chip" onClick={() => setQ(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {q.trim() && results.length > 0 && (
            <>
              <p className="t-caption t-faint">
                {results.length} {results.length === 1 ? 'modelo' : 'modelos'}
              </p>
              <ul className="search__results">
                {results.map((p) => {
                  const fid = finishFromQuery(p, q) ?? p.finishes[0].id;
                  const finish = p.finishes.find((f) => f.id === fid)!;
                  const price = startingPrice(p);
                  return (
                    <li key={p.slug}>
                      <Link to={`/iphone/${p.slug}?cor=${finish.id}`} className="search__result" onClick={closeSearch}>
                        <Device product={p} finish={finish} className="search__thumb" decorative />
                        <span className="search__name">{p.name}</span>
                        <span className="t-caption t-muted">
                          {finish.name}
                          {price !== null && ` · a partir de ${formatPrice(price, true)}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="link t-caption" onClick={submit}>
                Ver resultados no catálogo
              </button>
            </>
          )}

          {q.trim() && results.length === 0 && (
            <div className="search__empty">
              <Marquee text={`Nada para “${q.trim()}” · `} />
              <p className="t-muted">Tente o nome do modelo, uma cor ou uma capacidade, como “512 GB”.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
