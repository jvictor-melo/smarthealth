import { filtrarUnidades } from "../src/busca/filtrar";
import { normalizarTexto } from "../src/busca/normalizar";
import type { Unidade } from "../src/api/types";

function unidade(codigo_cnes: number, nome: string, tipo: number): Unidade {
    return {
        codigo_cnes,
        nome,
        tipo: { codigo: tipo, descricao: "" },
        endereco: { logradouro: null, numero: null, bairro: null, cep: null },
        telefone: null,
        email: null,
        localizacao: { lat: 0, lng: 0 },
        turno_atendimento: null,
        atende_sus: true,
        possui_centro_obstetrico: null,
        possui_centro_cirurgico: null,
        rede: "publica",
        verificada: false,
        ativo: true,
        data_atualizacao_cnes: null,
        distancia_m: null,
    };
}

// Já na ordem de distância, como a API devolve
const upa = unidade(1, "UNIDADE DE PRONTO ATENDIMENTO SATELITE", 73);
const ubs = unidade(2, "UBS SANTA ISABEL", 2);
const hospital = unidade(3, "HOSPITAL E MATERNIDADE DO SATÉLITE", 5);
const upaRenascenca = unidade(4, "UPA RENASCENÇA", 73);
const todas = [upa, ubs, hospital, upaRenascenca];

test("normalizarTexto tira acento, caixa e espaços extras", () => {
    expect(normalizarTexto("  Saúde  PÚBLICA ")).toBe("saude publica");
});

test("busca por tipo via sinônimo, sem diferenciar caixa", () => {
    expect(filtrarUnidades(todas, "upa")).toEqual([upa, upaRenascenca]);
    expect(filtrarUnidades(todas, "UPA")).toEqual([upa, upaRenascenca]);
    expect(filtrarUnidades(todas, "posto")).toEqual([ubs]);
});

test("busca por nome, com ou sem acento, mantendo a ordem", () => {
    expect(filtrarUnidades(todas, "satelite")).toEqual([upa, hospital]);
    expect(filtrarUnidades(todas, "upa renascenca")).toEqual([upaRenascenca]);
    expect(filtrarUnidades(todas, "Renascença")).toEqual([upaRenascenca]);
});

test("sem resultado e termo vazio", () => {
    expect(filtrarUnidades(todas, "xyz")).toEqual([]);
    expect(filtrarUnidades(todas, "  ")).toEqual(todas);
});
