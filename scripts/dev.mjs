// npm run dev: sobe o Postgres, liga cnes-service e api-gateway (via concurrently, com prefixo nos logs)
// e o Expo direto no terminal. O Expo precisa do terminal "de verdade" para mostrar o QR code e aceitar
// atalhos como "r"; dentro do concurrently ele perde os dois.
// npm run dev:prod: o mesmo, com o Expo em modo de produção (--no-dev --minify), que se comporta como o APK.
import { spawn, spawnSync } from "node:child_process";

const opcoes = { stdio: "inherit", shell: true };

const banco = spawnSync("npm run db", opcoes);
if (banco.status !== 0) process.exit(banco.status ?? 1);

// stdin ignorado: só o Expo lê o teclado
const api = spawn("npm run dev:api:servicos", { stdio: ["ignore", "inherit", "inherit"], shell: true });
const producao = process.argv.includes("--prod");
const expo = spawn(producao ? "npm --prefix app start -- --no-dev --minify" : "npm --prefix app start", opcoes);

// Ctrl+C chega a todos os processos do terminal; aqui só garantimos que um não fique sozinho
expo.on("exit", (codigo) => {
    api.kill();
    process.exit(codigo ?? 0);
});
api.on("exit", (codigo) => {
    if (codigo) console.error(`\nO back-end parou (código ${codigo}). Veja o erro acima.`);
});
