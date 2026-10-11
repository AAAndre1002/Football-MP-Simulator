# Football MP Simulator

Simulador de carreira de futebol em Português (Portugal), construído com React 18, TypeScript, Vite, Tailwind CSS e PWA. Combina gestão da carreira com partidas jogadas minuto a minuto. O modo offline guarda a carreira no navegador.

**Estado: desenvolvimento. Não é uma release pronta.** Fluxos integrados e novas operações de save ainda precisam de testes completos, CI/preview e verificação de implementação publicada.

## Sistemas da carreira

- Painel responsivo com estado físico e moral, próximo jogo, classificação, historial e gráficos SVG de valor de mercado e overall.
- Motor de jogo determinístico orientado por atributos; sessão ao vivo por minuto, eventos, posse, remates, precisão de passe, cartões, substituições e pausas táticas. Posse, bola nas costas, remate de longe e pressão alta alteram o modelo e as estatísticas.
- Treino técnico, físico e mental em três intensidades; fadiga, progressão, risco e duração de lesões, recuperação semanal e indisponibilidade de jogadores lesionados.
- Estimativa interna e explicável de valor do jogador (nível, idade, potencial, forma, minutos, golos/assistências, duração do contrato e reputação); propostas, contra-propostas, salários, prémios e cláusula.
- Hubs de saves offline/nuvem separados, slots locais export/import JSON com schema versionado, validação, renomeação e eliminação; o ranking online continua deliberadamente bloqueado até haver validação segura no servidor.
- Conferência de imprensa pós-jogo com impacto nas relações com treinador, adeptos e comunicação social.
- Equipamento de recuperação, treinador pessoal e patrocínios com custos e efeitos persistentes.
- Liga, calendário, classificação, autenticação preparada para Supabase e modo offline preservados.

## Desenvolvimento local

Requisitos: Node.js 20+ e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Com as variáveis de ambiente ausentes, o jogo continua disponível offline. O login e as gravações na nuvem só funcionam depois de configurar o Supabase descrito abaixo.

## Supabase (opcional)

1. Cria um projeto no [Supabase](https://supabase.com/dashboard) e executa `supabase/migrations/20261010060000_career_saves.sql` no SQL Editor.
2. Define `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local` (consulta `.env.example`).
3. Configura os endereços locais e de produção permitidos em Authentication → URL Configuration.
4. Define as mesmas duas variáveis no projeto Vercel e volta a publicar.

Nunca coloques uma chave `service_role` no frontend ou no repositório. Sem um projeto/variáveis Supabase, não há registo real nem sincronização de saves na nuvem.

## Testes e build

```bash
npm test
npm run build
npm run preview
```

O workflow de GitHub Actions executa os testes, o type-check e a build em cada push ou pull request para `main`.

## Arquitetura e expansão

- `src/types/index.ts`: contratos de dados da carreira, partidas e saves; saves existentes são normalizados em `src/hooks/useGameState.ts`.
- `src/engine/matchEngine.ts`: simulação pura determinística; `src/engine/matchSession.ts`: runner persistente por minuto e decisões de intervalo.
- `src/engine/playerDevelopment.ts`, `transferMarket.ts`, `pressConference.ts`: regras de desenvolvimento, mercado e imprensa, separadas da interface.
- `src/engine/season.ts` e `src/data/mockTeams.ts`: fixtures, tabela e equipas fictícias; `src/data/competitionClubs.ts`: camada só de nomes de clubes/competições reais com provenance, sem plantéis.
- `src/lib/saveTransfer.ts`: envelope JSON versionado, validação de importação e normalização compatível com GameSave legado.
- `src/components/`: vistas de carreira; `src/App.tsx` liga estado, ecrãs e sistemas de jogo.

Para acrescentar uma mecânica: defina tipos em `types/index.ts`, implemente regra pura num módulo de `engine/`, cubra-a com testes determinísticos em `src/engine/*.test.ts`, normalize campos novos para saves antigos e só depois ligue a regra a `useGameState` e aos componentes. Não coloque chaves privadas em código cliente; preserve compatibilidade com o modo offline.

## Player-only new-career flow and data status

The explicit new offline-career and signed-in cloud-slot actions now lead through the four-step player creator and a separate, playable fictional academy chapter before career entry. See [PLAYER_CREATION_INTEGRATION.md](./PLAYER_CREATION_INTEGRATION.md) for save safety, version compatibility, and provenance notes.

The career-pathway picker includes a limited set of real club and competition names with source URLs/season notes; these are factual references only, not real offers, current rosters, partnerships or licensed data. The displayed offer context (rating/role/minutes) is invented simulation data. No real rosters, player/staff data, badges or photos are included. No redistribution licence is confirmed; see [DATA_SOURCES.md](./DATA_SOURCES.md) for provenance and limits. The main season engine still uses clearly fictional sample clubs and generated players. No authentication or account security behavior was changed.
