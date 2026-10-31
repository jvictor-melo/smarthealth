import type { HttpGet } from "./http.js";
import type {
    EstabelecimentoCru,
    FiltrosEstabelecimentos,
    ListaEstabelecimentosResposta,
    ListaTiposUnidadeResposta,
    TipoUnidadeCru,
} from "./types.js";

/** Limite máximo aceito pela API em /cnes/estabelecimentos. */
export const CNES_PAGE_LIMIT = 20;

/**
 * Busca todas as páginas.
 * A API não informa o total: termina quando vem uma página com menos itens que o limit.
 * O offset conta ITENS (não páginas, ao contrário do que diz a doc oficial).
 */
export async function paginate<T>(
    fetchPage: (offset: number, limit: number) => Promise<T[]>,
    limit = CNES_PAGE_LIMIT,
    maxPages = 1000,
): Promise<T[]> {
    const items: T[] = [];
    for (let page = 0; page < maxPages; page++) {
        const batch = await fetchPage(page * limit, limit);
        items.push(...batch);
        if (batch.length < limit) return items;
    }
    throw new Error(`Paginação passou de ${maxPages} páginas; abortando para evitar loop infinito`);
}

export function createCnesClient(get: HttpGet) {
    return {
        async listarEstabelecimentos(filtros: FiltrosEstabelecimentos): Promise<EstabelecimentoCru[]> {
            return paginate(async (offset, limit) => {
                const resposta = await get<ListaEstabelecimentosResposta>("/cnes/estabelecimentos", { ...filtros, limit, offset });
                return resposta?.estabelecimentos ?? [];
            });
        },

        async buscarEstabelecimento(codigoCnes: number): Promise<EstabelecimentoCru | null> {
            return get<EstabelecimentoCru>(`/cnes/estabelecimentos/${codigoCnes}`);
        },

        async listarTiposUnidade(): Promise<TipoUnidadeCru[]> {
            const resposta = await get<ListaTiposUnidadeResposta>("/cnes/tipounidades");
            return resposta?.tipos_unidade ?? [];
        },
    };
}

export type CnesClient = ReturnType<typeof createCnesClient>;
