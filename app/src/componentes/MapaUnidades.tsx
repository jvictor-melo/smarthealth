import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { corDoTipo } from "../mapa/grupos";
import { cor } from "../tema";
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
                    // Pino é uma View estática: sem isso o Android redesenha os 200 pinos a cada quadro
                    tracksViewChanges={false}
                >
                    <View style={[styles.pino, { backgroundColor: corDoTipo(u.tipo.codigo) }]} />
                </Marker>
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    mapa: { flex: 1 },
    pino: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
        borderColor: cor.papel,
        elevation: 3,
    },
});
