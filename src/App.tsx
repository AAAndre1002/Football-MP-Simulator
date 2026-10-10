import { useMemo, useState } from 'react';
import { Activity, Banknote, CalendarDays, ChevronRight, CircleUserRound, LayoutDashboard, Menu, Settings, Shield, Trophy, X, ListOrdered } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { MatchCenter } from './components/MatchCenter';
import { PlayerProfile } from './components/PlayerProfile';
import { Market } from './components/Market';
import { Lifestyle } from './components/Lifestyle';
import { SeasonCenter } from './components/SeasonCenter';
import { useGameState } from './hooks/useGameState';
import { leagueTeams, makeFixtures } from './data/mockTeams';
import { seededRandom, settleRound, tableFromFixtures } from './engine/season';
import { simulateMatch } from './engine/matchEngine';
import type { GameSave, MatchResult, Player, SponsorOffer, Team, TransferOffer } from './types';

const navItems = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard }, { id: 'season', label: 'Época e liga', icon: ListOrdered },
  { id: 'match', label: 'Centro de jogo', icon: Activity }, { id: 'player', label: 'Meu jogador', icon: CircleUserRound },
  { id: 'market', label: 'Mercado', icon: Banknote }, { id: 'lifestyle', label: 'Estilo de vida', icon: CalendarDays },
];
const clamp = (value: number, min: number, max: number) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
function buildTeams(save: GameSave): Team[] {
  return leagueTeams.map(team => {
    if (team.id !== save.clubId) return team;
    const slot = team.players.find(p => p.position === save.player.position && team.startingXI.includes(p.id)) ?? team.players[10];
    const replacement: Player = { ...save.player, contract: save.player.contract ? { ...save.player.contract, teamId: save.clubId } : undefined };
    return { ...team, players: team.players.map(p => p.id === slot.id ? replacement : p), startingXI: team.startingXI.map(id => id === slot.id ? replacement.id : id), substitutes: team.substitutes.map(id => id === slot.id ? replacement.id : id) };
  });
}
function currentFixture(save: GameSave) { return save.fixtures.find(f => f.week === save.week && (f.homeTeamId === save.clubId || f.awayTeamId === save.clubId)); }
function currentMatch(save: GameSave, teams: Team[]): { home: Team; away: Team } | undefined {
  const fixture = currentFixture(save); if (!fixture) return;
  return { home: teams.find(t => t.id === fixture.homeTeamId) ?? leagueTeams[0], away: teams.find(t => t.id === fixture.awayTeamId) ?? leagueTeams[1] };
}
function resultForFixture(fixture: GameSave['fixtures'][number], teams: Team[]): MatchResult {
  const home = teams.find(t => t.id === fixture.homeTeamId)!, away = teams.find(t => t.id === fixture.awayTeamId)!;
  return simulateMatch(home, away, { random: seededRandom(fixture.id), matchId: fixture.id });
}
function addYears(date: string | undefined, years: number) {
  const d = date ? new Date(`${date}T12:00:00`) : new Date('2027-06-30T12:00:00'); d.setFullYear(d.getFullYear() + years); return d.toISOString().slice(0, 10);
}
export default function App() {
  const { save, setSave, train, reset } = useGameState();
  const [page, setPage] = useState('dashboard'); const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (id: string) => { setPage(id); setMenuOpen(false); };
  const teams = useMemo(() => buildTeams(save), [save]);
  const current = currentMatch(save, teams); const fixture = currentFixture(save); const club = teams.find(t => t.id === save.clubId) ?? teams[0];
  const opponent = current ? (current.home.id === save.clubId ? current.away : current.home) : teams.find(t => t.id !== save.clubId)!;
  const currentResult = fixture?.result ?? (save.matchPlayedThisWeek ? save.lastMatch : undefined);

  const onResult = (result: MatchResult) => setSave(currentSave => {
    const f = currentFixture(currentSave);
    if (!f || currentSave.matchPlayedThisWeek || f.result || result.homeTeamId !== f.homeTeamId || result.awayTeamId !== f.awayTeamId) return currentSave;
    const safeResult: MatchResult = { ...result, matchId: f.id, homeScore: clamp(Math.floor(result.homeScore), 0, 20), awayScore: clamp(Math.floor(result.awayScore), 0, 20) };
    const matchTeams = buildTeams(currentSave);
    const fixtures = settleRound(currentSave.fixtures, currentSave.week, safeResult, other => resultForFixture(other, matchTeams));
    const ownGoals = safeResult.homeTeamId === currentSave.clubId ? safeResult.homeScore : safeResult.awayScore;
    const opponentGoals = safeResult.homeTeamId === currentSave.clubId ? safeResult.awayScore : safeResult.homeScore;
    const outcome = ownGoals > opponentGoals ? 'win' : ownGoals === opponentGoals ? 'draw' : 'loss';
    const heroGoals = safeResult.events.filter(e => e.type === 'goal' && e.teamId === currentSave.clubId && e.playerId === currentSave.player.id).length;
    const heroAssists = safeResult.events.filter(e => e.type === 'goal' && e.teamId === currentSave.clubId && e.assistPlayerId === currentSave.player.id).length;
    const yellowCards = safeResult.events.filter(e => e.type === 'yellowCard' && e.playerId === currentSave.player.id).length;
    const redCards = safeResult.events.filter(e => e.type === 'redCard' && e.playerId === currentSave.player.id).length;
    const rating = clamp(6.0 + (outcome === 'win' ? 0.5 : outcome === 'loss' ? -0.45 : 0) + heroGoals * 1.1 + heroAssists * 0.65 - yellowCards * 0.45 - redCards * 2, 3, 10);
    const opponentName = teams.find(t => t.id === (safeResult.homeTeamId === currentSave.clubId ? safeResult.awayTeamId : safeResult.homeTeamId))?.name ?? 'Adversário';
    const matchHistory = [...currentSave.career.matchHistory, { week: currentSave.week, opponent: opponentName, score: `${ownGoals}–${opponentGoals}`, rating: Math.round(rating * 10) / 10, goals: heroGoals, assists: heroAssists, yellowCards, redCards }].slice(-60);
    const moraleChange = outcome === 'win' ? 5 : outcome === 'draw' ? 1 : -4;
    const player = { ...currentSave.player, morale: clamp((currentSave.player.morale ?? 60) + moraleChange + (heroGoals ? 2 : 0) - (redCards ? 12 : 0), 0, 100), coachRelationship: clamp((currentSave.player.coachRelationship ?? 60) + (rating >= 7 ? 4 : rating < 5.5 ? -5 : outcome === 'loss' ? -2 : 1), 0, 100), fanRelationship: clamp((currentSave.player.fanRelationship ?? 60) + heroGoals * 5 + heroAssists * 3 + (outcome === 'win' ? 2 : outcome === 'loss' ? -2 : 0), 0, 100), mediaReputation: clamp((currentSave.player.mediaReputation ?? 55) + (rating >= 8 ? 5 : rating < 5 ? -4 : 1), 0, 100) };
    const fatigue = safeResult.playerFatigue[currentSave.player.id] ?? currentSave.career.fatigue;
    const bonus = outcome === 'win' ? 350 : outcome === 'draw' ? 150 : 0;
    const career = { ...currentSave.career, appearances: currentSave.career.appearances + 1, goals: currentSave.career.goals + heroGoals, assists: currentSave.career.assists + heroAssists, yellowCards: currentSave.career.yellowCards + yellowCards, redCards: currentSave.career.redCards + redCards, ratingTotal: currentSave.career.ratingTotal + rating, matchHistory, fatigue };
    return { ...currentSave, fixtures, leagueTable: tableFromFixtures(matchTeams, fixtures), player, career, lastMatch: safeResult, matchPlayedThisWeek: true, playedMatches: currentSave.playedMatches + 1, balance: currentSave.balance + bonus };
  });
  const advance = () => setSave(currentSave => {
    if (!currentSave.matchPlayedThisWeek) return currentSave;
    let sponsorships: SponsorOffer[] = currentSave.sponsorships.map(s => s.status === 'active' && s.weeksRemaining > 0 ? { ...s, weeksRemaining: s.weeksRemaining - 1, status: s.weeksRemaining === 1 ? 'expired' : 'active' } : s);
    const sponsorPay = currentSave.sponsorships.filter(s => s.status === 'active' && s.weeksRemaining > 0).reduce((total, s) => total + s.weeklyIncome, 0);
    const wage = currentSave.player.contract?.weeklyWage ?? 0;
    if (currentSave.week >= 10) return { ...currentSave, balance: currentSave.balance + sponsorPay + wage, sponsorships, season: currentSave.season + 1, week: 1, fixtures: makeFixtures(leagueTeams, currentSave.season + 1), leagueTable: tableFromFixtures(leagueTeams, []), matchPlayedThisWeek: false, trainedThisWeek: false, lastMatch: currentSave.lastMatch, career: { ...currentSave.career, fatigue: Math.max(0, currentSave.career.fatigue - 38) } };
    return { ...currentSave, balance: currentSave.balance + sponsorPay + wage, sponsorships, week: currentSave.week + 1, matchPlayedThisWeek: false, trainedThisWeek: false, career: { ...currentSave.career, fatigue: Math.max(0, currentSave.career.fatigue - 38) } };
  });
  const hireAgent = () => setSave(s => s.agentHired || s.balance < 2500 || s.matchPlayedThisWeek ? s : { ...s, agentHired: true, balance: s.balance - 2500 });
  const generateOffers = () => setSave(s => {
    if (s.offersGeneratedWeek === s.week) return s;
    const rand = seededRandom(`transfer:${s.season}:${s.week}:${s.player.id}:${s.agentHired}`); const chance = clamp(0.35 + ((s.player.overall - 60) * 0.018) + ((s.player.mediaReputation ?? 50) / 250) + (s.agentHired ? 0.22 : 0), 0.3, 0.96);
    const eligible = leagueTeams.filter(t => t.id !== s.clubId).filter(() => rand() < chance);
    const newOffers: TransferOffer[] = eligible.slice(0, 2).map((team) => ({ id: `offer-${s.season}-${s.week}-${team.id}`, playerId: s.player.id, clubId: team.id, fee: Math.round((s.player.marketValue ?? s.player.overall * 50000) * (0.8 + rand() * 0.45) * (s.agentHired ? 1.18 : 1)), joiningBonus: Math.round((s.player.marketValue ?? 200000) * (s.agentHired ? 0.025 : 0.012)), weeklyWage: Math.round((s.player.contract?.weeklyWage ?? 800) * (0.9 + rand() * 0.4) * (s.agentHired ? 1.2 : 1)), contractYears: 2 + Math.floor(rand() * 2), status: 'pending' }));
    return { ...s, transferOffers: [...s.transferOffers.filter(o => o.status === 'pending'), ...newOffers], offersGeneratedWeek: s.week };
  });
  const respondOffer = (id: string, action: 'accept' | 'reject' | 'counter') => setSave(s => {
    const offer = s.transferOffers.find(o => o.id === id && (o.status === 'pending' || o.status === 'countered')); if (!offer) return s;
    if (action === 'reject') return { ...s, transferOffers: s.transferOffers.map(o => o.id === id ? { ...o, status: 'rejected' } : o) };
    if (action === 'counter') return { ...s, transferOffers: s.transferOffers.map(o => o.id === id ? { ...o, status: 'countered', weeklyWage: Math.round(o.weeklyWage * 1.12), fee: Math.round(o.fee * 1.05), joiningBonus: Math.round(o.joiningBonus * 1.1) } : o) };
    if (!s.matchPlayedThisWeek || !leagueTeams.some(t => t.id === offer.clubId)) return s;
    const team = leagueTeams.find(t => t.id === offer.clubId)!; const contract = { id: `contract-${s.season}-${s.week}-${team.id}`, playerId: s.player.id, teamId: team.id, startDate: '2026-07-01', endDate: addYears(s.player.contract?.endDate, offer.contractYears), weeklyWage: offer.weeklyWage, releaseClause: Math.max(offer.fee * 2, offer.fee + 250000) };
    return { ...s, clubId: team.id, player: { ...s.player, contract, morale: clamp((s.player.morale ?? 60) + 8, 0, 100), coachRelationship: 60, marketValue: Math.max(s.player.marketValue ?? 0, offer.fee) }, balance: s.balance + offer.joiningBonus, transferOffers: s.transferOffers.map(o => o.id === id ? { ...o, status: 'accepted' } : o) };
  });
  const generateSponsorOffers = () => setSave(s => {
    if (s.sponsorOffersGeneratedWeek === s.week) return s;
    const factor = 0.65 + (s.player.mediaReputation ?? 50) / 100; const offers: SponsorOffer[] = [
      { id: `sponsor-${s.season}-${s.week}-luso`, brand: 'Luso Energia', weeklyIncome: Math.round(350 * factor), durationWeeks: 5, weeksRemaining: 5, status: 'pending' },
      { id: `sponsor-${s.season}-${s.week}-sport`, brand: 'SportLab', weeklyIncome: Math.round(220 * factor), durationWeeks: 8, weeksRemaining: 8, status: 'pending' },
    ];
    return { ...s, sponsorships: [...s.sponsorships.filter(o => o.status !== 'pending'), ...offers], sponsorOffersGeneratedWeek: s.week };
  });
  const respondSponsor = (id: string, accept: boolean) => setSave(s => {
    const active = s.sponsorships.filter(o => o.status === 'active').length;
    return { ...s, sponsorships: s.sponsorships.map(o => o.id === id && o.status === 'pending' && (!accept || active < 2) ? { ...o, status: accept ? 'active' : 'declined' } : o) };
  });
  const updateClause = (value: number) => setSave(s => {
    const contract = s.player.contract; if (!contract) return s;
    return { ...s, player: { ...s.player, contract: { ...contract, releaseClause: clamp(Math.round(value), Math.ceil((s.player.marketValue ?? 0) * 0.5), 999_999_999) } } };
  });
  const renegotiate = () => setSave(s => {
    const contract = s.player.contract; if (!contract || s.contractActionSeason === s.season || s.matchPlayedThisWeek || !currentFixture(s) || s.balance < 0) return s;
    const bonus = Math.round(contract.weeklyWage * 2); return { ...s, balance: s.balance + bonus, contractActionSeason: s.season, player: { ...s.player, contract: { ...contract, weeklyWage: Math.round(contract.weeklyWage * 1.12), endDate: addYears(contract.endDate, 1), signingBonus: bonus } } };
  });
  const content = () => {
    if (page === 'match' && current) return <MatchCenter home={current.home} away={current.away} result={currentResult} fixtureNumber={save.week} clubId={save.clubId} playerId={save.player.id} initialFatigue={save.career.fatigue} tacticalStyle={save.tacticalStyle} onTacticChange={style => setSave(s => s.matchPlayedThisWeek ? s : { ...s, tacticalStyle: style })} onResult={onResult} onNextFixture={advance} />;
    if (page === 'season') return <SeasonCenter fixtures={save.fixtures} table={save.leagueTable} teams={teams} clubId={save.clubId} week={save.week} season={save.season} onPlay={() => navigate('match')} />;
    if (page === 'player') return <PlayerProfile player={save.player} career={save.career} />;
    if (page === 'market') return <Market save={save} onHireAgent={hireAgent} onGenerateOffers={generateOffers} onOfferAction={respondOffer} onSponsorOffers={generateSponsorOffers} onSponsorDecision={respondSponsor} onClauseChange={updateClause} onRenegotiate={renegotiate} />;
    if (page === 'lifestyle') return <Lifestyle save={save} player={save.player} onFocus={focus => setSave(s => s.trainedThisWeek ? s : { ...s, trainingFocus: focus })} onTrain={train} />;
    return <Dashboard save={save} player={save.player} clubName={club.name} onNavigate={navigate} nextOpponent={opponent.name} onAdvance={advance} />;
  };
  return <div className="min-h-screen bg-pitch-950 text-slate-100">
    {menuOpen && <button aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-pitch-900 p-5 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-pitch-950"><Trophy size={21} /></div><div><p className="font-bold">Football MP</p><p className="text-xs text-slate-500">Career Simulator</p></div></div><button className="lg:hidden" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <div className="mt-9 rounded-xl bg-white/[0.03] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10 font-bold text-lime-300">{club.shortName}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{club.name}</p><p className="text-xs text-slate-500">Liga Portuguesa</p></div></div></div>
      <p className="mb-2 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Carreira</p><nav className="space-y-1">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.id ? 'bg-lime-400/10 font-medium text-lime-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}><Icon size={17} />{item.label}{page === item.id && <ChevronRight size={15} className="ml-auto" />}</button>; })}</nav>
      <div className="mt-auto space-y-3"><div className="rounded-xl border border-lime-400/10 bg-lime-400/[0.04] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-lime-300"><Shield size={14} /> PROGRESSO GUARDADO</div><p className="mt-1 text-xs text-slate-500">Neste dispositivo · automaticamente</p></div><button onClick={() => { if (window.confirm('Apagar a carreira guardada e começar de novo?')) reset(); }} className="flex items-center gap-2 px-2 text-xs text-slate-600 hover:text-slate-300"><Settings size={14} /> Reiniciar carreira</button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-pitch-950/90 px-4 backdrop-blur-md sm:px-8"><div className="flex items-center gap-3"><button aria-label="Abrir menu" className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><span className="text-sm text-slate-400">Época <strong className="text-white">{save.season} · Jornada {save.week}</strong></span></div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">€{save.balance.toLocaleString('pt-PT')}</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-pitch-800 text-sm font-bold text-lime-300">AC</div></div></header><main className="mx-auto max-w-7xl p-4 sm:p-8">{content()}</main><footer className="px-8 pb-6 text-center text-xs text-slate-700">Football MP Simulator · Carreira offline guardada neste dispositivo</footer></div>
  </div>;
}
