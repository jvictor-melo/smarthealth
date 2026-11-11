import { sql, type SQL } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { unidades } from "../db/schema.js";

type ColunaUnidade = keyof typeof unidades.$inferSelect;

/**
 * Colunas que o sync atualiza no upsert (ON CONFLICT DO UPDATE).
 * As colunas manuais (horarios, servicos, observacoes, manualAtualizadoEm) NÃO podem entrar aqui.
 */
export const COLUNAS_SYNC = [
    "nome",
    "razaoSocial",
    "logradouro",
    "numero",
    "bairro",
    "cep",
    "telefone",
    "email",
    "localizacao",
    "codigoTipoUnidade",
    "turnoAtendimento",
    "atendeSus",
    "possuiCentroObstetrico",
    "possuiCentroCirurgico",
    "naturezaJuridica",
    "dataAtualizacaoCnes",
    "ativo",
    "verificada",
    "sincronizadoEm",
] as const satisfies readonly ColunaUnidade[];

/** Colunas preenchidas à mão a partir das entrevistas. */
export const COLUNAS_MANUAIS = ["horarios", "servicos", "observacoes", "manualAtualizadoEm"] as const satisfies readonly ColunaUnidade[];

/** SET col = excluded.col só para as colunas do sync. */
export function upsertSetUnidades(): Record<string, SQL> {
    const colunas = getTableColumns(unidades);
    return Object.fromEntries(COLUNAS_SYNC.map((chave) => [chave, sql.raw(`excluded."${colunas[chave].name}"`)]));
}
