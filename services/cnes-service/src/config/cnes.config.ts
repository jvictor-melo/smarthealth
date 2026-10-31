/**
 * Regras de negócio do recorte de dados do CNES.
 * Altere as listas aqui: é o único lugar onde elas são definidas.
 */

/**
 * Tipos de unidade (codigo_tipo_unidade) que atendem o público e entram na camada base.
 * 22 (consultório isolado) e 36 (clínica/centro de especialidade) ficam de fora até a equipe decidir.
 */
export const TIPOS_PERMITIDOS: readonly number[] = [
    1, // posto de saúde
    2, // centro de saúde / unidade básica
    4, // policlínica
    5, // hospital geral
    7, // hospital especializado
    15, // unidade mista
    20, // pronto socorro geral
    73, // pronto atendimento (UPA)
];

/**
 * Unidades da camada de destaque (verificada = true), com dados levantados em entrevistas.
 * Elas são sempre buscadas individualmente no sync, mesmo que o tipo saia de TIPOS_PERMITIDOS.
 */
export const CNES_VERIFICADAS: readonly number[] = [
    9939571, // UPA Satélite
    2679639, // Hospital e Maternidade do Satélite
    6003591, // UBS Santa Isabel
    2444178, // UBS Ininga
    5346150, // UBS Taquari
];
