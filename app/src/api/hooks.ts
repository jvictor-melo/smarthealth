import { useQuery } from "@tanstack/react-query";
import { LIMITE_UNIDADES, RAIO_TERESINA_M, TERESINA_CENTRO } from "../config";
import { buscarUnidade, listarUnidades } from "./client";

// Os dados vêm do sync semanal do CNES: não adianta buscar de novo a todo momento
const UMA_HORA_MS = 60 * 60 * 1000;

/**
 * Todas as unidades de Teresina numa chamada só (~195), sem depender do GPS nem de onde o mapa está.
 * A lista ordena pela distância da pessoa no próprio celular (ver mapa/distancia.ts).
 */
export function useUnidadesTeresina() {
    return useQuery({
        queryKey: ["unidades", "teresina"],
        queryFn: async () => {
            const lista = await listarUnidades({ centro: TERESINA_CENTRO, raioM: RAIO_TERESINA_M, limit: LIMITE_UNIDADES });
            // A API entrega no máximo LIMITE_UNIDADES; se bater no limite, faltam unidades no mapa
            if (lista.unidades.length >= LIMITE_UNIDADES) {
                console.warn(`[unidades] veio o limite de ${LIMITE_UNIDADES}: algumas unidades de Teresina podem ter ficado de fora`);
            }
            return lista;
        },
        staleTime: UMA_HORA_MS,
    });
}

export function useUnidade(codigoCnes: number) {
    return useQuery({
        queryKey: ["unidade", codigoCnes],
        queryFn: () => buscarUnidade(codigoCnes),
        enabled: Number.isInteger(codigoCnes) && codigoCnes > 0,
        staleTime: UMA_HORA_MS,
    });
}
