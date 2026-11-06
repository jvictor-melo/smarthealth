import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold, useFonts } from "@expo-google-fonts/atkinson-hyperlegible";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { cor, fonte } from "../tema";

const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

// Guarda as respostas da API no celular: da segunda abertura em diante os pinos aparecem na hora,
// e o app atualiza por trás. Os dados só mudam no sync semanal do CNES.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "smarthealth-cache" });
const persistOptions = {
    persister,
    maxAge: UMA_SEMANA_MS,
    // Mude quando o formato da resposta da API mudar: o cache antigo é descartado
    buster: "v1",
};

export default function RootLayout() {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    // retry 1: com o padrão (3 tentativas e espera crescente) a falha só aparecia depois de muito tempo carregando
                    // gcTime ≥ maxAge do cache, senão o que foi guardado é descartado antes de ser usado
                    queries: { retry: 1, gcTime: UMA_SEMANA_MS },
                },
            }),
    );
    // Atkinson Hyperlegible: fonte feita para leitura fácil por pessoas com baixa visão
    const [fontesProntas, erroFontes] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });

    if (!fontesProntas && !erroFontes) return null;

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerTintColor: cor.marca,
                    headerTitleStyle: { fontFamily: fonte.negrito, color: cor.tinta },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: cor.papel },
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="unidade/[codigo]" options={{ title: "", headerBackTitle: "Voltar" }} />
            </Stack>
        </PersistQueryClientProvider>
    );
}
