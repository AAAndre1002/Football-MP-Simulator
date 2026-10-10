# Football MP Simulator

Simulador de carreira de futebol em Português (Portugal), desenvolvido com React, TypeScript, Vite, Tailwind CSS e PWA.

## O que está incluído

- Menu inicial de carreira com acesso ao jogo offline.
- Ecrãs de iniciar sessão, criar conta e recuperar palavra-passe, ligados a Supabase Auth quando configurado.
- Até cinco slots de carreira online por conta, com carregamento, criação, remoção e gravação automática.
- Saves privados por utilizador através de Row Level Security (RLS).
- Modo offline continua disponível e guarda a carreira neste navegador.
- Liga fictícia, calendário, classificação, partidas, táticas, perfil, treino, mercado, contratos, finanças e patrocínios.

## Requisitos

- Node.js 20 ou superior
- npm

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Ativar login e saves na nuvem

1. Cria um projeto no [Supabase](https://supabase.com/dashboard).
2. No SQL Editor do projeto, executa `supabase/migrations/20261010060000_career_saves.sql`.
3. Copia a Project URL e a publishable key do projeto para `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Em Authentication → URL Configuration, adiciona o endereço local e o domínio da aplicação às URLs autorizadas de redirect.
5. Para o deploy, define as mesmas duas variáveis no ambiente de produção do Vercel e volta a publicar.

**Nunca coloques a `service_role` key no frontend nem no repositório.** A tabela usa RLS e só permite a cada utilizador ler ou alterar os próprios saves.

Sem estas variáveis, o ecrã de autenticação mostra que o backend ainda não está ligado e o jogo pode ser iniciado em modo offline.

## Testes e build

```bash
npm test
npm run build
npm run preview
```

O GitHub Actions executa os testes e a compilação TypeScript/Vite em pushes e pull requests para `main`.
