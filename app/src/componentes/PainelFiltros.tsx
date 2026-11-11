import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Rede } from "../api/types";
import { contarFiltros } from "../busca/filtros";
import { useFiltros } from "../estado/filtros";
import { GRUPOS } from "../mapa/grupos";
import { cor, espaco } from "../tema";
import { Texto } from "./Texto";

const REDES: { id: Rede; nome: string }[] = [
    { id: "publica", nome: "Pública" },
    { id: "privada", nome: "Privada" },
    { id: "filantropica", nome: "Filantrópica" },
];

interface Props {
    visivel: boolean;
    onFechar: () => void;
    /** Quantas unidades passam na busca + filtros atuais; o painel muda os filtros ao vivo */
    quantidade: number;
}

function Opcao({ marcada, onPress, children, corPonto }: { marcada: boolean; onPress: () => void; children: string; corPonto?: string }) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.opcao, marcada && styles.opcaoMarcada]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcada }}
        >
            {corPonto && <View style={[styles.ponto, { backgroundColor: corPonto }]} />}
            <Texto negrito style={{ color: marcada ? cor.papel : cor.marca }}>
                {children}
            </Texto>
        </Pressable>
    );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <View style={styles.bloco}>
            <Texto variante="destaque" negrito>
                {titulo}
            </Texto>
            {children}
        </View>
    );
}

export function PainelFiltros({ visivel, onFechar, quantidade }: Props) {
    const filtros = useFiltros();
    const ligados = contarFiltros(filtros);
    const especialidades = GRUPOS.find((g) => g.id === "especialidades");

    return (
        <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
            {/* Toque fora do painel fecha, como nos apps de mapa */}
            <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar filtros" />
            <SafeAreaView edges={["bottom"]} style={styles.painel}>
                <View style={styles.cabecalho}>
                    <Texto variante="titulo" negrito>
                        Filtros
                    </Texto>
                    <Pressable onPress={onFechar} hitSlop={12} accessibilityRole="button">
                        <Texto negrito style={styles.link}>
                            Fechar
                        </Texto>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.conteudo}>
                    <Bloco titulo="Tipo de atendimento">
                        <View style={styles.opcoes}>
                            {GRUPOS.map((g) => (
                                <Opcao key={g.id} marcada={filtros.grupos.includes(g.id)} onPress={() => filtros.alternarGrupo(g.id)} corPonto={g.cor}>
                                    {g.nome}
                                </Opcao>
                            ))}
                        </View>
                        {especialidades?.explicacao && (
                            <Texto variante="legenda" suave>
                                {especialidades.nome}: {especialidades.explicacao.toLowerCase()}
                            </Texto>
                        )}
                    </Bloco>

                    <Bloco titulo="Rede">
                        <View style={styles.opcoes}>
                            {REDES.map((r) => (
                                <Opcao key={r.id} marcada={filtros.redes.includes(r.id)} onPress={() => filtros.alternarRede(r.id)}>
                                    {r.nome}
                                </Opcao>
                            ))}
                        </View>
                        <Texto variante="legenda" suave>
                            Filantrópica: sem fins lucrativos, como Santas Casas.
                        </Texto>
                    </Bloco>

                    <Pressable
                        onPress={filtros.alternarSus}
                        style={styles.sus}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: filtros.soSus }}
                    >
                        <View style={[styles.caixa, filtros.soSus && styles.caixaMarcada]}>
                            {filtros.soSus && (
                                <Texto negrito style={styles.visto}>
                                    ✓
                                </Texto>
                            )}
                        </View>
                        <Texto variante="destaque">Só unidades que atendem SUS</Texto>
                    </Pressable>
                </ScrollView>

                <View style={styles.rodape}>
                    <Pressable
                        onPress={filtros.limpar}
                        disabled={ligados === 0}
                        style={[styles.botaoSecundario, ligados === 0 && styles.desligado]}
                        accessibilityRole="button"
                    >
                        <Texto variante="destaque" negrito style={styles.link}>
                            Limpar
                        </Texto>
                    </Pressable>
                    <Pressable onPress={onFechar} style={styles.botao} accessibilityRole="button">
                        <Texto variante="destaque" negrito style={styles.botaoTexto}>
                            {quantidade === 1 ? "Ver 1 unidade" : `Ver ${quantidade} unidades`}
                        </Texto>
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fundo: { flex: 1, backgroundColor: "rgba(19,35,43,0.45)" },
    painel: {
        maxHeight: "85%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: cor.papel,
    },
    cabecalho: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: espaco.l,
        paddingTop: espaco.l,
        paddingBottom: espaco.s,
    },
    conteudo: { paddingHorizontal: espaco.l, paddingBottom: espaco.l, gap: espaco.xl },
    bloco: { gap: espaco.s },
    opcoes: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s },
    opcao: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: espaco.l,
        paddingVertical: espaco.s,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: cor.marca,
    },
    opcaoMarcada: { backgroundColor: cor.marca },
    ponto: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: cor.papel },
    sus: { flexDirection: "row", alignItems: "center", gap: espaco.m, paddingVertical: espaco.xs },
    caixa: {
        width: 26,
        height: 26,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: cor.marca,
        alignItems: "center",
        justifyContent: "center",
    },
    caixaMarcada: { backgroundColor: cor.marca },
    visto: { color: cor.papel },
    rodape: {
        flexDirection: "row",
        gap: espaco.m,
        paddingHorizontal: espaco.l,
        paddingTop: espaco.m,
        paddingBottom: espaco.l,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: cor.linha,
    },
    botaoSecundario: {
        paddingHorizontal: espaco.l,
        minHeight: 52,
        justifyContent: "center",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: cor.marca,
    },
    desligado: { opacity: 0.4 },
    botao: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: cor.marca },
    botaoTexto: { color: cor.papel },
    link: { color: cor.marca },
});
