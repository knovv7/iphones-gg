import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { STORE } from '../config/store';
import { useDialog } from '../hooks/useDialog';
import { formatInstallment, formatPercent, formatPrice, formatStorage, pixPrice } from '../lib/format';
import type { CartLine } from '../state/cart';
import { useStore } from '../state/StoreProvider';
import { Device } from './Device';
import { DemoNote, Marquee } from './ui';
import './CartDrawer.css';

export function QtyStepper({
  line,
  onChange,
  compact,
}: {
  line: Pick<CartLine, 'qty' | 'maxQty' | 'key'>;
  onChange: (qty: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`qty${compact ? ' qty--compact' : ''}`} role="group" aria-label="Quantidade">
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(line.qty - 1)}
        aria-label={line.qty === 1 ? 'Remover item' : 'Diminuir quantidade'}
      >
        −
      </button>
      <output className="qty__value tnum" aria-live="polite">
        {line.qty}
      </output>
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(line.qty + 1)}
        disabled={line.qty >= line.maxQty}
        aria-label="Aumentar quantidade"
        title={line.qty >= line.maxQty ? `Limite de ${line.maxQty} por pedido ou estoque disponível` : undefined}
      >
        +
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, lines, subtotal, count, setQty, remove, lastAdded } = useStore();
  const panelRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  useDialog(cartOpen, closeCart, panelRef);

  const pix = pixPrice(subtotal);
  const installment = formatInstallment(subtotal);

  return (
    <div className={`drawer${cartOpen ? ' is-open' : ''}`} aria-hidden={!cartOpen}>
      <button type="button" className="drawer__scrim" tabIndex={-1} aria-label="Fechar sacola" onClick={closeCart} />
      <aside
        ref={panelRef}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        hidden={!cartOpen}
      >
        <header className="drawer__head">
          <h2 id="cart-title" className="t-h">
            Sacola <span className="t-faint tnum">{count}</span>
          </h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={closeCart} data-autofocus>
            Fechar
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="drawer__empty">
            <Marquee text="Sacola vazia · " className="drawer__marquee" />
            <p className="t-muted">Escolha um modelo, uma cor e uma capacidade para começar.</p>
            <Link to="/loja" className="btn btn--ghost" onClick={closeCart}>
              Ver iPhones
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__lines">
              {lines.map((l) => (
                <li key={l.key} className={`line${l.key === lastAdded ? ' is-new' : ''}`}>
                  <Link to={`/iphone/${l.slug}?cor=${l.finishId}&gb=${l.gb}`} className="line__media" onClick={closeCart}>
                    <Device product={l.product} finish={l.finish} decorative />
                  </Link>
                  <div className="line__info">
                    <Link to={`/iphone/${l.slug}?cor=${l.finishId}&gb=${l.gb}`} className="line__name" onClick={closeCart}>
                      {l.product.name}
                    </Link>
                    <p className="t-caption t-muted">
                      {l.finish.name} · {formatStorage(l.gb)}
                    </p>
                    <p className="t-caption t-faint tnum">{formatPrice(l.unitPrice)} cada</p>
                    <div className="line__row">
                      <QtyStepper line={l} compact onChange={(q) => setQty(l.key, q)} />
                      <button type="button" className="link t-caption t-muted" onClick={() => remove(l.key)}>
                        Remover
                      </button>
                    </div>
                  </div>
                  <p className="line__total tnum">{formatPrice(l.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <dl className="drawer__sum">
                <div>
                  <dt>Subtotal</dt>
                  <dd className="tnum">{formatPrice(subtotal)}</dd>
                </div>
                {installment && (
                  <div className="t-caption t-muted">
                    <dt className="sr-only">Parcelado</dt>
                    <dd>ou {installment}</dd>
                  </div>
                )}
                {pix !== null && (
                  <div className="t-caption t-muted">
                    <dt className="sr-only">À vista no Pix</dt>
                    <dd>
                      {formatPrice(pix)} à vista no Pix ({formatPercent(STORE.pricing.pixDiscount)} de desconto)
                    </dd>
                  </div>
                )}
              </dl>
              <p className="t-caption t-faint">Frete e prazo calculados no checkout, pelo CEP.</p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => {
                  closeCart();
                  navigate('/checkout');
                }}
              >
                Finalizar compra
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={closeCart}>
                Continuar comprando
              </button>
              <DemoNote />
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
