import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import { cartReducer, countOf, itemKey, resolveLines, sanitizeItems, subtotalOf, type CartLine } from './cart';

const CART_KEY = 'monolito.cart.v1';
const FAVORITES_KEY = 'monolito.favorites.v1';

interface StoreContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (slug: string, finishId: string, gb: number, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;

  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Chave do último item adicionado, para destacá-lo na sacola. */
  lastAdded: string | null;

  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  favorites: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, () => sanitizeItems(readJSON(CART_KEY, [])));
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const raw = readJSON<unknown>(FAVORITES_KEY, []);
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
  });

  useEffect(() => writeJSON(CART_KEY, items), [items]);
  useEffect(() => writeJSON(FAVORITES_KEY, favorites), [favorites]);

  // Mantém sacolas abertas em outras abas sincronizadas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) dispatch({ type: 'replace', items: sanitizeItems(readJSON(CART_KEY, [])) });
      if (e.key === FAVORITES_KEY) setFavorites(readJSON<string[]>(FAVORITES_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const lines = useMemo(() => resolveLines(items), [items]);

  const add = useCallback((slug: string, finishId: string, gb: number, qty = 1) => {
    dispatch({ type: 'add', slug, finishId, gb, qty });
    setLastAdded(itemKey({ slug, finishId, gb }));
    setSearchOpen(false);
    setCartOpen(true);
  }, []);

  const value: StoreContextValue = {
    lines,
    count: countOf(items),
    subtotal: subtotalOf(lines),
    add,
    setQty: useCallback((key, qty) => dispatch({ type: 'setQty', key, qty }), []),
    remove: useCallback((key) => dispatch({ type: 'remove', key }), []),
    clear: useCallback(() => dispatch({ type: 'clear' }), []),

    cartOpen,
    openCart: useCallback(() => {
      setSearchOpen(false);
      setCartOpen(true);
    }, []),
    closeCart: useCallback(() => {
      setCartOpen(false);
      setLastAdded(null);
    }, []),
    lastAdded,

    searchOpen,
    openSearch: useCallback(() => {
      setCartOpen(false);
      setSearchOpen(true);
    }, []),
    closeSearch: useCallback(() => setSearchOpen(false), []),

    favorites,
    isFavorite: useCallback((slug) => favorites.includes(slug), [favorites]),
    toggleFavorite: useCallback(
      (slug) => setFavorites((f) => (f.includes(slug) ? f.filter((s) => s !== slug) : [...f, slug])),
      [],
    ),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
