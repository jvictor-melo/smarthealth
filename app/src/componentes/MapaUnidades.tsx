import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { corDoTipo } from "../mapa/cores";

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
            showsUserLocation
            showsMyLocationButton
            onRegionChangeComplete={(r) => onCentroMudou({ lat: r.latitude, lng: r.longitude })}
        >
            {unidades.map((u) => (
                <Marker
                    key={u.codigo_cnes}
                    coordinate={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng }}
                    pinColor={corDoTipo(u.tipo.codigo)}
                    title={u.nome}
                    description="Toque para ver detalhes"
                    onCalloutPress={() => onSelecionar(u.codigo_cnes)}
                />
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    mapa: { flex: 1 },
});
