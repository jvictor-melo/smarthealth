
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3000),

    CNES_SERVICE_URL: z.url()
        .default("http://localhost:3002"),

    USER_SERVICE_URL: z.url()
        .default("http://localhost:3001"),

    CORS_ORIGIN: z.string()
        .default("*"),
});

const resultado = envSchema.safeParse(process.env);

if (!resultado.success) {
    console.error(
        "Erro na configuração das variáveis de ambiente:",
        z.treeifyError(resultado.error),
    );

    process.exit(1);
}

export const env = resultado.data;
