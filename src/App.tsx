import { useState } from 'react';
import { Activity, Banknote, CalendarDays, ChevronRight, CircleUserRound, LayoutDashboard, Menu, Settings, Shield, Trophy, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { MatchCenter } from './components/MatchCenter';
import { PlayerProfile } from './components/PlayerProfile';
import { Market } from './components/Market';
import { Lifestyle } from './components/Lifestyle';
import { useGameState } from './hooks/useGameState';
import type { MatchResult } from './types';

const navItems = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'match', label: 'Centro de jogo', icon: Activity },
  { id: 'player', label: 'Meu jogador', icon: CircleUserRound },
  { id: 'market', label: 'Mercado', icon: Banknote },
  { id: 'lifestyle', label: 'Estilo de vida', icon: CalendarDays },
];

export default function App() {
  const { save, setSave, train, reset, playerClub, opponentClub } = useGameState();
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (id: string) => { setPage(id); setMenuOpen(false); };

  const onResult = (result: MatchResult) => setSave(current => {
    if (current.matchPlayedThisWeek) return current;
    const outcome = result.homeScore > result.awayScore ? 'win' : result.homeScore === result.awayScore ? 'draw' : 'loss';
    const moraleChange = outcome === 'win' ? 5 : outcome === 'draw' ? 1 : -3;
    return {
      ...current,
      lastMatch: result,
      matchPlayedThisWeek: true,
      playedMatches: current.playedMatches + 1,
      balance: current.balance + 1250,
      player: {
        ...current.player,
        morale: Math.max(0, Math.min(100, (current.player.morale ?? 60) + moraleChange)),
        fanRelationship: Math.max(0, Math.min(100, (current.player.fanRelationship ?? 60) + (outcome === 'win' ? 3 : 0))),
        coachRelationship: Math.max(0, Math.min(100, (current.player.coachRelationship ?? 60) + (outcome === 'win' ? 2 : outcome === 'loss' ? -1 : 0))),
      },
    };
  });

  const nextFixture = () => setSave(current => ({ ...current, week: current.week + 1, matchPlayedThisWeek: false, trainedThisWeek: false }));
  const hireAgent = () => setSave(current => current.agentHired || current.balance < 2500 ? current : { ...current, agentHired: true, balance: current.balance - 2500 });

  const content = () => {
    switch (page) {
      case 'match':
        return <MatchCenter
          home={playerClub}
          away={opponentClub}
          result={save.matchPlayedThisWeek ? save.lastMatch : undefined}
          fixtureNumber={save.playedMatches + (save.matchPlayedThisWeek ? 0 : 1)}
          tacticalStyle={save.tacticalStyle}
          onTacticChange={style => setSave(current => ({ ...current, tacticalStyle: style }))}
          onResult={onResult}
          onNextFixture={nextFixture}
        />;
      case 'player': return <PlayerProfile player={save.player} />;
      case 'market': return <Market save={save} onHireAgent={hireAgent} />;
      case 'lifestyle': return <Lifestyle save={save} player={save.player} onFocus={focus => setSave(current => ({ ...current, trainingFocus: focus }))} onTrain={train} />;
      default: return <Dashboard save={save} player={save.player} clubName={playerClub.name} onNavigate={navigate} />;
    }
  };

  return <div className="min-h-screen bg-pitch-950 text-slate-100">
    {menuOpen && <button aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-pitch-900 p-5 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-pitch-950"><Trophy size={21} /></div><div><p className="font-bold">Football MP</p><p className="text-xs text-slate-500">Career Simulator</p></div></div><button className="lg:hidden" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <div className="mt-9 rounded-xl bg-white/[0.03] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10 font-bold text-lime-300">{playerClub.shortName}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{playerClub.name}</p><p className="text-xs text-slate-500">Liga Portuguesa</p></div></div></div>
      <p className="mb-2 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Carreira</p><nav className="space-y-1">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.id ? 'bg-lime-400/10 font-medium text-lime-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}><Icon size={17} />{item.label}{page === item.id && <ChevronRight size={15} className="ml-auto" />}</button>; })}</nav>
      <div className="mt-auto space-y-3"><div className="rounded-xl border border-lime-400/10 bg-lime-400/[0.04] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-lime-300"><Shield size={14} /> PROGRESSO GUARDADO</div><p className="mt-1 text-xs text-slate-500">Este dispositivo · automaticamente</p></div><button onClick={() => { if (window.confirm('Apagar a carreira guardada e começar de novo?')) reset(); }} className="flex items-center gap-2 px-2 text-xs text-slate-600 hover:text-slate-300"><Settings size={14} /> Reiniciar carreira</button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-pitch-950/90 px-4 backdrop-blur-md sm:px-8"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><span className="text-sm text-slate-400">Época <strong className="text-white">2026/27</strong></span></div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">€{save.balance.toLocaleString('pt-PT')}</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-pitch-800 text-sm font-bold text-lime-300">AC</div></div></header><main className="mx-auto max-w-7xl p-4 sm:p-8">{content()}</main><footer className="px-8 pb-6 text-center text-xs text-slate-700">Football MP Simulator · Protótipo local</footer></div>
  </div>;
}
