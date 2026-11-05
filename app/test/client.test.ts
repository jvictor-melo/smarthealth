import { ApiError, buscarUnidade, listarUnidades, TEMPO_LIMITE_MS } from "../src/api/client";
import { API_URL } from "../src/config";

function resposta(status: number, corpo: unknown = {}) {
    return Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } }));
}

describe("listarUnidades", () => {
    test("monta a url com centro, raio e limite e devolve o json", async () => {
        const corpo = { meta: { quantidade: 0, dados_atualizados_em: null }, unidades: [] };
        const fetchFn = jest.fn(() => resposta(200, corpo));

        const lista = await listarUnidades({ centro: { lat: -5.0892, lng: -42.8019 }, raioM: 10000, limit: 200 }, fetchFn);

        expect(fetchFn).toHaveBeenCalledWith(`${API_URL}/units?lat=-5.0892&lng=-42.8019&raio_m=10000&limit=200`, expect.anything());
        expect(lista).toEqual(corpo);
    });

    test("503 do gateway vira ApiError com status", async () => {
        const fetchFn = jest.fn(() => resposta(503));
        const erro = await listarUnidades({ centro: { lat: 0, lng: 0 }, raioM: 1, limit: 1 }, fetchFn).catch((e: unknown) => e);

        expect(erro).toBeInstanceOf(ApiError);
        expect((erro as ApiError).status).toBe(503);
    });

    test("falha de rede vira ApiError sem status", async () => {
        const fetchFn = jest.fn(() => Promise.reject(new TypeError("Network request failed")));
        const erro = await listarUnidades({ centro: { lat: 0, lng: 0 }, raioM: 1, limit: 1 }, fetchFn).catch((e: unknown) => e);

        expect(erro).toBeInstanceOf(ApiError);
        expect((erro as ApiError).status).toBeNull();
    });
});

test("gateway que não responde vira ApiError depois do tempo limite", async () => {
    jest.useFakeTimers();
    // Só termina quando o sinal de abort dispara, como um fetch para um IP que não responde
    const fetchFn = jest.fn(
        (_url: string, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => reject(new Error("Aborted")));
            }),
    );
    const promessa = listarUnidades({ centro: { lat: 0, lng: 0 }, raioM: 1, limit: 1 }, fetchFn).catch((e: unknown) => e);

    jest.advanceTimersByTime(TEMPO_LIMITE_MS);
    const erro = await promessa;
    jest.useRealTimers();

    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).status).toBeNull();
});

describe("buscarUnidade", () => {
    test("404 devolve null", async () => {
        const fetchFn = jest.fn(() => resposta(404, { erro: "Unidade não encontrada" }));

        expect(await buscarUnidade(1, fetchFn)).toBeNull();
        expect(fetchFn).toHaveBeenCalledWith(`${API_URL}/units/1`, expect.anything());
    });
});
