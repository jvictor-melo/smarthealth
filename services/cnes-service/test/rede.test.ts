import { describe, expect, it } from "vitest";
import { redeDaNatureza } from "../src/cnes/rede.js";

describe("redeDaNatureza", () => {
    it("separa pública, privada e filantrópica pelo primeiro dígito", () => {
        expect(redeDaNatureza("1155")).toBe("publica");
        expect(redeDaNatureza("2062")).toBe("privada");
        expect(redeDaNatureza("3999")).toBe("filantropica");
    });

    it("deixa sem rede os demais grupos e o código ausente", () => {
        expect(redeDaNatureza("4014")).toBeNull();
        expect(redeDaNatureza(null)).toBeNull();
    });
});
