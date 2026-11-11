# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

SmartHealth é um app mobile (Expo / React Native, sem site) para localizar unidades de saúde em Teresina-PI, com mapa, horários, serviços e rotas. O back-end é um conjunto de microsserviços Node + Express 5 + TypeScript (ESM). A documentação, o código e as mensagens de commit são em português.

## Layout do monorepo

Não existe workspace npm: cada serviço tem o próprio `package.json` e `node_modules`. O `package.json` da raiz só tem atalhos:

- `npm run setup`: `npm install` em todas as pastas.
- `npm run dev` (`scripts/dev.mjs`): sobe o Postgres (`docker compose up -d --wait`), cnes-service e api-gateway via `concurrently` (logs com prefixo `[cnes]`/`[gateway]`) e o Expo **fora** do `concurrently`, porque dentro dele o Expo não recebe o terminal e perde o QR code e os atalhos.
- `npm run dev:prod`: igual ao `dev`, com o Expo em modo de produção (`--no-dev --minify`), para medir velocidade como no APK.
- `npm run dev:api`: só banco e back-end.

Os comandos de cada pasta continuam valendo.

- `app/`: app Expo (detalhes abaixo).
- `packages/`: código compartilhado (ainda vazio).
- `infrastructure/docker-compose.yml`: só o Postgres 17 + PostGIS 3.5 para desenvolvimento (`smarthealth`/`smarthealth`/`smarthealth`). A porta do host é `${POSTGRES_PORT:-5432}`.
- `services/api-gateway`: porta 3000. Repassa só `GET` de `/units`, `/units/:codigo`, `/unit-types` e `/health/cnes` (reescrito para `/health`) ao cnes-service, com 503 `CNES_SERVICE_UNAVAILABLE` quando ele cai. URLs dos serviços em `.env` (`CNES_SERVICE_URL`, `USER_SERVICE_URL`).
- `services/user-service`: esqueleto (só `server.ts` com um `console.log`).
- `services/cnes-service`: sync do CNES e rotas de unidades (detalhes abaixo). O `README.md` dele é a referência sobre a API do CNES e as regras de sync; leia antes de mexer no sync.
- `docs/decisoes.md`: registro de todas as decisões e do que está em aberto.
- `docs/superpowers/`: design (o quê e por quê) e plano (como) de cada funcionalidade.

## Convenções

- Commits pequenos em conventional commits, com escopo do serviço: `feat(cnes-service): ...`, `chore(infra): ...`.
- Trabalho em branch `feat/...` a partir da `main`; nada é commitado direto na `main`.
- **Registre toda decisão de produto ou técnica em `docs/decisoes.md`** (data, decisão, motivo, quem decidiu), no mesmo commit da mudança. A equipe usa esse registro para escrever o documento do projeto para a professora. Decisão que mudou não é apagada: marque como substituída. Pendências vão na seção "Em aberto".
- TypeScript estrito com `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`, e imports relativos com extensão `.js` (`nodenext`).
- No Windows, `npm`/`npx` podem falhar no Git Bash ("'node' não é reconhecido"); rode pelo PowerShell.

## cnes-service

Sincroniza as unidades de Teresina (município IBGE `221100`) da API de dados abertos do CNES para o Postgres e expõe rotas de leitura na porta 3002.

### Comandos (em `services/cnes-service`)

```bash
cp .env.example .env          # ajuste DATABASE_URL se o Postgres não estiver na 5432
docker compose -f ../../infrastructure/docker-compose.yml up -d
npm install
npm run db:migrate            # aplica drizzle/*.sql (inclui CREATE EXTENSION postgis)
npm run sync:full             # primeira carga: ~36 requisições, ~10 s, ~195 unidades
npm run dev                   # tsx watch; Swagger em http://localhost:3002/docs
```

- `npm run sync`: sync incremental (o mesmo que o cron semanal roda).
- `npm test`: todos os testes (vitest); um arquivo: `npx vitest run test/filters.test.ts`; um caso: `npx vitest run -t "trecho do nome"`.
- `npx tsc --noEmit`: typecheck. Não há linter configurado.
- `npm run db:generate`: gera migration a partir de `src/db/schema.ts`. **O drizzle-kit escreve `"geography(Point, 4326)"` entre aspas e o Postgres rejeita; tire as aspas à mão no SQL gerado.**

Os testes nunca chamam a API real: usam respostas reais salvas em `test/fixtures/*.json` e um `fetch` injetado.

### Arquitetura

O fluxo do sync é `cnes/` → `sync/` → `db/`, e o das rotas é `routes/` → `controllers/` → `services/` → `db/`.

- `src/cnes/http.ts`: GET com throttle (pausa mínima entre requisições), timeout, retry com backoff em erro de rede/429/5xx, e `404 → null`. `fetch`, `sleep` e `now` são injetáveis para teste.
- `src/cnes/client.ts`: paginação e endpoints. Pontos da API que já causaram erro:
  - a base é `https://apidadosabertos.saude.gov.br`, **sem `/v1`** (o link da documentação no README raiz tem `/v1`, mas as rotas não);
  - `limit` máximo é 20;
  - `offset` conta **itens**, não páginas (a documentação oficial está errada);
  - a resposta não traz total: pare quando uma página vier com menos que `limit`.
- `src/cnes/normalize.ts`: converte os campos crus (strings vazias, "S/N", CEP, flags SIM/NÃO) e rejeita registros sem nome ou coordenada válida.
- `src/cnes/filters.ts`: `planejarSync` (função pura) decide o que salvar, o que desativar e o que é inválido.
- `src/sync/sync.service.ts`: `executarSync(modo)`. Garantias que precisam ser mantidas:
  - busca tudo na API antes de escrever e grava numa **única transação**: se a API falhar, o banco não muda;
  - `pg_try_advisory_lock` impede dois syncs simultâneos;
  - cada execução fica registrada em `sync_execucoes`;
  - o modo full aborta se o resultado vier vazio ou com menos de 50% das unidades ativas atuais;
  - unidades **nunca são apagadas**, só recebem `ativo=false`;
  - o incremental usa `data_atualizacao` = início do último sync com sucesso − 1 dia, e busca status ativo e inativo.
- `src/sync/columns.ts`: `COLUNAS_SYNC` é a lista de colunas que o upsert sobrescreve. As colunas manuais (`horarios`, `servicos`, `observacoes`, `manual_atualizado_em`) ficam de fora e **o sync nunca pode escrevê-las**. Coluna nova vinda da API entra em `COLUNAS_SYNC`; coluna preenchida à mão não. O teste `sync-columns.test.ts` protege essa separação.
- `src/sync/scheduler.ts`: node-cron (`SYNC_CRON`, padrão segunda 03:00 em `America/Fortaleza`) com `noOverlap`; desligável por `SYNC_CRON_ENABLED`.
- `src/config/cnes.config.ts`: **lugar único** das regras de negócio:
  - `TIPOS_PERMITIDOS` (1, 2, 4, 5, 7, 15, 20, 73; os tipos 22 e 36 ficam de fora de propósito);
  - `CNES_VERIFICADAS`, as 5 unidades com dados levantados em entrevista. Elas são sempre buscadas individualmente e sempre salvas, mesmo fora dos tipos permitidos.
- `src/config/env.ts`: variáveis validadas com zod (veja `.env.example`).
- `src/db/schema.ts`: tabelas `tipos_unidade`, `unidades` (pk `codigo_cnes`, `localizacao geography(Point,4326)` com índice GiST) e `sync_execucoes`. O tipo geography customizado fica em `src/db/geography.ts`.
- `src/services/units.service.ts`: consultas das rotas. O raio usa `ST_DWithin`, a ordenação usa KNN (`<->`) e a resposta JSON é em snake_case. `detalhes_verificados` só aparece para unidades verificadas.
- `src/cnes/rede.ts`: `rede` da resposta vem do primeiro dígito da natureza jurídica (coluna `natureza_juridica`): 1 pública, 2 privada, 3 filantrópica, resto `null`. O campo do CNES se chama `descricao_natureza_juridica_estabelecimento` mas traz o código.
- `src/docs/openapi.ts`: spec OpenAPI escrita à mão; atualize junto quando mudar uma rota ou um formato de resposta.

### Limitações conhecidas dos dados

- O bairro vem truncado em 20 caracteres.
- `turno_atendimento` é texto livre, não um horário estruturado.
- O Hospital e Maternidade do Satélite (2679639) tem coordenadas imprecisas no CNES e aparece ~5 km longe do endereço real. Corrigir direto no banco não adianta, porque o sync sobrescreve a localização.

## app

Expo SDK 58 + Expo Router, rotas em `app/src/app/` (só telas; o resto do código fica em `app/src/`). Fala apenas com o api-gateway, pela URL em `EXPO_PUBLIC_API_URL` (celular físico: IP do PC na rede; emulador Android: `http://10.0.2.2:3000`). O `app/README.md` explica como subir tudo.

### Comandos (em `app/`)

- `npx expo start`: abre no Expo Go. Não há como testar as telas fora de um celular ou emulador; o mapa (`react-native-maps`) não roda na web.
- `npm test` (jest-expo); um arquivo: `npx jest test/busca.test.ts`. `npm run typecheck`, `npx expo lint`, `npx expo-doctor`.
- `npx expo export --platform android --output-dir <pasta temporária>`: compila o bundle sem celular, útil para pegar erro de import.
- Dependências sempre com `npx expo install <pacote>`. A API do Expo muda a cada SDK: o `app/AGENTS.md` (do template) manda conferir a doc versionada em `docs.expo.dev/versions/v58.0.0/` antes de usar uma API do Expo.
- O TypeScript do app é 6.x, em que `types` padrão é vazio: por isso o `tsconfig.json` lista `"types": ["jest"]`.

### Decisões que não são óbvias no código

- O app assume que a pessoa está em Teresina. Sem permissão de GPS, usa o centro da cidade e não mostra distância. Não há campo de endereço de partida: o `expo-location` só geocodifica no Android com permissão de localização, então o "Ir até lá" manda só o destino e o app de mapas pede a origem.
- O app baixa Teresina inteira numa chamada só (`useUnidadesTeresina`: centro da cidade, `raio_m` 50000, `limit` 200, os máximos da API) e não busca de novo ao arrastar o mapa. Hoje vêm 194 de 195 (a que falta é a CNES 47872, com coordenada fora da cidade). Se a base passar de 200, isso precisa mudar no back-end.
- A lista ordena e mede distância pela posição da pessoa (`src/mapa/distancia.ts`), não pelo `distancia_m` da API, que é medido a partir do centro de Teresina.
- O mapa não espera o GPS: `useLocalizacao` entrega centro → última posição guardada → GPS, e o `MapaUnidades` desliza (`animateToRegion`) a cada melhora.
- As respostas da API ficam guardadas no celular por 7 dias (`PersistQueryClientProvider` + AsyncStorage, em `_layout.tsx`). Mudou o formato da resposta da API? Troque o `buster` lá, senão o app usa o cache no formato antigo.
- A busca é local, sobre as unidades carregadas: cada palavra digitada precisa ser início de uma palavra do nome, e termos de `src/busca/sinonimos.ts` ("upa", "posto", "hospital"...) viram filtro por tipo. Busca por sintomas ainda não existe; quando existir, entra como mais chaves em `sinonimos.ts`.
- Pinos são imagens prontas (`assets/pinos/*.png`, via `src/mapa/pinos.ts`), não Views: com View o Android "fotografa" cada um dos ~200 pinos e trava ao filtrar. Mudou a cor de um grupo em `tema.ts`? Gere de novo com `node scripts/gerar-pinos.mjs app/assets/pinos` (na raiz), ajustando as cores no script. O mapa recebe a lista via `useDeferredValue`, e o mini-mapa da tela da unidade usa `liteMode`.
- `src/mapa/grupos.ts` é o lugar único da regra tipo do CNES → grupo (Urgência 20/73, Hospital 5/7/15, Posto/UBS 1/2, "Especialidades e exames" 4 = policlínica), com nome e cor. Pinos, legenda, lista, filtros e tela da unidade usam daqui.
- Filtros (`src/busca/filtros.ts` + `src/estado/filtros.ts`): grupos, rede e "só SUS", combinados com a busca. Dentro de um bloco é "ou", entre blocos é "e", bloco vazio não filtra. Ficam só na memória: voltam ao normal quando o app fecha (decisão da equipe).
- `src/api/types.ts` espelha o OpenAPI do cnes-service; mudou o formato de resposta lá, atualize aqui.
