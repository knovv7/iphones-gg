import gsap from 'gsap';
import { useEffect, useRef, type CSSProperties } from 'react';
import './HeroPhone.css';

/*
 * iPhone do hero — mecânica do prompt "Soda" adaptada à loja:
 *
 *   aparelho      inclina para o cursor (giroscópio/toque no celular), suavização 0,05 por quadro,
 *                 ±20° no eixo Y e ±10° no X; flutua (6 s, 20 px); gira e se aproxima ao rolar
 *   bokeh         "folhas": discos de luz desfocada ao fundo, paralaxe ×−15
 *   luz subindo   "bolhas": pontos de luz que sobem a cada 400 ms
 *   troca de cor  fundo muda de tom (1,5 s), o aparelho gira 720° com desfoque e troca a foto no
 *                 pico
 *
 * Por quadro só se escrevem transform/opacity (e filter durante o giro). O laço roda só com o
 * hero na tela. Com prefers-reduced-motion nada se move e a troca de cor é imediata.
 */

interface Look {
  img: string;
  bgInner: string;
  bgMid: string;
  light: string; // r,g,b
  edge: [string, string, string, string];
}

const LOOKS: Record<string, Look> = {
  bordo: {
    img: '/images/iphone-costas',
    bgInner: '#4a1220',
    bgMid: '#16060a',
    light: '255,140,160',
    edge: ['#8a3a4a', '#3a0f19', '#1c060b', '#4e1824'],
  },
  glacial: {
    img: '/images/iphone-costas-glacial',
    bgInner: '#1d3a56',
    bgMid: '#0a1520',
    light: '170,205,240',
    edge: ['#cfe0f1', '#7690ab', '#3c4f63', '#93acc5'],
  },
  prateado: {
    img: '/images/iphone-costas-prateado',
    bgInner: '#38383b',
    bgMid: '#121214',
    light: '230,230,228',
    edge: ['#f0f0ee', '#9c9c9a', '#5e5e5c', '#bababa'],
  },
  preto: {
    img: '/images/iphone-costas-preto',
    bgInner: '#26262c',
    bgMid: '#0b0b0e',
    light: '205,205,220',
    edge: ['#76767c', '#2c2c30', '#141416', '#46464c'],
  },
};
const lookOf = (id: string) => LOOKS[id] ?? LOOKS.bordo;
export const heroImageFor = (id: string) => lookOf(id).img;

const BOKEH = [
  { top: 8, left: 6, size: 240, o: 0.55 },
  { top: 58, left: 84, size: 300, o: 0.4 },
  { top: 70, left: 12, size: 190, o: 0.45 },
  { top: 14, left: 78, size: 260, o: 0.35 },
];

const MAX_Y = 20; // = mouse.x (−0,5…0,5) × 40
const MAX_X = 10; // = mouse.y × 20
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface DeviceOrientationEventIOS {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** Variáveis de cor do hero para um acabamento (fundo e luz ficam no <section>). */
export function heroVars(id: string): CSSProperties {
  const l = lookOf(id);
  return { '--hp-bg-inner': l.bgInner, '--hp-bg-mid': l.bgMid, '--hp-light': l.light } as CSSProperties;
}

export function HeroPhone({ finishId }: { finishId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const scrollEl = useRef<HTMLDivElement>(null);
  const tiltEl = useRef<HTMLDivElement>(null);
  const imgEl = useRef<HTMLImageElement>(null);
  const shadowEl = useRef<HTMLDivElement>(null);
  const glareEl = useRef<HTMLDivElement>(null);
  const bokehEl = useRef<HTMLDivElement>(null);
  const sparksEl = useRef<HTMLDivElement>(null);
  const api = useRef<{ switchTo: (id: string) => void } | null>(null);
  const shown = useRef(finishId);
  const first = useRef(finishId);

  useEffect(() => {
    const el = root.current!;
    const hero = (el.closest('section') as HTMLElement) ?? el;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const edges = [...el.querySelectorAll<HTMLElement>('.hp__edge')];

    const applyLook = (id: string) => {
      const l = lookOf(id);
      el.style.setProperty('--hp-edge-a', l.edge[0]);
      el.style.setProperty('--hp-edge-b', l.edge[1]);
      el.style.setProperty('--hp-edge-c', l.edge[2]);
      el.style.setProperty('--hp-edge-d', l.edge[3]);
      imgEl.current!.src = `${l.img}.webp`;
    };
    applyLook(first.current);

    // Pré-carrega e decodifica as quatro fotos para a troca no pico do giro ser instantânea.
    const preload = window.setTimeout(() => {
      Object.values(LOOKS).forEach((l) => {
        const im = new Image();
        im.src = `${l.img}.webp`;
        im.decode?.().catch(() => {});
      });
    }, 1200);

    const bokeh = [...el.querySelectorAll<HTMLElement>('.hp-bokeh')];

    /* ---------------- troca de cor */
    let switching = false;
    let pending: string | null = null;
    const spin = { val: 0, blur: 0 };
    const setBlur = (b: number) => {
      const f = b > 0.05 ? `blur(${b.toFixed(2)}px)` : '';
      imgEl.current!.style.filter = f;
      edges.forEach((e) => (e.style.filter = f));
    };

    const switchTo = (id: string) => {
      if (id === shown.current) return;
      if (switching) {
        pending = id;
        return;
      }
      const look = lookOf(id);
      shown.current = id;

      if (reduced) {
        applyLook(id);
        Object.entries(heroVars(id)).forEach(([k, v]) => hero.style.setProperty(k, String(v)));
        return;
      }
      switching = true;

      // 1. fundo
      gsap.to(hero, { '--hp-bg-inner': look.bgInner, '--hp-bg-mid': look.bgMid, duration: 1.5, ease: 'power2.inOut' });
      hero.style.setProperty('--hp-light', look.light);

      // 2. giro de 720° com desfoque; a foto troca no pico
      gsap.to(spin, {
        val: 360,
        blur: 15,
        duration: 0.6,
        ease: 'power2.in',
        onUpdate: () => {
          setBlur(spin.blur);
          kick();
        },
        onComplete: () => {
          applyLook(id);
          gsap.to(spin, {
            val: 720,
            blur: 0,
            duration: 1.5,
            ease: 'back.out(0.7)',
            onUpdate: () => {
              setBlur(spin.blur);
              kick();
            },
            onComplete: () => {
              spin.val = 0;
              setBlur(0);
              switching = false;
              kick();
              const next = pending;
              pending = null;
              if (next && next !== shown.current) switchTo(next);
            },
          });
        },
      });
    };
    api.current = { switchTo };

    if (reduced) {
      return () => {
        window.clearTimeout(preload);
        api.current = null;
      };
    }

    /* ---------------- entrada: ponteiro, toque, giroscópio */
    const mouse = { x: 0, y: 0 }; // alvo, −0,5…0,5
    const cur = { x: 0, y: 0 };
    let gyroOn = false;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && gyroOn) return;
      const hr = hero.getBoundingClientRect();
      mouse.x = clamp((e.clientX - hr.left) / hr.width - 0.5, -0.5, 0.5);
      mouse.y = clamp((e.clientY - hr.top) / hr.height - 0.5, -0.5, 0.5);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && gyroOn) return;
      mouse.x = 0;
      mouse.y = 0;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') onLeave(e);
    };
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    hero.addEventListener('pointercancel', onLeave);
    hero.addEventListener('pointerup', onUp);

    let base: { b: number; g: number } | null = null;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      gyroOn = true;
      if (!base) base = { b: e.beta, g: e.gamma };
      base.b += (e.beta - base.b) * 0.01;
      base.g += (e.gamma - base.g) * 0.01;
      const dg = e.gamma - base.g;
      const db = e.beta - base.b;
      mouse.x = clamp(Math.abs(dg) < 0.6 ? 0 : dg / 36, -0.5, 0.5);
      mouse.y = clamp(Math.abs(db) < 0.6 ? 0 : db / 36, -0.5, 0.5);
    };
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const DOE = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationEventIOS }).DeviceOrientationEvent;
    let askOnTap: (() => void) | null = null;
    if (coarse && DOE) {
      window.addEventListener('deviceorientation', onOrientation);
      if (typeof DOE.requestPermission === 'function') {
        askOnTap = () => {
          DOE.requestPermission!().catch(() => {});
          el.removeEventListener('click', askOnTap!);
        };
        el.addEventListener('click', askOnTap);
      }
    }

    /* ---------------- rolagem */
    let scrollP = 0;
    let scrollTarget = 0;
    const readScroll = () => {
      scrollTarget = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    };
    readScroll();
    scrollP = scrollTarget;
    window.addEventListener('scroll', readScroll, { passive: true });

    /* ---------------- laço por quadro */
    let raf = 0;
    let last = 0;
    let visible = true;
    const t0 = performance.now();

    let disposed = false;
    const frame = (t: number) => {
      raf = 0;
      if (disposed || !tiltEl.current) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      const step = dt * 60; // quadros de 60 Hz equivalentes
      const time = (t - t0) / 1000;

      // cursor suavizado (lerp 0,05 por quadro, como no prompt)
      const k = 1 - Math.pow(0.95, step);
      cur.x += (mouse.x - cur.x) * k;
      cur.y += (mouse.y - cur.y) * k;

      // aparelho
      const ry = cur.x * 2 * MAX_Y + spin.val;
      const rx = -cur.y * 2 * MAX_X;
      tiltEl.current!.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;

      const nx = cur.x * 2;
      const ny = cur.y * 2;
      const strength = Math.min(1, Math.hypot(nx, ny));
      glareEl.current!.style.transform = `translate3d(${(nx * 22).toFixed(2)}%, ${(ny * 14).toFixed(2)}%, 0)`;
      glareEl.current!.style.opacity = (0.45 + strength * 0.55).toFixed(3);
      const face = 0.35 + 0.65 * Math.abs(Math.cos((spin.val * Math.PI) / 180));
      shadowEl.current!.style.transform = `translate3d(${(-nx * 7).toFixed(2)}%, 0, 0) scale(${((1 + Math.abs(nx) * 0.08) * face).toFixed(3)}, 1)`;

      // paralaxe do fundo
      bokehEl.current!.style.transform = `translate3d(${(cur.x * -15).toFixed(2)}px, ${(cur.y * -15).toFixed(2)}px, 0)`;

      // bokeh do fundo
      bokeh.forEach((b, i) => {
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * ((Math.PI * 2) / dur);
        b.style.transform = `translate3d(${(Math.cos(phase * 0.5) * 15).toFixed(2)}px, ${(Math.sin(phase) * 20).toFixed(2)}px, 0)`;
      });

      // rolagem: gira um pouco e se aproxima
      scrollP += (scrollTarget - scrollP) * (1 - Math.exp(-dt / 0.1));
      scrollEl.current!.style.transform =
        `translate3d(0, ${(scrollP * 6).toFixed(2)}%, 0) rotateY(${(scrollP * -24).toFixed(2)}deg) ` +
        `rotateZ(${(scrollP * 5).toFixed(2)}deg) scale(${(1 + scrollP * 0.22).toFixed(4)})`;

      if (visible) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
    }

    /* ---------------- luz subindo (as "bolhas" do prompt) */
    const spawn = () => {
      const box = sparksEl.current;
      if (!visible || !box || box.childElementCount > 36) return;
      const s = document.createElement('span');
      s.className = 'hp-spark';
      const size = Math.random() * 10 + 4;
      const dur = Math.random() * 6 + 4;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${Math.random() * 100}%`;
      s.style.setProperty('--o', (Math.random() * 0.4 + 0.2).toFixed(2));
      s.style.animationDuration = `${dur}s`;
      s.addEventListener('animationend', () => s.remove(), { once: true });
      box.appendChild(s);
    };
    const sparkTimer = window.setInterval(spawn, 400);

    /* ---------------- só anima com o hero na tela */
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) kick();
    });
    io.observe(hero);
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) kick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    kick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(preload);
      window.clearInterval(sparkTimer);
      io.disconnect();
      gsap.killTweensOf(spin);
      gsap.killTweensOf(hero);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onLeave);
      hero.removeEventListener('pointercancel', onLeave);
      hero.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('deviceorientation', onOrientation);
      document.removeEventListener('visibilitychange', onVisibility);
      if (askOnTap) el.removeEventListener('click', askOnTap);
      api.current = null;
    };
  }, []);

  // Troca de cor pedida pelos cartões.
  useEffect(() => {
    api.current?.switchTo(finishId);
  }, [finishId]);

  const mask = { maskImage: 'url(/images/iphone-costas.webp)', WebkitMaskImage: 'url(/images/iphone-costas.webp)' };

  return (
    <div className="hp-in" ref={root} aria-hidden="true">
      <div className="hp-bokeh-layer" ref={bokehEl}>
        {BOKEH.map((b, i) => (
          <span
            key={i}
            className="hp-bokeh"
            style={{ top: `${b.top}%`, left: `${b.left}%`, '--s': b.size, '--o': b.o } as CSSProperties}
          />
        ))}
      </div>
      <div className="hp-sparks" ref={sparksEl} />

      <div className="hp">
        <div className="hp__scroll" ref={scrollEl}>
          <div className="hp__shadow" ref={shadowEl}>
            <div className="hp__shadow-core" />
          </div>
          <div className="hp__float">
            <div className="hp__tilt" ref={tiltEl}>
              <div className="hp__phone">
                <div className="hp__edge" style={mask} />
                <div className="hp__edge hp__edge--deep" style={mask} />
                <img
                  ref={imgEl}
                  className="hp__img"
                  src={`${lookOf(first.current).img}.webp`}
                  width={729}
                  height={1461}
                  alt=""
                  decoding="async"
                  draggable={false}
                  {...{ fetchpriority: 'high' }}
                />
                <div className="hp__glare" style={mask}>
                  <div className="hp__glare-band" ref={glareEl} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Cartões de cor (o carrossel de sabores do prompt). */
export function HeroFinishPicker({
  finishes,
  value,
  onChange,
  price,
}: {
  finishes: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  price: string;
}) {
  const idx = Math.max(0, finishes.findIndex((f) => f.id === value));
  // No celular os cartões ficam abaixo do aparelho: se ele saiu da tela, a página sobe até ele
  // enquanto o giro começa, para a troca de cor ser vista.
  const pick = (id: string) => {
    onChange(id);
    const stage = document.querySelector('.hp')?.getBoundingClientRect();
    if (stage && stage.top < -stage.height * 0.2) {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 60;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: window.scrollY + stage.top - header - 16, behavior: smooth ? 'smooth' : 'auto' });
    }
  };
  const step = (d: number) => pick(finishes[(idx + d + finishes.length) % finishes.length].id);
  return (
    <div className="hp-pick">
      <div className="hp-pick__cards" role="radiogroup" aria-label="Cor do iPhone 18 Pro">
        {finishes.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={f.id === value}
            className="hp-card"
            onClick={() => pick(f.id)}
          >
            <img src={`${heroImageFor(f.id)}.webp`} alt="" width={729} height={1461} draggable={false} />
            <span className="hp-card__name">{f.name}</span>
            <span className="hp-card__price tnum">{price}</span>
          </button>
        ))}
      </div>
      <div className="hp-pick__nav">
        <button type="button" className="hp-arrow" onClick={() => step(-1)} aria-label="Cor anterior">
          ←
        </button>
        <button type="button" className="hp-arrow" onClick={() => step(1)} aria-label="Próxima cor">
          →
        </button>
      </div>
    </div>
  );
}
