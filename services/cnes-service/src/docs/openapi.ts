import { CNES_VERIFICADAS, TIPOS_PERMITIDOS } from "../config/cnes.config.js";

const nullableString = { type: "string", nullable: true };
const nullableBoolean = { type: "boolean", nullable: true };

export const openapi = {
    openapi: "3.0.3",
    info: {
        title: "SmartHealth: cnes-service",
        version: "1.0.0",
        description:
            "Unidades de saúde de Teresina-PI sincronizadas do CNES (API de dados abertos do Ministério da Saúde). " +
            `Base: tipos ${TIPOS_PERMITIDOS.join(", ")}. Unidades verificadas: ${CNES_VERIFICADAS.join(", ")}.`,
    },
    tags: [{ name: "Unidades" }, { name: "Infra" }],
    paths: {
        "/units": {
            get: {
                tags: ["Unidades"],
                summary: "Lista unidades ativas, ordenadas por distância quando lat/lng são enviados",
                parameters: [
                    { name: "lat", in: "query", schema: { type: "number", minimum: -90, maximum: 90 }, example: -5.0892 },
                    { name: "lng", in: "query", schema: { type: "number", minimum: -180, maximum: 180 }, example: -42.8019 },
                    {
                        name: "raio_m",
                        in: "query",
                        description: "Raio em metros (só vale com lat/lng)",
                        schema: { type: "integer", default: 5000, maximum: 50000 },
                    },
                    { name: "tipo", in: "query", description: "Código(s) do tipo de unidade, separados por vírgula", schema: { type: "string" }, example: "2,73" },
                    { name: "sus", in: "query", description: "Filtra por atendimento ambulatorial SUS", schema: { type: "boolean" } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 200 } },
                    { name: "offset", in: "query", schema: { type: "integer", default: 0, minimum: 0 } },
                ],
                responses: {
                    "200": {
                        description: "Lista de unidades",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        meta: { $ref: "#/components/schemas/MetaLista" },
                                        unidades: {
                                            type: "array",
                                            items: {
                                                allOf: [
                                                    { $ref: "#/components/schemas/Unidade" },
                                                    {
                                                        type: "object",
                                                        properties: { distancia_m: { type: "integer", nullable: true, description: "null quando não há lat/lng" } },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/ParametrosInvalidos" },
                },
            },
        },
        "/units/{codigoCnes}": {
            get: {
                tags: ["Unidades"],
                summary: "Detalhe de uma unidade (inclui dados verificados manualmente, se houver)",
                parameters: [{ name: "codigoCnes", in: "path", required: true, schema: { type: "integer" }, example: 9939571 }],
                responses: {
                    "200": { description: "Unidade", content: { "application/json": { schema: { $ref: "#/components/schemas/UnidadeDetalhe" } } } },
                    "400": { $ref: "#/components/responses/ParametrosInvalidos" },
                    "404": { description: "Unidade não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } } },
                },
            },
        },
        "/unit-types": {
            get: {
                tags: ["Unidades"],
                summary: "Tipos de unidade (descrições de /cnes/tipounidades)",
                parameters: [
                    {
                        name: "todos",
                        in: "query",
                        description: "false (padrão): só tipos com unidades ativas na base. true: todos os tipos do CNES.",
                        schema: { type: "boolean", default: false },
                    },
                ],
                responses: {
                    "200": {
                        description: "Tipos",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        tipos: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    codigo: { type: "integer", example: 73 },
                                                    descricao: { type: "string", example: "PRONTO ATENDIMENTO" },
                                                    total_unidades: { type: "integer", example: 3 },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/health": {
            get: {
                tags: ["Infra"],
                summary: "Saúde do serviço e data do último sync",
                responses: {
                    "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } } },
                    "503": { description: "Banco indisponível", content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } } },
                },
            },
        },
    },
    components: {
        responses: {
            ParametrosInvalidos: {
                description: "Parâmetros inválidos",
                content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } },
            },
        },
        schemas: {
            Erro: {
                type: "object",
                properties: { erro: { type: "string" }, detalhes: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } } },
            },
            MetaLista: {
                type: "object",
                properties: {
                    quantidade: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" },
                    raio_m: { type: "integer", nullable: true },
                    dados_atualizados_em: { type: "string", format: "date-time", nullable: true, description: "Fim do último sync com sucesso" },
                },
            },
            Unidade: {
                type: "object",
                properties: {
                    codigo_cnes: { type: "integer", example: 9939571 },
                    nome: { type: "string", example: "UNIDADE DE PRONTO ATENDIMENTO DR ANTONIO DIB TAJRA" },
                    tipo: { type: "object", properties: { codigo: { type: "integer" }, descricao: { type: "string" } } },
                    endereco: {
                        type: "object",
                        properties: {
                            logradouro: nullableString,
                            numero: nullableString,
                            bairro: { ...nullableString, description: "Truncado em 20 caracteres pela API do CNES" },
                            cep: { ...nullableString, description: "8 dígitos" },
                        },
                    },
                    telefone: { ...nullableString, description: "Só dígitos" },
                    email: nullableString,
                    localizacao: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
                    turno_atendimento: { ...nullableString, description: "Texto livre do CNES, não é horário estruturado" },
                    atende_sus: { type: "boolean" },
                    possui_centro_obstetrico: nullableBoolean,
                    possui_centro_cirurgico: nullableBoolean,
                    verificada: { type: "boolean", description: "Unidade com dados levantados em entrevista" },
                    ativo: { type: "boolean" },
                    data_atualizacao_cnes: { type: "string", format: "date", nullable: true },
                },
            },
            UnidadeDetalhe: {
                allOf: [
                    { $ref: "#/components/schemas/Unidade" },
                    {
                        type: "object",
                        properties: {
                            razao_social: { type: "string" },
                            detalhes_verificados: {
                                type: "object",
                                nullable: true,
                                description: "Só para unidades verificadas; campos ficam null até serem preenchidos",
                                properties: {
                                    horarios: {
                                        type: "object",
                                        nullable: true,
                                        description: "Chaves: dom, seg, ter, qua, qui, sex, sab",
                                        additionalProperties: {
                                            type: "array",
                                            items: { type: "object", properties: { abre: { type: "string", example: "07:00" }, fecha: { type: "string", example: "19:00" } } },
                                        },
                                    },
                                    servicos: { type: "array", nullable: true, items: { type: "string" } },
                                    observacoes: nullableString,
                                    atualizado_em: { type: "string", format: "date-time", nullable: true },
                                },
                            },
                        },
                    },
                ],
            },
            Health: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["ok", "erro"] },
                    banco: { type: "string", enum: ["ok", "indisponivel"] },
                    dados_atualizados_em: { type: "string", format: "date-time", nullable: true },
                },
            },
        },
    },
};
