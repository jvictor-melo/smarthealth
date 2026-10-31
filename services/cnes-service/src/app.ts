import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { ZodError, z } from "zod";
import { openapi } from "./docs/openapi.js";
import { logger } from "./lib/logger.js";
import unitsRoutes from "./routes/units.routes.js";

export function createApp() {
    const app = express();

    app.disable("x-powered-by");
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
    app.get("/docs.json", (_req, res) => {
        res.json(openapi);
    });
    app.use(unitsRoutes);

    app.use((_req: Request, res: Response) => {
        res.status(404).json({ erro: "Rota não encontrada" });
    });

    app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
        if (error instanceof ZodError) {
            res.status(400).json({ erro: "Parâmetros inválidos", detalhes: z.flattenError(error).fieldErrors });
            return;
        }
        logger.error({ err: error, method: req.method, url: req.originalUrl }, "erro não tratado");
        res.status(500).json({ erro: "Erro interno" });
    });

    return app;
}
