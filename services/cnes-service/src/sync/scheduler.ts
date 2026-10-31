import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { executarSync, SyncEmAndamentoError } from "./sync.service.js";

/** Agenda o sync incremental semanal (SYNC_CRON / SYNC_TIMEZONE). */
export function agendarSync() {
    if (!env.SYNC_CRON_ENABLED) {
        logger.info("sync automático desligado (SYNC_CRON_ENABLED=false)");
        return null;
    }
    if (!cron.validate(env.SYNC_CRON)) {
        throw new Error(`SYNC_CRON inválido: "${env.SYNC_CRON}"`);
    }

    const task = cron.schedule(
        env.SYNC_CRON,
        async () => {
            try {
                await executarSync("incremental");
            } catch (error) {
                if (error instanceof SyncEmAndamentoError) logger.warn(error.message);
                else logger.error({ err: error }, "sync agendado falhou");
            }
        },
        { name: "cnes-sync", timezone: env.SYNC_TIMEZONE, noOverlap: true },
    );

    logger.info({ cron: env.SYNC_CRON, timezone: env.SYNC_TIMEZONE }, "sync do CNES agendado");
    return task;
}
