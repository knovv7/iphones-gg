import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Device } from '../components/Device';
import { DemoNote } from '../components/ui';
import { getProduct, PRODUCTS } from '../data/products';
import type { Product } from '../data/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { startingPrice } from '../lib/catalog';
import { formatMm, formatPrice, formatStorage } from '../lib/format';
import './Compare.css';

const DEFAULT = ['iphone-18-pro', 'iphone-18-pro-max', 'iphone-17-pro'];
const MAX = 3;

interface Row {
  label: string;
  text: (p: Product) => string;
  render?: (p: Product) => ReactNode;
  /** Valor numérico para a barra proporcional; `best` indica se maior ou menor é melhor. */
  num?: (p: Product) => number;
  best?: 'max' | 'min';
  unit?: string;
}

const ROWS: Row[] = [
  {
    label: 'Preço a partir de',
    text: (p) => {
      const v = startingPrice(p);
      return v === null ? 'Em breve' : formatPrice(v, true);
    },
  },
  { label: 'Tela', text: (p) => p.keySpecs.display },
  { label: 'Chip', text: (p) => p.keySpecs.chip },
  { label: 'Câmeras traseiras', text: (p) => p.keySpecs.rearCameras },
  { label: 'Zoom', text: (p) => p.keySpecs.zoom },
  { label: 'Câmera frontal', text: (p) => p.keySpecs.frontCamera },
  {
    label: 'Reprodução de vídeo',
    text: (p) => `até ${p.keySpecs.videoHours} h`,
    num: (p) => p.keySpecs.videoHours,
    best: 'max',
  },
  {
    label: 'Espessura',
    text: (p) => formatMm(p.keySpecs.thickness),
    num: (p) => p.keySpecs.thickness,
    best: 'min',
  },
  { label: 'Peso', text: (p) => `${p.keySpecs.weight} g`, num: (p) => p.keySpecs.weight, best: 'min' },
  { label: 'Estrutura', text: (p) => p.keySpecs.material },
  { label: 'USB-C', text: (p) => p.keySpecs.usb },
  { label: 'Capacidades', text: (p) => p.storage.map((s) => formatStorage(s.gb)).join(', ') },
  {
    label: 'Cores',
    text: (p) => p.finishes.map((f) => f.name).join(', '),
    render: (p) => (
      <span className="cmp__colors">
        {p.finishes.map((f) => (
          <span key={f.id} className="cmp__color" title={f.name}>
            <span className="cmp__dot" style={{ background: f.hex }} aria-hidden="true" />
            {f.name}
          </span>
        ))}
      </span>
    ),
  },
];

export function Compare() {
  useDocumentTitle('Comparar modelos');
  const [params, setParams] = useSearchParams();
  const [onlyDiff, setOnlyDiff] = useState(false);

  const slugs = useMemo(() => {
    const fromUrl = (params.get('modelos') ?? '')
      .split(',')
      .filter((s) => getProduct(s))
      .slice(0, MAX);
    return fromUrl.length >= 2 ? fromUrl : fromUrl.length === 1 ? [fromUrl[0], DEFAULT.find((d) => d !== fromUrl[0])!] : DEFAULT;
  }, [params]);
  const models = slugs.map((s) => getProduct(s)!);

  const setSlugs = (next: string[]) => setParams({ modelos: next.join(',') }, { replace: true, preventScrollReset: true });

  const rows = ROWS.filter((r) => !onlyDiff || new Set(models.map(r.text)).size > 1);

  return (
    <div className="cmp" style={{ '--cols': models.length } as CSSProperties}>
      <header className="cmp__head wrap">
        <h1 className="t-display">Comparar modelos</h1>
        <div>
          <p className="t-sub t-muted">Escolha até três iPhones. Os aparelhos aparecem na mesma escala.</p>
          <DemoNote />
        </div>
      </header>

      <div className="wrap">
        <div className="cmp__table" role="table" aria-label="Comparação de especificações">
          <div className="cmp__row cmp__row--models" role="row">
            <div className="cmp__label" role="columnheader">
              <label className="ftoggle">
                <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
                <span className="ftoggle__track" aria-hidden="true" />
                Só diferenças
              </label>
            </div>
            {models.map((p, i) => (
              <div key={p.slug + i} className="cmp__model" role="columnheader">
                <label className="sr-only" htmlFor={`cmp-sel-${i}`}>
                  Modelo {i + 1}
                </label>
                <select
                  id={`cmp-sel-${i}`}
                  className="select"
                  value={p.slug}
                  onChange={(e) => setSlugs(slugs.map((s, j) => (j === i ? e.target.value : s)))}
                >
                  {PRODUCTS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <Link to={`/iphone/${p.slug}`} className="cmp__device-link" aria-label={`Ver ${p.name}`}>
                  <Device
                    product={p}
                    finish={p.finishes[0]}
                    className="cmp__device"
                    style={{
                      width: `calc(${p.dimensions.width + 6} * var(--mm))`,
                      height: `calc(${p.dimensions.height + 6} * var(--mm))`,
                    }}
                    decorative
                  />
                </Link>
                <p className="cmp__name t-h">{p.name}</p>
                <div className="cmp__model-actions">
                  <Link to={`/iphone/${p.slug}`} className="btn btn--ghost btn--sm">
                    Ver modelo
                  </Link>
                  {models.length > 2 && (
                    <button
                      type="button"
                      className="link t-caption t-muted"
                      onClick={() => setSlugs(slugs.filter((_, j) => j !== i))}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
            {models.length < MAX && (
              <div className="cmp__add">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setSlugs([...slugs, PRODUCTS.find((o) => !slugs.includes(o.slug))!.slug])}
                >
                  Adicionar modelo
                </button>
              </div>
            )}
          </div>

          {rows.map((r) => {
            const nums = r.num ? models.map(r.num) : [];
            const top = nums.length ? Math.max(...nums) : 0;
            const best = nums.length ? (r.best === 'min' ? Math.min(...nums) : Math.max(...nums)) : null;
            return (
              <div key={r.label} className="cmp__row" role="row">
                <div className="cmp__label t-caption t-muted" role="rowheader">
                  {r.label}
                </div>
                {models.map((p, i) => (
                  <div key={p.slug + i} className="cmp__cell" role="cell">
                    {r.render ? r.render(p) : r.text(p)}
                    {r.num && (
                      <span className="cmp__bar" aria-hidden="true">
                        <span
                          className={nums[i] === best && new Set(nums).size > 1 ? 'is-best' : ''}
                          style={{ width: `${(nums[i] / top) * 100}%` }}
                        />
                      </span>
                    )}
                  </div>
                ))}
                {models.length < MAX && <div className="cmp__cell cmp__cell--empty" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
        {onlyDiff && rows.length === 0 && <p className="t-muted cmp__same">Esses modelos têm as mesmas especificações listadas.</p>}
      </div>
    </div>
  );
}
