import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useBusca } from "../estado/busca";
import { cor, espaco, fonte, tamanho } from "../tema";
import { Texto } from "./Texto";

/** Atalhos que só preenchem a busca: os mesmos termos de src/busca/sinonimos.ts */
const ATALHOS = ["UPA", "Hospital", "Posto"];

export function BarraBusca() {
    const { termo, setTermo } = useBusca();
    const [focado, setFocado] = useState(false);

    return (
        <View style={styles.container}>
            <Texto variante="titulo" negrito style={styles.marca}>
                SmartHealth
            </Texto>
            <View style={[styles.campo, focado && styles.campoFocado]}>
                <TextInput
                    style={styles.entrada}
                    value={termo}
                    onChangeText={setTermo}
                    onFocus={() => setFocado(true)}
                    onBlur={() => setFocado(false)}
                    placeholder="Buscar unidade ou tipo de atendimento"
                    placeholderTextColor={cor.tintaSuave}
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel="Buscar unidade de saúde"
                />
                {termo.length > 0 && (
                    <Pressable onPress={() => setTermo("")} hitSlop={12} accessibilityRole="button" accessibilityLabel="Limpar busca">
                        <Texto negrito style={styles.limpar}>
                            Limpar
                        </Texto>
                    </Pressable>
                )}
            </View>
            <View style={styles.atalhos}>
                {ATALHOS.map((a) => {
                    const ativo = termo.trim().toLowerCase() === a.toLowerCase();
                    return (
                        <Pressable
                            key={a}
                            onPress={() => setTermo(ativo ? "" : a)}
                            style={[styles.atalho, ativo && styles.atalhoAtivo]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: ativo }}
                        >
                            <Texto variante="corpo" negrito style={{ color: ativo ? cor.papel : cor.marca }}>
                                {a}
                            </Texto>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: espaco.l, paddingTop: espaco.s, gap: espaco.m },
    marca: { color: cor.marca },
    campo: {
        flexDirection: "row",
        alignItems: "center",
        gap: espaco.s,
        minHeight: 52,
        paddingHorizontal: espaco.l,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: cor.linha,
        backgroundColor: cor.superficie,
    },
    campoFocado: { borderColor: cor.marca, backgroundColor: cor.papel },
    entrada: { flex: 1, paddingVertical: espaco.m, fontFamily: fonte.regular, fontSize: tamanho.destaque, color: cor.tinta },
    limpar: { color: cor.marca },
    atalhos: { flexDirection: "row", gap: espaco.s },
    atalho: {
        paddingHorizontal: espaco.l,
        paddingVertical: espaco.s,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: cor.marca,
    },
    atalhoAtivo: { backgroundColor: cor.marca },
});
