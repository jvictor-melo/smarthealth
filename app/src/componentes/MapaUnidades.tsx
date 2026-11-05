import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { corDoTipo } from "../mapa/cores";
import { cor } from "../tema";
import { nomeDoTipo, nomeLegivel } from "../texto/nomes";

// Esconde restaurantes, lojas etc. do Google Maps (Android) para só os pinos de saúde aparecerem
const SEM_PONTOS_DE_INTERESSE = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

interface Props {
    posicaoInicial: Coordenada;
    unidades: Unidade[];
    onSelecionar: (codigoCnes: number) => void;
    onCentroMudou: (centro: Coordenada) => void;
}

export function MapaUnidades({ posicaoInicial, unidades, onSelecionar, onCentroMudou }: Props) {
    return (
        <MapView
            style={styles.mapa}
            initialRegion={{
                latitude: posicaoInicial.lat,
                longitude: posicaoInicial.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
            customMapStyle={SEM_PONTOS_DE_INTERESSE}
            showsPointsOfInterests={false}
            poiClickEnabled={false}
            userInterfaceStyle="light"
            showsUserLocation
            showsMyLocationButton
            toolbarEnabled={false}
            onRegionChangeComplete={(r) => onCentroMudou({ lat: r.latitude, lng: r.longitude })}
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
