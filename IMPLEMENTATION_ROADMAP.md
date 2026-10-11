# Football-MP-Simulator — plano de implementação e estado

## Ordem de trabalho

1. Carreira do jogador primeiro: perfil, progressão e valor estimado.
2. Percursos e ofertas ilustrativas por nacionalidade/competição, com clubes reais quando nomes de fonte pública puderam ser conferidos; registar época e proveniência sem alegar licença.
3. Saves independentes: hubs offline/nuvem, CRUD, import/export versionado, preservar compatibilidade do GameSave.
4. Menus, responsividade, acessibilidade e testes automatizados.
5. Só depois fazer o teste live final da conta/recuperação, usando exclusivamente a conta QA estabelecida. Sem passwords ou tokens no chat.
6. Nunca declarar pronto/publicado sem passar aceitação, direitos de dados, testes e verificar commit/URL.

## Estado local conhecido

- O wizard do jogador, capítulo de academia fictício e integração para criar save continuam locais. Novo offline usa slots locais separados do legacy key; modo guest legacy fica compatível.
- O diretório não disponibilizou Git/Node/npm/npx nesta sessão. As alterações não foram commitadas nem enviadas para o PR #2/GitHub. Não houve deploy nem validação de URL/commit.
- Como `node`/`npm`/`npx` e dependências `node_modules` não existem nesta sessão, type-check, Vitest e build de produção não foram executados após estas alterações. Instalação, CI e testes de browser seguem obrigatórios.

## Trabalho acrescentado nesta sessão (código ainda não verificado por execução)

### Perfil / valor estimado
- `explainMarketValue` expõe estimativa e fatores: overall/base, idade, potencial, forma (até cinco notas), minutos, golos/assistências, anos de contrato e reputação nos media. A UI do perfil explica que é uma estimativa interna e não uma avaliação financeira.
- `CareerStats.totalMinutes` é opcional para preservar saves antigos; normalização deriva um default conservador de 70 minutos por aparição. O valor atualiza após jogos, treino, conferência e alteração contratual. As datas contratuais usam calendário de carreira simulado (não relógio do computador); os pontos de valor da mesma jornada são substituídos, não duplicados.
- Adicionado teste de monotonicidade/contexto em `careerSystems.test.ts`; precisa correr.

### Percurso e nomes reais
- A criação segue agora para um seletor de percurso depois da academia. `src/data/competitionClubs.ts` contém snapshot só de nomes de 18 clubes da Liga Portugal 2 2026/27, 20 da Série B brasileira 2026, 20 da Serie BKT 2026/27 e 22 da LaLiga Hypermotion 2026/27. Portugal é fonte pública secundária; Brasil/Itália/Espanha têm fonte oficial de federação/liga/clube.
- O seletor oferece três nomes por país; nível, função, minutos e propostas são simulação, não dados de recrutamento. Fontes, épocas e data de verificação estão em `DATA_SOURCES.md` e as URLs também aparecem no seletor. Portugal usa lista pública secundária para alguns nomes; Série B do Brasil é temporada-calendário 2026 (não rotulada como 2026/27); Itália e Espanha usam fontes oficiais de liga/club.
- Não foram usados logótipos, fotos, rosters ou staff. Não se confirmou licença de redistribuição/uso comercial; fontes factuais públicas não provam licença, patrocínio, afiliação ou aprovação. A seleção fica como metadado e não substitui o clube/plantéis ainda simulados no motor.
- A lista é deliberadamente amostra parcial, não base compreensiva nem comprovadamente atualizada ao vivo. Verificação e direitos seguem bloqueios para expandir roster, estatísticas, logos/fotos e publicidade.

### Saves e privacidade
- Slots offline agora permitem abrir, renomear, exportar JSON e apagar com confirmação. Import aceita envelope versionado `football-mp-simulator-save` (schema 1) e JSON GameSave legado; valida conteúdo e limites antes de normalizar, mantendo cada importação no destino escolhido (offline ou nuvem).
- Hubs na nuvem permitem criar/abrir/renomear/exportar/apagar e importam só por ação explícita do usuário na nuvem. A conta e RLS existentes não foram alteradas.
- O leaderboard continua BLOQUEADO e ausente da aplicação: não há serviço seguro validando score no servidor, critérios, opt-in, privacidade nem proteção contra adulteração; não usar pontuação confiada ao cliente nem montar placar público até existir desenho/backend seguro.

## Aceitação ainda pendente

- Type-check, suite Vitest completa e `vite build`; reparar todos os erros/regressões.
- Smoke tests desktop e móvel: wizard → academia → percurso → guardar, carregar e jogar; contas cloud com RLS, offline separado, operações de slots, exportar/importar (válido/alterado/legado), persistência após reload e tratamento de storage cheio/sem rede.
- Verificar exportação/importação em ambos os hubs, versão e validação estrita, erros de cloud e que nenhum save offline entra no cloud por acidente.
- Rever acessibilidade por teclado/leitor de ecrã, contraste, estados de erro e layouts em viewport móvel.
- Ainda não executado o teste final real de login/recuperação/persistência na conta QA. Realizar só com conta QA já estabelecida; parar se houver rate limit. Não usar credenciais pessoais nem recolher tokens/passwords.
- Confirmar fonte/época de cada nome real e obter avaliação de direitos para redistribuir em jogo público antes de qualquer afirmação de licenciamento; sem logos/fotos/plantéis reais.
- Fazer commit/CI/preview e, antes de falar em deploy, confirmar explicitamente commit e URL publicado. Não unir PR nem publicar antes de a suite de aceitação passar.
