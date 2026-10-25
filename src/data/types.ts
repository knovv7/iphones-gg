/** Desenho da traseira usado pelo renderizador de aparelhos (ver components/Device.tsx). */
export type CameraDesign = 'pro' | 'air' | 'dual' | 'single';

/** Linha do produto, usada em filtros e navegação. */
export type Family = 'pro' | 'air' | 'standard' | 'e';

/**
 * `available`  — à venda.
 * `preorder`   — em pré-venda (pode ir para a sacola).
 * `upcoming`   — anunciado, sem preço/venda. Use apenas com dados oficiais.
 * `unavailable`— fora de linha na loja.
 */
export type ProductStatus = 'available' | 'preorder' | 'upcoming' | 'unavailable';

export interface Finish {
  id: string;
  name: string;
  /** Cor base do acabamento, usada no swatch e no render. */
  hex: string;
}

export interface StorageOption {
  gb: number;
  /** Preço em reais. */
  price: number;
}

export interface SpecGroup {
  title: string;
  rows: [label: string, value: string][];
}

/** Especificações normalizadas para a página de comparação. */
export interface KeySpecs {
  display: string;
  chip: string;
  rearCameras: string;
  zoom: string;
  frontCamera: string;
  /** Horas de reprodução de vídeo. */
  videoHours: number;
  /** mm */
  thickness: number;
  /** gramas */
  weight: number;
  material: string;
  usb: string;
}

export interface Product {
  slug: string;
  name: string;
  /** Número da geração (17, 18…). Novas gerações entram apenas com dados oficiais. */
  generation: number;
  family: Family;
  status: ProductStatus;
  /** Data de início das vendas no Brasil (ISO). */
  releaseDate: string;
  tagline: string;
  description: string;
  highlights: string[];
  design: CameraDesign;
  /** Recorte superior da tela, para o render frontal. `null` quando não verificado. */
  frontCutout: 'island' | null;
  /** Dimensões em mm e peso em g. */
  dimensions: { height: number; width: number; depth: number; weight: number };
  finishes: Finish[];
  storage: StorageOption[];
  keySpecs: KeySpecs;
  specs: SpecGroup[];
  /** Páginas oficiais de onde as especificações foram conferidas. */
  sources: string[];
  /**
   * Fotos reais opcionais por acabamento e vista (caminhos em /public). Usadas na página do
   * produto; nas outras telas o render vetorial mantém o catálogo visualmente uniforme.
   * Na galeria, um acabamento com fotos mostra só as vistas fotografadas.
   */
  photos?: Partial<Record<string, Partial<Record<PhotoView, string>>>>;
  /**
   * Foto de vitrine (frente e verso juntos) por acabamento, usada onde aparecem os preços: cards do
   * catálogo e linha em escala. Caminho sem extensão (há .webp e .png). Acabamento sem vitrine usa o render.
   */
  showcase?: Partial<Record<string, string>>;
}

export type PhotoView = 'back' | 'front' | 'side' | 'camera';
