import { Pressable, StyleSheet, View } from "react-native";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { corDoTipo } from "../mapa/grupos";
import { distanciaM, formatarDistancia } from "../mapa/distancia";
import { cor, espaco } from "../tema";
import { nomeDoTipo, nomeLegivel } from "../texto/nomes";
import { Texto } from "./Texto";

interface Props {
    titulo: string;
    unidades: Unidade[];
    /** Posição da pessoa; null quando está sem GPS (a distância não é mostrada) */
    origem: Coordenada | null;
    maxItens: number;
    onSelecionar: (codigoCnes: number) => void;
    /** Texto quando nada passa na busca/filtros; muda conforme a causa para a pessoa saber o que fazer */
    mensagemVazia: string;
}

export function ListaUnidades({ titulo, unidades, origem, maxItens, onSelecionar, mensagemVazia }: Props) {
    return (
        <View style={styles.container}>
            <Texto variante="titulo" negrito style={styles.titulo}>
                {titulo}
            </Texto>
            {unidades.length === 0 ? (
                <Texto suave style={styles.vazio}>
                    {mensagemVazia}
                </Texto>
            ) : (
                unidades.slice(0, maxItens).map((u, i) => {
                    // "1,1 km" → número grande, unidade pequena: a distância é o que a pessoa compara
                    const [numero, medida] = origem ? formatarDistancia(distanciaM(origem, u.localizacao)).split(" ") : [];
                    return (
                        <Pressable
                            key={u.codigo_cnes}
                            style={({ pressed }) => [styles.item, i > 0 && styles.itemComLinha, pressed && styles.itemPressionado]}
                            onPress={() => onSelecionar(u.codigo_cnes)}
                            accessibilityRole="button"
                            accessibilityLabel={`${nomeLegivel(u.nome)}, ${nomeDoTipo(u.tipo)}${numero ? `, a ${numero} ${medida}` : ""}`}
                        >
                            <View style={[styles.faixa, { backgroundColor: corDoTipo(u.tipo.codigo) }]} />
                            <View style={styles.textos}>
                                <Texto variante="destaque" negrito numberOfLines={1}>
                                    {nomeLegivel(u.nome)}
                                </Texto>
                                <Texto variante="legenda" suave numberOfLines={1}>
                                    {nomeDoTipo(u.tipo)}
                                    {u.endereco.bairro ? `, ${nomeLegivel(u.endereco.bairro)}` : ""}
                                </Texto>
                            </View>
                            {numero && (
                                <View style={styles.distancia}>
                                    <Texto variante="titulo" negrito style={styles.numero}>
                                        {numero}
                                    </Texto>
                                    <Texto variante="legenda" suave>
                                        {medida}
                                    </Texto>
                                </View>
                            )}
                        </Pressable>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: espaco.l, paddingTop: espaco.l },
    titulo: { marginBottom: espaco.xs },
    vazio: { paddingVertical: espaco.m },
    item: { flexDirection: "row", alignItems: "center", gap: espaco.m, paddingVertical: espaco.m },
    itemComLinha: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cor.linha },
    itemPressionado: { opacity: 0.55 },
    faixa: { width: 5, alignSelf: "stretch", borderRadius: 3 },
    textos: { flex: 1, gap: 2 },
    distancia: { flexDirection: "row", alignItems: "baseline", gap: 3 },
    numero: { color: cor.marca },
});
