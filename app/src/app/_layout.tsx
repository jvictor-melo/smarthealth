import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold, useFonts } from "@expo-google-fonts/atkinson-hyperlegible";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { cor, fonte } from "../tema";

export default function RootLayout() {
    // retry 1: com o padrão (3 tentativas e espera crescente) a falha só aparecia depois de muito tempo carregando
    const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
    // Atkinson Hyperlegible: fonte feita para leitura fácil por pessoas com baixa visão
    const [fontesProntas, erroFontes] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });

    if (!fontesProntas && !erroFontes) return null;

    return (
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
    );
}
