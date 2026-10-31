/**
 * Formato cru dos campos que usamos da API de dados abertos do CNES.
 * A API devolve vários outros campos; eles são ignorados.
 */
export interface EstabelecimentoCru {
    codigo_cnes: number;
    nome_razao_social: string;
    nome_fantasia: string | null;
    codigo_tipo_unidade: number;
    codigo_cep_estabelecimento: string | null;
    endereco_estabelecimento: string | null;
    numero_estabelecimento: string | null;
    /** Vem truncado em 20 caracteres pela própria API. */
    bairro_estabelecimento: string | null;
    numero_telefone_estabelecimento: string | null;
    endereco_email_estabelecimento: string | null;
    latitude_estabelecimento_decimo_grau: number | null;
    longitude_estabelecimento_decimo_grau: number | null;
    /** Texto livre, ex: "ATENDIMENTOS NOS TURNOS DA MANHA E A TARDE". */
    descricao_turno_atendimento: string | null;
    /** "SIM" | "NAO" */
    estabelecimento_faz_atendimento_ambulatorial_sus: string | null;
    /** 1 | 0 | null */
    estabelecimento_possui_centro_cirurgico: number | null;
    /** 1 | 0 | null */
    estabelecimento_possui_centro_obstetrico: number | null;
    codigo_motivo_desabilitacao_estabelecimento: string | number | null;
    /** YYYY-MM-DD */
    data_atualizacao: string | null;
}

export interface TipoUnidadeCru {
    codigo_tipo_unidade: number;
    descricao_tipo_unidade: string;
}

export interface ListaEstabelecimentosResposta {
    estabelecimentos: EstabelecimentoCru[];
}

export interface ListaTiposUnidadeResposta {
    tipos_unidade: TipoUnidadeCru[];
}

/** Filtros aceitos por GET /cnes/estabelecimentos (todos opcionais). */
export interface FiltrosEstabelecimentos {
    codigo_municipio?: string;
    codigo_uf?: string;
    codigo_tipo_unidade?: number;
    /** 1 = ativo, 0 = inativo */
    status?: 0 | 1;
    estabelecimento_possui_centro_cirurgico?: 0 | 1;
    estabelecimento_possui_centro_obstetrico?: 0 | 1;
    /** YYYY-MM-DD: traz só o que foi atualizado a partir da data. */
    data_atualizacao?: string;
}
