// O CNES devolve tudo em MAIÚSCULAS, o que é difícil de ler, principalmente para idosos.

const SIGLAS = new Set(["UBS", "UPA", "CAPS", "SAMU", "HUT", "HU", "SUS", "CEO", "AD", "IJ", "II", "III", "IV", "PI", "LTDA", "ME", "SA"]);
const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "a", "o"]);
const ABREVIACOES: Record<string, string> = { dr: "Dr.", dra: "Dra." };

/** "UBS SANTA ISABEL" → "UBS Santa Isabel"; "HOSPITAL E MATERNIDADE DO SATÉLITE" → "Hospital e Maternidade do Satélite" */
export function nomeLegivel(nome: string): string {
    return nome
        .trim()
        .split(/\s+/)
        .map((palavra, i) => {
            const maiuscula = palavra.toUpperCase();
            const minuscula = palavra.toLowerCase();
            if (SIGLAS.has(maiuscula)) return maiuscula;
            if (ABREVIACOES[minuscula]) return ABREVIACOES[minuscula];
            if (i > 0 && MINUSCULAS.has(minuscula)) return minuscula;
            return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
        })
        .join(" ");
}

/** "8632150000" → "(86) 3215-0000"; o CNES guarda só os dígitos */
export function formatarTelefone(digitos: string): string {
    const m = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digitos);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : digitos;
}

export function formatarCep(cep: string): string {
    return /^\d{8}$/.test(cep) ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

const TIPOS: Record<number, string> = {
    1: "Posto de saúde",
    2: "Unidade básica de saúde",
    // Muita gente não sabe o que é policlínica; a tela da unidade explica o termo oficial
    4: "Especialidades e exames",
    5: "Hospital geral",
    7: "Hospital especializado",
    15: "Unidade mista",
    20: "Pronto-socorro",
    73: "UPA / pronto atendimento",
};

export function nomeDoTipo(tipo: { codigo: number; descricao: string }): string {
    const conhecido = TIPOS[tipo.codigo];
    if (conhecido) return conhecido;
    const frase = tipo.descricao.trim().toLowerCase();
    return frase.charAt(0).toUpperCase() + frase.slice(1);
}
