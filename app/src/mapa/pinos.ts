import type { ImageRequireSource } from "react-native";
import { grupoDoTipo, type Grupo } from "./grupos";

/**
 * Pinos como imagem pronta (assets/pinos, 1x/2x/3x): o mapa usa direto, sem "fotografar" uma View
 * para cada pino. Com View, filtrar ou voltar para a tela inicial travava ao recriar ~200 pinos.
 * As imagens têm as cores de tema.ts; mudou a cor de um grupo lá, gere os PNGs de novo
 * (na raiz: node scripts/gerar-pinos.mjs app/assets/pinos).
 */
const IMAGENS: Record<Grupo | "outros", ImageRequireSource> = {
    urgencia: require("../../assets/pinos/urgencia.png"),
    hospital: require("../../assets/pinos/hospital.png"),
    basica: require("../../assets/pinos/basica.png"),
    especialidades: require("../../assets/pinos/especialidades.png"),
    outros: require("../../assets/pinos/outros.png"),
};

export function imagemDoPino(codigoTipo: number): ImageRequireSource {
    return IMAGENS[grupoDoTipo(codigoTipo) ?? "outros"];
}
