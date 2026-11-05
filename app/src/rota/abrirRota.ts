import { Linking, Platform } from "react-native";
import type { Coordenada } from "../config";

/** Só o destino: o app de mapas usa o GPS dele ou pede o ponto de partida */
export function urlRota(destino: Coordenada, plataforma: string): string {
    const ponto = `${destino.lat},${destino.lng}`;
    if (plataforma === "ios") return `http://maps.apple.com/?daddr=${ponto}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${ponto}`;
}

export function abrirRota(destino: Coordenada): Promise<void> {
    return Linking.openURL(urlRota(destino, Platform.OS));
}
