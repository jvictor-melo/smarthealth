import { useQuery } from "@tanstack/react-query";
import { LIMITE_UNIDADES, RAIO_PADRAO_M, type Coordenada } from "../config";
import { arredondarCentro } from "../mapa/centro";
import { buscarUnidade, listarUnidades } from "./client";

export function useUnidadesProximas(centro: Coordenada, habilitado = true) {
    const arredondado = arredondarCentro(centro);
    return useQuery({
        queryKey: ["unidades", arredondado.lat, arredondado.lng],
        queryFn: () => listarUnidades({ centro: arredondado, raioM: RAIO_PADRAO_M, limit: LIMITE_UNIDADES }),
        enabled: habilitado,
        staleTime: 5 * 60 * 1000,
        // Mantém os pinos atuais na tela enquanto a busca do novo centro carrega
        placeholderData: (anterior) => anterior,
    });
}

export function useUnidade(codigoCnes: number) {
    return useQuery({
        queryKey: ["unidade", codigoCnes],
        queryFn: () => buscarUnidade(codigoCnes),
        enabled: Number.isInteger(codigoCnes) && codigoCnes > 0,
        staleTime: 5 * 60 * 1000,
    });
}
