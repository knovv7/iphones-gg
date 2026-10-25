import type { Finish, Product, SpecGroup } from './types';

/*
 * Catálogo.
 *
 * Especificações conferidas nas páginas oficiais da Apple Brasil (links em `sources`),
 * em outubro de 2026. Preços: preço sugerido pela Apple Brasil no lançamento de cada
 * modelo, usado como referência até a integração com o sistema de preços da loja.
 *
 * Para incluir uma geração nova (ex.: iPhone 18), adicione um objeto a `PRODUCTS` com
 * dados oficiais. A interface (filtros, navegação, comparação) se ajusta sozinha.
 * Modelos anunciados e ainda sem venda devem usar `status: 'upcoming'` e não exibem preço.
 */

const APPLE_18_PRO = 'https://www.apple.com/br/iphone-18-pro/specs/';
const APPLE_17_PRO = 'https://support.apple.com/pt-br/125090';
const APPLE_17_PRO_MAX = 'https://support.apple.com/pt-br/125091';

const FINISHES_18_PRO: Finish[] = [
  { id: 'bordo', name: 'Bordô', hex: '#5f1f2c' },
  { id: 'glacial', name: 'Glacial', hex: '#a9c3dd' },
  { id: 'prateado', name: 'Prateado', hex: '#d9d9d6' },
  { id: 'preto', name: 'Preto', hex: '#2b2b2e' },
];

/**
 * Galeria do 18 Pro e 18 Pro Max (geradas por `npm run images` a partir de "imagens iphone/").
 * Cada cor mostra só as vistas fotografadas: traseira, frente e câmeras em todas.
 * Quando chegarem as fotos de perfil, basta incluir `side` aqui.
 */
const PHOTOS_18_PRO: Product['photos'] = {
  bordo: {
    back: '/images/iphone-costas.webp',
    front: '/images/iphone-frente.webp',
    camera: '/images/iphone-costas-cameras.webp',
  },
  glacial: {
    back: '/images/iphone-costas-glacial.webp',
    front: '/images/iphone-frente-glacial.webp',
    camera: '/images/iphone-costas-glacial-cameras.webp',
  },
  prateado: {
    back: '/images/iphone-costas-prateado.webp',
    front: '/images/iphone-frente-prateado.webp',
    camera: '/images/iphone-costas-prateado-cameras.webp',
  },
  preto: {
    back: '/images/iphone-costas-preto.webp',
    front: '/images/iphone-frente-preto.webp',
    camera: '/images/iphone-costas-preto-cameras.webp',
  },
};

/** Vitrine (frente e verso) do 18 Pro e 18 Pro Max, nos cards de preço e na linha em escala. */
const SHOWCASE_18_PRO = {
  bordo: '/images/iphone-vitrine-bordo',
  glacial: '/images/iphone-vitrine-glacial',
  prateado: '/images/iphone-vitrine-prateado',
  preto: '/images/iphone-vitrine-preto',
};

/** Galeria do 17 Pro e 17 Pro Max: traseira, frente e câmeras em todas as cores. */
const PHOTOS_17_PRO: Product['photos'] = {
  'laranja-cosmico': {
    back: '/images/iphone17pro-costas-laranja.webp',
    front: '/images/iphone17pro-frente-laranja.webp',
    camera: '/images/iphone17pro-costas-laranja-cameras.webp',
  },
  'azul-intenso': {
    back: '/images/iphone17pro-costas-azul.webp',
    front: '/images/iphone17pro-frente-azul.webp',
    camera: '/images/iphone17pro-costas-azul-cameras.webp',
  },
  prateado: {
    back: '/images/iphone17pro-costas-prateado.webp',
    front: '/images/iphone17pro-frente-prateado.webp',
    camera: '/images/iphone17pro-costas-prateado-cameras.webp',
  },
};

/** Vitrine (frente e verso) do 17 Pro e 17 Pro Max, nos cards de preço e na linha em escala. */
const SHOWCASE_17_PRO = {
  'laranja-cosmico': '/images/iphone17pro-vitrine-laranja',
  'azul-intenso': '/images/iphone17pro-vitrine-azul',
  prateado: '/images/iphone17pro-vitrine-prateado',
};

const FINISHES_17_PRO: Finish[] = [
  { id: 'laranja-cosmico', name: 'Laranja-cósmico', hex: '#cf5f27' },
  { id: 'azul-intenso', name: 'Azul-intenso', hex: '#2c3850' },
  { id: 'prateado', name: 'Prateado', hex: '#d9d9d6' },
];

const pro18Specs = (max: boolean): SpecGroup[] => [
  {
    title: 'Tela',
    rows: [
      ['Tamanho', max ? '6,9 polegadas, OLED Super Retina XDR' : '6,3 polegadas, OLED Super Retina XDR'],
      ['Resolução', max ? '2868 x 1320 pixels a 460 ppp' : '2622 x 1206 pixels a 460 ppp'],
      ['Taxa de atualização', 'ProMotion, adaptativa até 120 Hz'],
      ['Brilho', 'Pico de 3.000 nits ao ar livre; 1.600 nits em HDR'],
    ],
  },
  {
    title: 'Chip',
    rows: [['Processador', 'A20 Pro: CPU de 6 núcleos, GPU de 7 núcleos, Neural Engine de 16 núcleos']],
  },
  {
    title: 'Câmeras',
    rows: [
      ['Principal', 'Fusion de 48 MP, 24 mm, abertura variável de ƒ/1.48 a ƒ/4.0'],
      ['Ultra-angular', '48 MP, 13 mm, ƒ/2.2, campo de visão de 120°'],
      ['Teleobjetiva', '48 MP, 100 mm (4x), ƒ/2.8'],
      ['Zoom', '8x com qualidade óptica; alcance óptico de 16x; digital até 40x'],
      ['Frontal', 'Center Stage de 18 MP, ƒ/1.9'],
    ],
  },
  {
    title: 'Bateria',
    rows: [['Reprodução de vídeo', max ? 'Até 43 horas' : 'Até 34 horas']],
  },
  {
    title: 'Design',
    rows: [
      ['Estrutura', 'Alumínio unibody'],
      ['Vidro', 'Ceramic Shield 2 na frente, Ceramic Shield na traseira'],
      ['Dimensões', max ? '163,4 x 78,0 x 8,75 mm' : '150,0 x 71,9 x 8,75 mm'],
      ['Peso', max ? '249 g' : '211 g'],
      ['Resistência', 'IP68, até 6 m por até 30 minutos (IEC 60529)'],
    ],
  },
  {
    title: 'Conexões',
    rows: [
      ['USB-C', 'USB 3, até 10 Gb/s'],
      ['SIM', 'Dual SIM (nano SIM e eSIM)'],
    ],
  },
];

const pro17Specs = (max: boolean): SpecGroup[] => [
  {
    title: 'Tela',
    rows: [
      ['Tamanho', max ? '6,9 polegadas, OLED Super Retina XDR' : '6,3 polegadas, OLED Super Retina XDR'],
      ['Taxa de atualização', 'ProMotion, adaptativa até 120 Hz'],
      ['Brilho', 'Pico de 3.000 nits ao ar livre; 1.600 nits em HDR'],
    ],
  },
  { title: 'Chip', rows: [['Processador', 'A19 Pro']] },
  {
    title: 'Câmeras',
    rows: [
      ['Principal', 'Fusion de 48 MP, 24 mm, ƒ/1.78'],
      ['Ultra-angular', '48 MP, 13 mm, ƒ/2.2, campo de visão de 120°'],
      ['Teleobjetiva', '48 MP, 100 mm (4x), ƒ/2.8'],
      ['Zoom', '8x com qualidade óptica; alcance óptico de 16x; digital até 40x'],
      ['Frontal', 'Center Stage de 18 MP, ƒ/1.9'],
    ],
  },
  {
    title: 'Bateria',
    rows: [['Reprodução de vídeo', max ? 'Até 37 horas' : 'Até 31 horas']],
  },
  {
    title: 'Design',
    rows: [
      ['Estrutura', 'Alumínio unibody'],
      ['Vidro', 'Ceramic Shield 2 na frente, Ceramic Shield na traseira'],
      ['Dimensões', max ? '163,4 x 78,0 x 8,75 mm' : '150,0 x 71,9 x 8,75 mm'],
      ['Peso', max ? '231 g' : '204 g'],
      ['Resistência', 'IP68, até 6 m por até 30 minutos (IEC 60529)'],
    ],
  },
  {
    title: 'Conexões',
    rows: [
      ['USB-C', 'USB 3, até 10 Gb/s'],
      ['SIM', 'Dual SIM (nano SIM e eSIM)'],
    ],
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: 'iphone-18-pro',
    name: 'iPhone 18 Pro',
    generation: 18,
    family: 'pro',
    status: 'available',
    releaseDate: '2026-09-18',
    tagline: 'Luz sob controle.',
    description:
      'A primeira câmera principal de iPhone com abertura variável, chip A20 Pro e tela ProMotion de 6,3 polegadas, em alumínio unibody.',
    highlights: ['Abertura variável ƒ/1.48–ƒ/4.0', 'Chip A20 Pro', 'Zoom 8x com qualidade óptica'],
    design: 'pro',
    frontCutout: 'island',
    dimensions: { height: 150.0, width: 71.9, depth: 8.75, weight: 211 },
    finishes: FINISHES_18_PRO,
    storage: [
      { gb: 256, price: 11999 },
      { gb: 512, price: 13499 },
      { gb: 1024, price: 16499 },
      { gb: 2048, price: 20999 },
    ],
    keySpecs: {
      display: '6,3" ProMotion 120 Hz',
      chip: 'A20 Pro',
      rearCameras: 'Três de 48 MP',
      zoom: '8x com qualidade óptica',
      frontCamera: '18 MP Center Stage',
      videoHours: 34,
      thickness: 8.75,
      weight: 211,
      material: 'Alumínio',
      usb: 'USB 3 · 10 Gb/s',
    },
    specs: pro18Specs(false),
    sources: [APPLE_18_PRO],
    photos: PHOTOS_18_PRO,
    showcase: SHOWCASE_18_PRO,
  },
  {
    slug: 'iphone-18-pro-max',
    name: 'iPhone 18 Pro Max',
    generation: 18,
    family: 'pro',
    status: 'available',
    releaseDate: '2026-09-18',
    tagline: 'A maior tela, a maior bateria.',
    description:
      'Tela de 6,9 polegadas, até 43 horas de reprodução de vídeo e o mesmo sistema de câmeras com abertura variável do iPhone 18 Pro.',
    highlights: ['Até 43 h de vídeo', 'Tela de 6,9"', 'Chip A20 Pro'],
    design: 'pro',
    frontCutout: 'island',
    dimensions: { height: 163.4, width: 78.0, depth: 8.75, weight: 249 },
    finishes: FINISHES_18_PRO,
    storage: [
      { gb: 256, price: 12999 },
      { gb: 512, price: 14499 },
      { gb: 1024, price: 17499 },
      { gb: 2048, price: 21999 },
    ],
    keySpecs: {
      display: '6,9" ProMotion 120 Hz',
      chip: 'A20 Pro',
      rearCameras: 'Três de 48 MP',
      zoom: '8x com qualidade óptica',
      frontCamera: '18 MP Center Stage',
      videoHours: 43,
      thickness: 8.75,
      weight: 249,
      material: 'Alumínio',
      usb: 'USB 3 · 10 Gb/s',
    },
    specs: pro18Specs(true),
    sources: [APPLE_18_PRO],
    photos: PHOTOS_18_PRO,
    showcase: SHOWCASE_18_PRO,
  },
  {
    slug: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    generation: 17,
    family: 'pro',
    status: 'available',
    releaseDate: '2025-09-19',
    tagline: 'Três câmeras de 48 MP.',
    description:
      'Alumínio unibody, chip A19 Pro e três câmeras Fusion de 48 MP com zoom de 8x com qualidade óptica.',
    highlights: ['Três câmeras de 48 MP', 'Chip A19 Pro', 'Laranja-cósmico'],
    design: 'pro',
    frontCutout: 'island',
    dimensions: { height: 150.0, width: 71.9, depth: 8.75, weight: 204 },
    finishes: FINISHES_17_PRO,
    storage: [
      { gb: 256, price: 11499 },
      { gb: 512, price: 12999 },
      { gb: 1024, price: 14499 },
    ],
    keySpecs: {
      display: '6,3" ProMotion 120 Hz',
      chip: 'A19 Pro',
      rearCameras: 'Três de 48 MP',
      zoom: '8x com qualidade óptica',
      frontCamera: '18 MP Center Stage',
      videoHours: 31,
      thickness: 8.75,
      weight: 204,
      material: 'Alumínio',
      usb: 'USB 3 · 10 Gb/s',
    },
    specs: pro17Specs(false),
    sources: [APPLE_17_PRO],
    photos: PHOTOS_17_PRO,
    showcase: SHOWCASE_17_PRO,
  },
  {
    slug: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    generation: 17,
    family: 'pro',
    status: 'available',
    releaseDate: '2025-09-19',
    tagline: '6,9 polegadas, 2 TB.',
    description:
      'A tela de 6,9 polegadas e até 37 horas de vídeo da geração 17, com opção de 2 TB de armazenamento.',
    highlights: ['Até 37 h de vídeo', 'Tela de 6,9"', 'Até 2 TB'],
    design: 'pro',
    frontCutout: 'island',
    dimensions: { height: 163.4, width: 78.0, depth: 8.75, weight: 231 },
    finishes: FINISHES_17_PRO,
    storage: [
      { gb: 256, price: 12499 },
      { gb: 512, price: 13999 },
      { gb: 1024, price: 15499 },
      { gb: 2048, price: 18499 },
    ],
    keySpecs: {
      display: '6,9" ProMotion 120 Hz',
      chip: 'A19 Pro',
      rearCameras: 'Três de 48 MP',
      zoom: '8x com qualidade óptica',
      frontCamera: '18 MP Center Stage',
      videoHours: 37,
      thickness: 8.75,
      weight: 231,
      material: 'Alumínio',
      usb: 'USB 3 · 10 Gb/s',
    },
    specs: pro17Specs(true),
    sources: [APPLE_17_PRO_MAX],
    photos: PHOTOS_17_PRO,
    showcase: SHOWCASE_17_PRO,
  },
];

export const FAMILY_LABEL: Record<Product['family'], string> = {
  pro: 'Pro',
  air: 'Air',
  standard: 'Padrão',
  e: 'Série e',
};

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
