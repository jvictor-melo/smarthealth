import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/client.js";
import { logger } from "./lib/logger.js";
import { agendarSync } from "./sync/scheduler.js";

const app = createApp();
const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, `cnes-service ouvindo em http://localhost:${env.PORT} (docs em /docs)`);
});

const tarefaSync = agendarSync();

async function encerrar(sinal: string) {
    logger.info({ sinal }, "encerrando cnes-service");
    await tarefaSync?.stop();
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on("SIGINT", () => void encerrar("SIGINT"));
process.on("SIGTERM", () => void encerrar("SIGTERM"));
