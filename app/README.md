# SmartHealth: app

App Expo (SDK 58, Expo Router) para encontrar unidades de saúde em Teresina-PI.

- **Tela inicial:** barra de busca, lista "Lugares próximos" (ou "Resultados" quando há texto) e mapa com os pinos.
- **Tela da unidade:** endereço, telefone, horários e serviços (nas unidades verificadas), mini-mapa e botão "Ir até lá", que abre a rota no Google Maps ou no Apple Maps.

O app assume que a pessoa está em Teresina. Sem permissão de localização, o mapa abre no centro da cidade e a lista não mostra distâncias.

## Como rodar

O app só conversa com o api-gateway, que repassa as rotas para o cnes-service. Suba nesta ordem:

1. **Postgres:** em `infrastructure/`, `docker compose up -d`.
2. **cnes-service:** em `services/cnes-service`, `npm run dev` (porta 3002). Na primeira vez, rode antes `npm run db:migrate` e `npm run sync:full`.
3. **api-gateway:** em `services/api-gateway`, `npm run dev` (porta 3000).
4. **App:** aqui em `app/`:

```bash
cp .env.example .env    # ajuste EXPO_PUBLIC_API_URL
npm install
npx expo start
```

Abra no celular com o **Expo Go**, lendo o QR code. O celular e o PC precisam estar na mesma rede.

### Endereço da API (`EXPO_PUBLIC_API_URL`)

- **Celular físico:** IP do PC na rede, por exemplo `http://192.168.0.10:3000` (veja com `ipconfig` no Windows). `localhost` não funciona, porque no celular ele aponta para o próprio celular.
- **Emulador Android:** `http://10.0.2.2:3000`.

Depois de mudar o `.env`, reinicie o `npx expo start`.

## Comandos

```bash
npm test               # testes (jest-expo)
npx jest test/busca.test.ts
npm run typecheck      # tsc --noEmit
npx expo lint
npx expo-doctor
```

Instale dependências sempre com `npx expo install <pacote>`, que escolhe a versão compatível com o SDK.

## Estrutura

- `src/app/`: só as telas (rotas do Expo Router).
- `src/api/`: cliente HTTP, tipos (espelho do OpenAPI do cnes-service) e hooks do TanStack Query.
- `src/busca/`: busca local por nome e tipo. Os termos como "upa", "posto" e "hospital" ficam em `sinonimos.ts`, que é onde a futura tabela de sintomas vai entrar.
- `src/mapa/`, `src/rota/`, `src/localizacao/`: cores dos pinos, distância, link da rota e GPS.

## Gerar o APK (EAS)

O mapa funciona no Expo Go sem configuração. Para gerar o APK pelo EAS, o Android exige uma chave do Google Maps: configure `androidGoogleMapsApiKey` no plugin do `react-native-maps` e use `provider={PROVIDER_GOOGLE}` (veja a doc do `react-native-maps` no site do Expo).
