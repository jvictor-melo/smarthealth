import { LIMITE_UNIDADES, RAIO_TERESINA_M, TERESINA_CENTRO } from "../src/config";

test("constantes da API", () => {
    expect(TERESINA_CENTRO).toEqual({ lat: -5.0892, lng: -42.8019 });
    // máximos aceitos pela API: o app baixa Teresina inteira de uma vez
    expect(RAIO_TERESINA_M).toBe(50000);
    expect(LIMITE_UNIDADES).toBe(200);
});
