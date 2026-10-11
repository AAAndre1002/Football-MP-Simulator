import { useState } from 'react';
import { ArrowRight, BookOpenCheck, Shield, Sparkles, Trophy } from 'lucide-react';
import type { Player } from '../types';
import { applyAcademyChoice, type AcademyDevelopment } from '../engine/academyDevelopment';

interface Props { player: Player; onComplete: (player: Player, development: AcademyDevelopment) => void; onCancel?: () => void; saveError?: string; }
const chapters = [
  { eyebrow: 'CAPÍTULO 1 · PRIMEIROS TREINOS', title: 'Um lugar para crescer', text: 'A treinadora fictícia Inês Duarte, personagem inventada para este jogo, apresenta duas sessões extra. O teu primeiro foco deixa uma marca no perfil.', options: [
    { id: 'first-touch', title: 'Repetir receções e primeiro toque', detail: '+2 controlo de bola · +2 relação com o treinador · −1 resistência' },
    { id: 'speed-circuit', title: 'Fazer o circuito de aceleração', detail: '+2 velocidade · +2 moral · −1 frieza' },
  ] },
  { eyebrow: 'CAPÍTULO 2 · CONFIANÇA', title: 'O que levas para a equipa?', text: 'Depois de uma semana exigente, surge uma oportunidade para mostrar como aprendes e como ajudas o grupo.', options: [
    { id: 'video-review', title: 'Pedir análise individual de vídeo', detail: '+2 decisões · +1 potencial · +2 relação com o treinador · −1 moral' },
    { id: 'peer-captain', title: 'Orientar o grupo numa sessão', detail: '+2 trabalho de equipa · +2 liderança · +1 potencial · −1 relação com o treinador' },
  ] },
  { eyebrow: 'CAPÍTULO 3 · PRIMEIRO CAMINHO', title: 'Escolher o próximo passo', text: 'A equipa técnica fictícia propõe dois percursos. Nenhum é uma garantia de sucesso: escolhe o tipo de oportunidade que queres perseguir.', options: [
    { id: 'first-team-route', title: 'Treinar com o plantel principal', detail: '+2 potencial · +2 moral · +1 frieza · percurso de primeira equipa · 180 minutos prometidos' },
    { id: 'reserve-route', title: 'Ganhar minutos na equipa de desenvolvimento', detail: '+1 potencial · +1 moral · +1 resistência e trabalho de equipa · +2 relação com o treinador · 360 minutos prometidos' },
  ] },
];
export function AcademyChapter({ player: initialPlayer, onComplete, onCancel, saveError }: Props) {
  const [player, setPlayer] = useState(initialPlayer);
  const [choices, setChoices] = useState<string[]>([]);
  const [development, setDevelopment] = useState<AcademyDevelopment | null>(null);
  const chapter = choices.length;
  const current = chapters[chapter];
  const select = (id: string) => {
    const result = applyAcademyChoice(player, choices, chapter + 1, id);
    setPlayer(result.player);
    setChoices(result.development.choices);
    if (result.development.completed) setDevelopment(result.development);
  };
  return <main className="opening-screen min-h-screen bg-black px-4 py-8 text-white sm:px-6">
    <div className="stadium-glow" aria-hidden="true" />
    <section className="relative mx-auto max-w-3xl">
      <header className="mb-7 flex items-start justify-between gap-4"><div><p className="opening-eyebrow"><span /> PERCURSO DE FORMAÇÃO · HISTÓRIA FICTÍCIA</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">O primeiro capítulo</h1><p className="mt-2 text-sm text-neutral-400">Academia Horizonte · academia fictícia criada para o simulador. Todas as personagens e acontecimentos desta história são inventados.</p></div>{onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Sair</button>}</header>
      <div className="mb-5 grid grid-cols-3 gap-2" aria-label={`Capítulo ${Math.min(chapter + 1, 3)} de 3`}>{chapters.map((item, index) => <div key={item.eyebrow} className={`rounded-lg border p-3 text-[10px] font-bold uppercase tracking-wide ${index < choices.length ? 'border-yellow-300/30 bg-yellow-300/[.06] text-yellow-200' : index === chapter && !development ? 'border-yellow-300/50 bg-yellow-300/[.08] text-yellow-100' : 'border-white/[.07] text-neutral-600'}`}>{index < choices.length ? '✓ ' : ''}Capítulo {index + 1}</div>)}</div>
      {development ? <section className="opening-card">
        <div className="opening-card-icon"><Trophy size={20} /></div><p className="opening-eyebrow small mt-4"><span /> PERCURSO DEFINIDO</p><h2 className="mt-2 text-2xl font-bold">O teu desenvolvimento começa agora</h2><p className="mt-2 text-sm leading-6 text-neutral-300">{player.name} vai seguir o percurso de <strong className="text-yellow-200">{development.route === 'first-team' ? 'treinos com a primeira equipa' : 'minutos na equipa de desenvolvimento'}</strong>, com {development.promisedMinutes} minutos de oportunidade previstos. A evolução depende também do que fizeres em campo.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-white/10 p-3"><span className="text-[10px] uppercase text-neutral-500">Overall</span><p className="mt-1 text-lg font-bold">{player.overall}</p></div><div className="rounded-lg border border-white/10 p-3"><span className="text-[10px] uppercase text-neutral-500">Potencial</span><p className="mt-1 text-lg font-bold text-yellow-200">{player.potential}</p></div><div className="rounded-lg border border-white/10 p-3"><span className="text-[10px] uppercase text-neutral-500">Moral · treinador</span><p className="mt-1 text-sm font-bold">{player.morale} · {player.coachRelationship}</p></div></div>
        <p className="mt-4 text-xs text-neutral-500">As três decisões ficam guardadas na carreira e os efeitos nos atributos e relações são permanentes.</p>
        {saveError && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-sm text-red-200">{saveError}</p>}
        <button type="button" onClick={() => onComplete(player, development)} className="opening-cta mt-6 w-full">CONTINUAR PARA A CARREIRA <ArrowRight size={16} /></button>
      </section> : <section className="opening-card">
        <p className="opening-eyebrow small"><span /> {current.eyebrow}</p><h2 className="mt-2 text-xl font-bold">{current.title}</h2><p className="mt-2 text-sm leading-6 text-neutral-300">{current.text}</p>
        <div className="mt-5 grid gap-3">{current.options.map(option => <button key={option.id} onClick={() => select(option.id)} className="rounded-xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-yellow-300/40 hover:bg-yellow-300/[.04]"><span className="flex items-center gap-2 text-sm font-bold"><Sparkles size={15} className="text-yellow-200" />{option.title}</span><span className="mt-2 block text-xs leading-5 text-neutral-400">{option.detail}</span></button>)}</div>
        <div className="mt-5 flex items-center gap-2 border-t border-white/[.07] pt-4 text-[11px] text-neutral-500"><BookOpenCheck size={14} /><span>Escolha {choices.length + 1} de 3 · impacto permanente na carreira</span><Shield size={14} className="ml-auto text-yellow-200/70" /></div>
        <div className="mt-4 rounded-lg border border-white/[.06] bg-white/[.02] p-3 text-xs text-neutral-400">Atributos atuais: overall {player.overall} · potencial {player.potential} · moral {player.morale} · relação com treinador {player.coachRelationship}</div>
      </section>}
    </section>
  </main>;
}
