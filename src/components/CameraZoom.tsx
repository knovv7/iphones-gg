import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import './CameraZoom.css';

/*
 * "Três câmeras de 48 MP" com zoom guiado pela rolagem.
 *
 * A seção é alta (palco + 1,75 tela de rolagem). O palco fica preso com position: sticky
 * enquanto a rolagem atravessa a seção; o progresso p (0 → 1) vem da posição da seção:
 *
 *   p 0.00 → 0.78   a foto sai do close no platô de câmeras e encolhe até o aparelho inteiro,
 *                   centralizado (revela de cima para baixo); o título some até p 0.28
 *   p 0.80 → 1.00   os números entram com fade e leve subida
 *   p 1             o palco se solta e a página segue
 *
 * Como depende só da posição da rolagem, volta igual ao subir. Por quadro só se escrevem
 * transform e opacity. A <img> tem o tamanho do close (o maior) e só é reduzida com scale,
 * então nunca é ampliada além do tamanho em que foi rasterizada.
 */

const SRC = '/images/iphone-costas';
const IMG_W = 729;
const IMG_H = 1461;
/** Altura do bloco de câmeras em relação à largura da foto (platô + respiro). */
const CAMERA_BLOCK = 0.64;
const ZOOM_END = 0.78;
const TITLE_END = 0.28;
const WIDE = '(min-width: 1024px)';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Rect {
  x: number;
  y: number;
  w: number;
}

const FACTS: [string, string][] = [
  ['48 MP', 'em cada uma das três câmeras traseiras'],
  ['8x', 'de zoom com qualidade óptica, 200 mm'],
  ['16x', 'de alcance óptico, do ultra-angular à tele'],
];

export function CameraZoom({ name }: { name: string }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLImageElement>(null);
  const facts = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const sec = section.current!;
    const stg = stage.current!;
    const hd = head.current!;
    const img = phone.current!;
    const fx = facts.current!;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let start: Rect = { x: 0, y: 0, w: 1 };
    let end: Rect = { x: 0, y: 0, w: 1 };
    let target = 0;
    let p = -1;
    let raf = 0;
    let last = 0;
    const items = [...fx.children] as HTMLElement[];

    /* ---------------- geometria: close inicial e aparelho inteiro */
    const measure = () => {
      const W = stg.clientWidth;
      const H = stg.clientHeight;
      const gutter = parseFloat(getComputedStyle(hd).paddingLeft) || 16;
      const wide = window.matchMedia(WIDE).matches;

      // Close: o bloco de câmeras preenche a largura logo abaixo do título. Em telas baixas,
      // reduz o suficiente para o bloco caber inteiro (sem passar de 70% da largura útil).
      const top0 = hd.offsetTop + hd.offsetHeight + 12;
      const usable = W - gutter * 2;
      const fit = (H - top0 - 16) / CAMERA_BLOCK;
      const w0 = Math.min(usable, Math.max(fit, usable * 0.7), 1240);
      start = { x: (W - w0) / 2, y: top0, w: w0 };

      // Inteiro: centralizado. Em telas estreitas os números ficam embaixo, então o aparelho
      // usa a área que sobra acima deles.
      const factsH = wide ? 0 : fx.offsetHeight + 24;
      const room = H - factsH;
      const h1 = room * (wide ? 0.84 : 0.88);
      const w1 = (h1 * IMG_W) / IMG_H;
      end = { x: (W - w1) / 2, y: (room - h1) / 2 + (wide ? 0 : 8), w: w1 };

      img.style.width = `${w0}px`;
      img.style.height = `${(w0 * IMG_H) / IMG_W}px`;
      p = -1; // força redesenho
      read();
      draw(target);
    };

    /* ---------------- progresso a partir da posição da seção */
    const read = () => {
      const r = sec.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stg).top) || 0;
      const distance = r.height - stg.offsetHeight;
      target = distance > 0 ? clamp01((stickyTop - r.top) / distance) : 0;
    };

    const draw = (v: number) => {
      const t = easeInOut(clamp01(v / ZOOM_END));
      const w = lerp(start.w, end.w, t);
      img.style.transform = `translate3d(${lerp(start.x, end.x, t).toFixed(2)}px, ${lerp(start.y, end.y, t).toFixed(2)}px, 0) scale(${(w / start.w).toFixed(5)})`;

      const h = clamp01(v / TITLE_END);
      hd.style.opacity = (1 - h).toFixed(3);
      hd.style.transform = `translate3d(0, ${(-28 * h).toFixed(2)}px, 0)`;
      hd.style.visibility = h >= 1 ? 'hidden' : '';

      // Entradas escalonadas que terminam todas até p = 1 (0.80–0.92, 0.84–0.96, 0.88–1.00).
      items.forEach((el, i) => {
        const f = clamp01((v - (0.8 + i * 0.04)) / 0.12);
        el.style.opacity = f.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - f) * 28).toFixed(2)}px, 0)`;
      });
    };

    const frame = (time: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 1 / 60;
      last = time;
      // Suavização leve (como o "scrub" do GSAP): absorve os degraus da roda do mouse.
      p = p < 0 ? target : p + (target - p) * (1 - Math.exp(-dt / 0.09));
      if (Math.abs(target - p) < 0.0005) p = target;
      draw(p);
      if (p !== target) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    p = target;
    draw(p);
    window.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(stg);
    sec.classList.add('is-live');

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      sec.classList.remove('is-live');
    };
  }, []);

  return (
    <section className="cam" id="camera" ref={section} aria-labelledby="camera-title">
      <div className="cam__stage" ref={stage}>
        <div className="cam__head wrap" ref={head}>
          <h2 id="camera-title" className="t-display">
            Três câmeras de 48 MP.
          </h2>
          <p className="t-sub t-muted">
            Principal Fusion de 24 mm, ultra-angular de 13 mm com 120° de campo de visão e teleobjetiva de 100 mm, no
            platô de alumínio do {name}.
          </p>
        </div>

        <picture>
          <source srcSet={`${SRC}.webp`} type="image/webp" />
          <img
            ref={phone}
            className="cam__phone"
            src={`${SRC}.png`}
            width={IMG_W}
            height={IMG_H}
            alt={`${name} em bordô visto de costas, com o platô de três câmeras`}
            decoding="async"
            draggable={false}
          />
        </picture>

        <ul className="cam__facts wrap" ref={facts}>
          {FACTS.map(([n, t], i) => (
            <li key={n} className={`cam__fact cam__fact--${i}`} style={{ '--i': i } as CSSProperties}>
              <span className="cam__num tnum">{n}</span>
              <span className="t-caption t-muted">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
