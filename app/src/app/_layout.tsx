import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

export default function RootLayout() {
    // retry 1: com o padrão (3 tentativas e espera crescente) a falha só aparecia depois de muito tempo carregando
    const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));

    return (
        <QueryClientProvider client={queryClient}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="unidade/[codigo]" options={{ title: "Unidade" }} />
            </Stack>
        </QueryClientProvider>
    );
}
