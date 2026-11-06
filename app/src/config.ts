export type Coordenada = { lat: number; lng: number };

/** Gateway do SmartHealth. Celular físico: IP do PC na rede; emulador Android: http://10.0.2.2:3000 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** Ponto de partida do mapa e da busca; também usado quando a pessoa nega a permissão de localização */
export const TERESINA_CENTRO: Coordenada = { lat: -5.0892, lng: -42.8019 };

/**
 * O app baixa Teresina inteira de uma vez: 50 km a partir do centro cobre o município todo.
 * São os máximos da API (raio_m ≤ 50000, limit ≤ 200); a base tem ~195 unidades.
 */
export const RAIO_TERESINA_M = 50000;
export const LIMITE_UNIDADES = 200;
