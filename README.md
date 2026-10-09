# Football MP Simulator

Protótipo de simulador de carreira de futebol em React, TypeScript, Vite e Tailwind CSS. Inclui interface adaptável a telemóvel, suporte PWA, save local e uma simulação inicial de partidas.

## Requisitos
- Node.js 20 ou superior
- npm

## Executar
```bash
npm install
npm run dev
```

## Validar/build
```bash
npm run build
npm run preview
```

## Estrutura
- `src/components`: ecrãs e componentes da interface
- `src/data`: clubes e jogadores de demonstração
- `src/engine`: lógica de simulação
- `src/hooks`: estado da carreira e persistência local
- `src/types`: modelos TypeScript

Os dados da carreira são guardados no `localStorage` do navegador. O protótipo usa clubes e atletas fictícios.
