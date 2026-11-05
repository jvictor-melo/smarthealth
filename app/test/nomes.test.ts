import { formatarCep, formatarTelefone, nomeDoTipo, nomeLegivel } from "../src/texto/nomes";

test("nomes do CNES em maiúsculas viram nomes legíveis", () => {
    expect(nomeLegivel("UNIDADE DE PRONTO ATENDIMENTO DR ANTONIO DIB TAJRA")).toBe("Unidade de Pronto Atendimento Dr. Antonio Dib Tajra");
    expect(nomeLegivel("UBS SANTA ISABEL")).toBe("UBS Santa Isabel");
    expect(nomeLegivel("HOSPITAL E MATERNIDADE DO SATÉLITE")).toBe("Hospital e Maternidade do Satélite");
    expect(nomeLegivel("CAPS AD III")).toBe("CAPS AD III");
    expect(nomeLegivel("  de  oliveira ")).toBe("De Oliveira");
});

test("telefone e CEP formatados", () => {
    expect(formatarTelefone("8632150000")).toBe("(86) 3215-0000");
    expect(formatarTelefone("86999990000")).toBe("(86) 99999-0000");
    expect(formatarTelefone("192")).toBe("192");
    expect(formatarCep("64001020")).toBe("64001-020");
});

test("tipos conhecidos têm nome amigável; os demais viram frase", () => {
    expect(nomeDoTipo({ codigo: 73, descricao: "PRONTO ATENDIMENTO" })).toBe("UPA / pronto atendimento");
    expect(nomeDoTipo({ codigo: 2, descricao: "CENTRO DE SAUDE/UNIDADE BASICA" })).toBe("Unidade básica de saúde");
    expect(nomeDoTipo({ codigo: 36, descricao: "CLINICA/CENTRO DE ESPECIALIDADE" })).toBe("Clinica/centro de especialidade");
});
