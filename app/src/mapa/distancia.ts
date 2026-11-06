import type { Coordenada } from "../config";

const RAIO_TERRA_M = 6371008.8;

/**
 * Distância em metros (haversine). A lista usa a distância até a pessoa, e não o distancia_m da API,
 * porque a API mede a partir do centro da busca, que muda quando o mapa é arrastado.
 */
export function distanciaM(a: Coordenada, b: Coordenada): number {
    const rad = (g: number) => (g * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(metros: number): string {
    return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}
