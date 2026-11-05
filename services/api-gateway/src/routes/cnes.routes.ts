
import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import { services } from "../config/services.config.js";

const router = Router();

const cnesProxy = createProxyMiddleware({
    target: services.cnes.url,

    changeOrigin: true,

    // Encaminha somente as rotas públicas do CNES.
    pathFilter: (pathname, req) => {
        const rotaPermitida =
            pathname === "/units" ||
            pathname.startsWith("/units/") ||
            pathname === "/unit-types" ||
            pathname === "/health/cnes";

        return rotaPermitida && req.method === "GET";
    },

    // O Gateway utiliza /health/cnes,
    // mas o CNES Service disponibiliza /health.
    pathRewrite: {
        "^/health/cnes$": "/health",
    },

    // Tratamento de falhas de comunicação.
    on: {
        error: (error, _req, res) => {
            console.error("[CNES Proxy] Erro de comunicação:", error.message);

            if (res.headersSent) {
                res.end();
                return;
            }

            res.writeHead(503, {
                "Content-Type": "application/json; charset=utf-8",
            });

            res.end(
                JSON.stringify({
                    success: false,
                    error: {
                        code: "CNES_SERVICE_UNAVAILABLE",
                        message: "Serviço de unidades de saúde temporariamente indisponível.",
                    },
                }),
            );
        },
    },
});

router.use(cnesProxy);

export default router;
