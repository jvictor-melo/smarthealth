import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    date,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { geographyPoint } from "./geography.js";

export const tiposUnidade = pgTable("tipos_unidade", {
    codigo: integer("codigo").primaryKey(),
    descricao: text("descricao").notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

/** Horários levantados manualmente: chave = dia da semana, valor = faixas de atendimento. */
export type DiaSemana = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";
export type FaixaHorario = { abre: string; fecha: string };
export type HorariosSemana = Partial<Record<DiaSemana, FaixaHorario[]>>;

export const unidades = pgTable(
    "unidades",
    {
        codigoCnes: integer("codigo_cnes").primaryKey(),

        // --- Dados vindos da API (sobrescritos a cada sync) ---
        nome: text("nome").notNull(),
        razaoSocial: text("razao_social").notNull(),
        logradouro: text("logradouro"),
        numero: text("numero"),
        bairro: text("bairro"),
        cep: text("cep"),
        telefone: text("telefone"),
        email: text("email"),
        localizacao: geographyPoint("localizacao").notNull(),
        codigoTipoUnidade: integer("codigo_tipo_unidade")
            .notNull()
            .references(() => tiposUnidade.codigo),
        turnoAtendimento: text("turno_atendimento"),
        atendeSus: boolean("atende_sus").notNull(),
        possuiCentroObstetrico: boolean("possui_centro_obstetrico"),
        possuiCentroCirurgico: boolean("possui_centro_cirurgico"),
        /** Código de 4 dígitos; o primeiro define a rede (ver cnes/rede.ts) */
        naturezaJuridica: text("natureza_juridica"),
        dataAtualizacaoCnes: date("data_atualizacao_cnes"),

        // --- Controle do sync ---
        ativo: boolean("ativo").notNull().default(true),
        verificada: boolean("verificada").notNull().default(false),
        sincronizadoEm: timestamp("sincronizado_em", { withTimezone: true }).notNull().defaultNow(),

        // --- Dados manuais (entrevistas). O sync NUNCA escreve nestas colunas. ---
        horarios: jsonb("horarios").$type<HorariosSemana>(),
        servicos: text("servicos").array(),
        observacoes: text("observacoes"),
        manualAtualizadoEm: timestamp("manual_atualizado_em", { withTimezone: true }),
    },
    (table) => [
        index("unidades_localizacao_idx").using("gist", table.localizacao),
        index("unidades_tipo_idx").on(table.codigoTipoUnidade),
        index("unidades_ativo_idx").on(table.ativo),
    ],
);

export const syncModo = pgEnum("sync_modo", ["full", "incremental"]);
export const syncStatus = pgEnum("sync_status", ["running", "success", "failed"]);

export const syncExecucoes = pgTable(
    "sync_execucoes",
    {
        id: serial("id").primaryKey(),
        modo: syncModo("modo").notNull(),
        status: syncStatus("status").notNull().default("running"),
        iniciadoEm: timestamp("iniciado_em", { withTimezone: true }).notNull().defaultNow(),
        finalizadoEm: timestamp("finalizado_em", { withTimezone: true }),
        qtdRecebidas: integer("qtd_recebidas"),
        qtdUpserts: integer("qtd_upserts"),
        qtdInativadas: integer("qtd_inativadas"),
        erro: text("erro"),
    },
    (table) => [
        index("sync_execucoes_status_idx").on(table.status, table.iniciadoEm),
        check("sync_finalizado_check", sql`${table.status} = 'running' OR ${table.finalizadoEm} IS NOT NULL`),
    ],
);

export type Unidade = typeof unidades.$inferSelect;
export type NovaUnidade = typeof unidades.$inferInsert;
export type TipoUnidade = typeof tiposUnidade.$inferSelect;
