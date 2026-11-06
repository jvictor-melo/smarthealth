# App SmartHealth: primeira versão (mapa) — design

## Intenção

Quem abre o app precisa encontrar rapidamente a unidade de saúde mais próxima e adequada em Teresina e chegar até ela. A tela inicial tem uma barra de pesquisa no topo e, embaixo, um mapa com pinos das unidades (hospitais, UPAs, UBS etc.). A pessoa pesquisa e é encaminhada ao lugar mais próximo, com rota.

Contexto: projeto de extensão (Ciência da Computação). Pelo cronograma do projeto, o protótipo é desenvolvido até novembro, com testes em novembro/dezembro e apresentação em dezembro de 2026.

## Objetivos

- **Tela inicial** (de cima para baixo): barra de pesquisa; lista "Lugares próximos" (vira "Resultados" quando há texto na busca) com bolinha da cor do tipo, nome e distância; mapa com os pinos das unidades, cor por tipo, centrado na posição do usuário (GPS).
- A lista mostra quantos itens couberem conforme a altura da tela (menos em celular pequeno).
- Busca por nome da unidade e por tipo de atendimento, priorizando a mais próxima.
- **Tela da unidade** (aberta ao tocar num item da lista ou num pino, com voltar): nome, tipo, endereço, telefone, distância, mini-mapa do local e, nas 5 verificadas, horários, serviços e observações. Botão "Ir até lá" que abre a rota no app de mapas externo.
- O app assume que o usuário está em Teresina: toda busca é em Teresina.

## Fora desta versão

- Busca por sintomas: ideia nova, ainda sem lista de sintomas nem regra de encaminhamento definidas. A barra de busca deve ser construída de forma que uma tabela local de sintomas → tipos de unidade possa ser plugada depois.
- Login, `expo-secure-store`, área de gestor/profissional, site.
- Rotas desenhadas dentro do app (exigiriam API paga de direções).
- Digitar endereço de partida (ponto A) no app: o geocodificador do expo-location exige permissão de localização no Android, justamente o caso de quem negou o GPS. Decidido que o app de mapas externo pede a origem.

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
- Ao negar a permissão de localização, o mapa centraliza no centro de Teresina; a lista se chama "Unidades em Teresina" e não mostra distância (seria a distância até o centro, e enganaria). Escolha do Claude.
- Ao arrastar o mapa, nova busca a partir do centro da região visível.
- "Ir até lá" abre Google Maps (Android) / Apple Maps (iOS) via link só com o destino; o app de mapas usa o GPS dele ou pede o endereço de partida.
- Topo da tela inicial: nome "SmartHealth" pequeno acima da barra de pesquisa (escolha do Claude, a confirmar).

## Deixado para quem implementa

Estrutura de pastas do app, cores dos pinos, layout exato do painel de detalhe, raio padrão e quando refazer a busca.

## Mudanças durante a implementação (2026-11-05)

- **Busca:** cada palavra digitada precisa ser o começo de uma palavra do nome (sem diferenciar acento e maiúscula), e termos como "upa", "posto" e "hospital" filtram por tipo. A regra "o nome contém o texto" trazia todas as UPAs ao buscar "upa renascença". Escolha do Claude.
- **Distância:** a lista mede e ordena a partir da posição da pessoa, não do centro do mapa, para não mudar de ordem quando o mapa é arrastado. Escolha do Claude.
- **Tela da unidade:** abre ao tocar num item da lista ou no balão que aparece ao tocar no pino.
- **Cores dos pinos:** vermelho para urgência (UPA, pronto-socorro), azul para hospital, verde para posto/UBS, cinza para os demais. Escolha do Claude.

O registro de todas as decisões do projeto fica em `docs/decisoes.md`.

## Otimização do carregamento (2026-11-06)

- O mapa abre na hora (última posição guardada ou centro de Teresina) e desliza até o GPS.
- **Substitui** a decisão "ao arrastar o mapa, nova busca a partir do centro da região visível": agora o app baixa Teresina inteira uma vez e não busca ao arrastar.
- As unidades ficam guardadas no celular por 7 dias.
- Medição de antes, no modo de produção: mapa ~2,4 s; mapa e pinos ~5,3 s em média (uma primeira abertura levou ~21 s).
- Medição de depois, no mesmo modo: ~2,6 s na primeira abertura e ~2,2 s nas seguintes (com as unidades guardadas no celular).
