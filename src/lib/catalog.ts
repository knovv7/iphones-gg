import { getStock } from '../data/inventory';
import { FAMILY_LABEL } from '../data/products';
import type { Family, Product } from '../data/types';
import { formatStorage } from './format';

export type SortKey = 'relevancia' | 'menor-preco' | 'maior-preco' | 'recentes';

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'relevancia', label: 'Destaques' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'recentes', label: 'Mais recentes' },
];

export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: 'ate-8000', label: 'Até R$ 8.000', min: 0, max: 8000 },
  { id: '8000-12000', label: 'R$ 8.000 a 12.000', min: 8000, max: 12000 },
  { id: '12000-16000', label: 'R$ 12.000 a 16.000', min: 12000, max: 16000 },
  { id: 'acima-16000', label: 'Acima de R$ 16.000', min: 16000, max: Infinity },
];

export interface CatalogFilters {
  q: string;
  families: Family[];
  generations: number[];
  storage: number[];
  price: string | null;
  inStock: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: '',
  families: [],
  generations: [],
  storage: [],
  price: null,
  inStock: false,
  sort: 'relevancia',
};

/* ---------- facetas derivadas do catálogo (novas gerações aparecem sozinhas) ---------- */

export function facetGenerations(products: Product[]): number[] {
  return [...new Set(products.map((p) => p.generation))].sort((a, b) => b - a);
}

export function facetFamilies(products: Product[]): Family[] {
  const order: Family[] = ['pro', 'air', 'standard', 'e'];
  const present = new Set(products.map((p) => p.family));
  return order.filter((f) => present.has(f));
}

/** Só as faixas de preço em que algum modelo do catálogo tem uma capacidade. */
export function facetPriceRanges(products: Product[]): PriceRange[] {
  return PRICE_RANGES.filter((r) =>
    products.some((p) => p.status !== 'upcoming' && p.storage.some((s) => s.price >= r.min && s.price < r.max)),
  );
}

export function facetStorage(products: Product[]): number[] {
  return [...new Set(products.flatMap((p) => p.storage.map((s) => s.gb)))].sort((a, b) => a - b);
}

/* ---------- preço e estoque ---------- */

/** Opções de armazenamento consideradas, respeitando o filtro de capacidade. */
function storageScope(p: Product, storage: number[]) {
  return storage.length ? p.storage.filter((s) => storage.includes(s.gb)) : p.storage;
}

/** Menor preço do modelo (dentro das capacidades filtradas). `null` se não houver preço. */
export function startingPrice(p: Product, storage: number[] = []): number | null {
  if (p.status === 'upcoming') return null;
  const scope = storageScope(p, storage);
  if (!scope.length) return null;
  return Math.min(...scope.map((s) => s.price));
}

export function priceFor(p: Product, gb: number): number | null {
  return p.storage.find((s) => s.gb === gb)?.price ?? null;
}

export function modelHasStock(p: Product, storage: number[] = []): boolean {
  if (p.status === 'upcoming' || p.status === 'unavailable') return false;
  return storageScope(p, storage).some((s) => p.finishes.some((f) => getStock(p.slug, f.id, s.gb) > 0));
}

export function isPurchasable(p: Product): boolean {
  return p.status === 'available' || p.status === 'preorder';
}

/* ---------- busca ---------- */

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function haystack(p: Product): string {
  const storage = p.storage.flatMap((s) => {
    const label = formatStorage(s.gb);
    return [label, label.replace(' ', '')];
  });
  return normalize(
    [
      p.name,
      `iphone ${p.generation}`,
      FAMILY_LABEL[p.family],
      p.tagline,
      p.keySpecs.chip,
      p.keySpecs.material,
      ...p.highlights,
      ...p.finishes.map((f) => f.name),
      ...storage,
    ].join(' | '),
  );
}

export function matchesQuery(p: Product, q: string): boolean {
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const h = haystack(p);
  return tokens.every((t) => h.includes(t));
}

/** Acabamento citado na busca (ex.: "18 pro bordô" → bordô), para pré-selecionar a cor. */
export function finishFromQuery(p: Product, q: string): string | undefined {
  const nq = normalize(q);
  if (!nq) return undefined;
  return p.finishes.find((f) => normalize(f.name).split(/[\s-]+/).some((w) => w.length > 2 && nq.includes(w)))?.id;
}

/* ---------- filtro e ordenação ---------- */

export function filterProducts(products: Product[], f: CatalogFilters): Product[] {
  const range = PRICE_RANGES.find((r) => r.id === f.price);
  return products.filter((p) => {
    if (f.families.length && !f.families.includes(p.family)) return false;
    if (f.generations.length && !f.generations.includes(p.generation)) return false;
    if (f.storage.length && !p.storage.some((s) => f.storage.includes(s.gb))) return false;
    if (range) {
      // O modelo entra se alguma capacidade (dentro do filtro de armazenamento) cabe na faixa.
      const fits = storageScope(p, f.storage).some((s) => s.price >= range.min && s.price < range.max);
      if (!fits) return false;
    }
    if (f.inStock && !modelHasStock(p, f.storage)) return false;
    if (!matchesQuery(p, f.q)) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey, storage: number[] = []): Product[] {
  const list = [...products];
  const price = (p: Product) => startingPrice(p, storage) ?? Infinity;
  switch (sort) {
    case 'menor-preco':
      return list.sort((a, b) => price(a) - price(b));
    case 'maior-preco':
      return list.sort((a, b) => price(b) - price(a));
    case 'recentes':
      return list.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || price(a) - price(b));
    default:
      return list; // ordem curada de PRODUCTS
  }
}

/* ---------- filtros <-> URL ---------- */

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const sort = params.get('ordem') as SortKey | null;
  return {
    q: params.get('q') ?? '',
    families: list('linha') as Family[],
    generations: list('geracao').map(Number).filter(Number.isFinite),
    storage: list('gb').map(Number).filter(Number.isFinite),
    price: params.get('preco'),
    inStock: params.get('estoque') === '1',
    sort: sort && SORT_OPTIONS.some((o) => o.id === sort) ? sort : 'relevancia',
  };
}

export function paramsFromFilters(f: CatalogFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.families.length) p.set('linha', f.families.join(','));
  if (f.generations.length) p.set('geracao', f.generations.join(','));
  if (f.storage.length) p.set('gb', f.storage.join(','));
  if (f.price) p.set('preco', f.price);
  if (f.inStock) p.set('estoque', '1');
  if (f.sort !== 'relevancia') p.set('ordem', f.sort);
  return p;
}

export function activeFilterCount(f: CatalogFilters): number {
  return (
    f.families.length + f.generations.length + f.storage.length + (f.price ? 1 : 0) + (f.inStock ? 1 : 0) + (f.q ? 1 : 0)
  );
}
