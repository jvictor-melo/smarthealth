import { create } from "zustand";

/** Fica fora da tela para o texto continuar lá ao voltar da tela da unidade */
interface EstadoBusca {
    termo: string;
    setTermo: (termo: string) => void;
}

export const useBusca = create<EstadoBusca>((set) => ({
    termo: "",
    setTermo: (termo) => set({ termo }),
}));
