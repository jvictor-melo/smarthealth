import { create } from "zustand";
import type { Rede } from "../api/types";
import { FILTROS_VAZIOS, type Filtros } from "../busca/filtros";
import type { Grupo } from "../mapa/grupos";

/** Só na memória: os filtros voltam ao normal quando o app é fechado (decisão da equipe) */
interface EstadoFiltros extends Filtros {
    alternarGrupo: (grupo: Grupo) => void;
    alternarRede: (rede: Rede) => void;
    alternarSus: () => void;
    limpar: () => void;
}

function alternar<T>(lista: T[], item: T): T[] {
    return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export const useFiltros = create<EstadoFiltros>((set) => ({
    ...FILTROS_VAZIOS,
    alternarGrupo: (grupo) => set((s) => ({ grupos: alternar(s.grupos, grupo) })),
    alternarRede: (rede) => set((s) => ({ redes: alternar(s.redes, rede) })),
    alternarSus: () => set((s) => ({ soSus: !s.soSus })),
    limpar: () => set(FILTROS_VAZIOS),
}));
