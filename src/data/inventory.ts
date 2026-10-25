/*
 * Estoque DEMONSTRATIVO.
 *
 * Substitua `getStock` por uma consulta ao sistema de estoque da loja. A interface só
 * depende do número retornado: 0 = esgotado, 1–3 = últimas unidades, >3 = disponível.
 */

const DEFAULT_STOCK = 12;

/** Exceções por variante: `slug:acabamento:gb`. */
const OVERRIDES: Record<string, number> = {
  'iphone-18-pro-max:bordo:2048': 2,
  'iphone-18-pro:glacial:2048': 0,
  'iphone-18-pro:bordo:1024': 3,
  'iphone-17-pro-max:azul-intenso:2048': 0,
  'iphone-17-pro-max:prateado:2048': 0,
  'iphone-17-pro:laranja-cosmico:256': 2,
};

export function variantKey(slug: string, finishId: string, gb: number): string {
  return `${slug}:${finishId}:${gb}`;
}

export function getStock(slug: string, finishId: string, gb: number): number {
  return OVERRIDES[variantKey(slug, finishId, gb)] ?? DEFAULT_STOCK;
}

export type Availability = 'in-stock' | 'low' | 'out';

export function availabilityOf(stock: number): Availability {
  if (stock <= 0) return 'out';
  if (stock <= 3) return 'low';
  return 'in-stock';
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'in-stock': 'Em estoque',
  low: 'Últimas unidades',
  out: 'Esgotado',
};
