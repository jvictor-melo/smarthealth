import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Unidade } from "../api/types";
import type { Coordenada } from "../config";
import { corDoTipo } from "../mapa/cores";
import { distanciaM, formatarDistancia } from "../mapa/distancia";

interface Props {
    titulo: string;
    unidades: Unidade[];
    /** Posição da pessoa; null quando está sem GPS (a distância não é mostrada) */
    origem: Coordenada | null;
    maxItens: number;
    onSelecionar: (codigoCnes: number) => void;
}

export function ListaUnidades({ titulo, unidades, origem, maxItens, onSelecionar }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>{titulo}</Text>
            {unidades.length === 0 ? (
                <Text style={styles.vazio}>Nenhuma unidade encontrada</Text>
            ) : (
                unidades.slice(0, maxItens).map((u) => (
                    <Pressable
                        key={u.codigo_cnes}
                        style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
                        onPress={() => onSelecionar(u.codigo_cnes)}
                        accessibilityRole="button"
                    >
                        <View style={[styles.bolinha, { backgroundColor: corDoTipo(u.tipo.codigo) }]} />
                        <Text style={styles.nome} numberOfLines={1}>
                            {u.nome}
                        </Text>
                        {origem && <Text style={styles.distancia}>{formatarDistancia(distanciaM(origem, u.localizacao))}</Text>}
                    </Pressable>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingVertical: 8 },
    titulo: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: "#111" },
    vazio: { color: "#666", paddingVertical: 8 },
    item: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
    itemPressionado: { opacity: 0.5 },
    bolinha: { width: 12, height: 12, borderRadius: 6 },
    nome: { flex: 1, fontSize: 15, color: "#222" },
    distancia: { fontSize: 14, color: "#555" },
});
