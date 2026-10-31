import type { Request, Response } from "express";
import { z } from "zod";
import * as unitsService from "../services/units.service.js";

const RAIO_PADRAO_M = 5000;
const RAIO_MAXIMO_M = 50000;

const listarQuery = z
    .object({
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
        raio_m: z.coerce.number().int().positive().max(RAIO_MAXIMO_M).default(RAIO_PADRAO_M),
        tipo: z
            .string()
            .regex(/^\d+(,\d+)*$/, "tipo deve ser um código ou uma lista separada por vírgula (ex: 2,73)")
            .transform((valor) => valor.split(",").map(Number))
            .optional(),
        sus: z
            .enum(["true", "false"])
            .transform((valor) => valor === "true")
            .optional(),
        limit: z.coerce.number().int().min(1).max(200).default(50),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
        message: "lat e lng devem ser enviados juntos",
        path: ["lat"],
    });

const codigoCnesParam = z.object({ codigoCnes: z.coerce.number().int().positive() });

const tiposQuery = z.object({
    todos: z
        .enum(["true", "false"])
        .default("false")
        .transform((valor) => valor === "true"),
});

export async function listarUnidades(req: Request, res: Response) {
    const query = listarQuery.parse(req.query);
    const [unidades, atualizadoEm] = await Promise.all([
        unitsService.listarUnidades({
            lat: query.lat,
            lng: query.lng,
            raioM: query.raio_m,
            tipos: query.tipo,
            sus: query.sus,
            limit: query.limit,
            offset: query.offset,
        }),
        unitsService.dadosAtualizadosEm(),
    ]);

    res.json({
        meta: {
            quantidade: unidades.length,
            limit: query.limit,
            offset: query.offset,
            raio_m: query.lat !== undefined ? query.raio_m : null,
            dados_atualizados_em: atualizadoEm,
        },
        unidades,
    });
}

export async function buscarUnidade(req: Request, res: Response) {
    const { codigoCnes } = codigoCnesParam.parse(req.params);
    const unidade = await unitsService.buscarUnidade(codigoCnes);
    if (!unidade) {
        res.status(404).json({ erro: "Unidade não encontrada" });
        return;
    }
    res.json(unidade);
}

export async function listarTipos(req: Request, res: Response) {
    const { todos } = tiposQuery.parse(req.query);
    res.json({ tipos: await unitsService.listarTiposUnidade(!todos) });
}

export async function health(_req: Request, res: Response) {
    const [bancoOk, atualizadoEm] = await Promise.all([
        unitsService.verificarBanco(),
        unitsService.dadosAtualizadosEm().catch(() => null),
    ]);
    res.status(bancoOk ? 200 : 503).json({
        status: bancoOk ? "ok" : "erro",
        banco: bancoOk ? "ok" : "indisponivel",
        dados_atualizados_em: atualizadoEm,
    });
}
