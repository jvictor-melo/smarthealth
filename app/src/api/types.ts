// Espelho do contrato do cnes-service (services/cnes-service/src/docs/openapi.ts), via api-gateway.

export interface Unidade {
    codigo_cnes: number;
    nome: string;
    tipo: { codigo: number; descricao: string };
    endereco: { logradouro: string | null; numero: string | null; bairro: string | null; cep: string | null };
    telefone: string | null;
    email: string | null;
    localizacao: { lat: number; lng: number };
    turno_atendimento: string | null;
    atende_sus: boolean;
    possui_centro_obstetrico: boolean | null;
    possui_centro_cirurgico: boolean | null;
    verificada: boolean;
    ativo: boolean;
    data_atualizacao_cnes: string | null;
    /** null quando a busca não teve lat/lng */
    distancia_m: number | null;
}

export type DiaSemana = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

export interface DetalhesVerificados {
    horarios: Partial<Record<DiaSemana, { abre: string; fecha: string }[]>> | null;
    servicos: string[] | null;
    observacoes: string | null;
    atualizado_em: string | null;
}

export interface UnidadeDetalhe extends Omit<Unidade, "distancia_m"> {
    razao_social: string;
    /** Só nas unidades verificadas */
    detalhes_verificados: DetalhesVerificados | null;
}

export interface ListaUnidades {
    meta: { quantidade: number; dados_atualizados_em: string | null };
    unidades: Unidade[];
}
