import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { TERESINA_CENTRO, type Coordenada } from "../config";

export interface EstadoLocalizacao {
    posicao: Coordenada;
    /** false quando a permissão foi negada ou o GPS falhou: a posição é o centro de Teresina */
    usandoGps: boolean;
    carregando: boolean;
}

export function useLocalizacao(): EstadoLocalizacao {
    const [estado, setEstado] = useState<EstadoLocalizacao>({ posicao: TERESINA_CENTRO, usandoGps: false, carregando: true });

    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") throw new Error("permissão negada");
                const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (!cancelado) setEstado({ posicao: { lat: coords.latitude, lng: coords.longitude }, usandoGps: true, carregando: false });
            } catch {
                if (!cancelado) setEstado({ posicao: TERESINA_CENTRO, usandoGps: false, carregando: false });
            }
        })();
        return () => {
            cancelado = true;
        };
    }, []);

    return estado;
}
