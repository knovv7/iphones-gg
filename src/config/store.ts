/**
 * Configuração comercial da loja.
 *
 * Tudo o que está aqui é política da loja, não dado do produto. Os valores atuais são
 * DEMONSTRATIVOS: ajuste-os à política real antes de publicar.
 */
export const STORE = {
  name: 'Monolito',
  legalNote:
    'A Monolito é uma loja independente, sem vínculo com a Apple Inc. iPhone é marca registrada da Apple Inc.',

  /** Exibe avisos de conteúdo demonstrativo (preços de referência, estoque, checkout não integrado). */
  demoMode: true,

  pricing: {
    /** Origem dos preços exibidos. */
    sourceNote:
      'Preços de referência: preço sugerido pela Apple Brasil no lançamento de cada modelo. Estoque demonstrativo.',
    /** Parcelamento no cartão. `0` desativa. */
    maxInstallments: 12,
    interestFree: true,
    /** Desconto para pagamento à vista no Pix (0.1 = 10%). `0` desativa. */
    pixDiscount: 0.1,
  },

  shipping: {
    /** Prazo de despacho em dias úteis após a confirmação do pagamento. `null` oculta a informação. */
    dispatchBusinessDays: 1 as number | null,
    /** Frete grátis a partir deste subtotal. `null` desativa. */
    freeShippingFrom: null as number | null,
  },

  /** Limite de unidades do mesmo item por pedido. */
  maxQuantityPerItem: 3,
} as const;
