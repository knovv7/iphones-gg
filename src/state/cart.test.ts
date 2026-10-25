import { describe, expect, it } from 'vitest';
import { STORE } from '../config/store';
import { cartReducer, countOf, itemKey, resolveLines, sanitizeItems, subtotalOf, type CartItem } from './cart';

const add = (items: CartItem[], slug: string, finishId: string, gb: number, qty = 1) =>
  cartReducer(items, { type: 'add', slug, finishId, gb, qty });

describe('sacola', () => {
  it('adiciona a variante escolhida e calcula o subtotal pelo catálogo', () => {
    let items = add([], 'iphone-18-pro', 'bordo', 512);
    items = add(items, 'iphone-17-pro', 'azul-intenso', 512, 2);
    const lines = resolveLines(items);
    expect(lines.map((l) => [l.product.name, l.finish.name, l.gb, l.qty])).toEqual([
      ['iPhone 18 Pro', 'Bordô', 512, 1],
      ['iPhone 17 Pro', 'Azul-intenso', 512, 2],
    ]);
    expect(subtotalOf(lines)).toBe(13499 + 12999 * 2);
    expect(countOf(items)).toBe(3);
  });

  it('soma a quantidade ao adicionar a mesma variante e respeita o limite por pedido', () => {
    let items = add([], 'iphone-17-pro-max', 'prateado', 256);
    items = add(items, 'iphone-17-pro-max', 'prateado', 256, 10);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(STORE.maxQuantityPerItem);
  });

  it('limita a quantidade ao estoque da variante', () => {
    // Estoque demonstrativo: 2 unidades.
    const items = add([], 'iphone-17-pro', 'laranja-cosmico', 256, 3);
    expect(items[0].qty).toBe(2);
  });

  it('não adiciona variantes esgotadas, inexistentes ou de modelos fora do catálogo', () => {
    expect(add([], 'iphone-18-pro', 'glacial', 2048)).toEqual([]);
    expect(add([], 'iphone-18-pro', 'laranja-cosmico', 256)).toEqual([]);
    expect(add([], 'iphone-18-pro', 'bordo', 64)).toEqual([]);
    expect(add([], 'iphone-99', 'bordo', 256)).toEqual([]);
    expect(add([], 'iphone-air', 'azul-ceu', 256)).toEqual([]);
  });

  it('altera e remove itens', () => {
    let items = add([], 'iphone-18-pro-max', 'preto', 256);
    const key = itemKey(items[0]);
    items = cartReducer(items, { type: 'setQty', key, qty: 2 });
    expect(items[0].qty).toBe(2);
    expect(subtotalOf(resolveLines(items))).toBe(25998);
    items = cartReducer(items, { type: 'setQty', key, qty: 0 });
    expect(items).toEqual([]);
    items = add(items, 'iphone-18-pro-max', 'preto', 256);
    items = cartReducer(items, { type: 'remove', key });
    expect(items).toEqual([]);
  });

  it('descarta dados inválidos vindos do armazenamento local', () => {
    const items = sanitizeItems([
      { slug: 'iphone-17-pro', finishId: 'prateado', gb: 1024, qty: 1 },
      { slug: 'iphone-17-pro', finishId: 'prateado', gb: 2048, qty: 1 },
      { slug: 'iphone-17e', finishId: 'preto', gb: 256, qty: 1 }, // modelo que saiu do catálogo
      { slug: 'x' },
      null,
      'lixo',
    ]);
    expect(items).toEqual([{ slug: 'iphone-17-pro', finishId: 'prateado', gb: 1024, qty: 1 }]);
    expect(sanitizeItems('não é lista')).toEqual([]);
  });
});
