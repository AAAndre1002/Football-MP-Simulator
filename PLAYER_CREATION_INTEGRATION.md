# Fase 1 — integração do criador de jogador

O wizard está disponível como componente reutilizável em `src/player-creation/PlayerCreationWizard.tsx`. É uma implementação isolada: **não está ligado ao menu de carreira e não grava nem substitui qualquer save**. Esta escolha preserva os saves offline/nuvem enquanto os fluxos de autenticação, slots e carregamento (deixados fora desta fase) continuam inalterados.

## Integração segura futura

1. Apresentar `<PlayerCreationWizard onComplete={...} onCancel={...} />` apenas num fluxo explícito de nova carreira, antes de criar/carregar o slot.
2. `onComplete` recebe `{ player, season: '2026/27' }`. Criar um `GameSave` novo a partir do jogador criado, mas **nunca chamar reset nem escrever por cima do save offline existente**. Para uma nova carreira offline, usar armazenamento versionado/slots locais independentes antes de efetuar qualquer gravação; o `useGameState` atual mantém deliberadamente uma única chave legacy.
3. Integrar o jogador no processo de inicialização atual e atribuir clube/contrato apenas depois de existir uma escolha apropriada. O wizard não inventa clube real nem dados licenciados.
4. Os metadados adicionados a `Player` são opcionais. Saves antigos sem `potential`, `role`, aparência, medidas, pé ou local de nascimento continuam válidos; não se exige migração para carregá-los. `normalizeGameSave` já preserva propriedades de jogador que existam.
5. `season` é a etiqueta de época para apresentação; no save atual o inteiro `season: 1` representa a primeira época e `makeFixtures(..., 1)` identifica os jogos como tal. Ao ligar o wizard, mapear a época de forma consistente sem alterar os resultados de fixture ou o histórico já guardados.

Perfis e pesos são dados originais para este simulador, destinados a gameplay e não apresentados como avaliações oficiais ou dados licenciados. As opções de posições secundárias e funções são declaradas em `playerCreation.ts`; as validações têm testes automatizados.
