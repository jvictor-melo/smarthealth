# cnes-service

Microsserviço do SmartHealth que:

1. consome a **API de dados abertos do Ministério da Saúde (CNES)**;
2. sincroniza os estabelecimentos de **Teresina-PI** para o nosso Postgres/PostGIS;
3. expõe rotas de leitura para o app (`/units`, `/unit-types`, `/health`, docs em `/docs`).

---

## 1. Mapeamento da API do CNES

> Tudo abaixo foi testado ao vivo. Onde a documentação oficial diverge, **vale o que está aqui**.

### Base

| Item | Valor |
|---|---|
| URL base | `https://apidadosabertos.saude.gov.br` |
| Prefixo | **nenhum**. `/v1/#/` é só a página do Swagger, não faz parte das rotas |
| Autenticação | não exige nas rotas do CNES |
| Formato | JSON |

### Rotas usadas

#### `GET /cnes/estabelecimentos`

Lista estabelecimentos com filtros e paginação.

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `codigo_municipio` | string (6 dígitos) | Código IBGE **de 6 dígitos**. Teresina = `221100` |
| `codigo_uf` | number | Código IBGE da UF (Piauí = `22`) |
| `codigo_tipo_unidade` | number | Ver `/cnes/tipounidades` |
| `status` | `1` \| `0` | 1 = ativo, 0 = inativo |
| `estabelecimento_possui_centro_cirurgico` | `1` \| `0` | |
| `estabelecimento_possui_centro_obstetrico` | `1` \| `0` | |
| `data_atualizacao` | `YYYY-MM-DD` | Traz só o que foi atualizado **a partir** dessa data |
| `limit` | number | **Máximo 20** |
| `offset` | number | **Quantidade de itens a pular** (ver pegadinhas) |

Resposta:

```json
{
  "estabelecimentos": [
    {
      "codigo_cnes": 9939571,
      "nome_razao_social": "FUNDACAO MUNICIPAL DE SAUDE",
      "nome_fantasia": "UNIDADE DE PRONTO ATENDIMENTO DR ANTONIO DIB TAJRA",
      "codigo_tipo_unidade": 73,
      "codigo_cep_estabelecimento": "64059130",
      "endereco_estabelecimento": "RUA SATURNO",
      "numero_estabelecimento": "4281",
      "bairro_estabelecimento": "SATELITE",
      "numero_telefone_estabelecimento": "8632315755",
      "endereco_email_estabelecimento": null,
      "latitude_estabelecimento_decimo_grau": -5.0534301,
      "longitude_estabelecimento_decimo_grau": -42.7591893,
      "descricao_turno_atendimento": "ATENDIMENTO CONTINUO DE 24 HORAS/DIA (PLANTAO:INCLUI SABADOS, DOMINGOS E FERIADOS)",
      "estabelecimento_faz_atendimento_ambulatorial_sus": "SIM",
      "estabelecimento_possui_centro_cirurgico": 0,
      "estabelecimento_possui_centro_obstetrico": 0,
      "codigo_motivo_desabilitacao_estabelecimento": null,
      "data_atualizacao": "2025-09-03"
      // ...e outros ~20 campos que não usamos
    }
  ]
}
```

#### `GET /cnes/estabelecimentos/{codigo_cnes}`

Devolve **o objeto direto** (sem o envelope `estabelecimentos`), com os mesmos campos da listagem.
Código inexistente → **HTTP 404** com `{"message": "Estabelecimento not found."}`.

#### `GET /cnes/tipounidades`

```json
{ "tipos_unidade": [ { "codigo_tipo_unidade": 73, "descricao_tipo_unidade": "PRONTO ATENDIMENTO" } ] }
```

São 39 tipos, e a lista não é paginada.

#### `GET /cnes/tipounidades/{codigo_tipo_unidade}`

Devolve o objeto direto: `{ "codigo_tipo_unidade": 73, "descricao_tipo_unidade": "PRONTO ATENDIMENTO" }`.

### Pegadinhas

| # | Pegadinha | Como tratamos |
|---|---|---|
| 1 | **`offset` conta ITENS, não páginas.** A doc oficial diz "número da página" e está errada. | Paginamos com `offset += 20` (`src/cnes/client.ts`). |
| 2 | **`limit` máximo = 20.** | `CNES_PAGE_LIMIT = 20`. |
| 3 | **A resposta não traz o total.** | A paginação termina quando vem uma página com menos de `limit` itens. Se o total for múltiplo de 20, a última requisição volta vazia. |
| 4 | `codigo_municipio` usa o **IBGE de 6 dígitos** (sem o dígito verificador). | `CNES_CODIGO_MUNICIPIO=221100`. |
| 5 | `codigo_cnes` vem como **número**. | Guardamos como `integer`. |
| 6 | `nome_fantasia` pode vir vazio. | Usamos `nome_razao_social` como fallback. |
| 7 | `bairro_estabelecimento` vem **truncado em 20 caracteres** ("PARQUE BRASIL III" pode chegar cortado). | Guardamos como veio; não dá para recuperar o resto. |
| 8 | `descricao_turno_atendimento` é **texto livre** ("ATENDIMENTOS NOS TURNOS DA MANHA E A TARDE"), não é horário. | Vai para `turno_atendimento`. Horários estruturados só nas unidades verificadas (campo manual). |
| 9 | `estabelecimento_faz_atendimento_ambulatorial_sus` vem como `"SIM"`/`"NAO"`. | Vira `boolean`. |
| 10 | `estabelecimento_possui_centro_*` vem como `1`/`0`/`null`. | Vira `true`/`false`/`null`. |
| 11 | **A resposta não traz o status** (ativo/inativo); ele só existe como filtro. | No incremental consultamos `status=1` e `status=0` separadamente. Na busca individual, consideramos ativo quando `codigo_motivo_desabilitacao_estabelecimento` é `null`. |
| 12 | Telefones em formatos misturados (`8632288752`, `(86) 99437-0620`). | Guardamos só os dígitos. |
| 13 | `numero_estabelecimento` pode ser `"S/N"`. | Vira `null`. |
| 14 | Várias strings vêm com espaços sobrando (ex: `"M "`). | `trim` em tudo; string vazia vira `null`. |
| 15 | Algumas coordenadas caem fora de Teresina (erro de cadastro na origem; nos tipos permitidos hoje há 1 caso, CNES 47872). | Mantemos como veio; o filtro por raio do app já exclui na prática. |
| 16 | `descricao_natureza_juridica_estabelecimento`, **apesar do nome, traz o código** da natureza jurídica (4 dígitos, ex.: `"1155"`), não a descrição. | Guardamos o código em `natureza_juridica`. A API do serviço devolve `rede` pelo primeiro dígito: 1 = `publica`, 2 = `privada`, 3 = `filantropica` (sem fins lucrativos); outros = `null` (ver `src/cnes/rede.ts`). |

### Números de Teresina (outubro/2026)

- 709 estabelecimentos ativos → 36 requisições de 20 itens.
- 195 nos tipos permitidos (camada base).
- Todos com coordenadas.
- Sync completo leva ~8 s (com pausa de 150 ms entre requisições).

---

## 2. Regras de negócio

As duas listas ficam **só** em [`src/config/cnes.config.ts`](src/config/cnes.config.ts).

### Camada base: `TIPOS_PERMITIDOS`

Teresina inteira, filtrada pelos tipos que atendem o público:

| Código | Tipo |
|---|---|
| 1 | Posto de saúde |
| 2 | Centro de saúde / unidade básica |
| 4 | Policlínica |
| 5 | Hospital geral |
| 7 | Hospital especializado |
| 15 | Unidade mista |
| 20 | Pronto socorro geral |
| 73 | Pronto atendimento (UPA) |

Os tipos **22** (consultório isolado) e **36** (clínica/centro de especialidade) ficam **fora** até a equipe decidir.

### Camada de destaque: `CNES_VERIFICADAS`

| CNES | Unidade |
|---|---|
| 9939571 | UPA Satélite |
| 2679639 | Hospital e Maternidade do Satélite |
| 6003591 | UBS Santa Isabel |
| 2444178 | UBS Ininga |
| 5346150 | UBS Taquari |

- Recebem `verificada = true`.
- São buscadas individualmente em todo sync e entram mesmo que o tipo saia de `TIPOS_PERMITIDOS`.
- Têm colunas **manuais**, preenchidas a partir das entrevistas: `horarios` (jsonb), `servicos` (text[]), `observacoes` e `manual_atualizado_em`.
- **O sync nunca escreve nessas colunas.** O upsert usa a lista explícita `COLUNAS_SYNC` (`src/sync/columns.ts`), e um teste garante que as manuais não estão nela.

Formato de `horarios`:

```json
{ "seg": [{ "abre": "07:00", "fecha": "11:00" }, { "abre": "13:00", "fecha": "17:00" }], "sab": [] }
```

Chaves: `dom`, `seg`, `ter`, `qua`, `qui`, `sex`, `sab`.

---

## 3. Banco

PostgreSQL + PostGIS, com migrations do Drizzle em `drizzle/`.

| Tabela | Conteúdo |
|---|---|
| `tipos_unidade` | `codigo` (pk), `descricao`, de `/cnes/tipounidades` |
| `unidades` | `codigo_cnes` (pk), campos do CNES (inclusive `natureza_juridica`), `localizacao geography(Point,4326)` (índice GiST), `ativo`, `verificada`, `sincronizado_em` e as colunas manuais |
| `sync_execucoes` | Histórico de cada sync: modo, status (`running`/`success`/`failed`), início/fim, contagens e erro |

Unidades nunca são deletadas: quando saem do filtro ou ficam inativas, recebem `ativo = false`.

---

## 4. Sincronização

| Comando | O que faz |
|---|---|
| `npm run sync:full` | Carga completa: `status=1` de Teresina inteira. O que estava ativo no banco e não veio é desativado. |
| `npm run sync` | Incremental: `data_atualizacao` = início do último sync com sucesso − 1 dia, consultando `status=1` e `status=0`. Sem sync anterior, faz o full. |
| automático | Incremental via node-cron em `SYNC_CRON`/`SYNC_TIMEZONE` (padrão: segunda 03:00, America/Fortaleza). |

Garantias:

- **Nada pela metade:** primeiro busca tudo na API, depois grava numa única transação. Se a API falhar, nenhuma unidade é tocada e o sync fica registrado como `failed`.
- **Sem execuções simultâneas:** `pg_try_advisory_lock` impede o cron e o script manual de rodarem juntos.
- **Proteção no full:** aborta se a API devolver zero ativos ou menos de 50% das unidades ativas atuais.
- **Chamadas à API:** pausa de `CNES_REQUEST_DELAY_MS` entre requisições e timeout de `CNES_REQUEST_TIMEOUT_MS`. São `CNES_MAX_RETRIES` tentativas com backoff exponencial (500 ms, 1 s, ...) em erros de rede, 429 e 5xx. 4xx não é repetido.
- **Mudança nas listas:** se `TIPOS_PERMITIDOS` ou `CNES_VERIFICADAS` mudarem, o próximo sync reaplica a regra em todo o banco.

---

## 5. Rotas do serviço

Documentação interativa em **`/docs`**, e a spec JSON em `/docs.json`.

| Rota | Descrição |
|---|---|
| `GET /units?lat=&lng=&raio_m=&tipo=&sus=&limit=&offset=` | Unidades ativas. Com `lat`+`lng`: filtra pelo raio (padrão 5000 m, máx. 50000) e ordena por distância (`distancia_m`). `tipo` aceita lista (`2,73`). `sus=true\|false`. `meta.dados_atualizados_em` traz a data do último sync. Cada unidade traz `rede` (`publica`, `privada`, `filantropica` ou `null`). |
| `GET /units/:codigoCnes` | Detalhe da unidade; `detalhes_verificados` com os dados manuais quando `verificada`. |
| `GET /unit-types` | Tipos com unidades ativas e a contagem (`?todos=true` traz os 39). |
| `GET /health` | Status do banco e `dados_atualizados_em`. 503 se o banco cair. |

---

## 6. Rodando localmente

```bash
# 1. banco (na raiz do monorepo)
docker compose -f infrastructure/docker-compose.yml up -d

# 2. serviço
cd services/cnes-service
cp .env.example .env
npm install
npm run db:migrate
npm run sync:full
npm run dev            # http://localhost:3002/docs
```

Testes (não chamam a API real; usam as fixtures em `test/fixtures/`, gravadas de respostas reais):

```bash
npm test
```

### Variáveis de ambiente

Ver [`.env.example`](.env.example).

| Variável | Padrão | |
|---|---|---|
| `PORT` | `3002` | |
| `DATABASE_URL` | — | obrigatória |
| `LOG_LEVEL` | `info` | pino |
| `CNES_API_BASE_URL` | `https://apidadosabertos.saude.gov.br` | sem `/v1` |
| `CNES_CODIGO_MUNICIPIO` | `221100` | IBGE 6 dígitos |
| `CNES_REQUEST_DELAY_MS` | `150` | |
| `CNES_REQUEST_TIMEOUT_MS` | `15000` | |
| `CNES_MAX_RETRIES` | `3` | total de tentativas |
| `SYNC_CRON_ENABLED` | `true` | |
| `SYNC_CRON` | `0 3 * * 1` | sintaxe node-cron |
| `SYNC_TIMEZONE` | `America/Fortaleza` | |

### Estrutura

```
src/
├── config/        env.ts (validação do .env) e cnes.config.ts (listas de negócio)
├── cnes/          http.ts (retry/timeout/pausa), client.ts (paginação), normalize.ts, filters.ts, types.ts
├── db/            schema.ts, client.ts, geography.ts (tipo PostGIS)
├── sync/          sync.service.ts, columns.ts, run.ts (npm run sync), scheduler.ts (cron)
├── services/      consultas das rotas
├── controllers/   validação (zod) e respostas
├── routes/
├── docs/          openapi.ts
├── app.ts         Express
└── server.ts      listen + cron
```

> **Nota sobre migrations:** o `drizzle-kit generate` escreve o tipo `"geography(Point, 4326)"` entre aspas, e o Postgres rejeita assim. Ao gerar uma migration nova que mexa nessa coluna, tire as aspas à mão.
