import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { BrandTicker } from '../components/BrandTicker';
import { CameraZoom } from '../components/CameraZoom';
import { Catalog } from '../components/Catalog';
import { Device } from '../components/Device';
import { HeroFinishPicker, HeroPhone, heroVars } from '../components/HeroPhone';
import { ProductImage, SHOWCASE_HEIGHT_RATIO } from '../components/ProductImage';
import { DemoNote, Roll } from '../components/ui';
import { getProduct, PRODUCTS } from '../data/products';
import { startingPrice } from '../lib/catalog';
import { formatInstallment, formatMm, formatPrice } from '../lib/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Home.css';

const HERO = getProduct('iphone-18-pro')!;
const HERO_MAX = getProduct('iphone-18-pro-max')!;

const COMPARISONS: [string, string][] = [
  ['iphone-18-pro', 'iphone-17-pro'],
  ['iphone-18-pro-max', 'iphone-18-pro'],
  ['iphone-17-pro-max', 'iphone-17-pro'],
  ['iphone-18-pro-max', 'iphone-17-pro-max'],
];

function Arcs() {
  const circles = [0, 360, 720, 1080, 1440];
  return (
    <svg className="arcs" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {circles.map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={450}
          r={380}
          pathLength={1}
          className="arcs__line"
          style={{ '--i': i } as CSSProperties}
        />
      ))}
      <line x1="0" x2="1440" y1="450" y2="450" pathLength={1} className="arcs__line" style={{ '--i': 5 } as CSSProperties} />
    </svg>
  );
}

function Hero() {
  const price = startingPrice(HERO)!;
  const [finish, setFinish] = useState('bordo');
  // Só as cores iniciais vêm do React; a transição entre cores é do GSAP (ver HeroPhone).
  const [initialVars] = useState(() => heroVars('bordo'));
  return (
    <section className="hero" aria-labelledby="hero-title" style={initialVars}>
      <div className="hero__top">
        <Arcs />
        <div className="hero__stage">
          <HeroPhone finishId={finish} />
        </div>
        <h1 id="hero-title" className="hero__title">
          Luz sob{' '}
          <br />
          controle.
        </h1>
      </div>

      <div className="hero__copy wrap">
        <div className="hero__lead">
          <p className="t-sub">
            {HERO.name} e {HERO_MAX.name.replace('iPhone ', '')}, com câmera principal de abertura variável e chip A20 Pro.
            A partir de <span className="tnum">{formatPrice(price, true)}</span>
            <span className="t-muted"> ou {formatInstallment(price)}.</span>
          </p>
          <div className="hero__ctas">
            <Link to={`/iphone/${HERO.slug}?cor=${finish}`} className="btn btn--primary">
              Comprar {HERO.name}
            </Link>
            <a href="#catalogo" className="btn btn--ghost roll-host">
              <Roll>Ver todos os modelos</Roll>
            </a>
          </div>
        </div>
        <div className="hero__aside t-caption t-muted">
          <HeroFinishPicker
            finishes={HERO.finishes}
            value={finish}
            onChange={setFinish}
            price={formatPrice(price, true)}
          />
          <a href="#camera" className="hero__scroll">
            Role para ver
            <span aria-hidden="true" className="hero__scroll-line" />
          </a>
        </div>
      </div>
    </section>
  );
}

/** Fotos das traseiras do 18 Pro por acabamento (geradas por `npm run images`, todas no mesmo tamanho). */
const FINISH_PHOTOS: Record<string, string> = {
  bordo: '/images/iphone-costas',
  glacial: '/images/iphone-costas-glacial',
  prateado: '/images/iphone-costas-prateado',
  preto: '/images/iphone-costas-preto',
};

function FinishesSection() {
  const [active, setActive] = useState(HERO.finishes[0].id);
  const offsets = [0, 64, 16, 88];
  return (
    <section className="finishes section" aria-labelledby="finishes-title">
      <div className="finishes__grid wrap">
        <div className="finishes__text">
          <h2 id="finishes-title" className="t-display reveal">
            Quatro acabamentos.
          </h2>
          <p className="t-sub t-muted reveal" style={{ '--i': 1 } as CSSProperties}>
            Alumínio unibody com traseira em Ceramic Shield. O bordô estreia nesta geração.
          </p>
          <div className="finishes__list reveal" style={{ '--i': 2 } as CSSProperties} role="radiogroup" aria-label="Acabamento">
            {HERO.finishes.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active === f.id}
                className="finishes__opt"
                onClick={() => setActive(f.id)}
                onMouseEnter={() => setActive(f.id)}
                onFocus={() => setActive(f.id)}
              >
                <span className="finishes__dot" style={{ background: f.hex }} aria-hidden="true" />
                {f.name}
              </button>
            ))}
          </div>
          <Link
            to={`/iphone/${HERO.slug}?cor=${active}`}
            className="btn btn--ghost reveal"
            style={{ '--i': 3 } as CSSProperties}
          >
            Comprar em {HERO.finishes.find((f) => f.id === active)!.name}
          </Link>
        </div>
        <div className="mosaic" aria-hidden="true">
          {HERO.finishes.map((f, i) => (
            <div
              key={f.id}
              className={`mosaic__item${active === f.id ? ' is-active' : ''}`}
              style={{ '--x': i, '--y': `${offsets[i]}px`, '--i': i } as CSSProperties}
              onMouseEnter={() => setActive(f.id)}
            >
              {FINISH_PHOTOS[f.id] ? (
                <picture>
                  <source srcSet={`${FINISH_PHOTOS[f.id]}.webp`} type="image/webp" />
                  <img
                    className="mosaic__device"
                    src={`${FINISH_PHOTOS[f.id]}.png`}
                    width={729}
                    height={1461}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </picture>
              ) : (
                <Device product={HERO} finish={f} className="mosaic__device" decorative />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LineupSection() {
  const byHeight = [...PRODUCTS].sort((a, b) => a.dimensions.height - b.dimensions.height || a.generation - b.generation);
  const shortest = byHeight[0];
  const tallest = byHeight[byHeight.length - 1];
  return (
    <section className="lineup section" aria-labelledby="lineup-title">
      <div className="lineup__head wrap">
        <h2 id="lineup-title" className="t-display reveal">
          A linha, em escala real.
        </h2>
        <p className="t-sub t-muted reveal" style={{ '--i': 1 } as CSSProperties}>
          Do {shortest.name}, com {formatMm(shortest.dimensions.height)} de altura, ao {tallest.name},
          com {formatMm(tallest.dimensions.height)}. Toque em um modelo para escolher cor e capacidade.
        </p>
      </div>
      <ul className="lineup__row wrap">
        {byHeight.map((p, i) => {
          const price = startingPrice(p);
          return (
            <li key={p.slug} className="reveal" style={{ '--i': i } as CSSProperties}>
              <Link to={`/iphone/${p.slug}`} className="lineup__item">
                <ProductImage
                  product={p}
                  finish={p.finishes[0]}
                  className="lineup__device"
                  style={{
                    width: `calc(${p.dimensions.width + 6} * var(--mm))`,
                    height: `calc(${p.dimensions.height + 6} * var(--mm))`,
                  }}
                  photoStyle={{ height: `calc(${p.dimensions.height * SHOWCASE_HEIGHT_RATIO} * var(--mm))`, width: 'auto' }}
                  decorative
                />
                <span className="lineup__name">{p.name}</span>
                <span className="t-caption t-muted tnum">
                  {price !== null ? formatPrice(price, true) : 'Em breve'} · {formatMm(p.dimensions.height)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CompareSection() {
  return (
    <section className="cmp-cta section" aria-labelledby="cmp-title">
      <div className="cmp-cta__grid wrap">
        <div>
          <h2 id="cmp-title" className="t-display reveal">
            Em dúvida entre dois?
          </h2>
          <p className="t-sub t-muted reveal" style={{ '--i': 1 } as CSSProperties}>
            Tela, câmeras, bateria, espessura e preço, lado a lado.
          </p>
        </div>
        <ul className="cmp-cta__list">
          {COMPARISONS.map(([a, b], i) => {
            const A = getProduct(a)!;
            const B = getProduct(b)!;
            const dh = A.keySpecs.videoHours - B.keySpecs.videoHours;
            const dp = (startingPrice(A) ?? 0) - (startingPrice(B) ?? 0);
            return (
              <li key={a + b} className="reveal" style={{ '--i': i } as CSSProperties}>
                <Link to={`/comparar?modelos=${a},${b}`} className="cmp-cta__row roll-host">
                  <span className="t-h">
                    <Roll>{`${A.name} e ${B.name.replace('iPhone ', '')}`}</Roll>
                  </span>
                  <span className="t-caption t-muted tnum">
                    {dh !== 0 && `${dh > 0 ? '+' : '−'}${Math.abs(dh)} h de vídeo · `}
                    {dp > 0 ? `${formatPrice(dp, true)} a mais` : dp < 0 ? `${formatPrice(-dp, true)} a menos` : 'mesmo preço'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Home() {
  useDocumentTitle(null);
  return (
    <>
      <Hero />
      <BrandTicker />
      <CameraZoom name={HERO.name} />
      <FinishesSection />
      <LineupSection />
      <section className="section" id="catalogo" aria-labelledby="catalog-title">
        <div className="catalog-head wrap">
          <h2 id="catalog-title" className="t-display reveal">
            Catálogo
          </h2>
          <div className="reveal" style={{ '--i': 1 } as CSSProperties}>
            <p className="t-sub t-muted">Filtre por geração, capacidade, preço e disponibilidade.</p>
            <DemoNote />
          </div>
        </div>
        <div className="wrap">
          <Catalog />
        </div>
      </section>
      <CompareSection />
    </>
  );
}
