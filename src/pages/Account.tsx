import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Marquee } from '../components/ui';
import { getProduct } from '../data/products';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { readJSON, removeKey } from '../lib/storage';
import { useStore } from '../state/StoreProvider';
import { ADDRESS_KEY, type SavedAddress } from './Checkout';
import './Account.css';

export function Account() {
  useDocumentTitle('Conta');
  const { favorites, toggleFavorite } = useStore();
  const [address, setAddress] = useState<SavedAddress | null>(() => readJSON<SavedAddress | null>(ADDRESS_KEY, null));
  const favProducts = favorites.map(getProduct).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="acc">
      <header className="acc__head wrap">
        <h1 className="t-display">Conta</h1>
        <p className="t-sub t-muted">Favoritos, endereço e pedidos guardados neste navegador.</p>
      </header>

      <section className="acc__block wrap" aria-labelledby="acc-login">
        <h2 id="acc-login" className="t-h">
          Entrar
        </h2>
        <div className="acc__login">
          <p className="t-muted">
            O acesso com e-mail e senha depende de um serviço de autenticação, que ainda não está configurado nesta
            loja. Até lá, seus favoritos, sua sacola e o endereço do checkout ficam salvos só neste navegador.
          </p>
          <button type="button" className="btn btn--ghost" disabled>
            Entrar (indisponível)
          </button>
        </div>
      </section>

      <section className="acc__block wrap" aria-labelledby="acc-fav">
        <h2 id="acc-fav" className="t-h">
          Favoritos <span className="t-faint tnum">{favProducts.length}</span>
        </h2>
        {favProducts.length ? (
          <ul className="acc__favs">
            {favProducts.map((p, i) => (
              <li key={p.slug} className="reveal" style={{ '--i': i } as CSSProperties}>
                <ProductCard product={p} />
                <button type="button" className="link t-caption t-muted acc__unfav" onClick={() => toggleFavorite(p.slug)}>
                  Remover dos favoritos
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="acc__empty">
            <Marquee text="Nenhum favorito · " />
            <p className="t-muted">Use “Salvar nos favoritos” na página de um modelo para guardá-lo aqui.</p>
            <Link to="/loja" className="btn btn--ghost">
              Ver iPhones
            </Link>
          </div>
        )}
      </section>

      <section className="acc__block wrap" aria-labelledby="acc-addr">
        <h2 id="acc-addr" className="t-h">
          Endereço salvo
        </h2>
        {address ? (
          <div className="acc__addr">
            <address>
              {address.name}
              <br />
              {address.street}, {address.number}
              {address.complement && ` — ${address.complement}`}
              <br />
              {address.district}, {address.city} — {address.state}
              <br />
              CEP {address.cep}
            </address>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                removeKey(ADDRESS_KEY);
                setAddress(null);
              }}
            >
              Apagar endereço
            </button>
          </div>
        ) : (
          <p className="t-muted">Nenhum endereço salvo. Ele aparece aqui quando você marca “Salvar” no checkout.</p>
        )}
      </section>

      <section className="acc__block wrap" aria-labelledby="acc-orders">
        <h2 id="acc-orders" className="t-h">
          Pedidos
        </h2>
        <p className="t-muted">Nenhum pedido. Os pedidos aparecem aqui depois que o pagamento estiver integrado.</p>
      </section>
    </div>
  );
}
