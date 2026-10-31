/**
 * Sync manual.
 *   npm run sync        → incremental (vira full se nunca houve sync com sucesso)
 *   npm run sync:full   → carga completa
 */
import { pool } from "../db/client.js";
import { logger } from "../lib/logger.js";
import { executarSync, SyncEmAndamentoError } from "./sync.service.js";

const modo = process.argv.includes("--full") ? "full" : "incremental";

try {
    const resultado = await executarSync(modo);
    logger.info(resultado, "sync manual finalizado");
    process.exitCode = 0;
} catch (error) {
    if (error instanceof SyncEmAndamentoError) logger.warn(error.message);
    else logger.error({ err: error }, "sync manual falhou");
    process.exitCode = 1;
} finally {
    await pool.end();
}
