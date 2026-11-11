# SmartHealth

Aplicativo mobile para encontrar unidades de saúde em Teresina-PI: mapa com a sua localização, busca e filtros por tipo de atendimento e rede, detalhes da unidade e rota até ela.

Projeto de extensão (PEX) do curso de Ciência da Computação. Os dados das unidades vêm do CNES (Cadastro Nacional de Estabelecimentos de Saúde), a base oficial do Ministério da Saúde.

## O que já funciona

- Mapa com as unidades de Teresina (UPA, hospital, posto/UBS e especialidades e exames), cada tipo com uma cor.
- Lista "Lugares próximos", ordenada pela distância até você.
- Busca por nome ou tipo ("upa", "posto", "hospital") e filtros por tipo de atendimento, rede (pública, privada, filantrópica) e atendimento SUS.
- Tela da unidade com endereço, telefone, horários (nas unidades verificadas) e botão "Ir até lá", que abre a rota no Google Maps ou Apple Maps.
- Dados atualizados toda semana a partir do CNES.

## Estrutura

| Pasta | O que é |
|---|---|
| `app/` | App mobile (Expo / React Native) |
| `services/cnes-service/` | Sincroniza as unidades do CNES e expõe as rotas de unidades (porta 3002) |
| `services/api-gateway/` | Porta de entrada do app para os serviços (porta 3000) |
| `services/user-service/` | Usuários e login (ainda não implementado) |
| `infrastructure/` | Postgres + PostGIS no Docker, para desenvolvimento |
| `docs/` | Registro de decisões e design de cada funcionalidade |
| `scripts/` | Atalhos de desenvolvimento (comando único, geração dos pinos) |

```
celular (app) → api-gateway :3000 → cnes-service :3002 → Postgres/PostGIS
```

## Como rodar

**Pré-requisitos:** Git, Node.js 24, Docker Desktop (aberto) e o app Expo Go no celular. No Windows, use o PowerShell.

### Primeira vez

```bash
git clone git@github.com:jvictor-melo/smarthealth.git
cd smarthealth
npm run setup        # npm install na raiz, cnes-service, api-gateway e app
```

Crie os `.env` a partir dos exemplos:

```bash
cp services/cnes-service/.env.example services/cnes-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
cp app/.env.example app/.env
```

- `app/.env`: `EXPO_PUBLIC_API_URL=http://<IP do PC na rede>:3000` (não use `localhost`).
- Porta 5432 ocupada por outro Postgres? Crie `infrastructure/.env` com `POSTGRES_PORT=5434` e use `5434` no `DATABASE_URL` do `services/cnes-service/.env`.

Prepare o banco:

```bash
npm run db                                         # sobe o Postgres no Docker
npm --prefix services/cnes-service run db:migrate  # cria as tabelas
npm --prefix services/cnes-service run sync:full   # baixa as unidades de Teresina do CNES
```

### Dia a dia

```bash
npm run dev        # desenvolvimento: banco, cnes-service, api-gateway e Expo num terminal só
npm run dev:prod   # o mesmo, com o app em modo de produção (como no APK)
npm run dev:api    # só banco e back-end (para rodar o Expo em outro terminal)
```

Leia o QR code com o Expo Go, com o celular no mesmo Wi-Fi do PC. No iPhone, o Expo Go exige login com a mesma conta do Expo no PC (`npx expo login --no-browser --username <usuário>`).

Depois de um `git pull`: `npm run setup` de novo e, se houver migration nova, `db:migrate` e `sync:full`.

### Problemas comuns

- **App mostra "Sem conexão com o servidor":** confira o IP no `app/.env`, se o celular está no mesmo Wi-Fi e se o firewall do Windows permite o Node.js em rede privada (a rede do Windows não pode estar marcada como "Pública").
- **cnes-service não conecta no banco:** provavelmente a porta 5432 está ocupada; veja o item da porta acima.
- **Expo Go mostra uma versão antiga do app no `dev:prod`:** no modo produção o Expo Go reaproveita o pacote já baixado. Limpe os dados do Expo Go (Configurações → Apps → Expo Go → Armazenamento → Limpar dados) e leia o QR code de novo, ou use `npm run dev`.

## Tecnologias

**App:** React Native, Expo (SDK 58), Expo Router, expo-location, react-native-maps, TanStack Query, Zustand. APK via EAS Build.

**Back-end:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL + PostGIS, zod, pino, node-cron, swagger-ui-express, Docker.

**Previstas para o login (user-service):** JWT, bcrypt, express-rate-limit, expo-secure-store.

## Documentação

- [`docs/decisoes.md`](docs/decisoes.md): todas as decisões do projeto, com o motivo, e o que está em aberto.
- [`services/cnes-service/README.md`](services/cnes-service/README.md): API do CNES, regras de sincronização e rotas do serviço. Com o serviço rodando, a documentação das rotas fica em http://localhost:3002/docs.
- [`app/README.md`](app/README.md): detalhes do app.
- [`docs/superpowers/`](docs/superpowers/): design e plano de implementação de cada funcionalidade.
- API de dados abertos do Ministério da Saúde: https://apidadosabertos.saude.gov.br/v1/#/ (a documentação usa `/v1`, mas as rotas de verdade não têm esse prefixo).
