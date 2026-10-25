import { useId, type CSSProperties } from 'react';
import type { CameraDesign, Finish, PhotoView, Product } from '../data/types';
import { isLight, shade } from '../lib/color';

/*
 * Render vetorial dos aparelhos, desenhado em milímetros a partir das dimensões oficiais.
 * Cada desenho de câmera segue o layout real do modelo; a cor vem do acabamento.
 * Com `photo`, uma foto real em `product.photos[acabamento][vista]` substitui o render.
 */

export type DeviceView = PhotoView;

const ALL_VIEWS: DeviceView[] = ['back', 'front', 'side', 'camera'];

const VIEW_LABEL: Record<DeviceView, string> = {
  back: 'traseira',
  front: 'frente',
  side: 'perfil lateral',
  camera: 'detalhe das câmeras',
};

/**
 * Vistas disponíveis. Com fotos, só as vistas fotografadas do acabamento (sem misturar foto e
 * desenho na mesma galeria). Sem fotos, a frente só aparece quando o recorte da tela foi verificado.
 */
export function viewsFor(
  product: Pick<Product, 'frontCutout' | 'photos'>,
  finishId?: string,
  withPhotos = false,
): DeviceView[] {
  const shots = withPhotos && finishId ? product.photos?.[finishId] : undefined;
  if (shots) return ALL_VIEWS.filter((v) => shots[v]);
  return product.frontCutout ? ALL_VIEWS : ALL_VIEWS.filter((v) => v !== 'front');
}

const VIEW_SHORT: Record<DeviceView, string> = {
  back: 'Traseira',
  front: 'Frente',
  side: 'Perfil',
  camera: 'Câmeras',
};

export function viewLabel(view: DeviceView, short = false): string {
  return short ? VIEW_SHORT[view] : VIEW_LABEL[view];
}

interface DeviceProps {
  product: Pick<Product, 'name' | 'design' | 'dimensions' | 'frontCutout' | 'photos'>;
  finish: Finish;
  view?: DeviceView;
  className?: string;
  style?: CSSProperties;
  /** Texto alternativo; por padrão "iPhone X em Cor, traseira". */
  label?: string;
  /** Marca o SVG como decorativo (quando o texto ao lado já descreve o aparelho). */
  decorative?: boolean;
  /** Usa a foto real desta vista, quando houver. */
  photo?: boolean;
}

const PAD = 3;

export function Device({ product, finish, view = 'back', className, style, label, decorative, photo }: DeviceProps) {
  const rawId = useId();
  const id = 'd' + rawId.replace(/[^a-zA-Z0-9]/g, '');
  const alt = label ?? `${product.name} em ${finish.name}, ${VIEW_LABEL[view]}`;

  const src = photo ? product.photos?.[finish.id]?.[view] : undefined;
  if (src) {
    return (
      <img
        className={`${className ?? ''} is-photo`}
        style={style}
        src={src}
        alt={decorative ? '' : alt}
        decoding="async"
        draggable={false}
      />
    );
  }

  const { width: W, height: H, depth: D } = product.dimensions;
  const geo = geometry(product.design, W, H);
  const c = palette(finish.hex);

  let viewBox: string;
  let body: JSX.Element;
  switch (view) {
    case 'front':
      viewBox = `${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`;
      body = <Front id={id} W={W} H={H} c={c} island={product.frontCutout === 'island'} />;
      break;
    case 'side':
      viewBox = `${-PAD - 1} ${-PAD} ${D + geo.bump + PAD * 2 + 2} ${H + PAD * 2}`;
      body = <Side id={id} D={D} H={H} W={W} c={c} geo={geo} />;
      break;
    case 'camera': {
      const [x, y, w, h] = geo.cameraCrop;
      viewBox = `${x} ${y} ${w} ${h}`;
      body = <Back id={id} W={W} H={H} c={c} geo={geo} design={product.design} grain />;
      break;
    }
    default:
      viewBox = `${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`;
      body = <Back id={id} W={W} H={H} c={c} geo={geo} design={product.design} />;
  }

  return (
    <svg
      className={className}
      style={style}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : alt}
      preserveAspectRatio="xMidYMid meet"
    >
      {body}
    </svg>
  );
}

/* ------------------------------------------------------------------ cores */

interface Palette {
  base: string;
  light: boolean;
  hi: string;
  lo: string;
  edgeHi: string;
  edgeLo: string;
  glass: string;
  plateau: string;
  ring: string;
  ringHi: string;
  ringLo: string;
}

function palette(hex: string): Palette {
  const light = isLight(hex);
  return {
    base: hex,
    light,
    hi: shade(hex, light ? 0.5 : 0.22),
    lo: shade(hex, light ? -0.22 : -0.45),
    edgeHi: shade(hex, light ? 0.7 : 0.38),
    edgeLo: shade(hex, light ? -0.38 : -0.62),
    glass: shade(hex, light ? -0.035 : 0.035),
    plateau: shade(hex, light ? 0.06 : 0.07),
    ring: shade(hex, light ? -0.12 : 0.12),
    ringHi: shade(hex, light ? 0.55 : 0.45),
    ringLo: shade(hex, light ? -0.45 : -0.55),
  };
}

/* ------------------------------------------------------------------ geometria */

interface Lens {
  x: number;
  y: number;
  r: number;
}

interface Geometry {
  radius: number;
  lenses: Lens[];
  flash: Lens;
  lidar?: Lens;
  mic: Lens;
  /** Saliência do módulo de câmera no perfil (mm) e faixa vertical que ele ocupa. */
  bump: number;
  bumpRange: [number, number];
  cameraCrop: [number, number, number, number];
}

function geometry(design: CameraDesign, W: number, H: number): Geometry {
  const radius = W * 0.165;
  switch (design) {
    case 'pro': {
      const P = H * 0.275;
      const r = W * 0.104;
      return {
        radius,
        lenses: [
          { x: W * 0.19, y: P * 0.29, r },
          { x: W * 0.19, y: P * 0.73, r },
          { x: W * 0.415, y: P * 0.51, r },
        ],
        flash: { x: W * 0.82, y: P * 0.29, r: r * 0.36 },
        lidar: { x: W * 0.82, y: P * 0.73, r: r * 0.33 },
        mic: { x: W * 0.82, y: P * 0.51, r: 0.45 },
        bump: 1.6,
        bumpRange: [0.6, P],
        cameraCrop: [-1, -1, W + 2, P + 5],
      };
    }
    case 'air': {
      const barY = H * 0.03;
      const barH = H * 0.12;
      const cy = barY + barH / 2;
      const r = barH * 0.39;
      const lx = W * 0.035 + barH / 2 + 0.4;
      return {
        radius,
        lenses: [{ x: lx, y: cy, r }],
        flash: { x: lx + r * 2.05, y: cy, r: r * 0.3 },
        mic: { x: lx + r * 2.9, y: cy, r: 0.42 },
        bump: 2.2,
        bumpRange: [barY, barY + barH],
        cameraCrop: [-1, -1, W + 2, barY + barH + 6],
      };
    }
    case 'dual': {
      const s = W * 0.43;
      const px = W * 0.06;
      const ph = s * 1.06;
      const pw = s * 0.48;
      const pillX = px + s * 0.42;
      const r = pw * 0.43;
      const top = px + (ph - s * 0.92) / 2;
      return {
        radius,
        lenses: [
          { x: pillX, y: top + pw / 2, r },
          { x: pillX, y: top + s * 0.92 - pw / 2, r },
        ],
        flash: { x: px + s + W * 0.075, y: px + s * 0.2, r: r * 0.36 },
        mic: { x: px + s * 0.8, y: px + ph / 2, r: 0.42 },
        bump: 1.5,
        bumpRange: [px, px + ph],
        cameraCrop: [-1, -1, W + 2, px + ph + 8],
      };
    }
    case 'single': {
      const r = W * 0.092;
      const x = W * 0.175;
      return {
        radius,
        lenses: [{ x, y: x, r }],
        flash: { x: x + r * 2.15, y: x - r * 0.45, r: r * 0.32 },
        mic: { x: x + r * 2.15, y: x + r * 0.55, r: 0.42 },
        bump: 1.1,
        bumpRange: [x - r * 1.15, x + r * 1.15],
        cameraCrop: [-1, -1, W + 2, x + r * 2.6],
      };
    }
  }
}

/* ------------------------------------------------------------------ peças */

interface PartProps {
  id: string;
  W: number;
  H: number;
  c: Palette;
}

function BodyGradient({ id, c }: { id: string; c: Palette }) {
  return (
    <linearGradient id={`${id}-body`} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor={c.edgeLo} />
      <stop offset="0.025" stopColor={c.edgeHi} />
      <stop offset="0.08" stopColor={c.hi} />
      <stop offset="0.45" stopColor={c.base} />
      <stop offset="0.88" stopColor={c.lo} />
      <stop offset="0.97" stopColor={c.edgeHi} />
      <stop offset="1" stopColor={c.edgeLo} />
    </linearGradient>
  );
}

function LensDefs({ id, c }: { id: string; c: Palette }) {
  return (
    <>
      <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c.ringHi} />
        <stop offset="0.45" stopColor={c.ring} />
        <stop offset="0.75" stopColor={c.ringLo} />
        <stop offset="1" stopColor={c.ring} />
      </linearGradient>
      <radialGradient id={`${id}-glass`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#1f2436" />
        <stop offset="0.6" stopColor="#0b0d14" />
        <stop offset="1" stopColor="#030305" />
      </radialGradient>
      <radialGradient id={`${id}-core`} cx="0.42" cy="0.38" r="0.62">
        <stop offset="0" stopColor="#5a5f93" />
        <stop offset="0.3" stopColor="#262a4a" />
        <stop offset="0.7" stopColor="#0c0e1a" />
        <stop offset="1" stopColor="#050509" />
      </radialGradient>
      <radialGradient id={`${id}-flash`} cx="0.45" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#fffdf3" />
        <stop offset="0.55" stopColor="#efe6c6" />
        <stop offset="1" stopColor="#a99f80" />
      </radialGradient>
      {/* reflexo do tratamento antirreflexo das lentes */}
      <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7cf2c4" />
        <stop offset="0.5" stopColor="#8a7dff" />
        <stop offset="1" stopColor="#ff7ad9" />
      </linearGradient>
    </>
  );
}

/** Arco de circunferência, ângulos em graus (0° = direita, sentido horário). */
function arc(x: number, y: number, r: number, from: number, to: number) {
  const p = (a: number) => [x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = p(from);
  const [x2, y2] = p(to);
  return `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function LensShape({ id, l }: { id: string; l: Lens }) {
  const { x, y, r } = l;
  return (
    <g>
      <circle cx={x} cy={y + r * 0.08} r={r * 1.04} fill="#000" opacity="0.45" />
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-ring)`} />
      <circle cx={x} cy={y} r={r * 0.965} fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth={r * 0.02} />
      <circle cx={x} cy={y} r={r * 0.9} fill="#050506" />
      <circle cx={x} cy={y} r={r * 0.8} fill={`url(#${id}-glass)`} />
      {/* elementos internos da objetiva */}
      <circle cx={x} cy={y} r={r * 0.69} fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth={r * 0.012} />
      <circle cx={x} cy={y} r={r * 0.6} fill="none" stroke="#9aa2ff" strokeOpacity="0.1" strokeWidth={r * 0.01} />
      <path
        d={arc(x, y, r * 0.64, 20, 120)}
        fill="none"
        stroke={`url(#${id}-coat)`}
        strokeOpacity="0.22"
        strokeWidth={r * 0.035}
        strokeLinecap="round"
      />
      <circle cx={x} cy={y} r={r * 0.46} fill={`url(#${id}-core)`} />
      <circle cx={x} cy={y} r={r * 0.3} fill="none" stroke="#7d84c9" strokeOpacity="0.18" strokeWidth={r * 0.01} />
      <circle cx={x} cy={y} r={r * 0.18} fill="#010102" />
      <circle cx={x} cy={y} r={r * 0.8} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth={r * 0.04} />
      {/* brilho especular em crescente */}
      <path
        d={arc(x, y, r * 0.7, 200, 248)}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.42"
        strokeWidth={r * 0.06}
        strokeLinecap="round"
      />
      <circle cx={x - r * 0.14} cy={y - r * 0.2} r={r * 0.05} fill="#fff" opacity="0.5" />
      <circle cx={x + r * 0.26} cy={y + r * 0.24} r={r * 0.035} fill="#b9beff" opacity="0.55" />
    </g>
  );
}

function Flash({ id, l }: { id: string; l: Lens }) {
  return (
    <g>
      <circle cx={l.x} cy={l.y} r={l.r * 1.18} fill="#000" opacity="0.35" />
      <circle cx={l.x} cy={l.y} r={l.r} fill={`url(#${id}-flash)`} />
      {/* lente de Fresnel */}
      {[0.78, 0.56, 0.34].map((k) => (
        <circle key={k} cx={l.x} cy={l.y} r={l.r * k} fill="none" stroke="#a1946b" strokeOpacity="0.35" strokeWidth={l.r * 0.05} />
      ))}
      <path
        d={arc(l.x, l.y, l.r * 0.86, 205, 250)}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.8"
        strokeWidth={l.r * 0.08}
        strokeLinecap="round"
      />
    </g>
  );
}

function Back({ id, W, H, c, geo, design, grain }: PartProps & { geo: Geometry; design: CameraDesign; grain?: boolean }) {
  const R = geo.radius;
  return (
    <>
      <defs>
        <BodyGradient id={id} c={c} />
        <LensDefs id={id} c={c} />
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={c.light ? 0.28 : 0.16} />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.84" stopColor="#fff" stopOpacity={c.light ? 0.12 : 0.06} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-drop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={c.light ? 0.22 : 0.45} />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width={W} height={H} rx={R} />
        </clipPath>
        {grain && (
          // Grão do alumínio, visível só na vista ampliada.
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.055 0" />
          </filter>
        )}
      </defs>

      <rect x="0" y="0" width={W} height={H} rx={R} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {design === 'pro' && <ProPlateau id={id} W={W} H={H} c={c} geo={geo} />}
        {design === 'air' && <AirBar id={id} W={W} H={H} c={c} geo={geo} />}
        {design === 'dual' && <DualModule id={id} W={W} H={H} c={c} geo={geo} />}
        {design === 'single' && <SingleModule id={id} W={W} H={H} c={c} geo={geo} />}
        <rect x="0" y="0" width={W} height={H} fill={`url(#${id}-sheen)`} pointerEvents="none" />
        {grain && <rect x="0" y="0" width={W} height={H} filter={`url(#${id}-grain)`} pointerEvents="none" />}
      </g>
      <rect
        x="0.3"
        y="0.3"
        width={W - 0.6}
        height={H - 0.6}
        rx={R - 0.3}
        fill="none"
        stroke={c.edgeHi}
        strokeOpacity="0.55"
        strokeWidth="0.35"
      />
    </>
  );
}

function ProPlateau({ id, W, H, c, geo }: PartProps & { geo: Geometry }) {
  const P = geo.bumpRange[1];
  const R = geo.radius;
  const m = W * 0.075;
  const glassY = P + W * 0.05;
  const [a, b, d] = geo.lenses;
  const pad = a.r * 1.22;
  const islandX = a.x - pad;
  const islandY = a.y - pad;
  return (
    <>
      {/* janela de vidro na parte inferior (traseira em Ceramic Shield) */}
      <rect x={m} y={glassY} width={W - m * 2} height={H - glassY - m} rx={R * 0.62} fill={c.glass} />
      <rect
        x={m}
        y={glassY}
        width={W - m * 2}
        height={H - glassY - m}
        rx={R * 0.62}
        fill="none"
        stroke={c.lo}
        strokeOpacity="0.5"
        strokeWidth="0.3"
      />
      {/* sombra projetada pelo platô */}
      <rect x="0" y={P} width={W} height={5} fill={`url(#${id}-drop)`} />
      {/* platô de câmeras de ponta a ponta */}
      <path
        d={`M0 ${R} Q0 0 ${R} 0 H${W - R} Q${W} 0 ${W} ${R} V${P - 3} Q${W} ${P} ${W - 3} ${P} H3 Q0 ${P} 0 ${P - 3} Z`}
        fill={`url(#${id}-body)`}
      />
      <rect x="0" y="0" width={W} height={P} fill={c.plateau} opacity="0.35" />
      <line x1="2" x2={W - 2} y1={P - 0.25} y2={P - 0.25} stroke={c.edgeHi} strokeOpacity="0.6" strokeWidth="0.3" />
      {/* ilha das lentes */}
      <rect
        x={islandX}
        y={islandY}
        width={d.x + pad - islandX}
        height={b.y + pad - islandY}
        rx={pad}
        fill={c.lo}
        opacity="0.55"
      />
      <rect
        x={islandX}
        y={islandY}
        width={d.x + pad - islandX}
        height={b.y + pad - islandY}
        rx={pad}
        fill="none"
        stroke={c.edgeHi}
        strokeOpacity="0.35"
        strokeWidth="0.3"
      />
      {geo.lenses.map((l, i) => (
        <LensShape key={i} id={id} l={l} />
      ))}
      <Flash id={id} l={geo.flash} />
      {geo.lidar && (
        <g>
          <circle cx={geo.lidar.x} cy={geo.lidar.y} r={geo.lidar.r} fill="#0a0a0c" />
          <circle cx={geo.lidar.x} cy={geo.lidar.y} r={geo.lidar.r * 0.55} fill="#17181d" />
        </g>
      )}
      <circle cx={geo.mic.x} cy={geo.mic.y} r={geo.mic.r} fill="#000" opacity="0.7" />
    </>
  );
}

function AirBar({ id, W, c, geo }: PartProps & { geo: Geometry }) {
  const [y0, y1] = geo.bumpRange;
  const h = y1 - y0;
  const x = W * 0.035;
  return (
    <>
      <rect x={x} y={y1 - h * 0.1} width={W - x * 2} height={h * 0.3} rx={h * 0.15} fill={`url(#${id}-drop)`} />
      <rect x={x} y={y0} width={W - x * 2} height={h} rx={h / 2} fill={`url(#${id}-body)`} />
      <rect x={x} y={y0} width={W - x * 2} height={h} rx={h / 2} fill={c.plateau} opacity="0.4" />
      <rect
        x={x + 0.25}
        y={y0 + 0.25}
        width={W - x * 2 - 0.5}
        height={h - 0.5}
        rx={h / 2 - 0.25}
        fill="none"
        stroke={c.edgeHi}
        strokeOpacity="0.6"
        strokeWidth="0.3"
      />
      {geo.lenses.map((l, i) => (
        <LensShape key={i} id={id} l={l} />
      ))}
      <Flash id={id} l={geo.flash} />
      <circle cx={geo.mic.x} cy={geo.mic.y} r={geo.mic.r} fill="#000" opacity="0.7" />
    </>
  );
}

function DualModule({ id, W, c, geo }: PartProps & { geo: Geometry }) {
  const s = W * 0.43;
  const px = W * 0.06;
  const ph = s * 1.06;
  const [a, b] = geo.lenses;
  const pw = a.r / 0.43;
  return (
    <>
      <rect x={px} y={px + ph - 1} width={s} height={4} rx={2} fill={`url(#${id}-drop)`} />
      <rect x={px} y={px} width={s} height={ph} rx={s * 0.27} fill={c.plateau} />
      <rect
        x={px}
        y={px}
        width={s}
        height={ph}
        rx={s * 0.27}
        fill="none"
        stroke={c.edgeHi}
        strokeOpacity="0.5"
        strokeWidth="0.3"
      />
      <rect
        x={a.x - pw / 2}
        y={a.y - pw / 2}
        width={pw}
        height={b.y - a.y + pw}
        rx={pw / 2}
        fill={`url(#${id}-ring)`}
      />
      {geo.lenses.map((l, i) => (
        <LensShape key={i} id={id} l={l} />
      ))}
      <circle cx={geo.mic.x} cy={geo.mic.y} r={geo.mic.r} fill="#000" opacity="0.6" />
      <Flash id={id} l={geo.flash} />
    </>
  );
}

function SingleModule({ id, geo }: PartProps & { geo: Geometry }) {
  return (
    <>
      {geo.lenses.map((l, i) => (
        <LensShape key={i} id={id} l={{ ...l }} />
      ))}
      <Flash id={id} l={geo.flash} />
      <circle cx={geo.mic.x} cy={geo.mic.y} r={geo.mic.r} fill="#000" opacity="0.6" />
    </>
  );
}

function Front({ id, W, H, c, island }: PartProps & { island: boolean }) {
  const R = W * 0.165;
  const bezel = 1.7;
  return (
    <>
      <defs>
        <BodyGradient id={id} c={c} />
        <radialGradient id={`${id}-wall`} cx="0.3" cy="0.22" r="0.95">
          <stop offset="0" stopColor={shade(c.base, c.light ? 0.1 : 0.35)} />
          <stop offset="0.35" stopColor={shade(c.base, c.light ? -0.35 : -0.15)} />
          <stop offset="0.75" stopColor={shade(c.base, -0.82)} />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx={R} fill={`url(#${id}-body)`} />
      <rect x="0.55" y="0.55" width={W - 1.1} height={H - 1.1} rx={R - 0.55} fill="#060606" />
      <rect
        x={bezel}
        y={bezel}
        width={W - bezel * 2}
        height={H - bezel * 2}
        rx={R - bezel}
        fill={`url(#${id}-wall)`}
      />
      {island && (
        <rect x={W / 2 - W * 0.145} y={bezel + W * 0.035} width={W * 0.29} height={W * 0.075} rx={W * 0.0375} fill="#000" />
      )}
      <rect x="0" y="0" width={W} height={H} rx={R} fill={`url(#${id}-glare)`} />
    </>
  );
}

function Side({ id, D, H, W, c, geo }: { id: string; D: number; H: number; W: number; c: Palette; geo: Geometry }) {
  const ry = W * 0.165 * 0.8;
  const [b0, b1] = geo.bumpRange;
  const btn = (y: number, len: number) => (
    <rect x={-0.55} y={y} width={0.9} height={len} rx={0.45} fill={c.ring} stroke={c.edgeLo} strokeWidth="0.15" />
  );
  return (
    <>
      <defs>
        <linearGradient id={`${id}-frame`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={c.edgeLo} />
          <stop offset="0.18" stopColor={c.lo} />
          <stop offset="0.42" stopColor={c.edgeHi} />
          <stop offset="0.58" stopColor={c.hi} />
          <stop offset="0.85" stopColor={c.lo} />
          <stop offset="1" stopColor={c.edgeLo} />
        </linearGradient>
      </defs>
      {/* saliência do módulo de câmera, no lado da traseira */}
      <rect x={D - 0.6} y={b0} width={geo.bump + 0.6} height={b1 - b0} rx={Math.min(0.9, geo.bump / 2)} fill={c.lo} />
      <rect x="0" y="0" width={D} height={H} rx={D * 0.48} ry={ry} fill={`url(#${id}-frame)`} />
      <line x1={D * 0.5} x2={D * 0.5} y1={ry} y2={H - ry} stroke="#fff" strokeOpacity="0.12" strokeWidth="0.15" />
      {btn(H * 0.17, H * 0.055)}
      {btn(H * 0.255, H * 0.085)}
      {btn(H * 0.355, H * 0.085)}
    </>
  );
}
