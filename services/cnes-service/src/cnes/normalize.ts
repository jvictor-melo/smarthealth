import type { EstabelecimentoCru, TipoUnidadeCru } from "./types.js";

/** Campos da unidade que vêm da API (o que o sync escreve no banco). */
export interface UnidadeCnes {
    codigoCnes: number;
    nome: string;
    razaoSocial: string;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cep: string | null;
    telefone: string | null;
    email: string | null;
    localizacao: { lat: number; lng: number };
    codigoTipoUnidade: number;
    turnoAtendimento: string | null;
    atendeSus: boolean;
    possuiCentroObstetrico: boolean | null;
    possuiCentroCirurgico: boolean | null;
    naturezaJuridica: string | null;
    dataAtualizacaoCnes: string | null;
}

export type ResultadoNormalizacao =
    | { ok: true; unidade: UnidadeCnes }
    | { ok: false; codigoCnes: unknown; motivo: string };

/** Trim; string vazia vira null. */
export function texto(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
}

/** Só dígitos; null se não sobrar nada. Telefones vêm em formatos misturados ("8632288752", "(86) 99437-0620"). */
export function digitos(value: unknown): string | null {
    const raw = texto(value);
    if (raw === null) return null;
    const onlyDigits = raw.replace(/\D/g, "");
    return onlyDigits === "" ? null : onlyDigits;
}

/** "S/N", "SN" e "0" significam sem número. */
export function numeroEndereco(value: unknown): string | null {
    const raw = texto(value);
    if (raw === null) return null;
    return /^(S\/?N|0+)$/i.test(raw) ? null : raw;
}

/** CEP com 8 dígitos ou null. */
export function cep(value: unknown): string | null {
    const raw = digitos(value);
    return raw !== null && raw.length === 8 ? raw : null;
}

export function email(value: unknown): string | null {
    const raw = texto(value);
    return raw !== null && raw.includes("@") ? raw.toLowerCase() : null;
}

/** "SIM" → true; qualquer outra coisa → false. */
export function simNao(value: unknown): boolean {
    return texto(value)?.toUpperCase() === "SIM";
}

/** 1 → true, 0 → false, ausente → null. */
export function flag(value: unknown): boolean | null {
    if (value === null || value === undefined || value === "") return null;
    return Number(value) === 1;
}

/** Código de natureza jurídica com 4 dígitos ("1155"); qualquer outra coisa vira null. */
export function naturezaJuridica(value: unknown): string | null {
    const raw = digitos(value);
    return raw !== null && raw.length === 4 ? raw : null;
}

export function dataIso(value: unknown): string | null {
    const raw = texto(value);
    return raw !== null && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function coordenada(value: unknown, limite: number): number | null {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n !== 0 && Math.abs(n) <= limite ? n : null;
}

export function normalizarEstabelecimento(cru: EstabelecimentoCru): ResultadoNormalizacao {
    const codigoCnes = Number(cru.codigo_cnes);
    if (!Number.isInteger(codigoCnes) || codigoCnes <= 0) {
        return { ok: false, codigoCnes: cru.codigo_cnes, motivo: "codigo_cnes inválido" };
    }

    const razaoSocial = texto(cru.nome_razao_social);
    const nome = texto(cru.nome_fantasia) ?? razaoSocial;
    if (nome === null) return { ok: false, codigoCnes, motivo: "sem nome_fantasia e sem nome_razao_social" };

    const lat = coordenada(cru.latitude_estabelecimento_decimo_grau, 90);
    const lng = coordenada(cru.longitude_estabelecimento_decimo_grau, 180);
    if (lat === null || lng === null) return { ok: false, codigoCnes, motivo: "sem coordenadas válidas" };

    const codigoTipoUnidade = Number(cru.codigo_tipo_unidade);
    if (!Number.isInteger(codigoTipoUnidade)) return { ok: false, codigoCnes, motivo: "codigo_tipo_unidade inválido" };

    return {
        ok: true,
        unidade: {
            codigoCnes,
            nome,
            razaoSocial: razaoSocial ?? nome,
            logradouro: texto(cru.endereco_estabelecimento),
            numero: numeroEndereco(cru.numero_estabelecimento),
            bairro: texto(cru.bairro_estabelecimento),
            cep: cep(cru.codigo_cep_estabelecimento),
            telefone: digitos(cru.numero_telefone_estabelecimento),
            email: email(cru.endereco_email_estabelecimento),
            localizacao: { lat, lng },
            codigoTipoUnidade,
            turnoAtendimento: texto(cru.descricao_turno_atendimento),
            atendeSus: simNao(cru.estabelecimento_faz_atendimento_ambulatorial_sus),
            possuiCentroObstetrico: flag(cru.estabelecimento_possui_centro_obstetrico),
            possuiCentroCirurgico: flag(cru.estabelecimento_possui_centro_cirurgico),
            naturezaJuridica: naturezaJuridica(cru.descricao_natureza_juridica_estabelecimento),
            dataAtualizacaoCnes: dataIso(cru.data_atualizacao),
        },
    };
}

export function normalizarTipoUnidade(cru: TipoUnidadeCru): { codigo: number; descricao: string } | null {
    const codigo = Number(cru.codigo_tipo_unidade);
    const descricao = texto(cru.descricao_tipo_unidade);
    if (!Number.isInteger(codigo) || descricao === null) return null;
    return { codigo, descricao };
}
