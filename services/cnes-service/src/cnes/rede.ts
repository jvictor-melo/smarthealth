/**
 * Rede da unidade a partir do código de natureza jurídica (tabela da Receita Federal usada pelo CNES):
 * 1xxx = administração pública, 2xxx = entidade empresarial, 3xxx = entidade sem fins lucrativos.
 * Os demais grupos (4xxx pessoa física, 5xxx organização internacional) ficam sem rede definida.
 */
export type Rede = "publica" | "privada" | "filantropica";

export function redeDaNatureza(codigo: string | null): Rede | null {
    switch (codigo?.charAt(0)) {
        case "1":
            return "publica";
        case "2":
            return "privada";
        case "3":
            return "filantropica";
        default:
            return null;
    }
}
