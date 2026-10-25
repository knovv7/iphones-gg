import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FAMILY_LABEL, PRODUCTS } from '../data/products';
import type { Family } from '../data/types';
import { useDialog } from '../hooks/useDialog';
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facetFamilies,
  facetGenerations,
  facetPriceRanges,
  facetStorage,
  filterProducts,
  filtersFromParams,
  finishFromQuery,
  paramsFromFilters,
  PRICE_RANGES,
  SORT_OPTIONS,
  sortProducts,
  type CatalogFilters,
  type SortKey,
} from '../lib/catalog';
import { formatStorage } from '../lib/format';
import { ProductCard } from './ProductCard';
import { Marquee } from './ui';
import './Catalog.css';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialog(sheetOpen, () => setSheetOpen(false), sheetRef);

  const update = (patch: Partial<CatalogFilters>) => {
    const next = paramsFromFilters({ ...filters, ...patch });
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const results = useMemo(
    () => sortProducts(filterProducts(PRODUCTS, filters), filters.sort, filters.storage),
    [filters],
  );
  const activeCount = activeFilterCount(filters);

  const families = facetFamilies(PRODUCTS);
  const generations = facetGenerations(PRODUCTS);
  const storages = facetStorage(PRODUCTS);
  const priceRanges = facetPriceRanges(PRODUCTS);
  // Com uma linha só (hoje, só Pro), a geração leva o nome da linha: "iPhone 17 Pro", não "iPhone 17".
  const generationLabel = (g: number) => `iPhone ${g}${families.length === 1 ? ` ${FAMILY_LABEL[families[0]]}` : ''}`;

  const chips: { label: string; clear: () => void }[] = [
    ...(filters.q ? [{ label: `“${filters.q}”`, clear: () => update({ q: '' }) }] : []),
    ...filters.families.map((f) => ({
      label: FAMILY_LABEL[f],
      clear: () => update({ families: filters.families.filter((x) => x !== f) }),
    })),
    ...filters.generations.map((g) => ({
      label: generationLabel(g),
      clear: () => update({ generations: filters.generations.filter((x) => x !== g) }),
    })),
    ...filters.storage.map((s) => ({
      label: formatStorage(s),
      clear: () => update({ storage: filters.storage.filter((x) => x !== s) }),
    })),
    ...(filters.price
      ? [{ label: PRICE_RANGES.find((r) => r.id === filters.price)?.label ?? '', clear: () => update({ price: null }) }]
      : []),
    ...(filters.inStock ? [{ label: 'Em estoque', clear: () => update({ inStock: false }) }] : []),
  ];

  const filterGroups = (
    <>
      {/* Com uma linha só no catálogo, o filtro não teria escolha a oferecer. */}
      {families.length > 1 && (
        <fieldset className="fgroup">
          <legend className="fgroup__title">Linha</legend>
          <div className="fgroup__opts">
            {families.map((f: Family) => (
              <button
                key={f}
                type="button"
                className="fchip"
                aria-pressed={filters.families.includes(f)}
                onClick={() => update({ families: toggle(filters.families, f) })}
              >
                {FAMILY_LABEL[f]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="fgroup">
        <legend className="fgroup__title">Geração</legend>
        <div className="fgroup__opts">
          {generations.map((g) => (
            <button
              key={g}
              type="button"
              className="fchip"
              aria-pressed={filters.generations.includes(g)}
              onClick={() => update({ generations: toggle(filters.generations, g) })}
            >
              {generationLabel(g)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="fgroup">
        <legend className="fgroup__title">Armazenamento</legend>
        <div className="fgroup__opts">
          {storages.map((s) => (
            <button
              key={s}
              type="button"
              className="fchip"
              aria-pressed={filters.storage.includes(s)}
              onClick={() => update({ storage: toggle(filters.storage, s) })}
            >
              {formatStorage(s)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="fgroup">
        <legend className="fgroup__title">Preço</legend>
        <div className="fgroup__opts fgroup__opts--stack">
          {priceRanges.map((r) => (
            <button
              key={r.id}
              type="button"
              className="fchip"
              aria-pressed={filters.price === r.id}
              onClick={() => update({ price: filters.price === r.id ? null : r.id })}
            >
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="fgroup">
        <legend className="fgroup__title">Disponibilidade</legend>
        <label className="ftoggle">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => update({ inStock: e.target.checked })}
          />
          <span className="ftoggle__track" aria-hidden="true" />
          Somente em estoque
        </label>
      </fieldset>
    </>
  );

  return (
    <div className="catalog">
      <aside className="catalog__side" aria-label="Filtros">
        {filterGroups}
        {activeCount > 0 && (
          <button type="button" className="link t-caption t-muted" onClick={() => setParams({}, { replace: true, preventScrollReset: true })}>
            Limpar filtros
          </button>
        )}
      </aside>

      <div className="catalog__main">
        <div className="catalog__bar">
          <p className="t-caption t-muted" aria-live="polite">
            <span className="tnum">{results.length}</span> {results.length === 1 ? 'modelo' : 'modelos'}
          </p>
          <button type="button" className="btn btn--ghost btn--sm catalog__filters-btn" onClick={() => setSheetOpen(true)}>
            Filtros{activeCount ? ` (${activeCount})` : ''}
          </button>
          <label className="catalog__sort">
            <span className="t-caption t-muted">Ordenar</span>
            <select
              className="select select--inline"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <ul className="catalog__chips" aria-label="Filtros ativos">
            {chips.map((c) => (
              <li key={c.label}>
                <button type="button" className="pill catalog__chip" onClick={c.clear} aria-label={`Remover filtro ${c.label}`}>
                  {c.label} <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {results.length ? (
          <ul className="catalog__grid">
            {results.map((p, i) => (
              <li key={p.slug} className="reveal" style={{ '--i': i % 3 } as CSSProperties}>
                <ProductCard
                  product={p}
                  storageScope={filters.storage}
                  initialFinish={finishFromQuery(p, filters.q)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="catalog__empty">
            <Marquee text="Nenhum modelo · " />
            <p className="t-muted">Nenhum iPhone combina com todos esses filtros.</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setParams(paramsFromFilters({ ...EMPTY_FILTERS }), { replace: true, preventScrollReset: true })}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className={`fsheet${sheetOpen ? ' is-open' : ''}`} hidden={!sheetOpen}>
        <button type="button" className="fsheet__scrim" tabIndex={-1} aria-label="Fechar filtros" onClick={() => setSheetOpen(false)} />
        <div ref={sheetRef} className="fsheet__panel" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="fsheet__head">
            <p className="t-h">Filtros</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSheetOpen(false)} data-autofocus>
              Fechar
            </button>
          </div>
          <div className="fsheet__body">{filterGroups}</div>
          <div className="fsheet__foot">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setParams({}, { replace: true, preventScrollReset: true })}
              disabled={!activeCount}
            >
              Limpar
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setSheetOpen(false)}>
              Ver {results.length} {results.length === 1 ? 'modelo' : 'modelos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
