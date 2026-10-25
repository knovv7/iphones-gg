import { STORE } from '../config/store';
import { getStock } from '../data/inventory';
import { getProduct } from '../data/products';
import type { Finish, Product } from '../data/types';
import { priceFor } from '../lib/catalog';
import { toCents } from '../lib/format';

/** O que fica salvo: só a identidade da variante e a quantidade. Preço e nome vêm sempre do catálogo. */
export interface CartItem {
  slug: string;
  finishId: string;
  gb: number;
  qty: number;
}

export interface CartLine extends CartItem {
  key: string;
  product: Product;
  finish: Finish;
  unitPrice: number;
  lineTotal: number;
  /** Máximo permitido para este item (estoque e limite por pedido). */
  maxQty: number;
}

export type CartAction =
  | { type: 'add'; slug: string; finishId: string; gb: number; qty?: number }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'clear' };

export const itemKey = (i: Pick<CartItem, 'slug' | 'finishId' | 'gb'>) => `${i.slug}:${i.finishId}:${i.gb}`;

export function maxQtyFor(slug: string, finishId: string, gb: number): number {
  return Math.max(0, Math.min(STORE.maxQuantityPerItem, getStock(slug, finishId, gb)));
}

/** Uma variante só existe se o modelo é vendável e tem o acabamento e a capacidade. */
function isValidVariant(slug: string, finishId: string, gb: number): boolean {
  const p = getProduct(slug);
  if (!p || (p.status !== 'available' && p.status !== 'preorder')) return false;
  return p.finishes.some((f) => f.id === finishId) && priceFor(p, gb) !== null;
}

export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const { slug, finishId, gb } = action;
      if (!isValidVariant(slug, finishId, gb)) return items;
      const max = maxQtyFor(slug, finishId, gb);
      if (max === 0) return items;
      const add = Math.max(1, Math.floor(action.qty ?? 1));
      const key = itemKey(action);
      const existing = items.find((i) => itemKey(i) === key);
      if (existing) {
        return items.map((i) => (itemKey(i) === key ? { ...i, qty: Math.min(max, i.qty + add) } : i));
      }
      return [...items, { slug, finishId, gb, qty: Math.min(max, add) }];
    }
    case 'setQty': {
      return items.flatMap((i) => {
        if (itemKey(i) !== action.key) return [i];
        const qty = Math.min(maxQtyFor(i.slug, i.finishId, i.gb), Math.floor(action.qty));
        return qty > 0 ? [{ ...i, qty }] : [];
      });
    }
    case 'remove':
      return items.filter((i) => itemKey(i) !== action.key);
    case 'replace':
      return action.items;
    case 'clear':
      return [];
  }
}

/** Limpa o que veio do armazenamento local: variantes que saíram do catálogo ou quantidades inválidas. */
export function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  let items: CartItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const { slug, finishId, gb, qty } = r as Record<string, unknown>;
    if (typeof slug !== 'string' || typeof finishId !== 'string' || typeof gb !== 'number' || typeof qty !== 'number') {
      continue;
    }
    items = cartReducer(items, { type: 'add', slug, finishId, gb, qty });
  }
  return items;
}

export function resolveLines(items: CartItem[]): CartLine[] {
  return items.flatMap((i) => {
    const product = getProduct(i.slug);
    const finish = product?.finishes.find((f) => f.id === i.finishId);
    const unitPrice = product ? priceFor(product, i.gb) : null;
    if (!product || !finish || unitPrice === null) return [];
    return [
      {
        ...i,
        key: itemKey(i),
        product,
        finish,
        unitPrice,
        lineTotal: toCents(unitPrice * i.qty),
        maxQty: maxQtyFor(i.slug, i.finishId, i.gb),
      },
    ];
  });
}

export function subtotalOf(lines: CartLine[]): number {
  return toCents(lines.reduce((sum, l) => sum + l.lineTotal, 0));
}

export function countOf(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
