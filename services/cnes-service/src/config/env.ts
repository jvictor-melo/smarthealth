import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3002),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    DATABASE_URL: z.string().url(),

    CNES_API_BASE_URL: z.string().url().default("https://apidadosabertos.saude.gov.br"),
    CNES_CODIGO_MUNICIPIO: z.string().regex(/^\d{6}$/).default("221100"),
    CNES_REQUEST_DELAY_MS: z.coerce.number().int().nonnegative().default(150),
    CNES_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
    CNES_MAX_RETRIES: z.coerce.number().int().min(1).default(3),

    SYNC_CRON_ENABLED: booleanFromString,
    SYNC_CRON: z.string().default("0 3 * * 1"),
    SYNC_TIMEZONE: z.string().default("America/Fortaleza"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Variáveis de ambiente inválidas:", z.prettifyError(parsed.error));
    process.exit(1);
}

export const env: Env = parsed.data;
