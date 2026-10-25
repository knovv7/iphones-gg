import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/products';
import {
  EMPTY_FILTERS,
  facetPriceRanges,
  filterProducts,
  filtersFromParams,
  finishFromQuery,
  paramsFromFilters,
  sortProducts,
  startingPrice,
  type CatalogFilters,
} from './catalog';
import { formatInstallment, formatStorage, installmentFor, pixPrice } from './format';

const run = (patch: Partial<CatalogFilters>) =>
  sortProducts(filterProducts(PRODUCTS, { ...EMPTY_FILTERS, ...patch }), patch.sort ?? 'relevancia', patch.storage).map(
    (p) => p.slug,
  );

describe('catálogo', () => {
  it('filtra por linha e geração', () => {
    expect(run({ families: ['pro'], generations: [18] })).toEqual(['iphone-18-pro', 'iphone-18-pro-max']);
    expect(run({ generations: [17] })).toEqual(['iphone-17-pro', 'iphone-17-pro-max']);
  });

  it('filtra por armazenamento', () => {
    expect(run({ storage: [2048] }).sort()).toEqual(['iphone-17-pro-max', 'iphone-18-pro', 'iphone-18-pro-max']);
  });

  it('filtra por faixa de preço considerando a capacidade filtrada', () => {
    expect(run({ price: '8000-12000' }).sort()).toEqual(['iphone-17-pro', 'iphone-18-pro']);
    // Com 1 TB, só os 18 passam de R$ 16.000 (17 Pro: R$ 14.499; 17 Pro Max: R$ 15.499).
    expect(run({ price: 'acima-16000', storage: [1024] }).sort()).toEqual(['iphone-18-pro', 'iphone-18-pro-max']);
  });

  it('oferece só as faixas de preço com algum modelo', () => {
    expect(facetPriceRanges(PRODUCTS).map((r) => r.id)).toEqual(['8000-12000', '12000-16000', 'acima-16000']);
  });

  it('ordena por preço', () => {
    const asc = run({ sort: 'menor-preco' });
    const prices = asc.map((s) => startingPrice(PRODUCTS.find((p) => p.slug === s)!)!);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(asc[0]).toBe('iphone-17-pro');
    expect(run({ sort: 'maior-preco' })[0]).toBe('iphone-18-pro-max');
  });

  it('busca por nome, cor e capacidade, sem depender de acentos', () => {
    expect(run({ q: 'pro max' }).sort()).toEqual(['iphone-17-pro-max', 'iphone-18-pro-max']);
    expect(run({ q: 'bordo' }).sort()).toEqual(['iphone-18-pro', 'iphone-18-pro-max']);
    expect(run({ q: '2tb' }).sort()).toEqual(['iphone-17-pro-max', 'iphone-18-pro', 'iphone-18-pro-max']);
    expect(run({ q: 'laranja' }).sort()).toEqual(['iphone-17-pro', 'iphone-17-pro-max']);
    expect(run({ q: 'galaxy' })).toEqual([]);
  });

  it('pré-seleciona a cor citada na busca', () => {
    const p = PRODUCTS.find((x) => x.slug === 'iphone-17-pro')!;
    expect(finishFromQuery(p, '17 pro laranja')).toBe('laranja-cosmico');
    expect(finishFromQuery(p, '17 pro')).toBeUndefined();
  });

  it('converte filtros para a URL e de volta', () => {
    const f: CatalogFilters = {
      q: 'air',
      families: ['pro'],
      generations: [18],
      storage: [256, 1024],
      price: '8000-12000',
      inStock: true,
      sort: 'menor-preco',
    };
    expect(filtersFromParams(paramsFromFilters(f))).toEqual(f);
    expect(filtersFromParams(new URLSearchParams('ordem=hack&gb=abc'))).toEqual(EMPTY_FILTERS);
  });
});

describe('formatação e pagamento', () => {
  it('parcela sem juros sem ultrapassar o total', () => {
    const inst = installmentFor(11999)!;
    expect(inst.count).toBe(12);
    expect(inst.value * 12).toBeLessThanOrEqual(11999);
    expect(formatInstallment(11999)).toMatch(/^12x de R\$\s999,91 sem juros$/);
  });

  it('aplica o desconto do Pix em centavos', () => {
    expect(pixPrice(11999)).toBe(10799.1);
  });

  it('formata capacidades', () => {
    expect(formatStorage(256)).toBe('256 GB');
    expect(formatStorage(2048)).toBe('2 TB');
  });
});
