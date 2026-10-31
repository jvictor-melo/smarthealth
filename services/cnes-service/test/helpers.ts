import { readFileSync } from "node:fs";
import type { EstabelecimentoCru } from "../src/cnes/types.js";

export function fixture<T>(nome: string): T {
    return JSON.parse(readFileSync(new URL(`./fixtures/${nome}`, import.meta.url), "utf8")) as T;
}

export function estabelecimentosDaPagina(nome: string): EstabelecimentoCru[] {
    return fixture<{ estabelecimentos: EstabelecimentoCru[] }>(nome).estabelecimentos;
}

export function porCodigo(lista: EstabelecimentoCru[], codigoCnes: number): EstabelecimentoCru {
    const encontrado = lista.find((e) => e.codigo_cnes === codigoCnes);
    if (!encontrado) throw new Error(`fixture sem o CNES ${codigoCnes}`);
    return encontrado;
}

/** Resposta mínima compatível com fetch. */
export function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
