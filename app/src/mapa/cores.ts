import { cor } from "../tema";

/** Cor do pino e da marca da lista: urgência em vermelho, hospital em índigo, atenção básica em verde */
export function corDoTipo(codigo: number): string {
    if (codigo === 73 || codigo === 20) return cor.urgencia;
    if (codigo === 5 || codigo === 7 || codigo === 15) return cor.hospital;
    if (codigo === 1 || codigo === 2) return cor.basica;
    return cor.outros;
}
