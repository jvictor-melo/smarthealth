import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Logger } from "pino";
import type pg from "pg";
import { createCnesClient, type CnesClient } from "../cnes/client.js";
import { ativoPelaBuscaIndividual, planejarSync, type RegistroRecebido, type RegrasFiltro } from "../cnes/filters.js";
import { createHttpGet } from "../cnes/http.js";
import { normalizarTipoUnidade } from "../cnes/normalize.js";
import { CNES_VERIFICADAS, TIPOS_PERMITIDOS } from "../config/cnes.config.js";
import { env } from "../config/env.js";
import { db as defaultDb, pool as defaultPool, type Db } from "../db/client.js";
import { syncExecucoes, tiposUnidade, unidades } from "../db/schema.js";
import { logger as defaultLogger } from "../lib/logger.js";
import { upsertSetUnidades } from "./columns.js";

export type ModoSync = "full" | "incremental";

export interface ResultadoSync {
    execucaoId: number;
    modo: ModoSync;
    desde: string | null;
    recebidas: number;
    upserts: number;
    inativadas: number;
    invalidas: number;
    duracaoMs: number;
}

export class SyncEmAndamentoError extends Error {
    constructor() {
        super("Já existe um sync do CNES em andamento");
        this.name = "SyncEmAndamentoError";
    }
}

/** Chave do pg_advisory_lock que impede dois syncs simultâneos (cron + script manual). */
const LOCK_KEY = 221100_01;
const TAMANHO_LOTE = 200;
/** No full, aborta se o número de ativos cair abaixo desta fração dos ativos atuais (proteção contra resposta vazia/parcial). */
const FRACAO_MINIMA_FULL = 0.5;

interface Dependencias {
    db: Db;
    pool: pg.Pool;
    cliente: CnesClient;
    regras: RegrasFiltro;
    codigoMunicipio: string;
    timezone: string;
    logger: Logger;
}

function dependenciasPadrao(): Dependencias {
    const get = createHttpGet({
        baseUrl: env.CNES_API_BASE_URL,
        delayMs: env.CNES_REQUEST_DELAY_MS,
        timeoutMs: env.CNES_REQUEST_TIMEOUT_MS,
        maxRetries: env.CNES_MAX_RETRIES,
        logger: defaultLogger,
    });
    return {
        db: defaultDb,
        pool: defaultPool,
        cliente: createCnesClient(get),
        regras: { tiposPermitidos: TIPOS_PERMITIDOS, verificadas: CNES_VERIFICADAS },
        codigoMunicipio: env.CNES_CODIGO_MUNICIPIO,
        timezone: env.SYNC_TIMEZONE,
        logger: defaultLogger,
    };
}

/** YYYY-MM-DD no fuso informado. */
export function dataNoFuso(data: Date, timezone: string): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}

export async function ultimoSyncComSucesso(db: Db = defaultDb) {
    const [ultimo] = await db
        .select({ id: syncExecucoes.id, modo: syncExecucoes.modo, iniciadoEm: syncExecucoes.iniciadoEm, finalizadoEm: syncExecucoes.finalizadoEm })
        .from(syncExecucoes)
        .where(eq(syncExecucoes.status, "success"))
        .orderBy(desc(syncExecucoes.iniciadoEm))
        .limit(1);
    return ultimo ?? null;
}

/**
 * Sincroniza as unidades de saúde do CNES.
 * Busca tudo na API antes de tocar no banco e grava numa única transação:
 * se algo falhar, o banco fica como estava.
 */
export async function executarSync(modoSolicitado: ModoSync, deps: Dependencias = dependenciasPadrao()): Promise<ResultadoSync> {
    const lockClient = await deps.pool.connect();

    try {
        const { rows } = await lockClient.query<{ ok: boolean }>("SELECT pg_try_advisory_lock($1) AS ok", [LOCK_KEY]);
        if (!rows[0]?.ok) throw new SyncEmAndamentoError();

        try {
            return await executarComLock(modoSolicitado, deps);
        } finally {
            await lockClient.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
        }
    } finally {
        lockClient.release();
    }
}

async function executarComLock(modoSolicitado: ModoSync, deps: Dependencias): Promise<ResultadoSync> {
    const { db, cliente, regras, logger, codigoMunicipio, timezone } = deps;
    const inicio = Date.now();

    // Com o lock na mão, qualquer "running" que sobrou é de um processo que morreu no meio.
    await db
        .update(syncExecucoes)
        .set({ status: "failed", finalizadoEm: new Date(), erro: "interrompido (processo encerrado durante o sync)" })
        .where(eq(syncExecucoes.status, "running"));

    const ultimo = modoSolicitado === "incremental" ? await ultimoSyncComSucesso(db) : null;
    const modo: ModoSync = ultimo ? "incremental" : "full";
    // Um dia de margem: data_atualizacao é só data, sem hora.
    const desde = ultimo ? dataNoFuso(new Date(ultimo.iniciadoEm.getTime() - 24 * 60 * 60 * 1000), timezone) : null;

    if (modoSolicitado === "incremental" && modo === "full") {
        logger.info("nenhum sync anterior com sucesso; fazendo carga completa");
    }

    const [execucao] = await db.insert(syncExecucoes).values({ modo }).returning({ id: syncExecucoes.id });
    const execucaoId = execucao!.id;
    const log = logger.child({ execucaoId, modo, desde });
    log.info("sync do CNES iniciado");

    try {
        // 1. Busca tudo na API (nada é gravado ainda)
        const tiposCrus = await cliente.listarTiposUnidade();
        const tipos = tiposCrus.map(normalizarTipoUnidade).filter((t) => t !== null);

        const registros: RegistroRecebido[] = [];
        for (const codigo of regras.verificadas) {
            const cru = await cliente.buscarEstabelecimento(codigo);
            if (cru) registros.push({ cru, statusAtivo: ativoPelaBuscaIndividual(cru) });
            else log.warn({ codigoCnes: codigo }, "unidade verificada não encontrada na API");
        }

        const filtroBase = { codigo_municipio: codigoMunicipio, ...(desde && { data_atualizacao: desde }) };
        const ativos = await cliente.listarEstabelecimentos({ ...filtroBase, status: 1 });
        registros.push(...ativos.map((cru) => ({ cru, statusAtivo: true })));

        if (modo === "incremental") {
            const inativos = await cliente.listarEstabelecimentos({ ...filtroBase, status: 0 });
            registros.push(...inativos.map((cru) => ({ cru, statusAtivo: false })));
        }

        log.info({ recebidas: registros.length, tipos: tipos.length }, "dados recebidos da API");

        // 2. Decide o que salvar/desativar
        const plano = planejarSync(registros, regras);
        for (const invalido of plano.invalidos) log.warn(invalido, "registro do CNES descartado");

        const codigosAtivosNovos = plano.salvar.filter((u) => u.ativo).map((u) => u.codigoCnes);

        if (modo === "full") {
            if (ativos.length === 0) throw new Error("A API não devolveu nenhum estabelecimento ativo; carga completa abortada");
            const [contagem] = await db.select({ total: sql<number>`count(*)::int` }).from(unidades).where(eq(unidades.ativo, true));
            const total = contagem?.total ?? 0;
            if (total > 0 && codigosAtivosNovos.length < total * FRACAO_MINIMA_FULL) {
                throw new Error(
                    `Carga completa trouxe ${codigosAtivosNovos.length} unidades ativas, menos de ${FRACAO_MINIMA_FULL * 100}% das ${total} atuais; abortada por segurança`,
                );
            }
        }

        // Tipos usados pelas unidades mas ausentes em /cnes/tipounidades (para não quebrar a FK)
        const codigosTipos = new Set(tipos.map((t) => t.codigo));
        const tiposFaltando = [...new Set(plano.salvar.map((u) => u.codigoTipoUnidade))].filter((c) => !codigosTipos.has(c));

        // 3. Grava tudo numa transação
        const agora = new Date();
        const inativadas = await db.transaction(async (tx) => {
            if (tipos.length > 0) {
                await tx
                    .insert(tiposUnidade)
                    .values(tipos.map((t) => ({ ...t, atualizadoEm: agora })))
                    .onConflictDoUpdate({
                        target: tiposUnidade.codigo,
                        set: { descricao: sql`excluded.descricao`, atualizadoEm: sql`excluded.atualizado_em` },
                    });
            }
            if (tiposFaltando.length > 0) {
                log.warn({ tiposFaltando }, "tipos sem descrição em /cnes/tipounidades");
                await tx
                    .insert(tiposUnidade)
                    .values(tiposFaltando.map((codigo) => ({ codigo, descricao: `TIPO ${codigo}`, atualizadoEm: agora })))
                    .onConflictDoNothing();
            }

            const set = upsertSetUnidades();
            for (let i = 0; i < plano.salvar.length; i += TAMANHO_LOTE) {
                const lote = plano.salvar.slice(i, i + TAMANHO_LOTE).map((u) => ({ ...u, sincronizadoEm: agora }));
                await tx.insert(unidades).values(lote).onConflictDoUpdate({ target: unidades.codigoCnes, set });
            }

            const desativar = { ativo: false, sincronizadoEm: agora };
            const desativadas = new Set<number>();
            const marcar = (linhas: { codigoCnes: number }[]) => linhas.forEach((l) => desativadas.add(l.codigoCnes));

            if (modo === "full") {
                // Ativo no banco e não veio na carga completa → saiu da base
                marcar(
                    await tx
                        .update(unidades)
                        .set(desativar)
                        .where(and(eq(unidades.ativo, true), notInArray(unidades.codigoCnes, codigosAtivosNovos)))
                        .returning({ codigoCnes: unidades.codigoCnes }),
                );
            } else if (plano.desativar.length > 0) {
                marcar(
                    await tx
                        .update(unidades)
                        .set(desativar)
                        .where(and(eq(unidades.ativo, true), inArray(unidades.codigoCnes, plano.desativar)))
                        .returning({ codigoCnes: unidades.codigoCnes }),
                );
            }

            // A lista de tipos pode ter mudado desde o último sync
            marcar(
                await tx
                    .update(unidades)
                    .set(desativar)
                    .where(
                        and(
                            eq(unidades.ativo, true),
                            notInArray(unidades.codigoTipoUnidade, [...regras.tiposPermitidos]),
                            notInArray(unidades.codigoCnes, [...regras.verificadas]),
                        ),
                    )
                    .returning({ codigoCnes: unidades.codigoCnes }),
            );

            // A lista de verificadas pode ter mudado desde o último sync
            await tx
                .update(unidades)
                .set({ verificada: false })
                .where(and(eq(unidades.verificada, true), notInArray(unidades.codigoCnes, [...regras.verificadas])));

            return desativadas.size;
        });

        const resultado: ResultadoSync = {
            execucaoId,
            modo,
            desde,
            recebidas: registros.length,
            upserts: plano.salvar.length,
            inativadas,
            invalidas: plano.invalidos.length,
            duracaoMs: Date.now() - inicio,
        };

        await db
            .update(syncExecucoes)
            .set({
                status: "success",
                finalizadoEm: new Date(),
                qtdRecebidas: resultado.recebidas,
                qtdUpserts: resultado.upserts,
                qtdInativadas: resultado.inativadas,
            })
            .where(eq(syncExecucoes.id, execucaoId));

        logger.info(resultado, "sync do CNES concluído");
        return resultado;
    } catch (error) {
        const mensagem = error instanceof Error ? error.message : String(error);
        await db
            .update(syncExecucoes)
            .set({ status: "failed", finalizadoEm: new Date(), erro: mensagem.slice(0, 2000) })
            .where(eq(syncExecucoes.id, execucaoId));
        log.error({ err: error }, "sync do CNES falhou; nenhuma alteração gravada nas unidades");
        throw error;
    }
}
