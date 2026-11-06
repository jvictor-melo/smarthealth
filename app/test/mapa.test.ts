import { corDoTipo } from "../src/mapa/cores";
import { distanciaM, formatarDistancia } from "../src/mapa/distancia";
import { itensVisiveis } from "../src/mapa/itensVisiveis";
import { urlRota } from "../src/rota/abrirRota";
import { cor } from "../src/tema";

test("cor por tipo de unidade", () => {
    expect(corDoTipo(73)).toBe(cor.urgencia);
    expect(corDoTipo(20)).toBe(cor.urgencia);
    expect(corDoTipo(5)).toBe(cor.hospital);
    expect(corDoTipo(2)).toBe(cor.basica);
    expect(corDoTipo(999)).toBe(cor.outros);
});

test("itens da lista conforme a altura da tela", () => {
    expect(itensVisiveis(640)).toBe(3);
    expect(itensVisiveis(780)).toBe(4);
    expect(itensVisiveis(900)).toBe(5);
});

test("distância entre dois pontos e formatação em km", () => {
    // 0,01° de longitude perto do equador (lat -5,09) ≈ 1107,6 m
    const d = distanciaM({ lat: -5.0892, lng: -42.8019 }, { lat: -5.0892, lng: -42.7919 });
    expect(Math.abs(d - 1107.6)).toBeLessThan(5);
    expect(formatarDistancia(1107.6)).toBe("1,1 km");
    expect(formatarDistancia(820)).toBe("0,8 km");
});

test("url de rota por plataforma, só com destino", () => {
    expect(urlRota({ lat: -5.1, lng: -42.8 }, "ios")).toBe("http://maps.apple.com/?daddr=-5.1,-42.8");
    expect(urlRota({ lat: -5.1, lng: -42.8 }, "android")).toBe("https://www.google.com/maps/dir/?api=1&destination=-5.1,-42.8");
});
