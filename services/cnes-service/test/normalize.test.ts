import { describe, expect, it } from "vitest";
import {
    cep,
    digitos,
    flag,
    normalizarEstabelecimento,
    normalizarTipoUnidade,
    numeroEndereco,
    simNao,
    texto,
} from "../src/cnes/normalize.js";
import type { EstabelecimentoCru, ListaTiposUnidadeResposta } from "../src/cnes/types.js";
import { estabelecimentosDaPagina, fixture, porCodigo } from "./helpers.js";

const upa = fixture<EstabelecimentoCru>("estabelecimento-upa-satelite.json");
const pagina1 = estabelecimentosDaPagina("estabelecimentos-pagina-1.json");

function normalizarOk(cru: EstabelecimentoCru) {
    const resultado = normalizarEstabelecimento(cru);
    if (!resultado.ok) throw new Error(`esperava ok, veio: ${resultado.motivo}`);
    return resultado.unidade;
}

describe("normalizarEstabelecimento", () => {
    it("mapeia os campos crus da UPA Satélite", () => {
        expect(normalizarOk(upa)).toEqual({
            codigoCnes: 9939571,
            nome: "UNIDADE DE PRONTO ATENDIMENTO DR ANTONIO DIB TAJRA",
            razaoSocial: "FUNDACAO MUNICIPAL DE SAUDE",
            logradouro: "RUA SATURNO",
            numero: "4281",
            bairro: "SATELITE",
            cep: "64059130",
            telefone: "8632315755",
            email: null,
            localizacao: { lat: -5.0534301, lng: -42.7591893 },
            codigoTipoUnidade: 73,
            turnoAtendimento: "ATENDIMENTO CONTINUO DE 24 HORAS/DIA (PLANTAO:INCLUI SABADOS, DOMINGOS E FERIADOS)",
            atendeSus: true,
            possuiCentroObstetrico: false,
            possuiCentroCirurgico: false,
            dataAtualizacaoCnes: "2025-09-03",
        });
    });

    it("usa nome_razao_social quando nome_fantasia vem vazio ou nulo", () => {
        expect(normalizarOk({ ...upa, nome_fantasia: "   " }).nome).toBe("FUNDACAO MUNICIPAL DE SAUDE");
        expect(normalizarOk({ ...upa, nome_fantasia: null }).nome).toBe("FUNDACAO MUNICIPAL DE SAUDE");
    });

    it("deixa só dígitos no telefone com máscara", () => {
        expect(normalizarOk(porCodigo(pagina1, 9686223)).telefone).toBe("86994370620");
    });

    it("trata número S/N e telefone ausente como null", () => {
        const unidade = normalizarOk(porCodigo(pagina1, 9717994));
        expect(unidade.numero).toBeNull();
        expect(unidade.telefone).toBeNull();
    });

    it("converte SIM/NAO e flags 1/0/null", () => {
        expect(normalizarOk({ ...upa, estabelecimento_faz_atendimento_ambulatorial_sus: "NAO" }).atendeSus).toBe(false);
        const hospital = normalizarOk({ ...upa, estabelecimento_possui_centro_obstetrico: 1, estabelecimento_possui_centro_cirurgico: null });
        expect(hospital.possuiCentroObstetrico).toBe(true);
        expect(hospital.possuiCentroCirurgico).toBeNull();
    });

    it("mantém o bairro como veio (a API trunca em 20 caracteres)", () => {
        expect(normalizarOk({ ...upa, bairro_estabelecimento: "PARQUE BRASIL III   " }).bairro).toBe("PARQUE BRASIL III");
    });

    it("rejeita registro sem coordenadas", () => {
        const resultado = normalizarEstabelecimento({ ...upa, latitude_estabelecimento_decimo_grau: null });
        expect(resultado).toEqual({ ok: false, codigoCnes: 9939571, motivo: "sem coordenadas válidas" });
        expect(normalizarEstabelecimento({ ...upa, longitude_estabelecimento_decimo_grau: 0 }).ok).toBe(false);
    });

    it("rejeita registro sem nenhum nome", () => {
        const resultado = normalizarEstabelecimento({ ...upa, nome_fantasia: "", nome_razao_social: " " });
        expect(resultado.ok).toBe(false);
    });

    it("normaliza todos os registros reais das fixtures sem rejeitar nenhum", () => {
        const todos = [...pagina1, ...estabelecimentosDaPagina("estabelecimentos-pagina-2.json")];
        expect(todos.map(normalizarEstabelecimento).filter((r) => !r.ok)).toEqual([]);
    });
});

describe("funções auxiliares", () => {
    it("texto faz trim e troca vazio por null", () => {
        expect(texto("  M ")).toBe("M");
        expect(texto("")).toBeNull();
        expect(texto(null)).toBeNull();
    });

    it("digitos e cep", () => {
        expect(digitos("(86) 3232-0000")).toBe("8632320000");
        expect(digitos("---")).toBeNull();
        expect(cep("64.059-130")).toBe("64059130");
        expect(cep("6405")).toBeNull();
    });

    it("numeroEndereco reconhece variações de sem número", () => {
        expect(numeroEndereco("S/N")).toBeNull();
        expect(numeroEndereco("sn")).toBeNull();
        expect(numeroEndereco("0")).toBeNull();
        expect(numeroEndereco("1250 A")).toBe("1250 A");
    });

    it("simNao e flag", () => {
        expect(simNao("SIM")).toBe(true);
        expect(simNao("sim ")).toBe(true);
        expect(simNao("NAO")).toBe(false);
        expect(flag(1)).toBe(true);
        expect(flag(0)).toBe(false);
        expect(flag(null)).toBeNull();
    });
});

describe("normalizarTipoUnidade", () => {
    it("lê a fixture de /cnes/tipounidades", () => {
        const { tipos_unidade } = fixture<ListaTiposUnidadeResposta>("tipounidades.json");
        const tipos = tipos_unidade.map(normalizarTipoUnidade);
        expect(tipos).not.toContain(null);
        expect(tipos).toContainEqual({ codigo: 73, descricao: "PRONTO ATENDIMENTO" });
    });
});
