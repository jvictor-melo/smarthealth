/**
 * Termos (já normalizados) → códigos de tipo de unidade do CNES.
 * É aqui que entra a futura tabela de sintomas: um sintoma vira mais uma chave apontando para os tipos adequados.
 */
export const SINONIMOS_TIPO: Record<string, number[]> = {
    upa: [73],
    "pronto atendimento": [73],
    "pronto socorro": [20],
    emergencia: [20, 73],
    urgencia: [20, 73],
    hospital: [5, 7, 15],
    maternidade: [5, 7],
    posto: [1, 2],
    ubs: [1, 2],
    postinho: [1, 2],
    policlinica: [4],
};
