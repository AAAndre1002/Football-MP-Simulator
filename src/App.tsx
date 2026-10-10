import { useEffect, useMemo, useState } from 'react';
import { Activity, Banknote, CalendarDays, ChevronRight, CircleUserRound, LayoutDashboard, Menu, Settings, Shield, Trophy, X, ListOrdered, Home } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { MatchCenter } from './components/MatchCenter';
import { PlayerProfile } from './components/PlayerProfile';
import { Market } from './components/Market';
import { Lifestyle } from './components/Lifestyle';
import { SeasonCenter } from './components/SeasonCenter';
import { useGameState } from './hooks/useGameState';
import { leagueTeams, makeFixtures } from './data/mockTeams';
import { seededRandom, settleRound, tableFromFixtures } from './engine/season';
import { canAdvanceWeek, nextSeasonWeek, weekProgressionBlock } from './engine/weekProgression';
import { simulateMatch } from './engine/matchEngine';
import { checkMatchInjury, calculateMarketValue, recordMarketValuePoint, remainingContractYears, recoverFatigue, recoverInjuries } from './engine/playerDevelopment';
import { generateTransferOffers, counterOffer, contractFromOffer } from './engine/transferMarket';
import { answerPressConference, pressChoices, pressHeadline } from './engine/pressConference';
import { academyEntryPlayerSlot } from './engine/academyDevelopment';
import type { GameSave, MatchResult, Player, SponsorOffer, Team, PressAnswer } from './types';

const navItems = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard }, { id: 'season', label: 'Época e liga', icon: ListOrdered },
  { id: 'match', label: 'Centro de jogo', icon: Activity }, { id: 'player', label: 'Meu jogador', icon: CircleUserRound },
  { id: 'market', label: 'Mercado', icon: Banknote }, { id: 'lifestyle', label: 'Estilo de vida', icon: CalendarDays },
];
const clamp = (value: number, min: number, max: number) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
function buildTeams(save: GameSave): Team[] {
  return leagueTeams.map(team => {
    if (team.id !== save.clubId) return team;
    const slot = academyEntryPlayerSlot(team, save.player.position, save.academyDevelopment?.route) ?? team.players[10];
    const replacement: Player = { ...save.player, contract: save.player.contract ? { ...save.player.contract, teamId: save.clubId } : undefined };
    const players = team.players.map(p => p.id === slot.id ? replacement : p);
    const startingXI = team.startingXI.map(id => id === slot.id ? replacement.id : id);
    const substitutes = team.substitutes.map(id => id === slot.id ? replacement.id : id);
    const unavailable = (save.injuries ?? []).some(injury => injury.weeksRemaining > 0);
    if (unavailable) {
      const replacementId = substitutes.find(id => players.find(p => p.id === id)?.position === save.player.position);
      const fitXI = startingXI.filter(id => id !== replacement.id);
      if (replacementId) fitXI.push(replacementId);
      return { ...team, players, startingXI: fitXI, substitutes: substitutes.filter(id => id !== replacementId) };
    }
    return { ...team, players, startingXI, substitutes };
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
interface AppProps { initialSave?: GameSave; onSaveChange?: (save: GameSave) => void; onExit?: () => void; }

export default function App({ initialSave, onSaveChange, onExit }: AppProps = {}) {
  const { save, setSave, train, reset } = useGameState(initialSave, !onSaveChange);
  useEffect(() => { onSaveChange?.(save); }, [save, onSaveChange]);
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
    const heroStats = safeResult.playerStats?.[currentSave.player.id];
    const heroGoals = heroStats?.goals ?? safeResult.events.filter(e => e.type === 'goal' && e.teamId === currentSave.clubId && e.playerId === currentSave.player.id).length;
    const heroAssists = heroStats?.assists ?? safeResult.events.filter(e => e.type === 'goal' && e.teamId === currentSave.clubId && e.assistPlayerId === currentSave.player.id).length;
    const yellowCards = heroStats?.yellowCards ?? safeResult.events.filter(e => e.type === 'yellowCard' && e.playerId === currentSave.player.id).length;
    const redCards = heroStats?.redCards ?? safeResult.events.filter(e => e.type === 'redCard' && e.playerId === currentSave.player.id).length;
    const playedMinutes = heroStats?.minutes ?? 0;
    const rating = playedMinutes ? heroStats?.rating ?? clamp(6 + (outcome === 'win' ? .5 : outcome === 'loss' ? -.45 : 0) + heroGoals * 1.1 + heroAssists * .65 - yellowCards * .45 - redCards * 2, 3, 10) : 6;
    const opponentName = teams.find(t => t.id === (safeResult.homeTeamId === currentSave.clubId ? safeResult.awayTeamId : safeResult.homeTeamId))?.name ?? 'Adversário';
    const matchHistory = playedMinutes ? [...currentSave.career.matchHistory, { week: currentSave.week, opponent: opponentName, score: `${ownGoals}–${opponentGoals}`, rating: Math.round(rating * 10) / 10, goals: heroGoals, assists: heroAssists, yellowCards, redCards }].slice(-60) : currentSave.career.matchHistory;
    const moraleChange = outcome === 'win' ? 5 : outcome === 'draw' ? 1 : -4;
    const player = { ...currentSave.player, morale: clamp((currentSave.player.morale ?? 60) + moraleChange + (heroGoals ? 2 : 0) - (redCards ? 12 : 0), 0, 100), coachRelationship: clamp((currentSave.player.coachRelationship ?? 60) + (rating >= 7 ? 4 : rating < 5.5 ? -5 : outcome === 'loss' ? -2 : 1), 0, 100), fanRelationship: clamp((currentSave.player.fanRelationship ?? 60) + heroGoals * 5 + heroAssists * 3 + (outcome === 'win' ? 2 : outcome === 'loss' ? -2 : 0), 0, 100), mediaReputation: clamp((currentSave.player.mediaReputation ?? 55) + (rating >= 8 ? 5 : rating < 5 ? -4 : 1), 0, 100) };
    const fatigue = safeResult.playerFatigue[currentSave.player.id] ?? currentSave.career.fatigue;
    const matchInjury = playedMinutes ? checkMatchInjury(player, fatigue, currentSave.week, seededRandom(`injury:${safeResult.matchId}:${player.id}`)) : undefined;
    const injuries = matchInjury ? [...(currentSave.injuries ?? []), matchInjury] : currentSave.injuries ?? [];
    const wageBonuses = heroGoals * (player.contract?.goalBonus ?? 0) + heroAssists * (player.contract?.assistBonus ?? 0);
    const matchBonus = outcome === 'win' ? 350 : outcome === 'draw' ? 150 : 0;
    const career = { ...currentSave.career, appearances: currentSave.career.appearances + (playedMinutes ? 1 : 0), totalMinutes: (currentSave.career.totalMinutes ?? currentSave.career.appearances * 70) + playedMinutes, goals: currentSave.career.goals + heroGoals, assists: currentSave.career.assists + heroAssists, yellowCards: currentSave.career.yellowCards + yellowCards, redCards: currentSave.career.redCards + redCards, ratingTotal: currentSave.career.ratingTotal + (playedMinutes ? rating : 0), matchHistory, fatigue };
    const marketValue = calculateMarketValue(player, matchHistory.map(entry => entry.rating), { appearances: career.appearances, totalMinutes: career.totalMinutes, goals: career.goals, assists: career.assists, contractYearsRemaining: remainingContractYears(player, currentSave.season, currentSave.week) });
    const pendingPress = { id: `press-${safeResult.matchId}`, week: currentSave.week, opponent: opponentName, score: `${ownGoals}–${opponentGoals}`, outcome, rating } as const;
    const marketPlayer = { ...player, marketValue };
    const marketHistory = recordMarketValuePoint(currentSave.career.marketValueHistory, currentSave.week, marketValue);
    return { ...currentSave, fixtures, leagueTable: tableFromFixtures(matchTeams, fixtures), player: marketPlayer, career: { ...career, marketValueHistory: marketHistory }, injuries, pendingPress, lastMatch: safeResult, matchPlayedThisWeek: true, playedMatches: currentSave.playedMatches + (playedMinutes ? 1 : 0), balance: currentSave.balance + matchBonus + wageBonuses };
  });
  const advance = () => setSave(currentSave => {
    if (!canAdvanceWeek(currentSave)) return currentSave;
    const sponsorships: SponsorOffer[] = currentSave.sponsorships.map(s => s.status === 'active' && s.weeksRemaining > 0 ? { ...s, weeksRemaining: s.weeksRemaining - 1, status: s.weeksRemaining === 1 ? 'expired' : 'active' } : s);
    const sponsorPay = currentSave.sponsorships.filter(s => s.status === 'active' && s.weeksRemaining > 0).reduce((total, s) => total + s.weeklyIncome, 0);
    const wage = currentSave.player.contract?.weeklyWage ?? 0;
    const trainerCost = currentSave.personalTrainer ? 250 : 0;
    const trainerActive = !currentSave.personalTrainer || currentSave.balance + sponsorPay + wage >= trainerCost;
    const balance = currentSave.balance + sponsorPay + wage - (trainerActive ? trainerCost : 0);
    const fatigue = recoverFatigue(currentSave.career.fatigue, currentSave.recoveryAssets ?? [], trainerActive && currentSave.personalTrainer);
    const injuries = recoverInjuries(currentSave.injuries ?? []);
    const career = { ...currentSave.career, fatigue };
    const common = { ...currentSave, balance, sponsorships, injuries, personalTrainer: trainerActive && currentSave.personalTrainer, career, matchPlayedThisWeek: false, trainedThisWeek: false };
    const nextWeek = nextSeasonWeek(currentSave.week, currentSave.season);
    if (nextWeek.newSeason) return { ...common, ...nextWeek, fixtures: makeFixtures(leagueTeams, nextWeek.season), leagueTable: tableFromFixtures(leagueTeams, []), offersGeneratedWeek: 0, sponsorOffersGeneratedWeek: 0, lastMatch: currentSave.lastMatch };
    return { ...common, ...nextWeek };
  });
  const hireAgent = () => setSave(s => s.agentHired || s.balance < 2500 || s.matchPlayedThisWeek ? s : { ...s, agentHired: true, balance: s.balance - 2500 });
  const generateOffers = () => setSave(s => {
    if (s.offersGeneratedWeek === s.week || s.matchPlayedThisWeek) return s;
    const recentRatings = s.career.matchHistory.slice(-5).map(entry => entry.rating);
    const newOffers = generateTransferOffers({ player: s.player, currentClubId: s.clubId, clubs: leagueTeams, season: s.season, week: s.week, agentHired: s.agentHired, recentRatings, random: seededRandom(`transfer:${s.season}:${s.week}:${s.player.id}:${s.agentHired}`) });
    return { ...s, transferOffers: [...s.transferOffers.filter(o => o.status === 'pending' || o.status === 'countered'), ...newOffers], offersGeneratedWeek: s.week };
  });
  const respondOffer = (id: string, action: 'accept' | 'reject' | 'counter') => setSave(s => {
    const offer = s.transferOffers.find(o => o.id === id && (o.status === 'pending' || o.status === 'countered')); if (!offer) return s;
    if (action === 'reject') return { ...s, transferOffers: s.transferOffers.map(o => o.id === id ? { ...o, status: 'rejected' } : o) };
    if (action === 'counter') return { ...s, transferOffers: s.transferOffers.map(o => o.id === id ? counterOffer(o, s.player, s.agentHired) : o) };
    if (!s.matchPlayedThisWeek || !leagueTeams.some(t => t.id === offer.clubId)) return s;
    const contract = contractFromOffer(offer, s.player, s.season);
    const club = leagueTeams.find(t => t.id === offer.clubId)!;
    const transferredPlayer = { ...s.player, contract, morale: clamp((s.player.morale ?? 60) + 8, 0, 100), coachRelationship: 60 };
    const marketValue = calculateMarketValue(transferredPlayer, s.career.matchHistory.map(entry => entry.rating), { appearances: s.career.appearances, totalMinutes: s.career.totalMinutes, goals: s.career.goals, assists: s.career.assists, contractYearsRemaining: remainingContractYears(transferredPlayer, s.season, s.week) });
    return { ...s, clubId: club.id, player: { ...transferredPlayer, marketValue }, career: { ...s.career, marketValueHistory: recordMarketValuePoint(s.career.marketValueHistory, s.week, marketValue) }, balance: s.balance + offer.joiningBonus, transferOffers: s.transferOffers.map(o => o.id === id ? { ...o, status: 'accepted' } : o) };
  });
  const answerPress = (answer: PressAnswer) => setSave(s => {
    const pending = s.pendingPress; if (!pending) return s;
    const answeredPlayer = answerPressConference(s.player, pending, answer);
    const headline = pressHeadline(answer, pending.outcome, answeredPlayer.name);
    const marketValue = calculateMarketValue(answeredPlayer, s.career.matchHistory.map(entry => entry.rating), { appearances: s.career.appearances, totalMinutes: s.career.totalMinutes, goals: s.career.goals, assists: s.career.assists, contractYearsRemaining: remainingContractYears(answeredPlayer, s.season, pending.week) });
    const player = { ...answeredPlayer, marketValue };
    const marketValueHistory = recordMarketValuePoint(s.career.marketValueHistory, pending.week, marketValue);
    return { ...s, player, career: { ...s.career, marketValueHistory }, pendingPress: undefined, pressHistory: [...(s.pressHistory ?? []), { week: pending.week, opponent: pending.opponent, answer, headline }].slice(-30) };
  });
  const buyRecoveryBoots = () => setSave(s => s.matchPlayedThisWeek || (s.recoveryAssets ?? []).includes('recoveryBoots') || s.balance < 2400 ? s : { ...s, balance: s.balance - 2400, recoveryAssets: [...(s.recoveryAssets ?? []), 'recoveryBoots'] });
  const hireTrainer = () => setSave(s => s.matchPlayedThisWeek || s.personalTrainer || s.balance < 1200 ? s : { ...s, balance: s.balance - 1200, personalTrainer: true });
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
    const bonus = Math.round(contract.weeklyWage * 2);
    const player = { ...s.player, contract: { ...contract, weeklyWage: Math.round(contract.weeklyWage * 1.12), endDate: addYears(contract.endDate, 1), signingBonus: bonus } };
    const marketValue = calculateMarketValue(player, s.career.matchHistory.map(entry => entry.rating), { appearances: s.career.appearances, totalMinutes: s.career.totalMinutes, goals: s.career.goals, assists: s.career.assists, contractYearsRemaining: remainingContractYears(player, s.season, s.week) });
    return { ...s, balance: s.balance + bonus, contractActionSeason: s.season, player: { ...player, marketValue }, career: { ...s.career, marketValueHistory: recordMarketValuePoint(s.career.marketValueHistory, s.week, marketValue) } };
  });
  const content = () => {
    if (page === 'match' && current) return <MatchCenter home={current.home} away={current.away} result={currentResult} fixtureNumber={save.week} clubId={save.clubId} playerId={save.player.id} initialFatigue={save.career.fatigue} tacticalStyle={save.tacticalStyle} onTacticChange={style => setSave(s => s.matchPlayedThisWeek ? s : { ...s, tacticalStyle: style })} onResult={onResult} onNextFixture={() => navigate('dashboard')} />;
    if (page === 'season') return <SeasonCenter fixtures={save.fixtures} table={save.leagueTable} teams={teams} clubId={save.clubId} week={save.week} season={save.season} onPlay={() => navigate('match')} />;
    if (page === 'player') return <PlayerProfile player={save.player} career={save.career} academyDevelopment={save.academyDevelopment} careerPathway={save.careerPathway} season={save.season} week={save.week} />;
    if (page === 'market') return <Market save={save} onHireAgent={hireAgent} onGenerateOffers={generateOffers} onOfferAction={respondOffer} onSponsorOffers={generateSponsorOffers} onSponsorDecision={respondSponsor} onClauseChange={updateClause} onRenegotiate={renegotiate} />;
    if (page === 'lifestyle') return <Lifestyle save={save} player={save.player} onFocus={focus => setSave(s => s.trainedThisWeek ? s : { ...s, trainingFocus: focus })} onTrain={train} onBuyRecovery={buyRecoveryBoots} onHireTrainer={hireTrainer} />;
    return <Dashboard save={save} player={save.player} clubName={club.name} onNavigate={navigate} nextOpponent={opponent.name} onAdvance={advance} advanceBlock={weekProgressionBlock(save)} />;
  };
  return <div className="career-shell min-h-screen bg-pitch-950 text-slate-100">
    {menuOpen && <button aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}
    <aside className={`career-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-pitch-900 p-5 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-pitch-950"><Trophy size={21} /></div><div><p className="font-bold">Football MP</p><p className="text-xs text-slate-500">Career Simulator</p></div></div><button className="lg:hidden" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <div className="mt-9 rounded-xl bg-white/[0.03] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10 font-bold text-lime-300">{club.shortName}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{club.name}</p><p className="text-xs text-slate-500">Liga Portuguesa</p></div></div></div>
      <p className="mb-2 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Carreira</p><nav className="space-y-1">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.id ? 'bg-lime-400/10 font-medium text-lime-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}><Icon size={17} />{item.label}{page === item.id && <ChevronRight size={15} className="ml-auto" />}</button>; })}</nav>
      <div className="mt-auto space-y-3"><div className="rounded-xl border border-lime-400/10 bg-lime-400/[0.04] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-lime-300"><Shield size={14} /> PROGRESSO GUARDADO</div><p className="mt-1 text-xs text-slate-500">Neste dispositivo · automaticamente</p></div><button onClick={() => { if (window.confirm('Apagar a carreira guardada e começar de novo?')) reset(); }} className="flex items-center gap-2 px-2 text-xs text-slate-600 hover:text-slate-300"><Settings size={14} /> Reiniciar carreira</button></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-pitch-950/90 px-4 backdrop-blur-md sm:px-8"><div className="flex items-center gap-3">{onExit && <button onClick={onExit} className="btn-secondary h-9 px-3 text-xs"><Home size={15} /> Menu</button>}<button aria-label="Abrir menu" className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button><span className="text-sm text-slate-400">Época <strong className="text-white">{save.season} · Jornada {save.week}</strong></span></div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">€{save.balance.toLocaleString('pt-PT')}</span><div aria-label="Football MP" className="flex h-9 w-9 items-center justify-center rounded-full border border-lime-300/20 bg-lime-300/10 text-lime-200"><Trophy size={16} /></div></div></header><main className="mx-auto max-w-7xl p-4 sm:p-8">{content()}</main>{save.pendingPress && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="press-title" className="panel w-full max-w-2xl border-amber-200/20 p-5 shadow-2xl sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-200">Zona mista · Jornada {save.pendingPress.week}</p><h2 id="press-title" className="mt-2 text-2xl font-semibold">Conferência de imprensa</h2><p className="mt-2 text-sm text-slate-400">{save.pendingPress.score} frente a {save.pendingPress.opponent}. A tua resposta pode influenciar o treinador, os adeptos e a reputação nos media.</p><div className="mt-5 grid gap-2">{pressChoices.map(choice => <button key={choice.id} onClick={() => answerPress(choice.id)} className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-left transition hover:border-amber-200/30 hover:bg-amber-200/[.04]"><span className="block text-sm font-semibold">{choice.title}</span><span className="mt-1 block text-xs text-slate-400">{choice.response} {choice.description}</span></button>)}</div></section></div>}<footer className="px-8 pb-6 text-center text-xs text-slate-700">Football MP Simulator · Carreira offline guardada neste dispositivo</footer></div>
  </div>;
}
