import type { CSSProperties } from 'react';
import type { Finish, Product } from '../data/types';
import { Device } from './Device';

/**
 * Imagem de vitrine onde aparecem os preços (cards do catálogo e linha em escala): a foto de
 * frente e verso quando o acabamento tem uma em `product.showcase`, senão o render da traseira.
 */
export function showcaseFor(product: Pick<Product, 'showcase'>, finishId: string): string | undefined {
  return product.showcase?.[finishId];
}

/**
 * Nas fotos de vitrine o aparelho da frente ocupa ~1/1,2 da altura da imagem (o de trás fica
 * mais alto). Multiplicar a altura do aparelho por isto mantém a escala real do aparelho da frente.
 */
export const SHOWCASE_HEIGHT_RATIO = 1.2;

interface Props {
  product: Pick<Product, 'name' | 'design' | 'dimensions' | 'frontCutout' | 'photos' | 'showcase'>;
  finish: Finish;
  className?: string;
  /** Estilo do render; a foto usa `photoStyle` quando informado. */
  style?: CSSProperties;
  photoStyle?: CSSProperties;
  decorative?: boolean;
}

export function ProductImage({ product, finish, className, style, photoStyle, decorative }: Props) {
  const src = showcaseFor(product, finish.id);
  if (!src) return <Device product={product} finish={finish} className={className} style={style} decorative={decorative} />;
  return (
    <img
      className={`${className ?? ''} is-photo`}
      style={photoStyle ?? style}
      src={`${src}.webp`}
      width={852}
      height={1428}
      alt={decorative ? '' : `${product.name} em ${finish.name}, frente e verso`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
