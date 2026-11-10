// Gera os PNGs dos pinos (bolinha colorida, borda branca, contorno escuro suave) em 1x/2x/3x.
// Uso (na raiz): node scripts/gerar-pinos.mjs app/assets/pinos
// As cores precisam bater com app/src/tema.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const CORES = {
    urgencia: "#C62828",
    hospital: "#3949AB",
    basica: "#2E7D4F",
    especialidades: "#8E24AA",
    outros: "#6B7A80",
};
const TAMANHO_DP = 24; // 22 de bolinha + 1 de contorno de cada lado
const BORDA_BRANCA_DP = 3;
const CONTORNO_DP = 1;
const SUPER = 4; // supersampling para borda suave

const crcTabela = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});
function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) c = crcTabela[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(dados.length);
    const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(corpo));
    return Buffer.concat([tam, corpo, crc]);
}
function png(lado, rgba) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(lado, 0);
    ihdr.writeUInt32BE(lado, 4);
    ihdr[8] = 8; // bits
    ihdr[9] = 6; // RGBA
    const linhas = Buffer.alloc((lado * 4 + 1) * lado);
    for (let y = 0; y < lado; y++) rgba.copy(linhas, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        bloco("IHDR", ihdr),
        bloco("IDAT", deflateSync(linhas)),
        bloco("IEND", Buffer.alloc(0)),
    ]);
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function desenhar(corHex, escala) {
    const lado = TAMANHO_DP * escala;
    const [r, g, b] = hex(corHex);
    const raio = lado / 2;
    const raioBranco = raio - CONTORNO_DP * escala;
    const raioCor = raioBranco - BORDA_BRANCA_DP * escala;
    const rgba = Buffer.alloc(lado * lado * 4);
    for (let y = 0; y < lado; y++)
        for (let x = 0; x < lado; x++) {
            let sr = 0, sg = 0, sb = 0, sa = 0;
            for (let sy = 0; sy < SUPER; sy++)
                for (let sx = 0; sx < SUPER; sx++) {
                    const dx = x + (sx + 0.5) / SUPER - raio;
                    const dy = y + (sy + 0.5) / SUPER - raio;
                    const d = Math.hypot(dx, dy);
                    if (d <= raioCor) { sr += r; sg += g; sb += b; sa += 255; }
                    else if (d <= raioBranco) { sr += 255; sg += 255; sb += 255; sa += 255; }
                    else if (d <= raio) { sa += 70; } // contorno escuro translúcido (preto, alfa baixo)
                }
            const n = SUPER * SUPER;
            const a = sa / n;
            const i = (y * lado + x) * 4;
            // cor média ponderada pelo alfa (o contorno contribui com preto)
            rgba[i] = a ? Math.round(sr / (sa / 255)) : 0;
            rgba[i + 1] = a ? Math.round(sg / (sa / 255)) : 0;
            rgba[i + 2] = a ? Math.round(sb / (sa / 255)) : 0;
            rgba[i + 3] = Math.round(a);
        }
    return png(lado, rgba);
}

const saida = process.argv[2];
mkdirSync(saida, { recursive: true });
for (const [nome, cor] of Object.entries(CORES))
    for (const escala of [1, 2, 3]) {
        const arquivo = escala === 1 ? `${nome}.png` : `${nome}@${escala}x.png`;
        writeFileSync(join(saida, arquivo), desenhar(cor, escala));
    }
console.log("ok");
