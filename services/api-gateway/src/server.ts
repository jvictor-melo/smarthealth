
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import gatewayRoutes from "./routes/gateway.routes.js";

const app = express();

// Desabilita a identificação do Express nos headers.
app.disable("x-powered-by");

// Proteção dos cabeçalhos HTTP.
app.use(helmet());

// Configuração do CORS.
const allowedOrigins =
    env.CORS_ORIGIN === "*"
        ? "*"
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
    cors({
        origin: allowedOrigins,
    }),
);

// Endpoint de saúde do próprio Gateway.
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
    });
});

// Rotas do Gateway.
app.use(gatewayRoutes);

// Inicialização.
const server = app.listen(env.PORT, () => {
    console.info(
        `API Gateway executando em http://localhost:${env.PORT}`,
    );
});

// Encerramento controlado.
function shutdown(signal: string) {
    console.info(`Recebido ${signal}. Encerrando API Gateway...`);

    server.close((error) => {
        if (error) {
            console.error("Erro ao encerrar servidor:", error);
            process.exitCode = 1;
            return;
        }

        console.info("API Gateway encerrado.");
    });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
