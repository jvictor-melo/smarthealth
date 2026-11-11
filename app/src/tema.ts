/**
 * Tokens visuais do app. Público amplo (idosos, acompanhantes): texto grande, contraste alto
 * e cor sempre acompanhada de texto, nunca como única informação.
 */
export const cor = {
    papel: "#FFFFFF",
    superficie: "#EEF3F4",
    linha: "#D5DFE2",
    tinta: "#13232B",
    tintaSuave: "#4E5F67",
    /** Marca e ações: o azul-petróleo das placas de unidades de saúde */
    marca: "#0B5C7A",
    marcaClara: "#E1EEF2",
    urgencia: "#C62828",
    hospital: "#3949AB",
    basica: "#2E7D4F",
    /** Roxo puxado para o magenta, para não confundir com o índigo de hospital */
    especialidades: "#8E24AA",
    outros: "#6B7A80",
    erroFundo: "#FDECEA",
    erroTexto: "#8B1A1A",
} as const;

export const fonte = {
    regular: "AtkinsonHyperlegible_400Regular",
    negrito: "AtkinsonHyperlegible_700Bold",
} as const;

/** Escala de tipo (pt): 13 · 15 · 17 · 20 · 26 */
export const tamanho = { legenda: 13, corpo: 15, destaque: 17, titulo: 20, nome: 26 } as const;

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
