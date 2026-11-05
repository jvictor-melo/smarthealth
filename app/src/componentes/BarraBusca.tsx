import { StyleSheet, Text, TextInput, View } from "react-native";
import { useBusca } from "../estado/busca";

export function BarraBusca() {
    const { termo, setTermo } = useBusca();

    return (
        <View style={styles.container}>
            <Text style={styles.marca}>SmartHealth</Text>
            <TextInput
                style={styles.campo}
                value={termo}
                onChangeText={setTermo}
                placeholder="Buscar unidade ou tipo (ex.: UPA, posto)"
                placeholderTextColor="#888"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
                accessibilityLabel="Buscar unidade de saúde"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
    marca: { fontSize: 14, fontWeight: "700", color: "#208AEF" },
    campo: {
        borderWidth: 2,
        borderColor: "#222",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: "#111",
        backgroundColor: "#fff",
    },
});
