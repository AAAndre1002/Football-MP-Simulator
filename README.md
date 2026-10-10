# Football MP Simulator

Simulador de carreira de futebol offline, em Português (Portugal), desenvolvido com React 18, TypeScript, Vite, Tailwind CSS e PWA. A carreira é guardada automaticamente no armazenamento local do navegador.

## Funcionalidades do MVP

- Liga portuguesa fictícia com seis clubes, calendário de 10 jornadas e jogos em casa/fora.
- Simulação de toda a jornada, classificação calculada por pontos, diferença e golos; os resultados não se repetem após recarregar.
- Centro de jogo com abordagens táticas que alteram o motor de simulação, relato, posse, remates e cartões.
- Perfil com jogos, golos, assistências, avaliações, cartões, fadiga e histórico por partida.
- Treino semanal pago, com limites de atributo e controlo de saldo.
- Salário contratual semanal, renovação/renegociação limitada a uma vez por época e cláusula de rescisão ajustável.
- Propostas de transferência geradas por jornada, contra-proposta, aceitar/recusar e agente com efeito em probabilidade, salário e bónus.
- Patrocínios com rendimento semanal, duração e limite de contratos ativos.
- Moral, relação com treinador/adeptos e reputação nos media reagem ao desempenho e influenciam o motor.
- Migração/clamp de dados de carreiras anteriores e persistência local; o jogo funciona sem backend.

Equipas, jogadores, clubes, valores e ofertas são dados fictícios de demonstração. O MVP não inclui contas online, sincronização entre dispositivos, mercado de jogadores completo, lesões ou competições de taça.

## Requisitos e execução

- Node.js 20 ou superior
- npm

```bash
npm ci
npm run dev
```

## Validação

```bash
npm test
npm run build
npm run preview
```

O GitHub Actions executa os testes do motor de época e a compilação TypeScript/Vite em pushes e pull requests para `main`.
