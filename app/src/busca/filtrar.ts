import type { Unidade } from "../api/types";
import { normalizarTexto } from "./normalizar";
import { SINONIMOS_TIPO } from "./sinonimos";

/** Cada palavra do termo precisa ser início de alguma palavra do nome ("renasc" acha "RENASCENÇA") */
function nomeContem(nome: string, palavras: string[]): boolean {
    const palavrasNome = normalizarTexto(nome).split(" ");
    return palavras.every((p) => palavrasNome.some((n) => n.startsWith(p)));
}

/**
 * Uma unidade entra se o termo inteiro bate com o nome, ou se o termo cita um tipo
 * (via SINONIMOS_TIPO) que a unidade tem e o resto do termo bate com o nome.
 * Mantém a ordem recebida (a API já ordena por distância).
 */
export function filtrarUnidades(unidades: Unidade[], termo: string): Unidade[] {
    const normalizado = normalizarTexto(termo);
    if (!normalizado) return unidades;

    const palavras = normalizado.split(" ");
    const tipos = new Set<number>();
    let resto = ` ${normalizado} `;
    // Sinônimos mais longos primeiro, para "pronto atendimento" não ser lido em pedaços
    for (const sinonimo of Object.keys(SINONIMOS_TIPO).sort((a, b) => b.length - a.length)) {
        if (resto.includes(` ${sinonimo} `)) {
            SINONIMOS_TIPO[sinonimo]!.forEach((t) => tipos.add(t));
            resto = resto.replace(` ${sinonimo} `, " ");
        }
    }
    const palavrasResto = resto.trim() ? resto.trim().split(" ") : [];

    return unidades.filter(
        (u) => nomeContem(u.nome, palavras) || (tipos.has(u.tipo.codigo) && nomeContem(u.nome, palavrasResto)),
    );
}
