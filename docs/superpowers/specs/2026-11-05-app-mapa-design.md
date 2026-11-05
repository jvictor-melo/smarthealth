# App SmartHealth: primeira versão (mapa) — design

## Intenção

Quem abre o app precisa encontrar rapidamente a unidade de saúde mais próxima e adequada em Teresina e chegar até ela. A tela inicial tem uma barra de pesquisa no topo e, embaixo, um mapa com pinos das unidades (hospitais, UPAs, UBS etc.). A pessoa pesquisa e é encaminhada ao lugar mais próximo, com rota.

Contexto: projeto de extensão (Ciência da Computação). Pelo cronograma do projeto, o protótipo é desenvolvido até novembro, com testes em novembro/dezembro e apresentação em dezembro de 2026.

## Objetivos

- Mapa centrado na posição do usuário (GPS), com pinos das unidades ativas próximas, cor por tipo.
- Busca por nome da unidade e por tipo de atendimento, priorizando a mais próxima.
- Detalhe da unidade ao tocar no pino: nome, tipo, endereço, telefone, distância e, nas 5 verificadas, horários, serviços e observações.
- Botão "Como chegar" que abre a rota em app de mapas externo.

## Fora desta versão

- Busca por sintomas: ideia nova, ainda sem lista de sintomas nem regra de encaminhamento definidas. A barra de busca deve ser construída de forma que uma tabela local de sintomas → tipos de unidade possa ser plugada depois.
- Login, `expo-secure-store`, área de gestor/profissional, site.
- Rotas desenhadas dentro do app (exigiriam API paga de direções).

## Restrições

- Stack definida no README raiz: Expo, Expo Router, expo-location, react-native-maps, TanStack Query, Zustand, EAS Build.
- O app fala apenas com o api-gateway (porta 3000), que repassa `GET /units`, `/units/:codigoCnes` e `/unit-types` ao cnes-service. URL base em `EXPO_PUBLIC_API_URL` (celular físico usa o IP do PC na rede; emulador Android usa `10.0.2.2`).
- A API só busca por raio a partir de um ponto (`lat`, `lng`, `raio_m` até 50 000, `tipo`, `sus`, `limit` até 200) e não tem busca por texto.
- Dados do CNES: bairro truncado em 20 caracteres, `turno_atendimento` é texto livre, o Hospital do Satélite (2679639) tem coordenadas imprecisas.

## Abordagens consideradas

1. **Busca por texto no próprio app (escolha do Claude, aprovada junto com o design).** O app carrega as unidades da região (raio amplo, até 200) e filtra por nome/tipo localmente, ordenando por distância. Sem mudança no back-end; Teresina tem ~195 unidades na base, então cabe em memória.
2. Nova rota de busca textual no cnes-service (`?q=`). Mais escalável, mas exige mexer no back-end agora sem necessidade para o volume atual.
3. Busca por endereço/lugar genérico via geocodificação (Google Places etc.). Exige chave paga e não é o foco (o foco são as unidades).

## Decisões

- Projeto em `app/`, criado com `create-expo-app` (template TypeScript + Expo Router); dependências instaladas com `npx expo install`.
- Ao negar a permissão de localização, o mapa centraliza no centro de Teresina e a distância passa a ser calculada a partir desse ponto.
- Ao arrastar o mapa, nova busca a partir do centro da região visível.
- "Como chegar" abre Google Maps (Android) / Apple Maps ou Google Maps (iOS) via deep link com as coordenadas da unidade.

## Deixado para quem implementa

Estrutura de pastas do app, cores dos pinos, layout exato do painel de detalhe, raio padrão e quando refazer a busca.
