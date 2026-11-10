import type { Rede, Unidade } from "../api/types";
import { grupoDoTipo, type Grupo } from "../mapa/grupos";

/** O que está marcado no painel de Filtros. Lista vazia = aquele bloco não filtra nada. */
export interface Filtros {
    grupos: Grupo[];
    redes: Rede[];
    soSus: boolean;
}

export const FILTROS_VAZIOS: Filtros = { grupos: [], redes: [], soSus: false };

/**
 * Dentro de um bloco vale "ou" (Pública ou Filantrópica); entre blocos vale "e"
 * (Pública e Urgência = só urgências públicas). Mantém a ordem recebida.
 */
export function aplicarFiltros(unidades: Unidade[], filtros: Filtros): Unidade[] {
    return unidades.filter((u) => {
        if (filtros.grupos.length) {
            const grupo = grupoDoTipo(u.tipo.codigo);
            if (!grupo || !filtros.grupos.includes(grupo)) return false;
        }
        if (filtros.redes.length && (!u.rede || !filtros.redes.includes(u.rede))) return false;
        if (filtros.soSus && !u.atende_sus) return false;
        return true;
    });
}

/** Quantos filtros estão ligados, para o botão mostrar "Filtros (2)" */
export function contarFiltros(filtros: Filtros): number {
    return filtros.grupos.length + filtros.redes.length + (filtros.soSus ? 1 : 0);
}
