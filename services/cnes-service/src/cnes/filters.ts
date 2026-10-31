import { normalizarEstabelecimento, type UnidadeCnes } from "./normalize.js";
import type { EstabelecimentoCru } from "./types.js";

/**
 * Um registro bruto e o status que a API atribuiu a ele.
 * statusAtivo vem do filtro `status` usado na consulta (1/0). A resposta não traz o status,
 * então nas buscas individuais usa-se a ausência de codigo_motivo_desabilitacao_estabelecimento.
 */
export interface RegistroRecebido {
    cru: EstabelecimentoCru;
    statusAtivo: boolean;
}

export interface RegrasFiltro {
    tiposPermitidos: readonly number[];
    verificadas: readonly number[];
}

export interface UnidadeParaSalvar extends UnidadeCnes {
    ativo: boolean;
    verificada: boolean;
}

export interface PlanoSync {
    /** Unidades a inserir/atualizar. */
    salvar: UnidadeParaSalvar[];
    /** Códigos que vieram da API mas estão fora do filtro ou inativos: desativar se já existirem no banco. */
    desativar: number[];
    /** Registros descartados por dados inválidos. */
    invalidos: { codigoCnes: unknown; motivo: string }[];
}

export function ativoPelaBuscaIndividual(cru: EstabelecimentoCru): boolean {
    const motivo = cru.codigo_motivo_desabilitacao_estabelecimento;
    return motivo === null || motivo === undefined || String(motivo).trim() === "";
}

export function tipoPermitido(codigoTipoUnidade: number, regras: RegrasFiltro): boolean {
    return regras.tiposPermitidos.includes(codigoTipoUnidade);
}

/**
 * Decide o que acontece com cada registro recebido:
 * - verificadas sempre entram (ativo segue o status da API);
 * - as demais entram só se o tipo for permitido e o status for ativo;
 * - o resto vira desativação (nunca deleção).
 * Se o mesmo código vier mais de uma vez, vale o último registro.
 */
export function planejarSync(registros: readonly RegistroRecebido[], regras: RegrasFiltro): PlanoSync {
    const salvar = new Map<number, UnidadeParaSalvar>();
    const desativar = new Set<number>();
    const invalidos: PlanoSync["invalidos"] = [];

    for (const { cru, statusAtivo } of registros) {
        const resultado = normalizarEstabelecimento(cru);
        if (!resultado.ok) {
            invalidos.push({ codigoCnes: resultado.codigoCnes, motivo: resultado.motivo });
            continue;
        }

        const unidade = resultado.unidade;
        const verificada = regras.verificadas.includes(unidade.codigoCnes);

        if (verificada || (statusAtivo && tipoPermitido(unidade.codigoTipoUnidade, regras))) {
            salvar.set(unidade.codigoCnes, { ...unidade, ativo: statusAtivo, verificada });
            desativar.delete(unidade.codigoCnes);
        } else {
            salvar.delete(unidade.codigoCnes);
            desativar.add(unidade.codigoCnes);
        }
    }

    return { salvar: [...salvar.values()], desativar: [...desativar], invalidos };
}
