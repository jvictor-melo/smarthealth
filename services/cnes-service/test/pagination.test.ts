import { describe, expect, it, vi } from "vitest";
import { CNES_PAGE_LIMIT, createCnesClient, paginate } from "../src/cnes/client.js";
import { CnesHttpError, createHttpGet, type HttpOptions } from "../src/cnes/http.js";
import { estabelecimentosDaPagina, fixture, jsonResponse } from "./helpers.js";

const pagina1 = estabelecimentosDaPagina("estabelecimentos-pagina-1.json");
const pagina2 = estabelecimentosDaPagina("estabelecimentos-pagina-2.json");
const ultima = estabelecimentosDaPagina("estabelecimentos-ultima-pagina.json");

function httpComFetch(fetch: typeof globalThis.fetch, extra: Partial<HttpOptions> = {}) {
    return createHttpGet({
        baseUrl: "https://api.teste",
        delayMs: 0,
        timeoutMs: 1000,
        maxRetries: 3,
        fetch,
        sleep: async () => {},
        ...extra,
    });
}

describe("paginate", () => {
    it("avança o offset de 20 em 20 itens e para na página incompleta", async () => {
        const paginas = [pagina1, pagina2, ultima];
        const fetchPage = vi.fn(async (offset: number) => paginas[offset / CNES_PAGE_LIMIT] ?? []);

        const itens = await paginate(fetchPage);

        expect(fetchPage.mock.calls.map(([offset, limit]) => [offset, limit])).toEqual([
            [0, 20],
            [20, 20],
            [40, 20],
        ]);
        expect(itens).toHaveLength(20 + 20 + ultima.length);
    });

    it("faz uma requisição a mais quando o total é múltiplo do limit", async () => {
        const fetchPage = vi.fn(async (offset: number) => (offset < 40 ? pagina1 : []));
        const itens = await paginate(fetchPage);
        expect(fetchPage).toHaveBeenCalledTimes(3);
        expect(itens).toHaveLength(40);
    });

    it("aborta se passar do número máximo de páginas", async () => {
        await expect(paginate(async () => pagina1, 20, 3)).rejects.toThrow(/3 páginas/);
    });
});

describe("cliente CNES", () => {
    it("monta a URL com filtros, limit e offset e junta as páginas", async () => {
        const paginas = [pagina1, pagina2, ultima];
        const urls: URL[] = [];
        const fetch = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            urls.push(url);
            const offset = Number(url.searchParams.get("offset"));
            return jsonResponse({ estabelecimentos: paginas[offset / 20] ?? [] });
        });

        const cliente = createCnesClient(httpComFetch(fetch as typeof globalThis.fetch));
        const itens = await cliente.listarEstabelecimentos({ codigo_municipio: "221100", status: 1 });

        expect(itens).toHaveLength(49);
        expect(urls.map((u) => u.searchParams.get("offset"))).toEqual(["0", "20", "40"]);
        expect(urls[0]?.pathname).toBe("/cnes/estabelecimentos");
        expect(urls[0]?.searchParams.get("codigo_municipio")).toBe("221100");
        expect(urls[0]?.searchParams.get("status")).toBe("1");
        expect(urls[0]?.searchParams.get("limit")).toBe("20");
    });

    it("lista tipos e devolve null para estabelecimento inexistente", async () => {
        const fetch = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            if (url.pathname === "/cnes/tipounidades") return jsonResponse(fixture("tipounidades.json"));
            return jsonResponse({ message: "Estabelecimento not found." }, 404);
        });
        const cliente = createCnesClient(httpComFetch(fetch as typeof globalThis.fetch));

        expect((await cliente.listarTiposUnidade()).length).toBeGreaterThan(0);
        expect(await cliente.buscarEstabelecimento(1)).toBeNull();
    });
});

describe("createHttpGet", () => {
    it("tenta de novo em 5xx com backoff exponencial", async () => {
        const fetch = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({}, 503))
            .mockRejectedValueOnce(new TypeError("fetch failed"))
            .mockResolvedValueOnce(jsonResponse({ ok: true }));
        const sleep = vi.fn(async () => {});

        const get = httpComFetch(fetch, { sleep, backoffBaseMs: 100 });

        expect(await get("/x")).toEqual({ ok: true });
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
    });

    it("desiste depois de maxRetries tentativas", async () => {
        const fetch = vi.fn(async () => jsonResponse({}, 500));
        const get = httpComFetch(fetch);
        await expect(get("/x")).rejects.toBeInstanceOf(CnesHttpError);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("não tenta de novo em erro 4xx", async () => {
        const fetch = vi.fn(async () => jsonResponse({}, 400));
        await expect(httpComFetch(fetch)("/x")).rejects.toMatchObject({ status: 400 });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("respeita a pausa mínima entre requisições", async () => {
        let agora = 1000;
        const sleep = vi.fn(async (ms: number) => {
            agora += ms;
        });
        const fetch = vi.fn(async () => {
            agora += 30; // a requisição levou 30ms
            return jsonResponse({});
        });
        const get = httpComFetch(fetch, { delayMs: 150, sleep, now: () => agora });

        await get("/a");
        await get("/b");

        expect(sleep).toHaveBeenCalledWith(120);
    });
});
