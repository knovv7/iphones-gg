import type { ReactNode } from 'react';
import { STORE } from '../config/store';
import { AVAILABILITY_LABEL, availabilityOf } from '../data/inventory';

/** Texto que rola para cima no hover (assinatura herdada das etiquetas do Minimal Collective). */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone?: 'red' | 'muted' }) {
  return <span className={`pill${tone ? ` pill--${tone}` : ''}`}>{children}</span>;
}

export function StockLabel({ stock }: { stock: number }) {
  const a = availabilityOf(stock);
  return <span className={`stock stock--${a}`}>{AVAILABILITY_LABEL[a]}</span>;
}

/** Linha que se repete em loop — usada em estados vazios, como os "TBA" da referência. */
export function Marquee({ text, className }: { text: string; className?: string }) {
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} aria-hidden={i > 0 ? true : undefined}>
      {text}
    </span>
  ));
  return (
    <div className={`marquee ${className ?? ''}`}>
      <div className="marquee__track">
        {items}
        {items.map((el, i) => (
          <span key={`b${i}`} aria-hidden="true">
            {el.props.children}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DemoNote({ children }: { children?: ReactNode }) {
  if (!STORE.demoMode) return null;
  return <p className="demo-note">{children ?? STORE.pricing.sourceNote}</p>;
}
