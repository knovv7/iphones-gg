import type { CartLine } from '../state/cart';

/*
 * Ponto de integração do pagamento.
 *
 * Esta versão NÃO processa pedidos: `placeOrder` sempre responde `not-configured`, sem
 * cobrar nem registrar nada. Para ativar o checkout, implemente aqui a chamada ao seu
 * backend (que cria o pedido e a cobrança no provedor de pagamento — Mercado Pago,
 * Pagar.me, Stripe etc.) e devolva `{ ok: true, orderId }` apenas quando o provedor
 * confirmar. Os dados do cartão devem ser coletados pelo componente seguro do provedor,
 * nunca por um campo desta loja.
 */

export interface OrderRequest {
  lines: Pick<CartLine, 'slug' | 'finishId' | 'gb' | 'qty' | 'unitPrice'>[];
  customer: { name: string; email: string; phone: string };
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
  };
  payment: { method: 'pix' | 'card'; installments: number };
}

export type OrderResult = { ok: true; orderId: string } | { ok: false; reason: 'not-configured' | 'failed'; message: string };

export const PAYMENT_CONFIGURED = false;

export async function placeOrder(_order: OrderRequest): Promise<OrderResult> {
  return {
    ok: false,
    reason: 'not-configured',
    message:
      'O pagamento ainda não está integrado a um provedor. Nenhum pedido foi criado e nenhuma cobrança foi feita.',
  };
}
