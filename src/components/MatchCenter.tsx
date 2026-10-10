import { useState } from 'react';
import { ArrowRight, Play, Shield, Zap } from 'lucide-react';
import type { MatchResult, TacticalStyle, Team } from '../types';
import { simulateMatch } from '../engine/matchEngine';

const tactics: { id: TacticalStyle; name: string; detail: string }[] = [
  { id: 'balanced', name: 'Equilibrada', detail: 'Sem riscos extremos' },
  { id: 'possession', name: 'Posse', detail: 'Mais controlo da bola' },
  { id: 'counterAttack', name: 'Contra-ataque', detail: 'Explora espaços' },
  { id: 'highPress', name: 'Pressão alta', detail: 'Pressiona e acelera' },
];

export function MatchCenter({
  home, away, result, fixtureNumber, clubId, playerId, initialFatigue, tacticalStyle, onTacticChange, onResult, onNextFixture,
}: {
  home: Team;
  away: Team;
  clubId: string;
  playerId: string;
  initialFatigue: number;
  result?: MatchResult;
  fixtureNumber: number;
  tacticalStyle: TacticalStyle;
  onTacticChange: (style: TacticalStyle) => void;
  onResult: (result: MatchResult) => void;
  onNextFixture: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const play = () => {
    if (isPlaying || result) return;
    setIsPlaying(true);
    window.setTimeout(() => {
      const userTeam = home.id === clubId ? { ...home, tacticalStyle } : { ...away, tacticalStyle };
      const matchHome = home.id === clubId ? userTeam : home;
      const matchAway = away.id === clubId ? userTeam : away;
      onResult(simulateMatch(matchHome, matchAway, { initialFatigue: { [playerId]: initialFatigue } }));
      setIsPlaying(false);
    }, 350);
  };
  const homeStats = result?.stats[home.id];
  const awayStats = result?.stats[away.id];

  return <div className="space-y-5">
    <div><p className="text-sm text-lime-400">Liga Portuguesa · Jornada {fixtureNumber}</p><h1 className="mt-1 text-3xl font-bold">Centro de jogo</h1></div>
    <section className="panel p-6 sm:p-9">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div><div className="crest mx-auto">FA</div><h2 className="mt-3 font-semibold">{home.name}</h2><p className="text-xs text-slate-500">Casa</p></div>
        <div><p className="text-xs uppercase tracking-widest text-slate-500">{result ? 'Final' : '90 min'}</p><div className="my-2 text-4xl font-black tabular-nums">{result ? `${result.homeScore} : ${result.awayScore}` : 'VS'}</div><p className="text-xs text-slate-500">{result ? 'Apito final' : 'Simulação de partida'}</p></div>
        <div><div className="crest crest-muted mx-auto">PN</div><h2 className="mt-3 font-semibold">{away.name}</h2><p className="text-xs text-slate-500">Visitante</p></div>
      </div>
      {!result && <div className="mx-auto mt-8 max-w-3xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Shield size={16} className="text-lime-300" /> Escolhe a abordagem tática</div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{tactics.map(tactic => <button key={tactic.id} onClick={() => onTacticChange(tactic.id)} className={`rounded-xl border p-3 text-left transition ${tacticalStyle === tactic.id ? 'border-lime-400/50 bg-lime-400/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}><span className="block text-sm font-semibold">{tactic.name}</span><span className="text-xs text-slate-500">{tactic.detail}</span></button>)}</div>
      </div>}
      <div className="mt-7 flex justify-center">{result
        ? <button className="btn-primary min-w-48 justify-center" onClick={onNextFixture}><ArrowRight size={17} /> Avançar para jornada {fixtureNumber + 1}</button>
        : <button className="btn-primary min-w-48 justify-center" disabled={isPlaying} onClick={play}>{isPlaying ? <><span className="animate-pulse">A simular...</span><Zap size={16} /></> : <><Play size={17} fill="currentColor" /> Iniciar partida</>}</button>}
      </div>
    </section>
    {result && <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="panel p-5"><h2 className="mb-4 font-semibold">Estatísticas</h2>{[['Posse de bola', `${homeStats?.possession}%`, `${awayStats?.possession}%`], ['Remates', `${homeStats?.shots}`, `${awayStats?.shots}`], ['À baliza', `${homeStats?.shotsOnTarget}`, `${awayStats?.shotsOnTarget}`], ['Cartões amarelos', `${homeStats?.yellowCards}`, `${awayStats?.yellowCards}`], ['Cartões vermelhos', `${homeStats?.redCards}`, `${awayStats?.redCards}`]].map(([name, h, a]) => <div key={name} className="grid grid-cols-[1fr_auto_1fr] border-t border-white/5 py-3 text-sm"><span>{h}</span><span className="px-3 text-center text-slate-500">{name}</span><span className="text-right">{a}</span></div>)}</section>
      <section className="panel p-5"><h2 className="mb-4 font-semibold">Relato da partida</h2><div className="max-h-72 space-y-2 overflow-y-auto pr-1">{[...result.events].reverse().map((event, index) => <div key={`${event.minute}-${event.type}-${index}`} className="flex gap-3 rounded-lg bg-white/[0.03] p-3"><span className="w-10 shrink-0 font-mono text-lime-300">{event.minute}'</span><span className="text-sm text-slate-300">{event.description}</span></div>)}{result.events.length === 0 && <p className="text-sm text-slate-500">Jogo sem ocorrências destacadas.</p>}</div></section>
    </div>}
  </div>;
}
