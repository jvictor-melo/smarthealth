/** Quantas unidades a lista da tela inicial mostra, para sobrar espaço para o mapa em celular pequeno */
export function itensVisiveis(alturaTela: number): number {
    if (alturaTela < 700) return 3;
    if (alturaTela < 850) return 4;
    return 5;
}
