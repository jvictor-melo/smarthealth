export type Coordenada = { lat: number; lng: number };

/** Gateway do SmartHealth. Celular físico: IP do PC na rede; emulador Android: http://10.0.2.2:3000 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** Usado quando a pessoa nega a permissão de localização */
export const TERESINA_CENTRO: Coordenada = { lat: -5.0892, lng: -42.8019 };

/** A API aceita raio_m até 50000 e limit até 200 */
export const RAIO_PADRAO_M = 10000;
export const LIMITE_UNIDADES = 200;
