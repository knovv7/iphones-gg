import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getStock } from '../data/inventory';
import { FAMILY_LABEL } from '../data/products';
import type { Product } from '../data/types';
import { isPurchasable, startingPrice } from '../lib/catalog';
import { formatInstallment, formatPrice, formatStorage } from '../lib/format';
import { isNew } from '../lib/product';
import { useStore } from '../state/StoreProvider';
import { ProductImage } from './ProductImage';
import { Pill } from './ui';
import './ProductCard.css';

interface Props {
  product: Product;
  /** Capacidades filtradas no catálogo: o preço "a partir de" e a compra rápida as respeitam. */
  storageScope?: number[];
  initialFinish?: string;
}

export function ProductCard({ product: p, storageScope = [], initialFinish }: Props) {
  const { add } = useStore();
  const [finishId, setFinishId] = useState(initialFinish ?? p.finishes[0].id);
  const finish = p.finishes.find((f) => f.id === finishId) ?? p.finishes[0];
  const price = startingPrice(p, storageScope);
  const installment = price !== null ? formatInstallment(price) : null;
  const gbs = p.storage.map((s) => s.gb);
  const range = gbs.length > 1 ? `${formatStorage(gbs[0])} a ${formatStorage(gbs[gbs.length - 1])}` : formatStorage(gbs[0]);

  // Compra rápida: menor capacidade (dentro do filtro) com estoque na cor escolhida.
  const scope = storageScope.length ? p.storage.filter((s) => storageScope.includes(s.gb)) : p.storage;
  const quick = [...scope].sort((a, b) => a.price - b.price).find((s) => getStock(p.slug, finish.id, s.gb) > 0);
  const href = `/iphone/${p.slug}?cor=${finish.id}`;

  return (
    <article className="pcard">
      <Link to={href} className="pcard__link" aria-label={`${p.name}, ver detalhes`}>
        <div className="pcard__tags" aria-hidden="true">
          <Pill>Geração {p.generation}</Pill>
          <Pill tone="muted">{FAMILY_LABEL[p.family]}</Pill>
          {isNew(p) && <Pill tone="red">Novo</Pill>}
        </div>
        <div className="pcard__media">
          <ProductImage key={finish.id} product={p} finish={finish} className="pcard__device" decorative />
        </div>
      </Link>

      <div className="pcard__body">
        <h3 className="pcard__name">
          <Link to={href}>{p.name}</Link>
        </h3>
        <p className="t-caption t-muted pcard__tagline">{p.tagline}</p>

        <div className="pcard__variants">
          <div className="swatches" role="radiogroup" aria-label={`Cores do ${p.name}`}>
            {p.finishes.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={f.id === finish.id}
                aria-label={f.name}
                title={f.name}
                className="swatch"
                style={{ '--sw': f.hex } as CSSProperties}
                onClick={() => setFinishId(f.id)}
                onMouseEnter={() => setFinishId(f.id)}
              />
            ))}
          </div>
          <p className="t-caption t-muted">
            <span className="pcard__finish">{finish.name}</span> · {range}
          </p>
        </div>

        <div className="pcard__price">
          {price !== null ? (
            <>
              <p className="tnum">
                <span className="t-caption t-muted">A partir de </span>
                {formatPrice(price)}
              </p>
              {installment && <p className="t-caption t-muted tnum">ou {installment}</p>}
            </>
          ) : (
            <p className="t-muted">Em breve</p>
          )}
        </div>

        <div className="pcard__actions">
          <Link to={href} className="btn btn--ghost btn--sm">
            Ver detalhes
          </Link>
          {isPurchasable(p) && (
            <button
              type="button"
              className="btn btn--ghost btn--sm pcard__add"
              disabled={!quick}
              onClick={() => quick && add(p.slug, finish.id, quick.gb)}
              aria-label={
                quick
                  ? `Adicionar ${p.name} ${finish.name} ${formatStorage(quick.gb)} à sacola`
                  : `${p.name} ${finish.name} esgotado`
              }
            >
              {quick ? `Adicionar ${formatStorage(quick.gb)}` : 'Esgotado nesta cor'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
