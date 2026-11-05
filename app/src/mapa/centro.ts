import type { Coordenada } from "../config";

/** ~100 m de precisão: usado na chave da busca para não refazer a requisição a cada pixel arrastado */
export function arredondarCentro(c: Coordenada): Coordenada {
    return { lat: Math.round(c.lat * 1000) / 1000, lng: Math.round(c.lng * 1000) / 1000 };
}
