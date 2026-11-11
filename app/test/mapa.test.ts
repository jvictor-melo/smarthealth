import { distanciaM, formatarDistancia } from "../src/mapa/distancia";
import { corDoTipo, GRUPOS, grupoDoTipo } from "../src/mapa/grupos";
import { itensVisiveis } from "../src/mapa/itensVisiveis";
import { urlRota } from "../src/rota/abrirRota";
import { cor } from "../src/tema";

test("cada tipo do CNES cai no grupo certo", () => {
    expect(grupoDoTipo(73)).toBe("urgencia");
    expect(grupoDoTipo(20)).toBe("urgencia");
    expect(grupoDoTipo(5)).toBe("hospital");
    expect(grupoDoTipo(15)).toBe("hospital");
    expect(grupoDoTipo(2)).toBe("basica");
    expect(grupoDoTipo(4)).toBe("especialidades");
    expect(grupoDoTipo(999)).toBeNull();
});

test("cor por tipo de unidade, com cinza só para tipo fora dos grupos", () => {
    expect(corDoTipo(73)).toBe(cor.urgencia);
    expect(corDoTipo(4)).toBe(cor.especialidades);
    expect(corDoTipo(999)).toBe(cor.outros);
});

test("cada grupo tem cor diferente", () => {
    expect(new Set(GRUPOS.map((g) => g.cor)).size).toBe(GRUPOS.length);
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
