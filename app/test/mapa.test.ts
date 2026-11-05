import { arredondarCentro } from "../src/mapa/centro";
import { corDoTipo } from "../src/mapa/cores";
import { itensVisiveis } from "../src/mapa/itensVisiveis";
import { urlRota } from "../src/rota/abrirRota";

test("cor por tipo de unidade", () => {
    expect(corDoTipo(73)).toBe("#d32f2f");
    expect(corDoTipo(5)).toBe("#1565c0");
    expect(corDoTipo(2)).toBe("#2e7d32");
    expect(corDoTipo(999)).toBe("#6d6d6d");
});

test("centro arredondado em 3 casas", () => {
    expect(arredondarCentro({ lat: -5.08923, lng: -42.80187 })).toEqual({ lat: -5.089, lng: -42.802 });
});

test("itens da lista conforme a altura da tela", () => {
    expect(itensVisiveis(640)).toBe(3);
    expect(itensVisiveis(780)).toBe(4);
    expect(itensVisiveis(900)).toBe(5);
});

test("url de rota por plataforma, só com destino", () => {
    expect(urlRota({ lat: -5.1, lng: -42.8 }, "ios")).toBe("http://maps.apple.com/?daddr=-5.1,-42.8");
    expect(urlRota({ lat: -5.1, lng: -42.8 }, "android")).toBe("https://www.google.com/maps/dir/?api=1&destination=-5.1,-42.8");
});
