import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnidadesTeresina } from "../api/hooks";
import { filtrarUnidades } from "../busca/filtrar";
import { aplicarFiltros, contarFiltros } from "../busca/filtros";
import { BarraBusca } from "../componentes/BarraBusca";
import { ListaUnidades } from "../componentes/ListaUnidades";
import { MapaUnidades } from "../componentes/MapaUnidades";
import { PainelFiltros } from "../componentes/PainelFiltros";
import { Texto } from "../componentes/Texto";
import { API_URL } from "../config";
import { useBusca } from "../estado/busca";
import { useFiltros } from "../estado/filtros";
import { useLocalizacao } from "../localizacao/useLocalizacao";
import { distanciaM } from "../mapa/distancia";
import { GRUPOS } from "../mapa/grupos";
import { itensVisiveis } from "../mapa/itensVisiveis";
import { cor, espaco } from "../tema";

export default function TelaInicial() {
    const { posicao, usandoGps, carregando: carregandoGps } = useLocalizacao();
    const termo = useBusca((s) => s.termo);
    const filtros = useFiltros();
    const [painelAberto, setPainelAberto] = useState(false);
    const { height } = useWindowDimensions();

    // Não espera o GPS: as unidades são as mesmas para qualquer ponto de Teresina
    const consulta = useUnidadesTeresina();

    const filtradas = useMemo(() => {
        // Busca por texto (e atalhos) e filtros se combinam: a unidade precisa passar nos dois
        const encontradas = aplicarFiltros(filtrarUnidades(consulta.data?.unidades ?? [], termo), filtros);
        // A API ordena pelo centro da busca, que muda ao arrastar o mapa; a lista ordena pela pessoa
        if (!usandoGps) return encontradas;
        return [...encontradas].sort((a, b) => distanciaM(posicao, a.localizacao) - distanciaM(posicao, b.localizacao));
    }, [consulta.data, termo, filtros, usandoGps, posicao]);
    const comFiltros = contarFiltros(filtros) > 0;

    useEffect(() => {
        // Aparece no terminal do Expo: ajuda a saber se o celular não alcança o gateway ou se a API respondeu erro
        if (consulta.error) console.warn(`[unidades] ${consulta.error.message} (API_URL=${API_URL})`);
    }, [consulta.error]);

    // Enquanto a permissão é decidida, já trata como "próximos" para o título não piscar
    const titulo = termo.trim() || comFiltros ? "Resultados" : usandoGps || carregandoGps ? "Lugares próximos" : "Unidades em Teresina";
    const abrirUnidade = (codigo: number) => router.push(`/unidade/${codigo}`);

    return (
        <SafeAreaView style={styles.tela} edges={["top", "left", "right"]}>
            <BarraBusca onAbrirFiltros={() => setPainelAberto(true)} />
            <PainelFiltros visivel={painelAberto} onFechar={() => setPainelAberto(false)} quantidade={filtradas.length} />
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
                    mensagemVazia={
                        comFiltros
                            ? "Nenhuma unidade com esses filtros. Toque em Filtros e depois em Limpar para ver todas."
                            : "Nenhuma unidade com esse nome por perto. Tente “UPA”, “posto” ou “hospital”."
                    }
                />
            )}

            <View style={styles.moldura}>
                {/* O mapa abre na hora, sem esperar o GPS; quando a posição chega, ele desliza até ela */}
                <MapaUnidades posicao={posicao} unidades={filtradas} onSelecionar={abrirUnidade} />
                {consulta.isFetching && !consulta.data && <ActivityIndicator style={styles.carregando} color={cor.marca} />}
                {/* Com unidades guardadas no celular, uma falha ao atualizar não atrapalha: o aviso só aparece sem nada para mostrar */}
                {consulta.isError && !consulta.data && (
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
                    {GRUPOS.map((g) => (
                        <View key={g.id} style={styles.legendaItem}>
                            <View style={[styles.legendaPonto, { backgroundColor: g.cor }]} />
                            <Texto variante="legenda">{g.nome}</Texto>
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
        right: espaco.m,
        bottom: espaco.m,
        flexDirection: "row",
        // 4 grupos não cabem numa linha em celular estreito: quebra em vez de cortar
        flexWrap: "wrap",
        columnGap: espaco.m,
        rowGap: espaco.xs,
        paddingHorizontal: espaco.m,
        paddingVertical: espaco.s,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.94)",
    },
    legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendaPonto: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: cor.papel },
});
