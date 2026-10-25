/**
 * Consulta de endereço pelo CEP no ViaCEP (serviço público, sem chave).
 * https://viacep.com.br
 */
export interface Address {
  street: string;
  district: string;
  city: string;
  state: string;
}

export type CepResult = { ok: true; address: Address } | { ok: false; reason: 'invalid' | 'not-found' | 'network' };

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function formatCep(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepResult> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return { ok: false, reason: 'invalid' };
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
    if (!res.ok) return { ok: false, reason: res.status === 400 ? 'invalid' : 'network' };
    const data = (await res.json()) as Record<string, string | boolean>;
    if (data.erro) return { ok: false, reason: 'not-found' };
    return {
      ok: true,
      address: {
        street: String(data.logradouro ?? ''),
        district: String(data.bairro ?? ''),
        city: String(data.localidade ?? ''),
        state: String(data.uf ?? ''),
      },
    };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return { ok: false, reason: 'network' };
  }
}
