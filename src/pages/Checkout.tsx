import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Device } from '../components/Device';
import { Marquee } from '../components/ui';
import { STORE } from '../config/store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPercent, formatPrice, formatStorage, pixPrice, toCents } from '../lib/format';
import { readJSON, writeJSON } from '../lib/storage';
import { formatCep, lookupCep, onlyDigits } from '../services/cep';
import { placeOrder, type OrderResult } from '../services/checkout';
import { useStore } from '../state/StoreProvider';
import './Checkout.css';

export const ADDRESS_KEY = 'monolito.address.v1';

export interface SavedAddress {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

const EMPTY: SavedAddress = {
  name: '',
  email: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
};

type Field = keyof SavedAddress;
type Errors = Partial<Record<Field, string>>;

function formatPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validate(f: SavedAddress): Errors {
  const e: Errors = {};
  if (f.name.trim().split(/\s+/).length < 2) e.name = 'Informe nome e sobrenome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Informe um e-mail válido.';
  if (onlyDigits(f.phone).length < 10) e.phone = 'Informe o celular com DDD.';
  if (onlyDigits(f.cep).length !== 8) e.cep = 'O CEP tem 8 dígitos.';
  if (!f.street.trim()) e.street = 'Informe a rua.';
  if (!f.number.trim()) e.number = 'Informe o número (ou “s/n”).';
  if (!f.district.trim()) e.district = 'Informe o bairro.';
  if (!f.city.trim()) e.city = 'Informe a cidade.';
  if (!/^[A-Za-z]{2}$/.test(f.state.trim())) e.state = 'UF com 2 letras.';
  return e;
}

export function Checkout() {
  useDocumentTitle('Checkout');
  const { lines, subtotal, count } = useStore();
  const [form, setForm] = useState<SavedAddress>(() => ({ ...EMPTY, ...readJSON<Partial<SavedAddress>>(ADDRESS_KEY, {}) }));
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [installments, setInstallments] = useState<number>(STORE.pricing.maxInstallments || 1);
  const [save, setSave] = useState(true);
  const [cepState, setCepState] = useState<'idle' | 'loading' | 'ok' | 'not-found' | 'error'>('idle');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const set = (field: Field) => (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (field === 'cep') v = formatCep(v);
    if (field === 'phone') v = formatPhone(v);
    if (field === 'state') v = v.toUpperCase().slice(0, 2);
    setForm((f) => ({ ...f, [field]: v }));
    setResult(null);
  };

  // Erros são derivados do formulário e só aparecem nos campos já visitados.
  const errors = validate(form);

  // Busca o endereço quando o CEP fica completo.
  const cepDigits = onlyDigits(form.cep);
  useEffect(() => {
    if (cepDigits.length !== 8) {
      setCepState('idle');
      return;
    }
    const ctrl = new AbortController();
    setCepState('loading');
    lookupCep(cepDigits, ctrl.signal)
      .then((r) => {
        if (r.ok) {
          setCepState('ok');
          setForm((f) => ({
            ...f,
            street: r.address.street || f.street,
            district: r.address.district || f.district,
            city: r.address.city || f.city,
            state: r.address.state || f.state,
          }));
        } else setCepState(r.reason === 'not-found' ? 'not-found' : 'error');
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [cepDigits]);

  const discount = method === 'pix' && pixPrice(subtotal) !== null ? toCents(subtotal - pixPrice(subtotal)!) : 0;
  const total = toCents(subtotal - discount);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = errors;
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (save) writeJSON(ADDRESS_KEY, form);
    setSubmitting(true);
    const res = await placeOrder({
      lines: lines.map(({ slug, finishId, gb, qty, unitPrice }) => ({ slug, finishId, gb, qty, unitPrice })),
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: {
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement,
        district: form.district,
        city: form.city,
        state: form.state,
      },
      payment: { method, installments: method === 'card' ? installments : 1 },
    });
    setSubmitting(false);
    setResult(res);
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  if (!lines.length) {
    return (
      <section className="co-empty wrap">
        <h1 className="t-display">Checkout</h1>
        <Marquee text="Sacola vazia · " />
        <p className="t-muted">Adicione um iPhone à sacola para continuar.</p>
        <Link to="/loja" className="btn btn--primary">
          Ver iPhones
        </Link>
      </section>
    );
  }

  const input = (field: Field, label: string, props: Record<string, unknown> = {}) => {
    const err = touched[field] ? errors[field] : undefined;
    return (
      <div className={`field field--${field}`}>
        <label className="field__label" htmlFor={`co-${field}`}>
          {label}
        </label>
        <input
          id={`co-${field}`}
          name={field}
          className="input"
          value={form[field]}
          onChange={set(field)}
          onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `co-${field}-err` : undefined}
          {...props}
        />
        {err && (
          <p id={`co-${field}-err`} className="field__error">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="co">
      <header className="co__head wrap">
        <h1 className="t-display">Checkout</h1>
        <p className="t-muted">
          {count} {count === 1 ? 'item' : 'itens'} na sacola
        </p>
      </header>

      {STORE.demoMode && (
        <div className="co__notice wrap">
          <p>
            <span className="co__notice-dot" aria-hidden="true" />
            Pagamento ainda não integrado. Você pode revisar o pedido e preencher a entrega, mas nenhuma compra é
            concluída nesta versão.
          </p>
        </div>
      )}

      <div className="co__grid wrap">
        <form ref={formRef} className="co__form" onSubmit={submit} noValidate>
          <fieldset className="co__section">
            <legend className="t-h">Contato</legend>
            {input('name', 'Nome completo', { autoComplete: 'name' })}
            <div className="co__row">
              {input('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
              {input('phone', 'Celular', { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '(11) 91234-5678' })}
            </div>
          </fieldset>

          <fieldset className="co__section">
            <legend className="t-h">Entrega</legend>
            <div className="co__row co__row--cep">
              {input('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '00000-000' })}
              <p className="t-caption t-muted co__cep-status" aria-live="polite">
                {cepState === 'loading' && 'Buscando endereço…'}
                {cepState === 'ok' && 'Endereço encontrado. Confira os dados.'}
                {cepState === 'not-found' && 'CEP não encontrado. Preencha o endereço.'}
                {cepState === 'error' && 'Não foi possível consultar o CEP agora. Preencha o endereço.'}
              </p>
            </div>
            {input('street', 'Rua', { autoComplete: 'address-line1' })}
            <div className="co__row co__row--3">
              {input('number', 'Número', { autoComplete: 'address-line2' })}
              {input('complement', 'Complemento (opcional)')}
              {input('district', 'Bairro')}
            </div>
            <div className="co__row co__row--city">
              {input('city', 'Cidade', { autoComplete: 'address-level2' })}
              {input('state', 'UF', { autoComplete: 'address-level1' })}
            </div>
            <p className="t-caption t-muted">
              Frete e prazo de entrega serão calculados pela transportadora quando o checkout for integrado.
            </p>
          </fieldset>

          <fieldset className="co__section">
            <legend className="t-h">Pagamento</legend>
            <div className="co__methods" role="radiogroup" aria-label="Forma de pagamento">
              <label className={`co__method${method === 'pix' ? ' is-on' : ''}`}>
                <input type="radio" name="method" checked={method === 'pix'} onChange={() => setMethod('pix')} />
                <span>
                  Pix à vista
                  {STORE.pricing.pixDiscount > 0 && (
                    <span className="t-caption t-muted"> · {formatPercent(STORE.pricing.pixDiscount)} de desconto</span>
                  )}
                </span>
              </label>
              <label className={`co__method${method === 'card' ? ' is-on' : ''}`}>
                <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} />
                <span>Cartão de crédito</span>
              </label>
            </div>
            {method === 'card' && STORE.pricing.maxInstallments > 1 && (
              <div className="field">
                <label className="field__label" htmlFor="co-inst">
                  Parcelas
                </label>
                <select
                  id="co-inst"
                  className="select"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {Array.from({ length: STORE.pricing.maxInstallments }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatPrice(Math.floor((subtotal / n) * 100) / 100)}
                      {STORE.pricing.interestFree ? ' sem juros' : ''}
                    </option>
                  ))}
                </select>
                <p className="t-caption t-muted">
                  Os dados do cartão serão pedidos no ambiente seguro do provedor de pagamento, não neste formulário.
                </p>
              </div>
            )}
          </fieldset>

          <label className="co__save t-caption">
            <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
            Salvar contato e endereço neste navegador
          </label>

          <button type="submit" className="btn btn--primary btn--block co__submit" disabled={submitting}>
            {submitting ? 'Enviando…' : `Confirmar pedido · ${formatPrice(total)}`}
          </button>

          {result && (
            <div
              ref={resultRef}
              tabIndex={-1}
              className={`co__result${result.ok ? ' is-ok' : ''}`}
              role={result.ok ? 'status' : 'alert'}
            >
              {result.ok ? (
                <p>Pedido {result.orderId} confirmado.</p>
              ) : (
                <>
                  <p className="t-h-sm">Pedido não enviado.</p>
                  <p className="t-muted">{result.message}</p>
                  <p className="t-caption t-muted">
                    Os itens continuam na sacola{save ? ' e seus dados ficaram salvos apenas neste navegador' : ''}.
                  </p>
                </>
              )}
            </div>
          )}
        </form>

        <aside className="co__summary" aria-labelledby="co-sum-title">
          <h2 id="co-sum-title" className="t-h">
            Resumo
          </h2>
          <ul className="co__lines">
            {lines.map((l) => (
              <li key={l.key} className="co__line">
                <Device product={l.product} finish={l.finish} className="co__thumb" decorative />
                <div>
                  <p>{l.product.name}</p>
                  <p className="t-caption t-muted">
                    {l.finish.name} · {formatStorage(l.gb)} · {l.qty}×
                  </p>
                </div>
                <p className="tnum">{formatPrice(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="co__totals">
            <div>
              <dt>Subtotal</dt>
              <dd className="tnum">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div>
                <dt>Desconto Pix</dt>
                <dd className="tnum co__discount">− {formatPrice(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Frete</dt>
              <dd className="t-muted">A calcular</dd>
            </div>
            <div className="co__total">
              <dt>Total</dt>
              <dd className="tnum">{formatPrice(total)}</dd>
            </div>
          </dl>
          {method === 'card' && installments > 1 && (
            <p className="t-caption t-muted tnum">
              {installments}x de {formatPrice(Math.floor((total / installments) * 100) / 100)}
              {STORE.pricing.interestFree ? ' sem juros' : ''}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
