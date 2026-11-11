import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { imagemDoPino } from "../mapa/pinos";
import { nomeDoTipo, nomeLegivel } from "../texto/nomes";

// Esconde restaurantes, lojas etc. do Google Maps (Android) para só os pinos de saúde aparecerem
const SEM_PONTOS_DE_INTERESSE = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

const ZOOM = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

interface Props {
    /** Muda conforme a localização melhora (centro → última posição → GPS); o mapa desliza até ela */
    posicao: Coordenada;
    unidades: Unidade[];
    onSelecionar: (codigoCnes: number) => void;
}

export function MapaUnidades({ posicao, unidades, onSelecionar }: Props) {
    const mapa = useRef<MapView>(null);
    // Só a primeira posição vira a região inicial; as seguintes chegam pelo animateToRegion
    const [posicaoInicial] = useState(posicao);

    // O mapa abre na hora com o que já se sabe; quando a posição melhora, ele desliza até lá
    useEffect(() => {
        if (posicao === posicaoInicial) return;
        mapa.current?.animateToRegion({ latitude: posicao.lat, longitude: posicao.lng, ...ZOOM }, 600);
    }, [posicao, posicaoInicial]);

    return (
        <MapView
            ref={mapa}
            style={styles.mapa}
            initialRegion={{
                latitude: posicaoInicial.lat,
                longitude: posicaoInicial.lng,
                ...ZOOM,
            }}
            customMapStyle={SEM_PONTOS_DE_INTERESSE}
            showsPointsOfInterests={false}
            poiClickEnabled={false}
            userInterfaceStyle="light"
            showsUserLocation
            showsMyLocationButton
            toolbarEnabled={false}
        >
            {unidades.map((u) => (
                <Marker
                    key={u.codigo_cnes}
                    coordinate={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng }}
                    title={nomeLegivel(u.nome)}
                    description={`${nomeDoTipo(u.tipo)}. Toque para ver detalhes`}
                    onCalloutPress={() => onSelecionar(u.codigo_cnes)}
                    anchor={{ x: 0.5, y: 0.5 }}
                    // Imagem pronta em vez de View: o mapa não precisa "fotografar" cada pino (ver mapa/pinos.ts)
                    image={imagemDoPino(u.tipo.codigo)}
                    tracksViewChanges={false}
                />
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    mapa: { flex: 1 },
});
