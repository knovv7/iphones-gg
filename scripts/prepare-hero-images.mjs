/*
 * Prepara as fotos dos aparelhos a partir dos originais em "imagens iphone/".
 *
 *   npm run images
 *
 * Cada PNG passa por um de dois caminhos:
 * - transparência real: o corpo vem a ~99% de opacidade (normaliza para 100%) e resíduos quase
 *   invisíveis do fundo (alfa < 24) viram transparência;
 * - xadrez desenhado na imagem (PNG sem canal alfa útil): o fundo cinza e branco é removido com
 *   um preenchimento a partir das bordas, e a borda do aparelho é recuada e suavizada para não
 *   sobrar halo claro sobre o fundo preto.
 *
 * As traseiras saem no mesmo tamanho da bordô (mosaico de acabamentos), e as vitrines de frente e
 * verso no mesmo tamanho entre si (cards de preço e linha em escala).
 * Saída: PNG + WebP em public/images.
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'imagens iphone';
const OUT = 'public/images';
mkdirSync(OUT, { recursive: true });

/**
 * Traseiras do iPhone 18 Pro e do 17 Pro, uma por acabamento (com recorte das câmeras para a galeria).
 * A primeira define o tamanho das demais.
 */
const BACKS = [
  { src: 'bordo.png', out: 'iphone-costas', cameras: 'iphone-costas-cameras' }, // hero, galeria, mosaico
  { src: 'glacial.png', out: 'iphone-costas-glacial', cameras: 'iphone-costas-glacial-cameras' },
  { src: 'prateado.png', out: 'iphone-costas-prateado', cameras: 'iphone-costas-prateado-cameras' },
  { src: 'preto.png', out: 'iphone-costas-preto', cameras: 'iphone-costas-preto-cameras' },
  // iPhone 17 Pro e 17 Pro Max
  { src: 'iPhone 17 costas laranja.png', out: 'iphone17pro-costas-laranja', cameras: 'iphone17pro-costas-laranja-cameras' },
  { src: 'iPhone 17 azul costas.png', out: 'iphone17pro-costas-azul', cameras: 'iphone17pro-costas-azul-cameras' },
  { src: 'iPhone 17 prateado costas.png', out: 'iphone17pro-costas-prateado', cameras: 'iphone17pro-costas-prateado-cameras' },
];
/** Frente usada no hero. */
/** Frentes do 18 Pro e do 17 Pro por acabamento, para a galeria. A primeira (bordô) define o tamanho das demais. */
const FRONTS = [
  { src: 'public images iphone frente.png', out: 'iphone-frente' }, // bordô
  { src: 'frente gracial.png', out: 'iphone-frente-glacial' },
  { src: 'frente prateado.png', out: 'iphone-frente-prateado' },
  { src: 'frente preto.png', out: 'iphone-frente-preto' },
  // iPhone 17 Pro e 17 Pro Max
  { src: 'iPhone 17 frente laranja.png', out: 'iphone17pro-frente-laranja' },
  { src: 'iPhone 17 azul frente.png', out: 'iphone17pro-frente-azul' },
  { src: 'iPhone 17 prateado frente.png', out: 'iphone17pro-frente-prateado' },
];
/** Vitrine (frente e verso juntos) do 18 Pro e do 17 Pro (e Pro Max), nos cards de preço e na linha. */
const SHOWCASE = [
  { src: 'bordo frente e verso.png', out: 'iphone-vitrine-bordo' },
  { src: 'glacial frente e verso.png', out: 'iphone-vitrine-glacial' },
  { src: 'prateado vice e versa.png', out: 'iphone-vitrine-prateado' },
  { src: 'preto frente e verso.png', out: 'iphone-vitrine-preto' },
  // iPhone 17 Pro e 17 Pro Max
  { src: 'iPhones 17 vice e versa laranja.png', out: 'iphone17pro-vitrine-laranja' },
  { src: 'iphone 17 vice e versa azul.png', out: 'iphone17pro-vitrine-azul' },
  { src: 'iphone 17 vice e versa prateado.png', out: 'iphone17pro-vitrine-prateado' },
];

async function load(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

const hasRealAlpha = ({ data }) => {
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
};

function normalizeAlpha({ data }) {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 240) data[i] = 255;
    else if (data[i] < 24) data[i] = 0;
  }
}

/**
 * Remove o xadrez desenhado: preenche a partir das bordas tudo o que é cinza claro neutro.
 * `inset` recua a silhueta (px) antes de uma suavização de 2 px.
 */
function removeChecker({ data, w, h }, inset = 1) {
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.min(r, g, b) >= 180 && Math.max(r, g, b) - Math.min(r, g, b) <= 14;
  };
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (!bg[p] && isBg(p * 4)) {
      bg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) push(x, 0), push(x, h - 1);
  for (let y = 0; y < h; y++) push(0, y), push(w - 1, y);
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  // Distância até o fundo (até inset + 2 px) para recuar e suavizar a borda.
  const reach = inset + 2;
  const dist = new Uint8Array(w * h).fill(255);
  for (let p = 0; p < w * h; p++) if (bg[p]) dist[p] = 0;
  for (let pass = 1; pass <= reach; pass++) {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (dist[p] !== 255) continue;
        const near =
          (x > 0 && dist[p - 1] === pass - 1) ||
          (x < w - 1 && dist[p + 1] === pass - 1) ||
          (y > 0 && dist[p - w] === pass - 1) ||
          (y < h - 1 && dist[p + w] === pass - 1);
        if (near) dist[p] = pass;
      }
  }
  for (let p = 0; p < w * h; p++) {
    const d = dist[p];
    data[p * 4 + 3] = d === 0 ? 0 : d === 255 ? 255 : Math.round(Math.min(1, Math.max(0, (d - inset) / 2)) * 255);
  }
}

/** Caixa que contém todos os pixels com alfa > 0, com margem. */
function bbox({ data, w, h }, pad = 6) {
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  return { left, top, width: Math.min(w, x1 + pad + 1) - left, height: Math.min(h, y1 + pad + 1) - top };
}

async function write(pipeline, name) {
  await pipeline.clone().png({ compressionLevel: 9, effort: 10 }).toFile(`${OUT}/${name}.png`);
  await pipeline.clone().webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${name}.webp`);
}

/** Recorta ao aparelho e, se `size` vier, ajusta a esse tamanho (sem distorcer). */
async function save(img, name, size) {
  const box = bbox(img);
  let p = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract(box);
  if (size) p = p.resize(size.width, size.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await write(p, name);
  const out = size ?? { width: box.width, height: box.height };
  console.log(`${name}: ${out.width}x${out.height}`);
  return box;
}

/** Recorte do platô de câmeras (topo da traseira), para a vista "Câmeras" da galeria. */
async function saveCameras(img, box, name) {
  const crop = { left: box.left, top: box.top, width: box.width, height: Math.round(box.width * 0.64) };
  await write(sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).extract(crop), name);
  console.log(`${name}: ${crop.width}x${crop.height}`);
}

async function prepare(file, inset) {
  const img = await load(file);
  const real = hasRealAlpha(img);
  if (real) normalizeAlpha(img);
  else removeChecker(img, inset);
  return { img, mode: real ? 'transparência real' : 'xadrez removido' };
}

/* ---------------- traseiras */
let size;
for (const b of BACKS) {
  const file = `${SRC}/${b.src}`;
  if (!existsSync(file)) {
    console.log(`${b.out}: original "${b.src}" não encontrado — mantido o arquivo já gerado`);
    continue;
  }
  // Aparelho escuro sobre xadrez claro: recua 2 px para a borda não ficar acinzentada.
  const { img, mode } = await prepare(file, b.src === 'preto.png' ? 2 : 1);
  const box = await save(img, b.out, size);
  size ??= { width: box.width, height: box.height };
  if (b.cameras) await saveCameras(img, box, b.cameras);
  console.log(`  ↳ ${b.src}: ${mode}`);
}

/* ---------------- vitrine (frente e verso), todas no mesmo tamanho */
let showcaseSize;
for (const s of SHOWCASE) {
  const file = `${SRC}/${s.src}`;
  if (!existsSync(file)) {
    console.log(`${s.out}: original "${s.src}" não encontrado — mantido o arquivo já gerado`);
    continue;
  }
  const { img, mode } = await prepare(file, 1);
  const box = await save(img, s.out, showcaseSize);
  showcaseSize ??= { width: box.width, height: box.height };
  console.log(`  ↳ ${s.src}: ${mode}`);
}

/* ---------------- frentes, todas no tamanho da frente bordô */
let frontSize;
const bordoFront = `${OUT}/${FRONTS[0].out}.png`;
if (existsSync(bordoFront)) {
  const m = await sharp(bordoFront).metadata();
  frontSize = { width: m.width, height: m.height };
}
for (const f of FRONTS) {
  const file = `${SRC}/${f.src}`;
  if (!existsSync(file)) {
    console.log(`${f.out}: original "${f.src}" não encontrado — mantido o arquivo já gerado`);
    continue;
  }
  const { img, mode } = await prepare(file, 1);
  const box = await save(img, f.out, frontSize);
  frontSize ??= { width: box.width, height: box.height };
  console.log(`  ↳ ${f.src}: ${mode}`);
}
