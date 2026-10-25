# Integração do Minimal Collective com uma loja premium de iPhones

## Objetivo

Utilize o site https://minimalcollective.digital/ como referência visual para desenvolver uma loja virtual especializada na venda de iPhones. O arquivo `DESIGN.md` contém a análise visual do site de referência e deve orientar a identidade estética do projeto.

A tarefa é combinar três elementos:

1. **`DESIGN.md`** — guia visual: identidade, cores, tipografia, composição e linguagem estética.
2. **Prompt original da loja** — especificação funcional: objetivo do negócio, páginas, recursos, integrações e requisitos já definidos.
3. **Este documento (`INSTRUCOES.md`)** — orientação de como integrar os dois sem perder funcionalidades nem copiar literalmente o site de referência.

## 1. Regra principal de integração

Não copie o Minimal Collective literalmente e não se limite a aplicar um tema escuro a um e-commerce genérico.

Preserve as funcionalidades e os requisitos do prompt original. Utilize o `DESIGN.md` como direção artística e adapte sua linguagem visual à experiência de compra de iPhones.

Prioridades:

- **Funcionalidade:** mantenha as páginas, os recursos, as integrações e os comportamentos definidos no prompt original.
- **Identidade visual:** aplique os princípios do Minimal Collective aos componentes da loja.
- **Experiência de compra:** facilite a descoberta dos produtos, a comparação entre modelos e a compra.
- **Identidade própria:** crie uma marca independente, sem sugerir que a loja é a própria Apple nem reproduzir literalmente o site de referência.

Se houver conflito entre o prompt original e a referência, preserve a funcionalidade solicitada e adapte sua apresentação visual.

Antes de programar, examine a estrutura do projeto e os componentes existentes. Identifique o que já funciona e evite reescrever ou remover recursos desnecessariamente.

## 2. Direção artística

Use o Minimal Collective como referência de linguagem visual, não como um template pronto.

A loja deve transmitir sofisticação, exclusividade, tecnologia, confiança e minimalismo contemporâneo.

### Paleta de cores

- Preto profundo como fundo principal.
- Tons de preto e grafite para diferenciar superfícies e seções.
- Branco suave para títulos, preços e informações importantes.
- Cinza discreto para descrições e informações secundárias.
- Vermelho como cor de destaque da identidade da loja.

Use o vermelho com moderação em botões principais, indicadores, ícones ativos, pequenos contornos e detalhes interativos. Evite preencher grandes áreas com vermelho.

Prefira bordas finas, divisórias discretas e sombras suaves apenas quando ajudarem a criar profundidade. Evite gradientes genéricos, sombras exageradas e cartões visualmente pesados.

## 3. Adaptação do layout para e-commerce

Transforme a linguagem editorial do site de referência em uma experiência comercial coerente.

### Cabeçalho

Crie um cabeçalho minimalista e funcional com:

- Nome ou logotipo da loja.
- Navegação pelas categorias.
- Pesquisa funcional.
- Acesso ao perfil ou à conta, conforme o projeto.
- Carrinho funcional.
- Menu responsivo para dispositivos móveis.

Mantenha o cabeçalho limpo, com espaçamento generoso e detalhes discretos.

### Seção principal (hero)

Crie uma abertura visual impactante, com um iPhone em destaque, imagem de alta qualidade, fundo escuro e iluminação sofisticada.

Inclua um título curto e expressivo, uma descrição objetiva e chamadas para ação que levem ao catálogo ou ao produto destacado.

Use espaços vazios, tipografia expressiva e composição editorial. O aparelho deve ser o protagonista; evite excesso de textos, selos e elementos decorativos.

### Apresentação editorial dos produtos

Não comece com uma grade convencional ocupando toda a página. Primeiro, crie uma narrativa visual inspirada no Minimal Collective:

- Apresente um iPhone em uma composição ampla.
- Revele detalhes do aparelho, como câmeras, acabamento e cores, em seções posteriores.
- Alterne, quando fizer sentido, imagens grandes, textos curtos e composições assimétricas.
- Conecte visualmente as seções sem comprometer a legibilidade.
- Depois da apresentação editorial, introduza o catálogo funcional.

A composição deve ser intencional e equilibrada, e não assimétrica apenas por decoração.

### Catálogo

Organize os produtos em uma grade responsiva, com imagens nítidas e proporções consistentes.

Cada produto deve exibir, conforme os dados disponíveis:

- Imagem correspondente ao modelo.
- Nome e geração.
- Armazenamento.
- Cor ou variante.
- Preço.
- Condições de parcelamento, se configuradas.
- Botão para ver detalhes ou comprar.

Implemente filtros e ordenação funcionais para critérios relevantes, como modelo, armazenamento, preço e disponibilidade, conforme a arquitetura do projeto.

### Modelos de iPhone

Prepare a estrutura para diferentes gerações, incluindo iPhone 17 e outras linhas que estejam efetivamente disponíveis no catálogo. A arquitetura deve permitir adicionar modelos futuros, como uma eventual linha iPhone 18, sem reconstruir a interface.

Não apresente modelos futuros como lançados, nem invente disponibilidade, preços, cores ou especificações. Use dados reais fornecidos pelo projeto ou identifique claramente qualquer conteúdo demonstrativo.

### Página de produto

Preserve ou implemente, conforme o prompt original, uma página com:

- Galeria de imagens do aparelho.
- Seleção de cor e armazenamento.
- Preço atualizado conforme a variante.
- Especificações verificadas.
- Disponibilidade e entrega, quando configuradas.
- Botão para adicionar ao carrinho.
- Condições de pagamento, se integradas.
- Produtos relacionados.

As seleções devem atualizar os dados exibidos e ser mantidas corretamente ao adicionar o item ao carrinho.

## 4. Tipografia e composição

Reproduza a hierarquia tipográfica do Minimal Collective sem sacrificar a legibilidade.

- Títulos grandes e expressivos nas áreas de campanha.
- Textos secundários menores e discretos.
- Espaçamento cuidadoso entre letras e linhas.
- Alinhamentos precisos e margens generosas.
- Contraste entre títulos e informações auxiliares.

Não use tamanhos grandes em todos os textos. O impacto deve vir da hierarquia, da escala e da composição.

Prefira uma família tipográfica moderna, legível e compatível com o português. Reaproveite a fonte existente se ela for adequada.

## 5. Animações e rolagem

Faça da rolagem uma parte natural da experiência visual, sem prejudicar a navegação.

Quando apropriado, implemente:

- Entrada gradual de textos e imagens ao surgirem na área visível.
- Pequenos deslocamentos verticais e transições suaves.
- Efeitos discretos de hover nos produtos e botões.
- Mudanças fluidas ao selecionar variantes.
- Animações cuidadosas no carrinho lateral.

Evite animações excessivas, atrasos longos, movimentos bruscos e efeitos que prejudiquem o desempenho. Respeite a preferência por movimento reduzido (`prefers-reduced-motion`) e garanta que o conteúdo continue acessível sem animações.

## 6. Funcionalidades

Não transforme o projeto em uma apresentação estática. Preserve os recursos do prompt original e garanta o funcionamento dos elementos existentes, incluindo, quando previstos:

- Pesquisa.
- Navegação e categorias.
- Filtros e ordenação.
- Seleção de variantes.
- Adição e remoção de itens do carrinho.
- Alteração de quantidades.
- Cálculo correto do subtotal.
- Perfil ou conta do usuário.
- Checkout e integrações existentes.

Não deixe botões apenas decorativos. Se um recurso depender de backend, API, autenticação ou serviço externo não configurado, implemente o que for possível e informe claramente o que ainda depende dessa configuração. Não simule uma compra concluída quando ela não tiver sido processada de verdade.

## 7. Imagens

Priorize imagens de alta qualidade que correspondam exatamente aos produtos anunciados. Mantenha uma direção artística consistente entre a campanha, o catálogo e as páginas de produto.

Evite imagens pixeladas, esticadas, repetidas indevidamente ou com proporções inconsistentes. Não use imagens aleatórias de smartphones como se fossem de um modelo específico.

O fundo escuro deve valorizar o aparelho sem alterar visualmente as cores reais do produto.

## 8. Responsividade

Não trate a versão móvel como uma simples redução da versão desktop.

- Adapte o cabeçalho e mantenha pesquisa e carrinho acessíveis.
- Ajuste títulos e imagens sem sobreposição.
- Use grades adequadas à largura da tela.
- Preserve a legibilidade de preços e especificações.
- Garanta que filtros, seletores e botões sejam fáceis de tocar.
- Evite rolagem horizontal acidental, cortes e desalinhamentos.

Verifique o layout em larguras de tela diferentes e corrija problemas de usabilidade.

## 9. Implementação e validação

Antes de alterar o código:

1. Leia o `DESIGN.md`, o prompt original da loja e este documento.
2. Examine a estrutura do projeto e identifique os componentes, bibliotecas e integrações existentes.
3. Determine como aplicar a linguagem visual sem quebrar funcionalidades.
4. Implemente as mudanças diretamente no projeto existente.
5. Teste os principais fluxos e corrija os problemas encontrados.

Verifique erros no console, links e botões sem ação, imagens que não carregam, navegação, cálculo do carrinho, seleção de variantes, responsividade e desempenho das animações.

Reaproveite componentes e integrações úteis. Mantenha o código organizado e preparado para expansão do catálogo.

## 10. Resultado esperado

O resultado deve combinar a identidade editorial do Minimal Collective com uma loja de iPhones premium, responsiva e funcional: fundo preto profundo, tipografia elegante, imagens impactantes, composição assimétrica equilibrada, detalhes discretos em vermelho e navegação simples.

A loja deve parecer uma marca independente especializada em iPhones, e não um template genérico, uma cópia do Minimal Collective ou uma imitação da loja oficial da Apple.

Ao concluir, apresente um resumo curto do que foi preservado do prompt original, de quais diretrizes do `DESIGN.md` foram aplicadas e de quais funcionalidades foram efetivamente testadas.
