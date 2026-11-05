/** Cor do pino e da bolinha da lista: urgência em vermelho, hospital em azul, atenção básica em verde */
export function corDoTipo(codigo: number): string {
    if (codigo === 73 || codigo === 20) return "#d32f2f";
    if (codigo === 5 || codigo === 7 || codigo === 15) return "#1565c0";
    if (codigo === 1 || codigo === 2) return "#2e7d32";
    return "#6d6d6d";
}
