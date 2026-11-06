import { API_URL, type Coordenada } from "../config";
import type { ListaUnidades, UnidadeDetalhe } from "./types";

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Sem isso, um gateway inalcançável deixa o app carregando para sempre (o fetch do celular demora muito a desistir) */
export const TEMPO_LIMITE_MS = 10000;

/** status null = não chegou resposta (sem rede, gateway desligado) */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number | null,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function getJson<T>(caminho: string, fetchFn: FetchFn, nuloEm404 = false): Promise<T | null> {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    let resposta: Response;
    try {
        resposta = await fetchFn(`${API_URL}${caminho}`, { signal: controle.signal });
    } catch (erro) {
        throw new ApiError(`Falha de rede em ${caminho}: ${String(erro)}`, null);
    } finally {
        clearTimeout(relogio);
    }
    if (nuloEm404 && resposta.status === 404) return null;
    if (!resposta.ok) throw new ApiError(`HTTP ${resposta.status} em ${caminho}`, resposta.status);
    return (await resposta.json()) as T;
}

export async function listarUnidades(
    p: { centro: Coordenada; raioM: number; limit: number },
    fetchFn: FetchFn = fetch,
): Promise<ListaUnidades> {
    const query = new URLSearchParams({
        lat: String(p.centro.lat),
        lng: String(p.centro.lng),
        raio_m: String(p.raioM),
        limit: String(p.limit),
    });
    return (await getJson<ListaUnidades>(`/units?${query}`, fetchFn))!;
}

export function buscarUnidade(codigoCnes: number, fetchFn: FetchFn = fetch): Promise<UnidadeDetalhe | null> {
    return getJson<UnidadeDetalhe>(`/units/${codigoCnes}`, fetchFn, true);
}
