# SmartHealth

Aplicativo mobile para localizar unidades de saúde próximas, com mapa, horários, serviços e rotas.

## Front-end: frameworks e libs

- **React Native**: base do aplicativo mobile
- **Expo**: plataforma de desenvolvimento do app
- **Expo Router**: navegação entre telas
- **expo-location**: localização do usuário
- **react-native-maps**: mapa interativo
- **TanStack Query (React Query)**: requisições à API com cache
- **Zustand**: estado global do app
- **expo-secure-store**: armazenamento seguro do token
- **EAS Build**: geração do APK

## Back-end

- **Node.js**
- **Express.js**
- **TypeScript**

## Back-end: frameworks e libs

- **JWT**: autenticação
- **bcrypt**: hash de senhas
- **cors**: controle de acesso à API
- **express-rate-limit**: limite de requisições
- **Drizzle ORM**: acesso ao banco
- **PostgreSQL + PostGIS**: banco de dados com consultas geográficas
- **swagger-ui-express**: documentação da API
- **pino**: logs
- **dotenv / .env**: variáveis de ambiente
- **Docker**: containers dos serviços e do banco
- **OpenSSL**: geração de chaves e certificados

### API CNES

- **Documentacao da API**: https://apidadosabertos.saude.gov.br/v1/#/

## Como rodar tudo

Na raiz do projeto, com o Docker aberto:

```bash
npm run setup   # primeira vez ou depois de um git pull: instala as dependências de todas as pastas
npm run dev     # sobe o Postgres, o cnes-service, o api-gateway e o Expo (com o QR code) num terminal só
```

- `npm run dev:prod`: o mesmo, com o app rodando como no APK (modo de produção), para medir velocidade.
- `npm run dev:api`: só o banco e o back-end, para rodar o `npx expo start` em outro terminal.
- Primeira vez: veja o `services/cnes-service/README.md` (migrations e `sync:full`) e o `app/README.md` (`.env` com o IP do PC).
- Caso o app mostre “Sem conexão com o servidor” e o cnes-service não conecta no banco, provavelmente a porta 5432 do seu PC já está em uso por outro Postgres. Crie infrastructure/.env com POSTGRES_PORT=5434 e troque a porta para 5434 no DATABASE_URL do services/cnes-service/.env.
