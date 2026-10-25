import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { QtyStepper } from '../components/CartDrawer';
import { Device, viewLabel, viewsFor, type DeviceView } from '../components/Device';
import { ProductCard } from '../components/ProductCard';
import { DemoNote, Pill, StockLabel } from '../components/ui';
import { STORE } from '../config/store';
import { getStock } from '../data/inventory';
import { FAMILY_LABEL, getProduct, PRODUCTS } from '../data/products';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isPurchasable, priceFor } from '../lib/catalog';
import { formatInstallment, formatPercent, formatPrice, formatStorage, pixPrice } from '../lib/format';
import { isNew, relatedTo } from '../lib/product';
import { maxQtyFor } from '../state/cart';
import { useStore } from '../state/StoreProvider';
import { NotFound } from './NotFound';
import './ProductPage.css';

export function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProduct(slug);
  if (!product) return <NotFound />;
  return <ProductView key={product.slug} slug={product.slug} />;
}

function ProductView({ slug }: { slug: string }) {
  const p = getProduct(slug)!;
  const [params, setParams] = useSearchParams();
  const { add, isFavorite, toggleFavorite } = useStore();
  useDocumentTitle(p.name);

  const finish = p.finishes.find((f) => f.id === params.get('cor')) ?? p.finishes[0];
  const gbParam = Number(params.get('gb'));
  const storage = p.storage.find((s) => s.gb === gbParam) ?? p.storage[0];

  // A vista é guardada pelo nome: ao trocar de cor, "Câmeras" continua em "Câmeras" mesmo que
  // o conjunto de vistas mude (acabamentos com foto mostram só as vistas fotografadas).
  const views = viewsFor(p, finish.id, true);
  const [chosenView, setChosenView] = useState<DeviceView>('back');
  const view: DeviceView = views.includes(chosenView) ? chosenView : views[0];
  const viewIdx = views.indexOf(view);

  const stock = getStock(p.slug, finish.id, storage.gb);
  const maxQty = maxQtyFor(p.slug, finish.id, storage.gb);
  const [qty, setQty] = useState(1);
  useEffect(() => setQty((q) => Math.max(1, Math.min(q, maxQty || 1))), [maxQty]);

  const price = priceFor(p, storage.gb)!;
  const total = price * qty;
  const pix = pixPrice(total);
  const installment = formatInstallment(total);
  const purchasable = isPurchasable(p) && stock > 0;
  const fav = isFavorite(p.slug);
  const related = useMemo(() => relatedTo(p, PRODUCTS), [p]);

  const select = (patch: { cor?: string; gb?: number }) => {
    const next = new URLSearchParams(params);
    if (patch.cor) next.set('cor', patch.cor);
    if (patch.gb) next.set('gb', String(patch.gb));
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const onGalleryKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setChosenView(views[(viewIdx + 1) % views.length]);
    if (e.key === 'ArrowLeft') setChosenView(views[(viewIdx - 1 + views.length) % views.length]);
  };

  return (
    <article className="pdp">
      <nav className="pdp__crumbs wrap t-caption t-muted" aria-label="Você está em">
        <Link to="/loja" className="link">
          Loja
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/loja?linha=${p.family}`} className="link">
          {FAMILY_LABEL[p.family]}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="pdp__grid wrap">
        {/* ------------------------------------------------ galeria */}
        <section className="gallery" aria-label="Galeria de imagens" onKeyDown={onGalleryKey}>
          <div className="gallery__stage">
            <Device
              key={`${finish.id}-${view}`}
              product={p}
              finish={finish}
              view={view}
              className={`gallery__device gallery__device--${view}`}
              photo
            />
            <p className="gallery__caption t-caption t-muted">
              {finish.name} · {viewLabel(view)}
            </p>
          </div>
          <div className="gallery__thumbs" role="tablist" aria-label="Vistas do aparelho">
            {views.map((v, i) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={i === viewIdx}
                className="gallery__thumb"
                onClick={() => setChosenView(v)}
                tabIndex={i === viewIdx ? 0 : -1}
              >
                <Device product={p} finish={finish} view={v} className="gallery__thumb-device" decorative photo />
                <span className="t-caption">{viewLabel(v, true)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ compra */}
        <section className="buy" aria-labelledby="pdp-title">
          <div className="buy__tags">
            <Pill>Geração {p.generation}</Pill>
            <Pill tone="muted">{FAMILY_LABEL[p.family]}</Pill>
            {isNew(p) && <Pill tone="red">Novo</Pill>}
          </div>
          <h1 id="pdp-title" className="buy__title t-display">
            {p.name}
          </h1>
          <p className="t-sub">{p.tagline}</p>
          <p className="t-muted buy__desc">{p.description}</p>

          <fieldset className="buy__group">
            <legend className="buy__label">
              Cor <span className="buy__value">{finish.name}</span>
            </legend>
            <div className="swatches swatches--lg" role="radiogroup" aria-label="Cor">
              {p.finishes.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={f.id === finish.id}
                  aria-label={f.name}
                  title={f.name}
                  className="swatch swatch--lg"
                  style={{ '--sw': f.hex } as CSSProperties}
                  onClick={() => select({ cor: f.id })}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="buy__group">
            <legend className="buy__label">
              Armazenamento <span className="buy__value">{formatStorage(storage.gb)}</span>
            </legend>
            <div className="storage" role="radiogroup" aria-label="Armazenamento">
              {p.storage.map((s) => {
                const out = getStock(p.slug, finish.id, s.gb) <= 0;
                return (
                  <button
                    key={s.gb}
                    type="button"
                    role="radio"
                    aria-checked={s.gb === storage.gb}
                    className={`storage__opt${out ? ' is-out' : ''}`}
                    onClick={() => select({ gb: s.gb })}
                  >
                    <span className="storage__gb">{formatStorage(s.gb)}</span>
                    <span className="t-caption t-muted tnum">{out ? 'Esgotado' : formatPrice(s.price, true)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="buy__price">
            <p className="buy__amount t-h-lg tnum" aria-live="polite">
              <span key={price * qty} className="buy__amount-num">
                {formatPrice(total)}
              </span>
            </p>
            {installment && <p className="t-muted tnum">ou {installment}</p>}
            {pix !== null && (
              <p className="t-caption t-muted tnum">
                {formatPrice(pix)} à vista no Pix ({formatPercent(STORE.pricing.pixDiscount)} de desconto)
              </p>
            )}
          </div>

          <div className="buy__stock">
            <StockLabel stock={stock} />
            {stock > 0 && STORE.shipping.dispatchBusinessDays !== null && (
              <p className="t-caption t-muted">
                Envio em até {STORE.shipping.dispatchBusinessDays}{' '}
                {STORE.shipping.dispatchBusinessDays === 1 ? 'dia útil' : 'dias úteis'} após a confirmação do pagamento.
                Frete calculado pelo CEP no checkout.
              </p>
            )}
            {stock <= 0 && (
              <p className="t-caption t-muted">Escolha outra cor ou capacidade, ou salve nos favoritos.</p>
            )}
          </div>

          <div className="buy__actions">
            {purchasable && (
              <QtyStepper
                line={{ key: 'pdp', qty, maxQty }}
                onChange={(q) => setQty(Math.max(1, Math.min(maxQty, q)))}
              />
            )}
            <button
              type="button"
              className="btn btn--primary buy__add"
              disabled={!purchasable}
              onClick={() => add(p.slug, finish.id, storage.gb, qty)}
            >
              {purchasable ? 'Adicionar à sacola' : 'Indisponível'}
            </button>
          </div>
          <p className="t-caption t-muted" aria-live="polite">
            {qty > 1 ? `${qty} × ` : ''}
            {p.name}, {finish.name}, {formatStorage(storage.gb)}
          </p>
          <button
            type="button"
            className="btn btn--ghost buy__fav"
            aria-pressed={fav}
            onClick={() => toggleFavorite(p.slug)}
          >
            <span className={`buy__heart${fav ? ' is-on' : ''}`} aria-hidden="true" />
            {fav ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
          </button>
          <DemoNote />
        </section>
      </div>

      {/* ------------------------------------------------ destaques */}
      <section className="pdp-hl section" aria-labelledby="hl-title">
        <div className="pdp-hl__grid wrap">
          <h2 id="hl-title" className="t-display reveal">
            Destaques
          </h2>
          <ul className="pdp-hl__list">
            {p.highlights.map((h, i) => (
              <li key={h} className="t-h reveal" style={{ '--i': i } as CSSProperties}>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="pdp-hl__crop reveal">
          <Device product={p} finish={finish} view="camera" className="pdp-hl__device" decorative photo />
        </div>
      </section>

      {/* ------------------------------------------------ especificações */}
      <section className="specs section" aria-labelledby="specs-title">
        <div className="specs__grid wrap">
          <div className="specs__head">
            <h2 id="specs-title" className="t-display reveal">
              Especificações
            </h2>
            <p className="t-caption t-muted reveal" style={{ '--i': 1 } as CSSProperties}>
              Conferidas na{' '}
              {p.sources.map((s) => (
                <a key={s} href={s} className="link" target="_blank" rel="noreferrer">
                  página técnica oficial
                </a>
              ))}
              .
            </p>
            {related[0] && (
              <Link
                to={`/comparar?modelos=${p.slug},${related[0].slug}`}
                className="btn btn--ghost btn--sm reveal"
                style={{ '--i': 2 } as CSSProperties}
              >
                Comparar com {related[0].name}
              </Link>
            )}
          </div>
          <div className="specs__body">
            {p.specs.map((g) => (
              <div key={g.title} className="specs__group reveal">
                <h3 className="specs__title t-h-sm">{g.title}</h3>
                <dl>
                  {g.rows.map(([k, v]) => (
                    <div key={k} className="specs__row">
                      <dt className="t-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <div className="specs__group reveal">
              <h3 className="specs__title t-h-sm">Cores e capacidades</h3>
              <dl>
                <div className="specs__row">
                  <dt className="t-muted">Cores</dt>
                  <dd>{p.finishes.map((f) => f.name).join(', ')}</dd>
                </div>
                <div className="specs__row">
                  <dt className="t-muted">Capacidades</dt>
                  <dd>{p.storage.map((s) => formatStorage(s.gb)).join(', ')}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ relacionados */}
      <section className="section" aria-labelledby="related-title">
        <div className="wrap">
          <h2 id="related-title" className="t-display reveal related__title">
            Veja também
          </h2>
          <ul className="related__grid">
            {related.map((r, i) => (
              <li key={r.slug} className="reveal" style={{ '--i': i } as CSSProperties}>
                <ProductCard product={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
