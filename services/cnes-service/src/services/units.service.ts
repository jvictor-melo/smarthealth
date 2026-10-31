import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../db/client.js";
import { tiposUnidade, unidades } from "../db/schema.js";
import { ultimoSyncComSucesso } from "../sync/sync.service.js";

export interface FiltrosUnidades {
    lat?: number | undefined;
    lng?: number | undefined;
    raioM: number;
    tipos?: number[] | undefined;
    sus?: boolean | undefined;
    limit: number;
    offset: number;
}

const camposBase = {
    codigoCnes: unidades.codigoCnes,
    nome: unidades.nome,
    codigoTipoUnidade: unidades.codigoTipoUnidade,
    descricaoTipoUnidade: tiposUnidade.descricao,
    logradouro: unidades.logradouro,
    numero: unidades.numero,
    bairro: unidades.bairro,
    cep: unidades.cep,
    telefone: unidades.telefone,
    email: unidades.email,
    lat: sql<number>`ST_Y(${unidades.localizacao}::geometry)`,
    lng: sql<number>`ST_X(${unidades.localizacao}::geometry)`,
    turnoAtendimento: unidades.turnoAtendimento,
    atendeSus: unidades.atendeSus,
    possuiCentroObstetrico: unidades.possuiCentroObstetrico,
    possuiCentroCirurgico: unidades.possuiCentroCirurgico,
    verificada: unidades.verificada,
    ativo: unidades.ativo,
    dataAtualizacaoCnes: unidades.dataAtualizacaoCnes,
};

const camposManuais = {
    razaoSocial: unidades.razaoSocial,
    horarios: unidades.horarios,
    servicos: unidades.servicos,
    observacoes: unidades.observacoes,
    manualAtualizadoEm: unidades.manualAtualizadoEm,
};

interface LinhaBase {
    codigoCnes: number;
    nome: string;
    codigoTipoUnidade: number;
    descricaoTipoUnidade: string;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cep: string | null;
    telefone: string | null;
    email: string | null;
    lat: number;
    lng: number;
    turnoAtendimento: string | null;
    atendeSus: boolean;
    possuiCentroObstetrico: boolean | null;
    possuiCentroCirurgico: boolean | null;
    verificada: boolean;
    ativo: boolean;
    dataAtualizacaoCnes: string | null;
}

function toUnidadeDto(linha: LinhaBase) {
    return {
        codigo_cnes: linha.codigoCnes,
        nome: linha.nome,
        tipo: { codigo: linha.codigoTipoUnidade, descricao: linha.descricaoTipoUnidade },
        endereco: { logradouro: linha.logradouro, numero: linha.numero, bairro: linha.bairro, cep: linha.cep },
        telefone: linha.telefone,
        email: linha.email,
        localizacao: { lat: linha.lat, lng: linha.lng },
        turno_atendimento: linha.turnoAtendimento,
        atende_sus: linha.atendeSus,
        possui_centro_obstetrico: linha.possuiCentroObstetrico,
        possui_centro_cirurgico: linha.possuiCentroCirurgico,
        verificada: linha.verificada,
        ativo: linha.ativo,
        data_atualizacao_cnes: linha.dataAtualizacaoCnes,
    };
}

export async function dadosAtualizadosEm(): Promise<Date | null> {
    const ultimo = await ultimoSyncComSucesso();
    return ultimo?.finalizadoEm ?? null;
}

export async function listarUnidades(filtros: FiltrosUnidades) {
    const temPonto = filtros.lat !== undefined && filtros.lng !== undefined;
    const ponto = temPonto ? sql`ST_SetSRID(ST_MakePoint(${filtros.lng}, ${filtros.lat}), 4326)::geography` : null;
    const distancia = ponto ? sql<number>`round(ST_Distance(${unidades.localizacao}, ${ponto}))::int` : sql<null>`NULL::int`;

    const condicoes: SQL[] = [eq(unidades.ativo, true)];
    if (ponto) condicoes.push(sql`ST_DWithin(${unidades.localizacao}, ${ponto}, ${filtros.raioM})`);
    if (filtros.tipos?.length) condicoes.push(inArray(unidades.codigoTipoUnidade, filtros.tipos));
    if (filtros.sus !== undefined) condicoes.push(eq(unidades.atendeSus, filtros.sus));

    const linhas = await db
        .select({ ...camposBase, distanciaM: distancia })
        .from(unidades)
        .innerJoin(tiposUnidade, eq(tiposUnidade.codigo, unidades.codigoTipoUnidade))
        .where(and(...condicoes))
        .orderBy(ponto ? sql`${unidades.localizacao} <-> ${ponto}` : asc(unidades.nome), asc(unidades.codigoCnes))
        .limit(filtros.limit)
        .offset(filtros.offset);

    return linhas.map(({ distanciaM, ...linha }) => ({ ...toUnidadeDto(linha), distancia_m: distanciaM }));
}

export async function buscarUnidade(codigoCnes: number) {
    const [linha] = await db
        .select({ ...camposBase, ...camposManuais })
        .from(unidades)
        .innerJoin(tiposUnidade, eq(tiposUnidade.codigo, unidades.codigoTipoUnidade))
        .where(eq(unidades.codigoCnes, codigoCnes))
        .limit(1);

    if (!linha) return null;

    return {
        ...toUnidadeDto(linha),
        razao_social: linha.razaoSocial,
        // Dados levantados manualmente; null quando ainda não houve entrevista
        detalhes_verificados: linha.verificada
            ? {
                  horarios: linha.horarios,
                  servicos: linha.servicos,
                  observacoes: linha.observacoes,
                  atualizado_em: linha.manualAtualizadoEm,
              }
            : null,
    };
}

export async function listarTiposUnidade(apenasUsados: boolean) {
    const base = db
        .select({ codigo: tiposUnidade.codigo, descricao: tiposUnidade.descricao, total_unidades: sql<number>`count(${unidades.codigoCnes})::int` })
        .from(tiposUnidade)
        .leftJoin(unidades, and(eq(unidades.codigoTipoUnidade, tiposUnidade.codigo), eq(unidades.ativo, true)))
        .groupBy(tiposUnidade.codigo, tiposUnidade.descricao)
        .orderBy(asc(tiposUnidade.codigo));

    return apenasUsados ? base.having(sql`count(${unidades.codigoCnes}) > 0`) : base;
}

export async function verificarBanco(): Promise<boolean> {
    try {
        await db.execute(sql`SELECT 1`);
        return true;
    } catch {
        return false;
    }
}
