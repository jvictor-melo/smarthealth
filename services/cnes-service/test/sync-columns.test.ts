import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { unidades } from "../src/db/schema.js";
import { COLUNAS_MANUAIS, COLUNAS_SYNC, upsertSetUnidades } from "../src/sync/columns.js";

describe("colunas do upsert do sync", () => {
    it("nunca sobrescreve as colunas manuais", () => {
        const set = Object.keys(upsertSetUnidades());
        for (const manual of COLUNAS_MANUAIS) expect(set).not.toContain(manual);
    });

    it("cobre todas as outras colunas da tabela (exceto a chave)", () => {
        const todas = Object.keys(getTableColumns(unidades));
        const esperadas = todas.filter((c) => c !== "codigoCnes" && !(COLUNAS_MANUAIS as readonly string[]).includes(c));
        expect([...COLUNAS_SYNC].sort()).toEqual(esperadas.sort());
    });
});
