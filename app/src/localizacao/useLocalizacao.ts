import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { TERESINA_CENTRO, type Coordenada } from "../config";

/** De onde veio a posição: centro da cidade (sem GPS), última posição guardada pelo celular, ou GPS agora */
export type OrigemPosicao = "centro" | "ultima" | "gps";

export interface EstadoLocalizacao {
    posicao: Coordenada;
    origem: OrigemPosicao;
    /** false quando a permissão foi negada ou o GPS falhou: a posição é o centro de Teresina */
    usandoGps: boolean;
    /** true até sabermos se há permissão; o mapa não espera por isso */
    carregando: boolean;
}

// Última posição com mais de 30 min pode estar em outro bairro; nesse caso esperamos o GPS
const IDADE_MAXIMA_ULTIMA_MS = 30 * 60 * 1000;

/**
 * Entrega uma posição o quanto antes e vai melhorando: primeiro o centro de Teresina,
 * depois a última posição que o celular guardou (quase instantânea) e por fim o GPS.
 */
export function useLocalizacao(): EstadoLocalizacao {
    const [estado, setEstado] = useState<EstadoLocalizacao>({ posicao: TERESINA_CENTRO, origem: "centro", usandoGps: false, carregando: true });

    useEffect(() => {
        let cancelado = false;
        const atualizar = (novo: EstadoLocalizacao) => {
            if (!cancelado) setEstado(novo);
        };

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") throw new Error("permissão negada");

                const ultima = await Location.getLastKnownPositionAsync({ maxAge: IDADE_MAXIMA_ULTIMA_MS });
                if (ultima) {
                    atualizar({ posicao: { lat: ultima.coords.latitude, lng: ultima.coords.longitude }, origem: "ultima", usandoGps: true, carregando: false });
                }

                const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                atualizar({ posicao: { lat: coords.latitude, lng: coords.longitude }, origem: "gps", usandoGps: true, carregando: false });
            } catch {
                // Se a última posição já chegou, ficamos com ela; senão, centro de Teresina
                if (!cancelado) setEstado((atual) => (atual.origem === "ultima" ? atual : { posicao: TERESINA_CENTRO, origem: "centro", usandoGps: false, carregando: false }));
            }
        })();

        return () => {
            cancelado = true;
        };
    }, []);

    return estado;
}
