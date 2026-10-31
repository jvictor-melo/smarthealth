import type { Logger } from "pino";

export class CnesHttpError extends Error {
    constructor(
        message: string,
        readonly status: number | null,
        readonly url: string,
    ) {
        super(message);
        this.name = "CnesHttpError";
    }
}

export interface HttpOptions {
    baseUrl: string;
    /** Intervalo mínimo entre o início de duas requisições. */
    delayMs: number;
    timeoutMs: number;
    /** Total de tentativas por requisição (1 = sem retry). */
    maxRetries: number;
    /** Base do backoff exponencial: base, base*2, base*4... */
    backoffBaseMs?: number;
    fetch?: typeof globalThis.fetch;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    logger?: Pick<Logger, "debug" | "warn">;
}

export type Query = Record<string, string | number | undefined>;
export type HttpGet = <T>(path: string, query?: Query) => Promise<T | null>;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isRetryable(status: number) {
    return status === 429 || status >= 500;
}

/**
 * GET em JSON com pausa entre requisições, timeout e retry com backoff.
 * Devolve null em 404; lança CnesHttpError nos demais erros.
 */
export function createHttpGet(options: HttpOptions): HttpGet {
    const fetchFn = options.fetch ?? globalThis.fetch;
    const sleep = options.sleep ?? defaultSleep;
    const now = options.now ?? Date.now;
    const backoffBaseMs = options.backoffBaseMs ?? 500;
    let lastRequestAt: number | null = null;

    async function throttle() {
        if (lastRequestAt !== null) {
            const wait = lastRequestAt + options.delayMs - now();
            if (wait > 0) await sleep(wait);
        }
        lastRequestAt = now();
    }

    return async function get<T>(path: string, query: Query = {}): Promise<T | null> {
        const url = new URL(path, options.baseUrl);
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }

        let lastError: unknown;
        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
            await throttle();
            try {
                options.logger?.debug({ url: url.toString(), attempt }, "GET CNES");
                const response = await fetchFn(url, {
                    headers: { accept: "application/json" },
                    signal: AbortSignal.timeout(options.timeoutMs),
                });

                if (response.status === 404) return null;
                if (response.ok) return (await response.json()) as T;

                lastError = new CnesHttpError(`HTTP ${response.status}`, response.status, url.toString());
            } catch (error) {
                lastError = error;
            }

            if (lastError instanceof CnesHttpError && lastError.status !== null && !isRetryable(lastError.status)) {
                throw lastError;
            }

            if (attempt < options.maxRetries) {
                const backoff = backoffBaseMs * 2 ** (attempt - 1);
                options.logger?.warn({ url: url.toString(), attempt, backoff, err: lastError }, "falha na API CNES, tentando de novo");
                await sleep(backoff);
            }
        }

        const reason = lastError instanceof Error ? lastError.message : String(lastError);
        const status = lastError instanceof CnesHttpError ? lastError.status : null;
        throw new CnesHttpError(`API CNES falhou após ${options.maxRetries} tentativas: ${reason}`, status, url.toString());
    };
}
