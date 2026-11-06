import { Text, type TextProps } from "react-native";
import { cor, fonte, tamanho } from "../tema";

type Variante = keyof typeof tamanho;

interface Props extends TextProps {
    variante?: Variante;
    negrito?: boolean;
    suave?: boolean;
}

/** Texto com a fonte e a escala do app; evita repetir fontFamily em cada estilo */
export function Texto({ variante = "corpo", negrito = false, suave = false, style, ...resto }: Props) {
    return (
        <Text
            {...resto}
            style={[
                {
                    fontFamily: negrito ? fonte.negrito : fonte.regular,
                    fontSize: tamanho[variante],
                    lineHeight: Math.round(tamanho[variante] * 1.3),
                    color: suave ? cor.tintaSuave : cor.tinta,
                },
                style,
            ]}
        />
    );
}
