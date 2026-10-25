import type { Product } from '../data/types';

const NEW_WINDOW_DAYS = 90;

/** Lançado nos últimos 90 dias. */
export function isNew(p: Product, today = new Date()): boolean {
  const release = new Date(p.releaseDate + 'T00:00:00');
  const days = (today.getTime() - release.getTime()) / 86_400_000;
  return days >= 0 && days <= NEW_WINDOW_DAYS;
}

/** Produtos relacionados: mesma linha primeiro, depois a geração vizinha. */
export function relatedTo(p: Product, all: Product[], limit = 3): Product[] {
  const score = (o: Product) =>
    (o.family === p.family ? 0 : 2) + Math.abs(o.generation - p.generation) + (o.status === 'available' ? 0 : 3);
  return all
    .filter((o) => o.slug !== p.slug)
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}
