/** Minúsculas, sem acentos e com espaços colapsados, para comparar texto digitado com nomes do CNES */
export function normalizarTexto(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}
