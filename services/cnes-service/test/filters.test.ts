import { describe, expect, it } from "vitest";
import { ativoPelaBuscaIndividual, planejarSync, type RegrasFiltro } from "../src/cnes/filters.js";
import { CNES_VERIFICADAS, TIPOS_PERMITIDOS } from "../src/config/cnes.config.js";
import type { EstabelecimentoCru } from "../src/cnes/types.js";
import { estabelecimentosDaPagina, fixture } from "./helpers.js";

const regras: RegrasFiltro = { tiposPermitidos: TIPOS_PERMITIDOS, verificadas: CNES_VERIFICADAS };
const pagina1 = estabelecimentosDaPagina("estabelecimentos-pagina-1.json");
const pagina2 = estabelecimentosDaPagina("estabelecimentos-pagina-2.json");
const upa = fixture<EstabelecimentoCru>("estabelecimento-upa-satelite.json");

const ativos = (lista: EstabelecimentoCru[]) => lista.map((cru) => ({ cru, statusAtivo: true }));
const codigos = (lista: { codigoCnes: number }[]) => lista.map((u) => u.codigoCnes).sort((a, b) => a - b);

describe("configuração", () => {
    it("tem a lista inicial de tipos e deixa 22 e 36 de fora", () => {
        expect([...TIPOS_PERMITIDOS]).toEqual([1, 2, 4, 5, 7, 15, 20, 73]);
        expect(TIPOS_PERMITIDOS).not.toContain(22);
        expect(TIPOS_PERMITIDOS).not.toContain(36);
    });

    it("tem exatamente as 5 unidades verificadas", () => {
        expect([...CNES_VERIFICADAS].sort()).toEqual([2444178, 2679639, 5346150, 6003591, 9939571].sort());
    });
});

describe("planejarSync", () => {
    it("mantém só os tipos permitidos e manda o resto para desativação", () => {
        const plano = planejarSync(ativos([...pagina1, ...pagina2]), regras);

        expect(codigos(plano.salvar)).toEqual([8051364, 8539243, 8549729, 9689915, 9796339, 9868054, 9939571]);
        expect(plano.salvar.every((u) => TIPOS_PERMITIDOS.includes(u.codigoTipoUnidade))).toBe(true);
        expect(plano.desativar).toHaveLength(40 - 7);
        expect(plano.desativar).toContain(9686223); // tipo 22 (consultório isolado)
        expect(plano.desativar).toContain(6015522); // tipo 36 (clínica especializada)
        expect(plano.invalidos).toEqual([]);
    });

    it("marca verificada só nas unidades da lista", () => {
        const plano = planejarSync(ativos([...pagina1, ...pagina2]), regras);
        const verificadas = plano.salvar.filter((u) => u.verificada);
        expect(codigos(verificadas)).toEqual([9939571]);
        expect(plano.salvar.every((u) => u.ativo)).toBe(true);
    });

    it("unidade verificada entra mesmo com tipo fora da lista", () => {
        const plano = planejarSync(ativos([upa]), { tiposPermitidos: [2], verificadas: [9939571] });
        expect(plano.salvar).toHaveLength(1);
        expect(plano.salvar[0]).toMatchObject({ codigoCnes: 9939571, verificada: true, ativo: true });
    });

    it("unidade inativa (status=0) vira desativação; verificada inativa é salva como inativa", () => {
        const ubs = pagina2.find((e) => e.codigo_cnes === 9868054)!;
        const plano = planejarSync(
            [
                { cru: ubs, statusAtivo: false },
                { cru: upa, statusAtivo: false },
            ],
            regras,
        );
        expect(plano.desativar).toEqual([9868054]);
        expect(plano.salvar).toEqual([expect.objectContaining({ codigoCnes: 9939571, ativo: false, verificada: true })]);
    });

    it("quando o mesmo código vem duas vezes, vale o último registro", () => {
        const plano = planejarSync(
            [
                { cru: upa, statusAtivo: true },
                { cru: { ...upa, codigo_tipo_unidade: 36 }, statusAtivo: true },
            ],
            { tiposPermitidos: TIPOS_PERMITIDOS, verificadas: [] },
        );
        expect(plano.salvar).toEqual([]);
        expect(plano.desativar).toEqual([9939571]);
    });

    it("separa registros inválidos sem derrubar o resto", () => {
        const plano = planejarSync(ativos([{ ...upa, latitude_estabelecimento_decimo_grau: null }, ...pagina1]), regras);
        expect(plano.invalidos).toEqual([{ codigoCnes: 9939571, motivo: "sem coordenadas válidas" }]);
        expect(codigos(plano.salvar)).toEqual([8051364, 8539243, 9689915, 9796339]);
    });
});

describe("ativoPelaBuscaIndividual", () => {
    it("considera ativo quando não há motivo de desabilitação", () => {
        expect(ativoPelaBuscaIndividual(upa)).toBe(true);
        expect(ativoPelaBuscaIndividual({ ...upa, codigo_motivo_desabilitacao_estabelecimento: "01" })).toBe(false);
    });
});
