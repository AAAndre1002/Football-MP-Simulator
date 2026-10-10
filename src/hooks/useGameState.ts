import { useEffect, useState } from 'react';
import type { CareerStats, Fixture, GameSave, InjuryStatus, MatchEvent, MatchResult, Player, PlayerAttributes, PendingPress, PressHistoryEntry, RecoveryAsset, SponsorOffer, TacticalStyle, TrainingFocus, TrainingSummary, TransferOffer } from '../types';
import { emptyLeagueTable, leagueTeams, makeFixtures, playerCharacter, playerClub } from '../data/mockTeams';
import { tableFromFixtures, seededRandom } from '../engine/season';
import { applyTraining, calculateMarketValue, recordMarketValuePoint, remainingContractYears, type TrainingIntensity } from '../engine/playerDevelopment';
import { getCareerPathway } from '../player-creation/clubOffers';

const STORAGE_KEY = 'football-mp-simulator-save-v1';
const clamp = (n: unknown, min: number, max: number, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
const allowedTactics: TacticalStyle[] = ['balanced', 'possession', 'counterAttack', 'highPress'];
const allFocuses: TrainingFocus[] = ['passing', 'shooting', 'dribbling', 'tackling', 'vision', 'ballControl', 'pace', 'acceleration', 'stamina', 'strength', 'agility', 'decisions', 'positioning', 'teamwork', 'composure', 'leadership'];
function trainingValue(player: Player, focus: TrainingFocus): number {
  if (focus in player.attributes.technical) return player.attributes.technical[focus as keyof PlayerAttributes['technical']];
  if (focus in player.attributes.physical) return player.attributes.physical[focus as keyof PlayerAttributes['physical']];
  return player.attributes.mental[focus as keyof PlayerAttributes['mental']];
}
function attributesFrom(input?: PlayerAttributes): PlayerAttributes {
  const def = playerCharacter.attributes; const a = input && typeof input === 'object' ? input : def;
  const group = <K extends keyof PlayerAttributes>(key: K): PlayerAttributes[K] => {
    const src = (a[key] ?? def[key]) as Record<string, unknown>; const base = def[key] as unknown as Record<string, number>;
    return Object.fromEntries(Object.keys(base).map(name => [name, clamp(src[name], 1, 99, base[name])])) as PlayerAttributes[K];
  };
  return { physical: group('physical'), technical: group('technical'), mental: group('mental'), ...(a.goalkeeping || def.goalkeeping ? { goalkeeping: group('goalkeeping') } : {}) };
}
function defaultCareer(player: Player): CareerStats {
  return { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratingTotal: 0, matchHistory: [], fatigue: 0, marketValueHistory: [{ week: 1, value: player.marketValue ?? 0 }], overallHistory: [{ week: 1, value: player.overall }] };
}
function freshSave(): GameSave {
  const player: Player = { ...playerCharacter, id: 'smf-11', contract: { id: 'contract-1', playerId: 'smf-11', teamId: playerClub.id, startDate: '2026-07-01', endDate: '2027-06-30', weeklyWage: 1250, releaseClause: 1400000, goalBonus: 250, assistBonus: 125 } };
  player.marketValue = calculateMarketValue(player, [], { appearances: 0, totalMinutes: 0, goals: 0, assists: 0, contractYearsRemaining: remainingContractYears(player) });
  return { version: 4, player, clubId: playerClub.id, balance: 12500, week: 1, season: 1, trainingFocus: 'shooting', tacticalStyle: 'balanced', trainedThisWeek: false, matchPlayedThisWeek: false, playedMatches: 0, agentHired: false, fixtures: makeFixtures(leagueTeams), leagueTable: emptyLeagueTable(leagueTeams), career: defaultCareer(player), transferOffers: [], sponsorships: [], offersGeneratedWeek: 0, sponsorOffersGeneratedWeek: 0, contractActionSeason: 0, injuries: [], pressHistory: [], recoveryAssets: [], personalTrainer: false };
}

export const createFreshSave = (): GameSave => freshSave();

/** Build a separate new save around a wizard-created player; callers choose its storage slot. */
export function createCareerSave(createdPlayer: Player): GameSave {
  const base = freshSave();
  const player: Player = {
    ...createdPlayer,
    contract: { id: `academy-contract-${createdPlayer.id}`, playerId: createdPlayer.id, teamId: playerClub.id, startDate: '2026-07-01', endDate: '2027-06-30', weeklyWage: 250, releaseClause: Math.max(100000, (createdPlayer.marketValue ?? 50000) * 4), goalBonus: 50, assistBonus: 25 },
  };
  player.marketValue = calculateMarketValue(player, [], { appearances: 0, totalMinutes: 0, goals: 0, assists: 0, contractYearsRemaining: remainingContractYears(player) });
  return { ...base, player, clubId: playerClub.id, career: defaultCareer(player), transferOffers: [], sponsorships: [], injuries: [], pressHistory: [], recoveryAssets: [] };
}
function safeResult(value: unknown, homeTeamId: string, awayTeamId: string, id: string): MatchResult | undefined {
  if (!value || typeof value !== 'object') return;
  const raw = value as Partial<MatchResult>;
  if (raw.homeTeamId !== homeTeamId || raw.awayTeamId !== awayTeamId || !Array.isArray(raw.events)) return;
  const eventTypes = ['chance', 'goal', 'yellowCard', 'redCard', 'substitution', 'injury'];
  const events = raw.events.filter((item): item is MatchEvent => {
    if (!item || typeof item !== 'object') return false;
    const event = item as MatchEvent;
    return eventTypes.includes(event.type) && Number.isFinite(event.minute) && (event.teamId === homeTeamId || event.teamId === awayTeamId);
  }).slice(0, 500).map(e => ({ minute: clamp(e.minute, 0, 150, 0), type: e.type, teamId: e.teamId, description: typeof e.description === 'string' ? e.description.slice(0, 300) : '',
    ...(typeof e.playerId === 'string' ? { playerId: e.playerId.slice(0, 100) } : {}), ...(typeof e.playerName === 'string' ? { playerName: e.playerName.slice(0, 100) } : {}),
    ...(typeof e.relatedPlayerId === 'string' ? { relatedPlayerId: e.relatedPlayerId.slice(0, 100) } : {}), ...(typeof e.relatedPlayerName === 'string' ? { relatedPlayerName: e.relatedPlayerName.slice(0, 100) } : {}),
    ...(typeof e.assistPlayerId === 'string' ? { assistPlayerId: e.assistPlayerId.slice(0, 100) } : {}), ...(typeof e.assistPlayerName === 'string' ? { assistPlayerName: e.assistPlayerName.slice(0, 100) } : {}) }));
  const stat = (teamId: string) => { const s = raw.stats?.[teamId]; return { shots: clamp(s?.shots, 0, 100, 0), shotsOnTarget: clamp(s?.shotsOnTarget, 0, 100, 0), possession: clamp(s?.possession, 0, 100, 0), yellowCards: clamp(s?.yellowCards, 0, 20, 0), redCards: clamp(s?.redCards, 0, 20, 0), passes: clamp(s?.passes, 0, 5000, 0), passAccuracy: clamp(s?.passAccuracy, 0, 100, 0), tackles: clamp(s?.tackles, 0, 200, 0) }; };
  const playerStats = Object.fromEntries(Object.entries(raw.playerStats ?? {}).slice(0, 40).map(([key, stats]) => [key.slice(0, 100), { minutes: clamp(stats?.minutes, 0, 150, 0), goals: clamp(stats?.goals, 0, 20, 0), assists: clamp(stats?.assists, 0, 20, 0), shots: clamp(stats?.shots, 0, 100, 0), yellowCards: clamp(stats?.yellowCards, 0, 20, 0), redCards: clamp(stats?.redCards, 0, 20, 0), rating: clamp(stats?.rating, 0, 10, 6) }]));
  return { matchId: id, homeTeamId, awayTeamId, homeScore: clamp(raw.homeScore, 0, 20, 0), awayScore: clamp(raw.awayScore, 0, 20, 0), events,
    stats: { [homeTeamId]: stat(homeTeamId), [awayTeamId]: stat(awayTeamId) }, playerFatigue: Object.fromEntries(Object.entries(raw.playerFatigue ?? {}).slice(0, 40).map(([key, n]) => [key.slice(0, 100), clamp(n, 0, 100, 0)])), playerStats };
}
export function normalizeGameSave(value: unknown): GameSave {
  const base = freshSave();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<GameSave> & { player?: Partial<Player>; career?: Partial<CareerStats> };
  const playerData = raw.player && typeof raw.player === 'object' ? raw.player : base.player;
  const playerOverall = clamp(playerData.overall, 1, 99, base.player.overall);
  const storedStartingPotential = clamp(playerData.initialPotential, 1, 100, clamp(playerData.potential, 1, 100, playerOverall));
  const legacyPotential = clamp(Math.max(playerOverall, clamp(playerData.potential, 1, 100, storedStartingPotential)), playerOverall, 100, playerOverall);
  const initialPotential = storedStartingPotential;
  const player: Player = { ...base.player, ...playerData, id: typeof playerData.id === 'string' ? playerData.id.slice(0, 80) : base.player.id,
    name: typeof playerData.name === 'string' ? playerData.name.slice(0, 80) : base.player.name,
    age: clamp(playerData.age, 16, 45, base.player.age), overall: playerOverall, potential: legacyPotential, initialPotential, potentialMomentum: clamp(playerData.potentialMomentum, -4, 4, 0), potentialTrend: playerData.potentialTrend === 1 || playerData.potentialTrend === -1 ? playerData.potentialTrend : 0, marketValue: clamp(playerData.marketValue, 0, 999_999_999, base.player.marketValue ?? 0),
    attributes: attributesFrom(playerData.attributes), morale: clamp(playerData.morale, 0, 100, 70), coachRelationship: clamp(playerData.coachRelationship, 0, 100, 65), fanRelationship: clamp(playerData.fanRelationship, 0, 100, 60), mediaReputation: clamp(playerData.mediaReputation, 0, 100, 55),
    contract: playerData.contract ? { ...base.player.contract!, ...playerData.contract, teamId: typeof playerData.contract.teamId === 'string' ? playerData.contract.teamId : base.player.contract!.teamId,
      weeklyWage: clamp(playerData.contract.weeklyWage, 0, 1_000_000, 1250), releaseClause: clamp(playerData.contract.releaseClause, 0, 999_999_999, 1_400_000), goalBonus: clamp(playerData.contract.goalBonus, 0, 1_000_000, 250), assistBonus: clamp(playerData.contract.assistBonus, 0, 1_000_000, 125) } : base.player.contract };
  const season = clamp(raw.season, 1, 999, 1);
  const scheduled = makeFixtures(leagueTeams, season);
  const storedFixtures = Array.isArray(raw.fixtures) ? raw.fixtures : [];
  const fixtureList: Fixture[] = scheduled.map(f => {
    const old = storedFixtures.find(item => item && item.id === f.id);
    const result = old ? safeResult(old.result, f.homeTeamId, f.awayTeamId, f.id) : undefined;
    return result ? { ...f, result } : f;
  });
  const history = Array.isArray(raw.career?.matchHistory) ? raw.career!.matchHistory!.slice(-60).filter(item => item && Number.isFinite(item.rating) && typeof item.opponent === 'string').map(item => ({ week: clamp(item.week, 1, 10, 1), opponent: item.opponent.slice(0, 100), score: typeof item.score === 'string' ? item.score.slice(0, 20) : '0–0', rating: clamp(item.rating, 0, 10, 6), goals: clamp(item.goals, 0, 20, 0), assists: clamp(item.assists, 0, 20, 0), yellowCards: clamp(item.yellowCards, 0, 10, 0), redCards: clamp(item.redCards, 0, 5, 0), ...(Number.isFinite(item.minutes) ? { minutes: clamp(item.minutes, 0, 150, 0) } : {}) })) : [];
  const points = (items: unknown, fallback: number) => Array.isArray(items) ? items.slice(-30).filter((item): item is { week: number; value: number } => !!item && typeof item === 'object' && Number.isFinite((item as { value?: unknown }).value)).map(item => ({ week: clamp(item.week, 1, 10000, 1), value: clamp(item.value, 0, 999_999_999, fallback) })) : [{ week: 1, value: fallback }];
  const career: CareerStats = { appearances: clamp(raw.career?.appearances, 0, 10000, clamp(raw.playedMatches, 0, 10000, 0)), goals: clamp(raw.career?.goals, 0, 10000, 0), assists: clamp(raw.career?.assists, 0, 10000, 0), yellowCards: clamp(raw.career?.yellowCards, 0, 10000, 0), redCards: clamp(raw.career?.redCards, 0, 10000, 0), ratingTotal: clamp(raw.career?.ratingTotal, 0, 1_000_000, 0), totalMinutes: clamp(raw.career?.totalMinutes, 0, 2_000_000, clamp(raw.career?.appearances, 0, 10000, 0) * 70), matchHistory: history, fatigue: clamp(raw.career?.fatigue, 0, 100, 0), marketValueHistory: points(raw.career?.marketValueHistory, player.marketValue ?? 0), overallHistory: points(raw.career?.overallHistory, player.overall) };
  const sponsors = Array.isArray(raw.sponsorships) ? raw.sponsorships.slice(0, 20).filter(s => s && typeof s.id === 'string').map(s => ({ ...s, brand: typeof s.brand === 'string' ? s.brand.slice(0, 100) : 'Marca', weeklyIncome: clamp(s.weeklyIncome, 0, 1_000_000, 0), durationWeeks: clamp(s.durationWeeks, 1, 52, 1), weeksRemaining: clamp(s.weeksRemaining, 0, 52, 0), status: ['pending','active','declined','expired'].includes(s.status) ? s.status : 'expired' })) : [];
  const offers = Array.isArray(raw.transferOffers) ? raw.transferOffers.slice(0, 20).filter(o => o && typeof o.id === 'string').map(o => ({ ...o, playerId: player.id, clubId: leagueTeams.some(t => t.id === o.clubId) ? o.clubId : playerClub.id, fee: clamp(o.fee, 0, 999_999_999, 0), joiningBonus: clamp(o.joiningBonus, 0, 999_999_999, 0), weeklyWage: clamp(o.weeklyWage, 0, 1_000_000, 0), contractYears: clamp(o.contractYears, 1, 5, 2), status: ['pending','accepted','rejected','countered'].includes(o.status) ? o.status : 'rejected' })) : [];
  const injuries: InjuryStatus[] = Array.isArray(raw.injuries) ? raw.injuries.slice(0, 10).filter(i => i && typeof i.id === 'string').map(i => ({ id: i.id.slice(0, 80), name: typeof i.name === 'string' ? i.name.slice(0, 80) : 'Lesão', severity: ['minor','moderate','serious'].includes(i.severity) ? i.severity : 'minor', weeksRemaining: clamp(i.weeksRemaining, 0, 24, 0), occurredWeek: clamp(i.occurredWeek, 1, 10000, 1) })) : [];
  const pressHistory: PressHistoryEntry[] = Array.isArray(raw.pressHistory) ? raw.pressHistory.slice(-30).filter(p => p && typeof p.opponent === 'string').map(p => ({ week: clamp(p.week, 1, 10000, 1), opponent: p.opponent.slice(0, 80), answer: ['team_first','confident','humble'].includes(p.answer) ? p.answer : 'team_first', headline: typeof p.headline === 'string' ? p.headline.slice(0, 200) : '' })) : [];
  const pendingPress: PendingPress | undefined = raw.pendingPress && typeof raw.pendingPress.opponent === 'string' ? { id: String(raw.pendingPress.id).slice(0, 100), week: clamp(raw.pendingPress.week, 1, 10000, 1), opponent: raw.pendingPress.opponent.slice(0, 80), score: String(raw.pendingPress.score).slice(0, 20), outcome: ['win','draw','loss'].includes(raw.pendingPress.outcome) ? raw.pendingPress.outcome : 'draw', rating: clamp(raw.pendingPress.rating, 0, 10, 6) } : undefined;
  const trainingRaw = raw.lastTraining as Partial<TrainingSummary> | undefined;
  const validIntensity = trainingRaw && ['recovery','balanced','high'].includes(trainingRaw.intensity ?? '');
  const lastTraining: TrainingSummary | undefined = trainingRaw && validIntensity && allFocuses.includes(trainingRaw.focus as TrainingFocus)
    ? { week: clamp(trainingRaw.week, 1, 10000, 1), focus: trainingRaw.focus as TrainingFocus, intensity: trainingRaw.intensity as TrainingSummary['intensity'], previousValue: clamp(trainingRaw.previousValue, 0, 100, 0), currentValue: clamp(trainingRaw.currentValue, 0, 100, 0), attributeGain: clamp(trainingRaw.attributeGain, 0, 20, 0), fatigueChange: clamp(trainingRaw.fatigueChange, -100, 100, 0), ...(typeof trainingRaw.injuryName === 'string' ? { injuryName: trainingRaw.injuryName.slice(0, 80) } : {}) }
    : undefined;
  const recoveryAssets = Array.isArray(raw.recoveryAssets) ? raw.recoveryAssets.filter((asset): asset is RecoveryAsset => asset === 'recoveryBoots' || asset === 'personalTrainer') : [];
  const academyRaw = raw.academyDevelopment;
  const academyDevelopment = academyRaw && academyRaw.completed === true && Array.isArray(academyRaw.choices) && academyRaw.choices.length === 3
    && academyRaw.choices.every((id, index) => ['first-touch','speed-circuit','video-review','peer-captain','first-team-route','reserve-route'].includes(id) && academyRaw.choices.indexOf(id) === index)
    && (academyRaw.route === 'first-team' || academyRaw.route === 'reserve')
    ? { academyLabel: 'Academia Horizonte', completed: true, choices: academyRaw.choices.slice(0, 3), route: academyRaw.route, promisedMinutes: clamp(academyRaw.promisedMinutes, 0, 1000, 0) } : undefined;
  const fixtures = fixtureList;
  const lastMatch = raw.lastMatch ? safeResult(raw.lastMatch, raw.lastMatch.homeTeamId, raw.lastMatch.awayTeamId, raw.lastMatch.matchId) : undefined;
  const pathwayRaw = raw.careerPathway;
  const careerPathway = pathwayRaw && ['portugal', 'brazil', 'italy', 'spain'].includes(pathwayRaw.country) && typeof pathwayRaw.offerId === 'string' && getCareerPathway(pathwayRaw as GameSave['careerPathway'])
    ? { country: pathwayRaw.country, offerId: pathwayRaw.offerId.slice(0, 80) } as GameSave['careerPathway'] : undefined;
  return { ...base, ...raw, version: 4, player, lastMatch, clubId: leagueTeams.some(t => t.id === raw.clubId) ? raw.clubId! : base.clubId,
    balance: clamp(raw.balance, 0, 999_999_999, base.balance), week: clamp(raw.week, 1, 10, 1), season: clamp(raw.season, 1, 999, 1),
    trainingFocus: allFocuses.includes(raw.trainingFocus as TrainingFocus) ? raw.trainingFocus! : base.trainingFocus,
    tacticalStyle: allowedTactics.includes(raw.tacticalStyle as TacticalStyle) ? raw.tacticalStyle! : base.tacticalStyle,
    trainedThisWeek: raw.trainedThisWeek === true, matchPlayedThisWeek: raw.matchPlayedThisWeek === true && fixtures.some(f => f.week === clamp(raw.week, 1, 10, 1) && !!f.result),
    playedMatches: clamp(raw.playedMatches, 0, 10000, 0), agentHired: raw.agentHired === true, fixtures,
    leagueTable: tableFromFixtures(leagueTeams, fixtures), career, transferOffers: offers as TransferOffer[], sponsorships: sponsors as SponsorOffer[],
    offersGeneratedWeek: clamp(raw.offersGeneratedWeek, 0, 10000, 0), sponsorOffersGeneratedWeek: clamp(raw.sponsorOffersGeneratedWeek, 0, 10000, 0), contractActionSeason: clamp(raw.contractActionSeason, 0, 999, 0), injuries, pendingPress, pressHistory, recoveryAssets, personalTrainer: raw.personalTrainer === true, lastTraining, academyDevelopment, careerPathway };
}
export function useGameState(initialSave?: GameSave, persistLocally = true) {
  const [save, setSave] = useState<GameSave>(() => {
    if (initialSave) return normalizeGameSave(initialSave);
    try { const stored = localStorage.getItem(STORAGE_KEY); return stored ? normalizeGameSave(JSON.parse(stored)) : freshSave(); } catch { return freshSave(); }
  });
  useEffect(() => { if (!persistLocally) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* private browsing may deny storage */ } }, [save, persistLocally]);
  const train = (intensity: TrainingIntensity = 'balanced') => setSave(current => {
    const cost = intensity === 'high' ? 180 : intensity === 'recovery' ? 80 : 120;
    if (current.trainedThisWeek || current.balance < cost || (current.injuries ?? []).some(injury => injury.weeksRemaining > 0)) return current;
    const previousValue = trainingValue(current.player, current.trainingFocus);
    const result = applyTraining({ player: current.player, focus: current.trainingFocus, intensity, fatigue: current.career.fatigue, week: current.week, personalTrainer: current.personalTrainer || current.recoveryAssets?.includes('personalTrainer'), random: seededRandom(`training:${current.season}:${current.week}:${current.player.id}:${current.trainingFocus}:${intensity}`) });
    const currentValue = trainingValue(result.player, current.trainingFocus);
    const trainingSummary: TrainingSummary = { week: current.week, focus: current.trainingFocus, intensity, previousValue, currentValue, attributeGain: Math.round((currentValue - previousValue) * 10) / 10, fatigueChange: Math.round((result.fatigue - current.career.fatigue) * 10) / 10, ...(result.injury ? { injuryName: result.injury.name } : {}) };
    const priorPotential = current.player.potential ?? current.player.overall;
    const trainedPlayer: Player = { ...result.player, potential: Math.min(100, Math.max(result.player.overall, priorPotential)), initialPotential: current.player.initialPotential ?? priorPotential, potentialMomentum: current.player.potentialMomentum ?? 0, potentialTrend: Math.min(100, Math.max(result.player.overall, priorPotential)) > priorPotential ? 1 : current.player.potentialTrend ?? 0 };
    const marketValue = calculateMarketValue(trainedPlayer, current.career.matchHistory.map(entry => entry.rating), { appearances: current.career.appearances, totalMinutes: current.career.totalMinutes, goals: current.career.goals, assists: current.career.assists, contractYearsRemaining: remainingContractYears(trainedPlayer, current.season, current.week) });
    const injuryList = result.injury ? [...(current.injuries ?? []), result.injury] : current.injuries ?? [];
    return { ...current, player: { ...trainedPlayer, marketValue }, career: { ...current.career, fatigue: result.fatigue, marketValueHistory: recordMarketValuePoint(current.career.marketValueHistory, current.week, marketValue), overallHistory: [...(current.career.overallHistory ?? []), { week: current.week, value: result.player.overall }].slice(-30) }, injuries: injuryList, lastTraining: trainingSummary, trainedThisWeek: true, balance: current.balance - cost };
  });
  const reset = () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } setSave(freshSave()); };
  return { save, setSave, train, reset };
}
