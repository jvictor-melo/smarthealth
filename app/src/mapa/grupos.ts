import { cor } from "../tema";

/**
 * Grupos de atendimento que a pessoa entende, a partir dos tipos do CNES.
 * Lugar único da regra: pinos, legenda, lista, filtros e tela da unidade usam daqui.
 */
export type Grupo = "urgencia" | "hospital" | "basica" | "especialidades";

export interface InfoGrupo {
    id: Grupo;
    nome: string;
    cor: string;
    /** Frase curta para quem não conhece o tipo (ex.: o que é uma policlínica) */
    explicacao?: string;
}

/** Na ordem em que aparecem na legenda e no painel de filtros */
export const GRUPOS: readonly InfoGrupo[] = [
    { id: "urgencia", nome: "Urgência", cor: cor.urgencia },
    { id: "hospital", nome: "Hospital", cor: cor.hospital },
    { id: "basica", nome: "Posto / UBS", cor: cor.basica },
    {
        id: "especialidades",
        nome: "Especialidades e exames",
        cor: cor.especialidades,
        explicacao: "Consultas com especialistas e exames, sem urgência.",
    },
];

const TIPOS_POR_GRUPO: Record<Grupo, readonly number[]> = {
    urgencia: [20, 73],
    hospital: [5, 7, 15],
    basica: [1, 2],
    especialidades: [4],
};

/** null para tipos fora dos grupos (só acontece se uma unidade verificada mudar de tipo no CNES) */
export function grupoDoTipo(codigo: number): Grupo | null {
    for (const g of GRUPOS) if (TIPOS_POR_GRUPO[g.id].includes(codigo)) return g.id;
    return null;
}

export function infoDoGrupo(grupo: Grupo): InfoGrupo {
    return GRUPOS.find((g) => g.id === grupo)!;
}

/** Cor do pino e da marca da lista */
export function corDoTipo(codigo: number): string {
    const grupo = grupoDoTipo(codigo);
    return grupo ? infoDoGrupo(grupo).cor : cor.outros;
}
