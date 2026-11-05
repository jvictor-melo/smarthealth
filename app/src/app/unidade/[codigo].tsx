import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnidade } from "../../api/hooks";
import type { DiaSemana, UnidadeDetalhe } from "../../api/types";
import { corDoTipo } from "../../mapa/cores";
import { abrirRota } from "../../rota/abrirRota";

const DIAS: { chave: DiaSemana; nome: string }[] = [
    { chave: "seg", nome: "Segunda" },
    { chave: "ter", nome: "Terça" },
    { chave: "qua", nome: "Quarta" },
    { chave: "qui", nome: "Quinta" },
    { chave: "sex", nome: "Sexta" },
    { chave: "sab", nome: "Sábado" },
    { chave: "dom", nome: "Domingo" },
];

function endereco(u: UnidadeDetalhe): string | null {
    const { logradouro, numero, bairro, cep } = u.endereco;
    const linha = [logradouro && (numero ? `${logradouro}, ${numero}` : logradouro), bairro, cep && `CEP ${cep}`].filter(Boolean).join(" · ");
    return linha || null;
}

function Campo({ rotulo, valor, onPress }: { rotulo: string; valor: string | null; onPress?: () => void }) {
    if (!valor) return null;
    return (
        <View style={styles.campo}>
            <Text style={styles.rotulo}>{rotulo}</Text>
            <Text style={[styles.valor, onPress && styles.link]} onPress={onPress}>
                {valor}
            </Text>
        </View>
    );
}

export default function TelaUnidade() {
    const { codigo } = useLocalSearchParams<{ codigo: string }>();
    const codigoCnes = Number(codigo);
    const consulta = useUnidade(codigoCnes);
    const u = consulta.data;

    if (consulta.isLoading) return <ActivityIndicator style={styles.centro} size="large" />;
    if (consulta.isError) {
        return (
            <View style={styles.centro}>
                <Text style={styles.mensagem}>Não foi possível carregar a unidade</Text>
                <Pressable onPress={() => consulta.refetch()} accessibilityRole="button">
                    <Text style={styles.link}>Tentar de novo</Text>
                </Pressable>
            </View>
        );
    }
    if (!u) {
        return (
            <View style={styles.centro}>
                <Text style={styles.mensagem}>Unidade não encontrada</Text>
            </View>
        );
    }

    const detalhes = u.detalhes_verificados;
    const horarios = DIAS.filter((d) => detalhes?.horarios?.[d.chave]?.length);

    return (
        <SafeAreaView style={styles.tela} edges={["bottom", "left", "right"]}>
            <Stack.Screen options={{ title: u.tipo.descricao }} />
            <ScrollView contentContainerStyle={styles.conteudo}>
                <View style={styles.cabecalho}>
                    <View style={[styles.bolinha, { backgroundColor: corDoTipo(u.tipo.codigo) }]} />
                    <Text style={styles.nome}>{u.nome}</Text>
                </View>

                <Campo rotulo="Endereço" valor={endereco(u)} />
                <Campo rotulo="Telefone" valor={u.telefone} onPress={() => Linking.openURL(`tel:${u.telefone}`)} />
                <Campo rotulo="Atendimento (CNES)" valor={u.turno_atendimento} />

                {horarios.length > 0 && (
                    <View style={styles.campo}>
                        <Text style={styles.rotulo}>Horários</Text>
                        {horarios.map((d) => (
                            <Text key={d.chave} style={styles.valor}>
                                {d.nome}: {detalhes!.horarios![d.chave]!.map((f) => `${f.abre}–${f.fecha}`).join(", ")}
                            </Text>
                        ))}
                    </View>
                )}
                {!!detalhes?.servicos?.length && <Campo rotulo="Serviços" valor={detalhes.servicos.join(" · ")} />}
                <Campo rotulo="Observações" valor={detalhes?.observacoes ?? null} />

                <View style={styles.miniMapa}>
                    <MapView
                        style={StyleSheet.absoluteFill}
                        initialRegion={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                    >
                        <Marker coordinate={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng }} pinColor={corDoTipo(u.tipo.codigo)} />
                    </MapView>
                </View>
            </ScrollView>

            <Pressable style={styles.botao} onPress={() => abrirRota(u.localizacao)} accessibilityRole="button">
                <Text style={styles.botaoTexto}>Ir até lá</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    tela: { flex: 1, backgroundColor: "#fff" },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff" },
    mensagem: { fontSize: 16, color: "#333" },
    conteudo: { padding: 16, gap: 16 },
    cabecalho: { flexDirection: "row", alignItems: "center", gap: 10 },
    bolinha: { width: 14, height: 14, borderRadius: 7 },
    nome: { flex: 1, fontSize: 20, fontWeight: "700", color: "#111" },
    campo: { gap: 2 },
    rotulo: { fontSize: 13, color: "#666" },
    valor: { fontSize: 16, color: "#222" },
    link: { color: "#208AEF", fontWeight: "600" },
    miniMapa: { height: 180, borderRadius: 16, overflow: "hidden" },
    botao: { margin: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: "#208AEF", alignItems: "center" },
    botaoTexto: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
