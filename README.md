# Monolito — loja de iPhones

Loja virtual de iPhones com a linguagem visual do Minimal Collective (`minimal-collective-DESIGN.md`)
adaptada ao comércio, seguindo `INSTRUCOES.md`. React 18 + Vite + TypeScript, sem backend.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes da sacola, filtros, busca e parcelamento
npm run build      # gera dist/ (sirva com fallback para index.html: as rotas são do lado do cliente)
```

Precisa do Node 20 ou mais novo.

## Publicar (GitHub + Vercel)

1. **GitHub:** crie um repositório vazio (sem README, sem .gitignore) e, nesta pasta:

   ```bash
   git remote add origin https://github.com/<seu-usuario>/<repositorio>.git
   git push -u origin main
   ```

2. **Vercel:** em vercel.com, *Add New → Project*, importe o repositório e clique em *Deploy*. Não há
   variáveis de ambiente. As configurações já estão em `vercel.json`: instala com `npm ci`, roda
   `npm run build` (typecheck + Vite), publica `dist/` e manda toda rota para `index.html`, para que
   endereços como `/loja?geracao=18` ou `/iphone/iphone-17-pro` abram direto ou ao recarregar.
3. Depois disso, cada `git push` na `main` publica de novo, e cada pull request ganha um link de prévia.

A pasta `imagens iphone/` guarda os originais das fotos e só é usada pelo `npm run images`; o site usa
as versões tratadas em `public/images/`.

## Páginas

| Rota | O que faz |
| --- | --- |
| `/` | Campanha editorial (hero, faixa da marca, câmeras, acabamentos, comparativos, linha em escala real) e o catálogo com filtros |
| `/loja` | Catálogo. Filtros e busca ficam na URL: `?geracao=18&gb=512&preco=8000-12000&estoque=1&ordem=menor-preco&q=bordo` |
| `/iphone/:slug` | Produto: galeria (traseira, frente, perfil, câmeras), cor e capacidade (`?cor=&gb=`), preço por variante, estoque, especificações com fonte, relacionados |
| `/comparar` | Até três modelos lado a lado (`?modelos=a,b,c`), com opção "só diferenças" |
| `/checkout` | Contato, entrega com busca de CEP (ViaCEP), Pix ou cartão parcelado, resumo |
| `/conta` | Favoritos, endereço salvo e pedidos (neste navegador) |

## Onde mexer

- **Catálogo:** `src/data/products.ts`. Cada modelo traz especificações conferidas nas páginas oficiais
  da Apple Brasil (links em `sources`). Para uma nova geração, adicione um objeto: filtros, navegação,
  comparação e a linha em escala se ajustam sozinhos. Modelo anunciado e ainda sem venda:
  `status: 'upcoming'` (não mostra preço nem botão de compra). Hoje o catálogo tem só o iPhone 18 Pro,
  18 Pro Max, 17 Pro e 17 Pro Max. O filtro "Linha" só aparece quando há mais de uma linha, e as faixas de
  preço só quando algum modelo cai nelas (`facetPriceRanges` em `src/lib/catalog.ts`).
- **Política comercial:** `src/config/store.ts` (nome, parcelas, desconto no Pix, prazo de despacho,
  limite por pedido, avisos de demonstração).
- **Estoque:** `src/data/inventory.ts`. Hoje é demonstrativo; troque `getStock` pela consulta ao seu sistema.
- **Imagens:** os aparelhos são desenhados em SVG a partir das dimensões oficiais
  (`src/components/Device.tsx`), com o layout de câmera de cada modelo. Para usar fotos reais na página
  do produto, coloque os arquivos em `public/` e preencha `photos` por acabamento e vista:
  `photos: { bordo: { back: '/images/…', front: '/images/…', camera: '/images/…' } }` (vistas: `back`,
  `front`, `side`, `camera`). Com fotos, a galeria daquela cor mostra só as vistas fotografadas; a
  sacola e a comparação continuam com os desenhos.
  Hoje o 18 Pro, o 18 Pro Max, o 17 Pro e o 17 Pro Max usam as fotos de `imagens iphone/` em todas as
  cores (traseira, frente e câmeras), em `PHOTOS_18_PRO` e `PHOTOS_17_PRO` (`src/data/products.ts`), e as
  vitrines de frente e verso nos cards (`SHOWCASE_18_PRO` e `SHOWCASE_17_PRO`).
- **Fotos do iPhone 18 Pro:** os originais ficam em `imagens iphone/` (traseiras `<cor>.png`, frentes
  `frente <cor>.png` e vitrines `<cor> frente e verso.png`). `npm run images` (`scripts/prepare-hero-images.mjs`) detecta se cada PNG tem
  transparência real ou um xadrez desenhado na imagem (e remove o xadrez), recorta, deixa as quatro
  traseiras no mesmo tamanho e gera PNG + WebP em `public/images/`. Usadas no hero, na seção de câmeras,
  na galeria do 18 Pro e do 18 Pro Max e no mosaico "Quatro acabamentos" (`FINISH_PHOTOS` em `src/pages/Home.tsx`).
  As fotos de frente e verso (`<cor> frente e verso.png`) viram `iphone-vitrine-<cor>` e aparecem onde há
  preço — cards do catálogo e linha em escala — no 18 Pro e no 18 Pro Max, nas quatro cores (`showcase` em
  `src/data/products.ts`).
- **iPhone 3D do hero:** `src/components/HeroPhone.tsx`, com a mecânica do prompt "Soda" adaptada: o
  aparelho inclina para o cursor (giroscópio ou dedo no celular; no iPhone, o iOS pede permissão ao tocar
  no aparelho), flutua, reflete a luz, faz sombra e gira ao rolar; luzes desfocadas e pontos de luz que
  sobem ficam ao fundo. Os cartões de cor trocam o acabamento: o fundo muda de tom e o aparelho gira 720°
  com desfoque, trocando a foto no pico (GSAP). Cores e fotos por acabamento em `LOOKS`. Com
  `prefers-reduced-motion` nada se move e a troca de cor é imediata.
- **Faixa da marca:** `src/components/BrandTicker.tsx`, logo abaixo do hero: passa o nome da loja com o
  logo da Apple em laço contínuo; para no hover e fica parada com `prefers-reduced-motion`. O texto vem de
  `STORE.name` (ou da prop `text`).
- **"Três câmeras de 48 MP":** `src/components/CameraZoom.tsx`. A seção fica presa (`position: sticky`)
  por 1,75 tela de rolagem (`--pin` em `CameraZoom.css`); nesse trecho a foto sai do close nas câmeras
  até o aparelho inteiro, o título some e os números entram no fim. Acompanha a rolagem nos dois
  sentidos. Com `prefers-reduced-motion` a seção não prende e mostra o aparelho inteiro.
- **Cores e tipografia:** `src/styles/tokens.css`.

## O que ainda depende de configuração externa

| Recurso | Situação |
| --- | --- |
| Pagamento | **Não integrado.** `src/services/checkout.ts` responde `not-configured`: nenhum pedido é criado e nada é cobrado. Ligue ali o seu backend/provedor (Mercado Pago, Pagar.me, Stripe…). |
| Frete | Exibido como "a calcular". Precisa de contrato com transportadora ou API de frete. |
| Login | Não há autenticação. Sacola, favoritos e endereço ficam no `localStorage` do navegador. |
| Preços | Preço sugerido pela Apple Brasil no lançamento de cada modelo, usado como referência. |
| Estoque | Demonstrativo (algumas variantes esgotadas ou com poucas unidades, para exercitar a interface). |
| CEP | Integrado ao ViaCEP (público, sem chave). |

Os avisos de conteúdo demonstrativo somem com `demoMode: false` em `src/config/store.ts`.

A Monolito é uma loja independente, sem vínculo com a Apple Inc. iPhone é marca registrada da Apple Inc.
