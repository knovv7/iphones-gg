import { STORE } from '../config/store';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlRound = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/** R$ 11.999,00 — ou R$ 11.999 com `round`. */
export function formatPrice(value: number, round = false): string {
  // Intl insere um espaço não separável entre "R$" e o número; mantemos.
  return (round && Number.isInteger(value) ? brlRound : brl).format(value);
}

export function formatStorage(gb: number): string {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}

/** Notação oficial: 5,64 mm · 146,7 mm · 150,0 mm. */
export function formatMm(value: number): string {
  const digits = Math.round(value * 100) % 10 === 0 ? 1 : 2;
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} mm`;
}

/** Arredonda para centavos, evitando erros de ponto flutuante. */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface Installment {
  count: number;
  value: number;
  interestFree: boolean;
}

/** Parcela máxima configurada para um valor. `null` quando o parcelamento está desativado. */
export function installmentFor(total: number): Installment | null {
  const { maxInstallments, interestFree } = STORE.pricing;
  if (!maxInstallments || maxInstallments < 2 || total <= 0) return null;
  // Sem juros: parcelas iguais, arredondadas para baixo nos centavos (o resíduo vai na primeira).
  return { count: maxInstallments, value: Math.floor((total / maxInstallments) * 100) / 100, interestFree };
}

export function formatInstallment(total: number): string | null {
  const inst = installmentFor(total);
  if (!inst) return null;
  return `${inst.count}x de ${formatPrice(inst.value)}${inst.interestFree ? ' sem juros' : ''}`;
}

/** Preço à vista no Pix, com o desconto configurado. `null` quando não há desconto. */
export function pixPrice(total: number): number | null {
  const d = STORE.pricing.pixDiscount;
  if (!d) return null;
  return toCents(total * (1 - d));
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
