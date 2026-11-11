import { useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnidade } from "../../api/hooks";
import type { DiaSemana, Rede, UnidadeDetalhe } from "../../api/types";
import { Texto } from "../../componentes/Texto";
import { corDoTipo, grupoDoTipo } from "../../mapa/grupos";
import { imagemDoPino } from "../../mapa/pinos";
import { abrirRota } from "../../rota/abrirRota";
import { cor, espaco } from "../../tema";
import { formatarCep, formatarTelefone, nomeDoTipo, nomeLegivel } from "../../texto/nomes";

const NOME_REDE: Record<Rede, string> = {
    publica: "Unidade pública",
    privada: "Unidade privada",
    filantropica: "Filantrópica (sem fins lucrativos)",
};

const DIAS: { chave: DiaSemana; nome: string }[] = [
    { chave: "seg", nome: "Segunda" },
    { chave: "ter", nome: "Terça" },
    { chave: "qua", nome: "Quarta" },
    { chave: "qui", nome: "Quinta" },
    { chave: "sex", nome: "Sexta" },
    { chave: "sab", nome: "Sábado" },
    { chave: "dom", nome: "Domingo" },
];

function linhasEndereco(u: UnidadeDetalhe): string[] {
    const { logradouro, numero, bairro, cep } = u.endereco;
    const rua = logradouro ? nomeLegivel(logradouro) + (numero ? `, ${numero}` : "") : null;
    const resto = [bairro && nomeLegivel(bairro), cep && `CEP ${formatarCep(cep)}`].filter(Boolean).join(", ");
    return [rua, resto || null].filter((l): l is string => !!l);
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <View style={styles.secao}>
            <Texto variante="legenda" negrito suave>
                {titulo}
            </Texto>
            {children}
        </View>
    );
}

function Centro({ children }: { children: ReactNode }) {
    return <View style={styles.centro}>{children}</View>;
}

export default function TelaUnidade() {
    const { codigo } = useLocalSearchParams<{ codigo: string }>();
    const consulta = useUnidade(Number(codigo));
    const u = consulta.data;

    if (consulta.isLoading) {
        return (
            <Centro>
                <ActivityIndicator size="large" color={cor.marca} />
            </Centro>
        );
    }
    if (consulta.isError) {
        return (
            <Centro>
                <Texto variante="destaque" style={styles.mensagem}>
                    Sem conexão com o servidor do SmartHealth.
                </Texto>
                <Pressable onPress={() => consulta.refetch()} accessibilityRole="button" hitSlop={8}>
                    <Texto variante="destaque" negrito style={styles.link}>
                        Tentar de novo
                    </Texto>
                </Pressable>
            </Centro>
        );
    }
    if (!u) {
        return (
            <Centro>
                <Texto variante="destaque" style={styles.mensagem}>
                    Essa unidade não está mais na lista do CNES.
                </Texto>
            </Centro>
        );
    }

    const corTipo = corDoTipo(u.tipo.codigo);
    const grupo = grupoDoTipo(u.tipo.codigo);
    const detalhes = u.detalhes_verificados;
    const horarios = DIAS.filter((d) => detalhes?.horarios?.[d.chave]?.length);
    const endereco = linhasEndereco(u);

    return (
        <SafeAreaView style={styles.tela} edges={["bottom", "left", "right"]}>
            <ScrollView contentContainerStyle={styles.conteudo}>
                <View style={styles.cabecalho}>
                    <View style={styles.tipo}>
                        <View style={[styles.tipoPonto, { backgroundColor: corTipo }]} />
                        <Texto negrito style={{ color: corTipo }}>
                            {nomeDoTipo(u.tipo)}
                        </Texto>
                    </View>
                    <Texto variante="nome" negrito>
                        {nomeLegivel(u.nome)}
                    </Texto>
                    {grupo === "especialidades" && (
                        <Texto suave>Policlínica: consultas com especialistas e exames, sem urgência.</Texto>
                    )}
                    {(u.rede || u.atende_sus) && (
                        <View style={styles.etiquetas}>
                            {u.rede && (
                                <View style={styles.etiqueta}>
                                    <Texto variante="legenda" negrito>
                                        {NOME_REDE[u.rede]}
                                    </Texto>
                                </View>
                            )}
                            {u.atende_sus && (
                                <View style={styles.etiqueta}>
                                    <Texto variante="legenda" negrito>
                                        Atende SUS
                                    </Texto>
                                </View>
                            )}
                        </View>
                    )}
                    {u.verificada && (
                        <View style={styles.selo}>
                            <Texto variante="legenda" negrito style={styles.seloTexto}>
                                Informações conferidas pela equipe do SmartHealth
                            </Texto>
                        </View>
                    )}
                </View>

                {/* pointerEvents none: no modo leve, tocar no mapa abriria o app do Google Maps; a rota é pelo botão "Ir até lá" */}
                <View style={styles.miniMapa} pointerEvents="none">
                    <MapView
                        style={StyleSheet.absoluteFill}
                        initialRegion={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                        // Android: mapa leve, praticamente uma imagem. Abrir e voltar da unidade travava com um mapa completo aqui
                        liteMode
                        userInterfaceStyle="light"
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        toolbarEnabled={false}
                    >
                        <Marker
                            coordinate={{ latitude: u.localizacao.lat, longitude: u.localizacao.lng }}
                            anchor={{ x: 0.5, y: 0.5 }}
                            image={imagemDoPino(u.tipo.codigo)}
                            tracksViewChanges={false}
                        />
                    </MapView>
                </View>

                {endereco.length > 0 && (
                    <Secao titulo="Endereço">
                        {endereco.map((linha) => (
                            <Texto key={linha} variante="destaque">
                                {linha}
                            </Texto>
                        ))}
                    </Secao>
                )}

                {u.telefone && (
                    <Secao titulo="Telefone">
                        <View style={styles.telefone}>
                            <Texto variante="destaque">{formatarTelefone(u.telefone)}</Texto>
                            <Pressable
                                style={styles.botaoLigar}
                                onPress={() => Linking.openURL(`tel:${u.telefone}`)}
                                accessibilityRole="button"
                                accessibilityLabel={`Ligar para ${formatarTelefone(u.telefone)}`}
                            >
                                <Texto negrito style={styles.link}>
                                    Ligar
                                </Texto>
                            </Pressable>
                        </View>
                    </Secao>
                )}

                {horarios.length > 0 ? (
                    <Secao titulo="Horários">
                        {horarios.map((d) => (
                            <View key={d.chave} style={styles.horario}>
                                <Texto variante="destaque">{d.nome}</Texto>
                                <Texto variante="destaque" negrito>
                                    {detalhes!.horarios![d.chave]!.map((f) => `${f.abre} às ${f.fecha}`).join(" e ")}
                                </Texto>
                            </View>
                        ))}
                    </Secao>
                ) : (
                    u.turno_atendimento && (
                        <Secao titulo="Atendimento">
                            <Texto variante="destaque">{u.turno_atendimento}</Texto>
                        </Secao>
                    )
                )}

                {!!detalhes?.servicos?.length && (
                    <Secao titulo="Serviços">
                        <View style={styles.servicos}>
                            {detalhes.servicos.map((s) => (
                                <View key={s} style={styles.servico}>
                                    <Texto>{s}</Texto>
                                </View>
                            ))}
                        </View>
                    </Secao>
                )}

                {detalhes?.observacoes && (
                    <Secao titulo="Observações">
                        <Texto variante="destaque">{detalhes.observacoes}</Texto>
                    </Secao>
                )}
            </ScrollView>

            <View style={styles.rodape}>
                <Pressable
                    style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
                    onPress={() => abrirRota(u.localizacao)}
                    accessibilityRole="button"
                    accessibilityHint="Abre a rota no aplicativo de mapas"
                >
                    <Texto variante="titulo" negrito style={styles.botaoTexto}>
                        Ir até lá
                    </Texto>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    tela: { flex: 1, backgroundColor: cor.papel },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: espaco.m, padding: espaco.xl, backgroundColor: cor.papel },
    mensagem: { textAlign: "center" },
    conteudo: { paddingHorizontal: espaco.l, paddingBottom: espaco.xl, gap: espaco.xl },
    cabecalho: { gap: espaco.s },
    tipo: { flexDirection: "row", alignItems: "center", gap: espaco.s },
    tipoPonto: { width: 12, height: 12, borderRadius: 6 },
    etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s, marginTop: espaco.xs },
    etiqueta: { paddingHorizontal: espaco.m, paddingVertical: 6, borderRadius: 12, backgroundColor: cor.superficie },
    selo: { alignSelf: "flex-start", marginTop: espaco.xs, paddingHorizontal: espaco.m, paddingVertical: 6, borderRadius: 12, backgroundColor: cor.marcaClara },
    seloTexto: { color: cor.marca },
    miniMapa: { height: 190, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: cor.linha },
    secao: { gap: espaco.xs },
    telefone: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    botaoLigar: { paddingHorizontal: espaco.l, paddingVertical: espaco.s, borderRadius: 18, borderWidth: 1.5, borderColor: cor.marca },
    link: { color: cor.marca },
    horario: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: espaco.s,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: cor.linha,
    },
    servicos: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s, marginTop: espaco.xs },
    servico: { paddingHorizontal: espaco.m, paddingVertical: 6, borderRadius: 12, backgroundColor: cor.superficie },
    rodape: { paddingHorizontal: espaco.l, paddingTop: espaco.m, paddingBottom: espaco.l, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cor.linha },
    botao: { minHeight: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: cor.marca },
    botaoPressionado: { opacity: 0.85 },
    botaoTexto: { color: cor.papel },
});
