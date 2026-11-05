import { LIMITE_UNIDADES, RAIO_PADRAO_M, TERESINA_CENTRO } from "../src/config";

test("constantes da API", () => {
    expect(TERESINA_CENTRO).toEqual({ lat: -5.0892, lng: -42.8019 });
    expect(RAIO_PADRAO_M).toBeLessThanOrEqual(50000);
    expect(LIMITE_UNIDADES).toBe(200);
});
