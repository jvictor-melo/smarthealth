import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnidadesProximas } from "../api/hooks";
import { filtrarUnidades } from "../busca/filtrar";
import { BarraBusca } from "../componentes/BarraBusca";
import { ListaUnidades } from "../componentes/ListaUnidades";
import { MapaUnidades } from "../componentes/MapaUnidades";
import { Texto } from "../componentes/Texto";
import { API_URL, type Coordenada } from "../config";
import { useBusca } from "../estado/busca";
import { useLocalizacao } from "../localizacao/useLocalizacao";
import { distanciaM } from "../mapa/distancia";
import { itensVisiveis } from "../mapa/itensVisiveis";
import { cor, espaco } from "../tema";

const LEGENDA = [
    { cor: cor.urgencia, nome: "Urgência" },
    { cor: cor.hospital, nome: "Hospital" },
    { cor: cor.basica, nome: "Posto / UBS" },
];

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

    useEffect(() => {
        // Aparece no terminal do Expo: ajuda a saber se o celular não alcança o gateway ou se a API respondeu erro
        if (consulta.error) console.warn(`[unidades] ${consulta.error.message} (API_URL=${API_URL})`);
    }, [consulta.error]);

    const titulo = termo.trim() ? "Resultados" : usandoGps ? "Lugares próximos" : "Unidades em Teresina";
    const abrirUnidade = (codigo: number) => router.push(`/unidade/${codigo}`);

    return (
        <SafeAreaView style={styles.tela} edges={["top", "left", "right"]}>
            <BarraBusca />
            {!usandoGps && !carregandoGps && (
                <Texto variante="legenda" style={styles.aviso}>
                    Sem acesso à sua localização. Mostrando unidades a partir do centro de Teresina.
                </Texto>
            )}
            {!consulta.data && consulta.isFetching && (
                <Texto suave style={styles.status}>
                    Procurando unidades perto de você…
                </Texto>
            )}
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
                    <ActivityIndicator style={styles.centro} size="large" color={cor.marca} />
                ) : (
                    <MapaUnidades posicaoInicial={posicao} unidades={filtradas} onSelecionar={abrirUnidade} onCentroMudou={setCentroMapa} />
                )}
                {consulta.isFetching && !carregandoGps && <ActivityIndicator style={styles.carregando} color={cor.marca} />}
                {consulta.isError && (
                    <View style={styles.erro}>
                        <Texto style={styles.erroTexto}>Sem conexão com o servidor do SmartHealth. Confira a internet e tente de novo.</Texto>
                        <Pressable onPress={() => consulta.refetch()} accessibilityRole="button" hitSlop={8}>
                            <Texto negrito style={styles.erroTexto}>
                                Tentar de novo
                            </Texto>
                        </Pressable>
                    </View>
                )}
                <View style={styles.legenda} pointerEvents="none">
                    {LEGENDA.map((l) => (
                        <View key={l.nome} style={styles.legendaItem}>
                            <View style={[styles.legendaPonto, { backgroundColor: l.cor }]} />
                            <Texto variante="legenda">{l.nome}</Texto>
                        </View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    tela: { flex: 1, backgroundColor: cor.papel },
    aviso: { marginHorizontal: espaco.l, marginTop: espaco.m, color: cor.tintaSuave },
    status: { marginHorizontal: espaco.l, marginTop: espaco.l },
    moldura: {
        flex: 1,
        marginHorizontal: espaco.l,
        marginTop: espaco.m,
        marginBottom: espaco.l,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: cor.linha,
        overflow: "hidden",
        backgroundColor: cor.superficie,
    },
    centro: { flex: 1 },
    carregando: { position: "absolute", top: espaco.m, alignSelf: "center" },
    erro: {
        position: "absolute",
        left: espaco.m,
        right: espaco.m,
        top: espaco.m,
        padding: espaco.m,
        gap: espaco.s,
        borderRadius: 16,
        backgroundColor: cor.erroFundo,
    },
    erroTexto: { color: cor.erroTexto },
    legenda: {
        position: "absolute",
        left: espaco.m,
        bottom: espaco.m,
        flexDirection: "row",
        gap: espaco.m,
        paddingHorizontal: espaco.m,
        paddingVertical: espaco.s,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.94)",
    },
    legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendaPonto: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: cor.papel },
});
