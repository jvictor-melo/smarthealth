import type { Rede, Unidade } from "../src/api/types";
import { aplicarFiltros, contarFiltros, FILTROS_VAZIOS } from "../src/busca/filtros";

function unidade(codigo_cnes: number, tipo: number, rede: Rede | null, atende_sus: boolean): Unidade {
    return {
        codigo_cnes,
        nome: `UNIDADE ${codigo_cnes}`,
        tipo: { codigo: tipo, descricao: "" },
        endereco: { logradouro: null, numero: null, bairro: null, cep: null },
        telefone: null,
        email: null,
        localizacao: { lat: 0, lng: 0 },
        turno_atendimento: null,
        atende_sus,
        possui_centro_obstetrico: null,
        possui_centro_cirurgico: null,
        rede,
        verificada: false,
        ativo: true,
        data_atualizacao_cnes: null,
        distancia_m: null,
    };
}

const upaPublica = unidade(1, 73, "publica", true);
const clinicaPrivada = unidade(2, 4, "privada", false);
const santaCasa = unidade(3, 5, "filantropica", true);
const hospitalPrivado = unidade(4, 5, "privada", false);
const semRede = unidade(5, 2, null, true);
const todas = [upaPublica, clinicaPrivada, santaCasa, hospitalPrivado, semRede];

test("sem nada marcado não filtra nada", () => {
    expect(aplicarFiltros(todas, FILTROS_VAZIOS)).toEqual(todas);
});

test("dentro de um bloco vale 'ou'", () => {
    expect(aplicarFiltros(todas, { ...FILTROS_VAZIOS, redes: ["publica", "filantropica"] })).toEqual([upaPublica, santaCasa]);
    expect(aplicarFiltros(todas, { ...FILTROS_VAZIOS, grupos: ["urgencia", "especialidades"] })).toEqual([upaPublica, clinicaPrivada]);
});

test("entre blocos vale 'e'", () => {
    expect(aplicarFiltros(todas, { grupos: ["hospital"], redes: ["privada"], soSus: false })).toEqual([hospitalPrivado]);
    expect(aplicarFiltros(todas, { grupos: ["hospital"], redes: [], soSus: true })).toEqual([santaCasa]);
});

test("unidade sem rede definida some quando há filtro de rede", () => {
    expect(aplicarFiltros(todas, { ...FILTROS_VAZIOS, redes: ["publica"] })).not.toContain(semRede);
    expect(aplicarFiltros(todas, { ...FILTROS_VAZIOS, soSus: true })).toContain(semRede);
});

test("conta quantos filtros estão ligados", () => {
    expect(contarFiltros(FILTROS_VAZIOS)).toBe(0);
    expect(contarFiltros({ grupos: ["urgencia"], redes: ["publica", "privada"], soSus: true })).toBe(4);
});
