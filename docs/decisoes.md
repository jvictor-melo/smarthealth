# Registro de decisões do SmartHealth

Decisões de produto e de técnica tomadas ao longo do desenvolvimento, com o motivo de cada uma. Serve de base para reescrever o documento do projeto (PEX) e para quem chegar no projeto entender por que as coisas são como são.

- **Quem decidiu:** "Equipe" = veio de vocês; "Claude (aprovado)" = proposta do Claude aceita pela equipe; "Claude" = escolha técnica do Claude, sem discussão, que a equipe pode rever.
- Decisão nova entra no fim da seção certa, com data. Decisão que mudou: não apague, marque como **substituída** e aponte para a nova.

## Mudanças em relação ao documento original do projeto (PEX)

| Data | O documento previa | O que foi decidido | Motivo | Quem |
|---|---|---|---|---|
| 2026-11-02 | Cadastro manual das cinco unidades da Zona Leste | Base com todas as unidades de Teresina vindas do CNES (~195), e as cinco unidades da Zona Leste como "verificadas", com dados extras das entrevistas | Dado oficial e atualizado automaticamente; a pessoa encontra unidades na cidade toda, e as cinco continuam em destaque | Equipe |
| 2026-11-05 | Desenvolvimento de um site público | Sem site: só o app mobile | Foco no app dentro do prazo | Equipe |
| 2026-11-05 | Gestores e profissionais cadastrando e atualizando dados | Fora da primeira versão (sem login nem área de gestor) | Prazo; o user-service ainda é um esqueleto | Claude (aprovado) |
| 2026-11-05 | Pesquisa e filtros por tipo de atendimento | Mantido, e a equipe acrescentou a ideia de pesquisar por **sintoma** | Encaminhar a pessoa ao lugar certo, não só ao mais próximo | Equipe |

## Dados (cnes-service)

| Data | Decisão | Motivo | Quem |
|---|---|---|---|
| 2026-11-02 | Fonte dos dados: API de dados abertos do Ministério da Saúde (CNES), município de Teresina (IBGE 221100) | Fonte oficial, pública e sem autenticação | Equipe |
| 2026-11-02 | Tipos de unidade que entram: 1 posto, 2 UBS/centro de saúde, 4 policlínica, 5 hospital geral, 7 hospital especializado, 15 unidade mista, 20 pronto-socorro, 73 UPA | São os que atendem o público em geral | Equipe |
| 2026-11-02 | Tipos 22 (consultório isolado) e 36 (clínica/centro de especialidade) ficam de fora por enquanto | Muitos são consultórios privados; a equipe ainda vai decidir | Equipe |
| 2026-11-02 | As 5 unidades das entrevistas (UPA Satélite 9939571, Hospital e Maternidade do Satélite 2679639, UBS Santa Isabel 6003591, UBS Ininga 2444178, UBS Taquari 5346150) são "verificadas" e sempre entram, mesmo que o tipo mude | São o recorte do projeto de extensão | Equipe |
| 2026-11-02 | Horários, serviços e observações das verificadas ficam em colunas preenchidas à mão, que a sincronização nunca sobrescreve | O CNES não tem esses dados de forma confiável; eles vêm das entrevistas | Equipe |
| 2026-11-02 | Sincronização semanal automática (segunda, 3h), mais comandos manuais `sync` e `sync:full` | Os dados do CNES mudam pouco; evita sobrecarregar a API pública | Equipe |
| 2026-11-02 | Unidade que sai do CNES ou muda para tipo não permitido é marcada inativa, nunca apagada | Preserva histórico e os dados manuais | Equipe |
| 2026-11-02 | A sincronização busca tudo antes e grava numa transação só; se a API falhar, nada muda no banco | Nunca deixar o banco pela metade | Equipe |
| 2026-11-02 | A sincronização completa é cancelada se vier vazia ou com menos da metade das unidades ativas | Proteção contra a API devolver dados quebrados e o sync desativar tudo | Claude |
| 2026-11-02 | Postgres + PostGIS, com localização em `geography(Point, 4326)` e índice espacial | Busca por raio em metros reais e ordenação por distância rápidas | Equipe |
| 2026-11-02 | Cliente da API com pausa de ~150 ms entre chamadas, 3 tentativas e tempo limite | Respeitar a API pública e aguentar instabilidade | Equipe |

## API e arquitetura

| Data | Decisão | Motivo | Quem |
|---|---|---|---|
| 2026-11-02 | Microsserviços em Node + Express + TypeScript: cnes-service (porta 3002), user-service (3001) e api-gateway (3000) | Arquitetura definida pela equipe no início | Equipe |
| 2026-11-02 | Rotas do cnes-service: `/units` (raio, tipo, SUS), `/units/:codigo`, `/unit-types`, `/health`, documentação em `/docs` | O que o app precisa para mapa, lista e detalhe | Equipe |
| 2026-11-05 | O gateway só repassa `GET` das rotas públicas do cnes-service e responde 503 se ele cair | Não expor mais que o necessário | Equipe |
| 2026-11-05 | O app só fala com o gateway, nunca direto com os serviços | Um único ponto de entrada; trocar endereço dos serviços não afeta o app | Claude (aprovado) |

## App

| Data | Decisão | Motivo | Quem |
|---|---|---|---|
| 2026-11-05 | Stack: Expo (SDK 58) com Expo Router, expo-location, react-native-maps, TanStack Query e Zustand | Lista definida no README do projeto | Equipe |
| 2026-11-05 | Tela inicial: barra de busca no topo, lista "Lugares próximos" no meio, mapa com pinos embaixo | Desenho da equipe | Equipe |
| 2026-11-05 | A lista mostra 3 a 5 unidades conforme a altura do celular, e vira "Resultados" quando a pessoa digita | Não espremer o mapa em celular pequeno; um lugar só para próximos e resultados | Equipe |
| 2026-11-05 | Duas telas: a inicial e a da unidade (endereço, telefone, horários, serviços, mini-mapa e botão "Ir até lá") | A pessoa pesquisa, escolhe e vê tudo antes de ir | Equipe |
| 2026-11-05 | Rota: o botão "Ir até lá" abre o Google Maps (Android) ou Apple Maps (iPhone) com o destino | Grátis, sem chave de API, e esses apps já fazem a navegação | Claude (aprovado) |
| 2026-11-05 | O app assume que a pessoa está em Teresina; toda busca é na cidade | É um protótipo para Teresina | Equipe |
| 2026-11-05 | Sem campo de endereço de partida: o app de mapas pede a origem | O geocodificador do celular (expo-location) só funciona no Android com permissão de localização, justamente o caso de quem negou o GPS | Equipe, depois de o Claude verificar a limitação |
| 2026-11-05 | Sem permissão de GPS: mapa abre no centro de Teresina, lista vira "Unidades em Teresina" e não mostra distância | Distância até o centro da cidade enganaria a pessoa | Claude (aprovado) |
| 2026-11-05 | Busca feita no próprio app sobre as unidades carregadas: cada palavra digitada precisa ser o começo de uma palavra do nome, sem diferenciar acento ou maiúscula; palavras como "upa", "posto" e "hospital" filtram por tipo | Teresina tem ~195 unidades, cabe no celular; evita mexer no back-end agora | Claude (aprovado) |
| 2026-11-05 | A distância na lista é calculada a partir da pessoa, não do centro do mapa | Senão a lista mudaria de ordem ao arrastar o mapa | Claude |
| 2026-11-05 | Cores dos pinos: vermelho para urgência (UPA, pronto-socorro), azul para hospital, verde para posto/UBS, cinza para o resto | Leitura rápida do tipo de atendimento | Claude |
| 2026-11-06 | Cada chamada à API desiste depois de 10 s, e o app tenta de novo só uma vez antes de mostrar o erro | No primeiro teste no celular, com o banco fora do ar, o app ficou carregando sem fim e sem aviso | Claude |
| 2026-11-06 | Enquanto as unidades não chegam, a tela mostra "Carregando unidades…" no lugar da lista | A lista simplesmente sumia e parecia que o app não sugeria nada | Claude |
| 2026-11-06 | O mapa esconde os pontos de interesse do Google (restaurantes, lojas, escolas) | No teste no celular eles se misturavam com as unidades de saúde | Equipe |
| 2026-11-06 | Novo visual: fonte Atkinson Hyperlegible, azul-petróleo como cor da marca, tema sempre claro, pinos redondos com legenda de cores, distância em destaque na lista, nomes do CNES convertidos de MAIÚSCULAS para leitura normal, telefone e CEP formatados, atalhos "UPA", "Hospital" e "Posto" abaixo da busca, selo nas unidades verificadas | O público inclui idosos e pessoas com baixa visão: a fonte foi feita para leitura fácil, e cor nunca aparece sozinha sem texto | Claude (aprovado) |
| 2026-11-06 | O mapa abre na hora, na última posição que o celular guardou (ou no centro de Teresina), e desliza até o GPS quando ele responde | Medido no modo de produção: antes, o mapa levava ~2,4 s esperando o GPS, e tudo (mapa e pinos) ~5,3 s em média; depois das otimizações (A, B e E), ~2,6 s na primeira abertura e ~2,2 s nas seguintes | Equipe |
| 2026-11-06 | O app baixa todas as unidades de Teresina numa chamada só (~195, ~110 KB) e não busca de novo ao arrastar o mapa. **Substitui** a decisão de buscar de novo a partir do centro do mapa ao arrastar | Pinos aparecem sem depender do GPS e arrastar o mapa não carrega nada. Limite: a API entrega até 200 por chamada; se a base crescer (ex.: tipos 22 e 36), precisa mudar | Equipe |
| 2026-11-06 | As unidades ficam guardadas no celular por até 7 dias: da segunda abertura em diante os pinos aparecem na hora e o app atualiza por trás. Se a atualização falhar e houver unidades guardadas, o app mostra as guardadas sem aviso de erro | Os dados só mudam no sync semanal do CNES | Equipe (o "sem aviso" é escolha do Claude) |
| 2026-11-05 | No topo da tela inicial aparece o nome "SmartHealth" pequeno | O desenho tinha algo no topo; a equipe ainda não confirmou o que era | Claude (a confirmar) |

## Processo

| Data | Decisão | Motivo | Quem |
|---|---|---|---|
| 2026-11-02 | Trabalho em branches `feat/...`, commits pequenos em conventional commits, nada direto na `main` | Organização e revisão por PR | Equipe |
| 2026-11-05 | O app só começou depois que o cnes-service foi mesclado na `main` | Evitar dois merges e conflito com o trabalho do gateway | Equipe |
| 2026-11-05 | Cada funcionalidade tem um design (o quê e por quê) e um plano (como) em `docs/superpowers/` | Registro para a equipe e para o documento final | Claude (aprovado) |
| 2026-11-05 | Teste no celular pelo Expo Go na mesma rede do PC; acesso por qualquer rede exige túnel público, que precisa ser aberto por alguém da equipe | Abrir túnel expõe o gateway na internet | Equipe |
| 2026-11-06 | Comando único `npm run dev` na raiz (Postgres, cnes-service, gateway e Expo num terminal só), com `npm run setup` para instalar tudo; os comandos de cada pasta continuam valendo | Antes eram 4 terminais e 4 comandos para testar o app | Equipe |
| 2026-11-06 | `npm run dev:prod`: o mesmo comando único, com o Expo em modo de produção (`--no-dev --minify`) | Medir a velocidade como no APK, antes e depois das otimizações | Equipe |

## Em aberto

- **Busca por sintomas:** falta a lista de sintomas e a regra de encaminhamento. Proposta do Claude: uma tabela fixa, feita pela equipe ou com um profissional das entrevistas, ligando cada sintoma a uma gravidade e a tipos de unidade, com aviso para ligar para o SAMU (192) nos casos graves. Entraria em `app/src/busca/sinonimos.ts`.
- **Coordenadas do Hospital e Maternidade do Satélite (2679639):** o CNES tem coordenadas imprecisas e o hospital aparece ~5 km longe de onde fica. Proposta: coluna de coordenada manual para as verificadas, com prioridade sobre a do CNES.
- **Dados das entrevistas:** horários, serviços e observações das cinco unidades ainda não foram lançados no banco.
- **Tipos 22 e 36:** entram ou não na base.
- **APK:** gerar pelo EAS exige uma chave do Google Maps para Android.
- **Prazo:** pelo cronograma do PEX, testes em novembro e dezembro e apresentação em dezembro de 2026.
