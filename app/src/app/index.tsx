import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnidadesProximas } from "../api/hooks";
import { filtrarUnidades } from "../busca/filtrar";
import { BarraBusca } from "../componentes/BarraBusca";
import { ListaUnidades } from "../componentes/ListaUnidades";
import { MapaUnidades } from "../componentes/MapaUnidades";
import type { Coordenada } from "../config";
import { useBusca } from "../estado/busca";
import { useLocalizacao } from "../localizacao/useLocalizacao";
import { distanciaM } from "../mapa/distancia";
import { itensVisiveis } from "../mapa/itensVisiveis";

export default function TelaInicial() {
    const { posicao, usandoGps, carregando: carregandoGps } = useLocalizacao();
    const [centroMapa, setCentroMapa] = useState<Coordenada | null>(null);
    const termo = useBusca((s) => s.termo);
    const { height } = useWindowDimensions();

    const consulta = useUnidadesProximas(centroMapa ?? posicao, !carregandoGps);

    const filtradas = useMemo(() => {
        const encontradas = filtrarUnidades(consulta.data?.unidades ?? [], termo);
        // A API ordena pelo centro da busca, que muda ao arrastar o mapa; a lista ordena pela pessoa
        if (!usandoGps) return encontradas;
        return [...encontradas].sort((a, b) => distanciaM(posicao, a.localizacao) - distanciaM(posicao, b.localizacao));
    }, [consulta.data, termo, usandoGps, posicao]);

    const titulo = termo.trim() ? "Resultados" : usandoGps ? "Lugares próximos" : "Unidades em Teresina";
    const abrirUnidade = (codigo: number) => router.push(`/unidade/${codigo}`);

    return (
        <SafeAreaView style={styles.tela} edges={["top", "left", "right"]}>
            <BarraBusca />
            {!usandoGps && !carregandoGps && <Text style={styles.aviso}>Sem localização: mostrando unidades a partir do centro de Teresina</Text>}
            {!consulta.data && consulta.isFetching && <Text style={styles.status}>Carregando unidades…</Text>}
            {consulta.data && (
                <ListaUnidades
                    titulo={titulo}
                    unidades={filtradas}
                    origem={usandoGps ? posicao : null}
                    maxItens={itensVisiveis(height)}
                    onSelecionar={abrirUnidade}
                />
            )}

            <View style={styles.moldura}>
                {carregandoGps ? (
                    <ActivityIndicator style={styles.centro} size="large" />
                ) : (
                    <MapaUnidades posicaoInicial={posicao} unidades={filtradas} onSelecionar={abrirUnidade} onCentroMudou={setCentroMapa} />
                )}
                {consulta.isFetching && !carregandoGps && <ActivityIndicator style={styles.carregando} />}
                {consulta.isError && (
                    <View style={styles.erro}>
                        <Text style={styles.erroTexto}>Não foi possível carregar as unidades</Text>
                        <Pressable onPress={() => consulta.refetch()} accessibilityRole="button">
                            <Text style={styles.erroBotao}>Tentar de novo</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    tela: { flex: 1, backgroundColor: "#fff" },
    aviso: { marginHorizontal: 16, marginTop: 8, fontSize: 13, color: "#8a5a00" },
    status: { marginHorizontal: 16, marginTop: 12, fontSize: 15, color: "#555" },
    moldura: {
        flex: 1,
        margin: 16,
        borderWidth: 2,
        borderColor: "#222",
        borderRadius: 20,
        overflow: "hidden",
    },
    centro: { flex: 1 },
    carregando: { position: "absolute", top: 12, right: 12 },
    erro: {
        position: "absolute",
        left: 12,
        right: 12,
        top: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#fdecea",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    erroTexto: { flex: 1, color: "#8b1a1a" },
    erroBotao: { color: "#8b1a1a", fontWeight: "700" },
});
