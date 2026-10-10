import { useEffect, useState } from 'react';
import type { CareerStats, Fixture, GameSave, MatchEvent, MatchResult, Player, PlayerAttributes, SponsorOffer, TacticalStyle, TrainingFocus, TransferOffer } from '../types';
import { emptyLeagueTable, leagueTeams, makeFixtures, playerCharacter, playerClub } from '../data/mockTeams';
import { tableFromFixtures } from '../engine/season';

const STORAGE_KEY = 'football-mp-simulator-save-v1';
const clamp = (n: unknown, min: number, max: number, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
const allowedTactics: TacticalStyle[] = ['balanced', 'possession', 'counterAttack', 'highPress'];
const allFocuses: TrainingFocus[] = ['passing', 'shooting', 'dribbling', 'tackling', 'vision', 'ballControl', 'pace', 'acceleration', 'stamina', 'strength', 'agility', 'decisions', 'positioning', 'teamwork', 'composure', 'leadership'];
function attributesFrom(input?: PlayerAttributes): PlayerAttributes {
  const def = playerCharacter.attributes; const a = input && typeof input === 'object' ? input : def;
  const group = <K extends keyof PlayerAttributes>(key: K): PlayerAttributes[K] => {
    const src = (a[key] ?? def[key]) as Record<string, unknown>; const base = def[key] as unknown as Record<string, number>;
    return Object.fromEntries(Object.keys(base).map(name => [name, clamp(src[name], 1, 99, base[name])])) as PlayerAttributes[K];
  };
  return { physical: group('physical'), technical: group('technical'), mental: group('mental'), ...(a.goalkeeping || def.goalkeeping ? { goalkeeping: group('goalkeeping') } : {}) };
}
function defaultCareer(): CareerStats { return { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratingTotal: 0, matchHistory: [], fatigue: 0 }; }
function freshSave(): GameSave {
  const player: Player = { ...playerCharacter, id: 'smf-11', contract: { id: 'contract-1', playerId: 'smf-11', teamId: playerClub.id, startDate: '2026-07-01', endDate: '2027-06-30', weeklyWage: 1250, releaseClause: 1400000 } };
  return { version: 2, player, clubId: playerClub.id, balance: 12500, week: 1, season: 1, trainingFocus: 'shooting', tacticalStyle: 'balanced', trainedThisWeek: false, matchPlayedThisWeek: false, playedMatches: 0, agentHired: false, fixtures: makeFixtures(leagueTeams), leagueTable: emptyLeagueTable(leagueTeams), career: defaultCareer(), transferOffers: [], sponsorships: [], offersGeneratedWeek: 0, sponsorOffersGeneratedWeek: 0, contractActionSeason: 0 };
}
function safeResult(value: unknown, homeTeamId: string, awayTeamId: string, id: string): MatchResult | undefined {
  if (!value || typeof value !== 'object') return;
  const raw = value as Partial<MatchResult>;
  if (raw.homeTeamId !== homeTeamId || raw.awayTeamId !== awayTeamId || !Array.isArray(raw.events)) return;
  const eventTypes = ['chance', 'goal', 'yellowCard', 'redCard', 'substitution'];
  const events = raw.events.filter((item): item is MatchEvent => {
    if (!item || typeof item !== 'object') return false;
    const event = item as MatchEvent;
    return eventTypes.includes(event.type) && Number.isFinite(event.minute) && (event.teamId === homeTeamId || event.teamId === awayTeamId);
  }).slice(0, 500).map(e => ({ minute: clamp(e.minute, 0, 150, 0), type: e.type, teamId: e.teamId, description: typeof e.description === 'string' ? e.description.slice(0, 300) : '',
    ...(typeof e.playerId === 'string' ? { playerId: e.playerId.slice(0, 100) } : {}), ...(typeof e.playerName === 'string' ? { playerName: e.playerName.slice(0, 100) } : {}),
    ...(typeof e.relatedPlayerId === 'string' ? { relatedPlayerId: e.relatedPlayerId.slice(0, 100) } : {}), ...(typeof e.relatedPlayerName === 'string' ? { relatedPlayerName: e.relatedPlayerName.slice(0, 100) } : {}),
    ...(typeof e.assistPlayerId === 'string' ? { assistPlayerId: e.assistPlayerId.slice(0, 100) } : {}), ...(typeof e.assistPlayerName === 'string' ? { assistPlayerName: e.assistPlayerName.slice(0, 100) } : {}) }));
  const stat = (teamId: string) => { const s = raw.stats?.[teamId]; return { shots: clamp(s?.shots, 0, 100, 0), shotsOnTarget: clamp(s?.shotsOnTarget, 0, 100, 0), possession: clamp(s?.possession, 0, 100, 0), yellowCards: clamp(s?.yellowCards, 0, 20, 0), redCards: clamp(s?.redCards, 0, 20, 0) }; };
  return { matchId: id, homeTeamId, awayTeamId, homeScore: clamp(raw.homeScore, 0, 20, 0), awayScore: clamp(raw.awayScore, 0, 20, 0), events,
    stats: { [homeTeamId]: stat(homeTeamId), [awayTeamId]: stat(awayTeamId) }, playerFatigue: Object.fromEntries(Object.entries(raw.playerFatigue ?? {}).slice(0, 40).map(([key, n]) => [key.slice(0, 100), clamp(n, 0, 100, 0)])) };
}
function normalizeSave(value: unknown): GameSave {
  const base = freshSave();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<GameSave> & { player?: Partial<Player>; career?: Partial<CareerStats> };
  const playerData = raw.player && typeof raw.player === 'object' ? raw.player : base.player;
  const player: Player = { ...base.player, ...playerData, id: typeof playerData.id === 'string' ? playerData.id.slice(0, 80) : base.player.id,
    name: typeof playerData.name === 'string' ? playerData.name.slice(0, 80) : base.player.name,
    age: clamp(playerData.age, 16, 45, base.player.age), overall: clamp(playerData.overall, 1, 99, base.player.overall), marketValue: clamp(playerData.marketValue, 0, 999_999_999, base.player.marketValue ?? 0),
    attributes: attributesFrom(playerData.attributes), morale: clamp(playerData.morale, 0, 100, 70), coachRelationship: clamp(playerData.coachRelationship, 0, 100, 65), fanRelationship: clamp(playerData.fanRelationship, 0, 100, 60), mediaReputation: clamp(playerData.mediaReputation, 0, 100, 55),
    contract: playerData.contract ? { ...base.player.contract!, ...playerData.contract, teamId: typeof playerData.contract.teamId === 'string' ? playerData.contract.teamId : base.player.contract!.teamId,
      weeklyWage: clamp(playerData.contract.weeklyWage, 0, 1_000_000, 1250), releaseClause: clamp(playerData.contract.releaseClause, 0, 999_999_999, 1_400_000) } : base.player.contract };
  const season = clamp(raw.season, 1, 999, 1);
  const scheduled = makeFixtures(leagueTeams, season);
  const storedFixtures = Array.isArray(raw.fixtures) ? raw.fixtures : [];
  const fixtureList: Fixture[] = scheduled.map(f => {
    const old = storedFixtures.find(item => item && item.id === f.id);
    const result = old ? safeResult(old.result, f.homeTeamId, f.awayTeamId, f.id) : undefined;
    return result ? { ...f, result } : f;
  });
  const history = Array.isArray(raw.career?.matchHistory) ? raw.career!.matchHistory!.slice(-60).filter(item => item && Number.isFinite(item.rating) && typeof item.opponent === 'string').map(item => ({ week: clamp(item.week, 1, 10, 1), opponent: item.opponent.slice(0, 100), score: typeof item.score === 'string' ? item.score.slice(0, 20) : '0–0', rating: clamp(item.rating, 0, 10, 6), goals: clamp(item.goals, 0, 20, 0), assists: clamp(item.assists, 0, 20, 0), yellowCards: clamp(item.yellowCards, 0, 10, 0), redCards: clamp(item.redCards, 0, 5, 0) })) : [];
  const career: CareerStats = { appearances: clamp(raw.career?.appearances, 0, 10000, clamp(raw.playedMatches, 0, 10000, 0)), goals: clamp(raw.career?.goals, 0, 10000, 0), assists: clamp(raw.career?.assists, 0, 10000, 0), yellowCards: clamp(raw.career?.yellowCards, 0, 10000, 0), redCards: clamp(raw.career?.redCards, 0, 10000, 0), ratingTotal: clamp(raw.career?.ratingTotal, 0, 1_000_000, 0), matchHistory: history, fatigue: clamp(raw.career?.fatigue, 0, 100, 0) };
  const sponsors = Array.isArray(raw.sponsorships) ? raw.sponsorships.slice(0, 20).filter(s => s && typeof s.id === 'string').map(s => ({ ...s, brand: typeof s.brand === 'string' ? s.brand.slice(0, 100) : 'Marca', weeklyIncome: clamp(s.weeklyIncome, 0, 1_000_000, 0), durationWeeks: clamp(s.durationWeeks, 1, 52, 1), weeksRemaining: clamp(s.weeksRemaining, 0, 52, 0), status: ['pending','active','declined','expired'].includes(s.status) ? s.status : 'expired' })) : [];
  const offers = Array.isArray(raw.transferOffers) ? raw.transferOffers.slice(0, 20).filter(o => o && typeof o.id === 'string').map(o => ({ ...o, playerId: player.id, clubId: leagueTeams.some(t => t.id === o.clubId) ? o.clubId : playerClub.id, fee: clamp(o.fee, 0, 999_999_999, 0), joiningBonus: clamp(o.joiningBonus, 0, 999_999_999, 0), weeklyWage: clamp(o.weeklyWage, 0, 1_000_000, 0), contractYears: clamp(o.contractYears, 1, 5, 2), status: ['pending','accepted','rejected','countered'].includes(o.status) ? o.status : 'rejected' })) : [];
  const fixtures = fixtureList;
  const lastMatch = raw.lastMatch ? safeResult(raw.lastMatch, raw.lastMatch.homeTeamId, raw.lastMatch.awayTeamId, raw.lastMatch.matchId) : undefined;
  return { ...base, ...raw, version: 2, player, lastMatch, clubId: leagueTeams.some(t => t.id === raw.clubId) ? raw.clubId! : base.clubId,
    balance: clamp(raw.balance, 0, 999_999_999, base.balance), week: clamp(raw.week, 1, 10, 1), season: clamp(raw.season, 1, 999, 1),
    trainingFocus: allFocuses.includes(raw.trainingFocus as TrainingFocus) ? raw.trainingFocus! : base.trainingFocus,
    tacticalStyle: allowedTactics.includes(raw.tacticalStyle as TacticalStyle) ? raw.tacticalStyle! : base.tacticalStyle,
    trainedThisWeek: raw.trainedThisWeek === true, matchPlayedThisWeek: raw.matchPlayedThisWeek === true && fixtures.some(f => f.week === clamp(raw.week, 1, 10, 1) && !!f.result),
    playedMatches: clamp(raw.playedMatches, 0, 10000, 0), agentHired: raw.agentHired === true, fixtures,
    leagueTable: tableFromFixtures(leagueTeams, fixtures), career, transferOffers: offers as TransferOffer[], sponsorships: sponsors as SponsorOffer[],
    offersGeneratedWeek: clamp(raw.offersGeneratedWeek, 0, 10000, 0), sponsorOffersGeneratedWeek: clamp(raw.sponsorOffersGeneratedWeek, 0, 10000, 0), contractActionSeason: clamp(raw.contractActionSeason, 0, 999, 0) };
}
const technicalFocus: (keyof PlayerAttributes['technical'])[] = ['passing', 'shooting', 'dribbling', 'tackling', 'vision', 'ballControl'];
const physicalFocus: (keyof PlayerAttributes['physical'])[] = ['pace', 'acceleration', 'stamina', 'strength', 'agility'];
function improveAttribute(attributes: PlayerAttributes, focus: TrainingFocus): PlayerAttributes {
  if (technicalFocus.includes(focus as keyof PlayerAttributes['technical'])) { const key = focus as keyof PlayerAttributes['technical']; return { ...attributes, technical: { ...attributes.technical, [key]: Math.min(99, attributes.technical[key] + 1) } }; }
  if (physicalFocus.includes(focus as keyof PlayerAttributes['physical'])) { const key = focus as keyof PlayerAttributes['physical']; return { ...attributes, physical: { ...attributes.physical, [key]: Math.min(99, attributes.physical[key] + 1) } }; }
  const key = focus as keyof PlayerAttributes['mental']; return { ...attributes, mental: { ...attributes.mental, [key]: Math.min(99, attributes.mental[key] + 1) } };
}
export function useGameState() {
  const [save, setSave] = useState<GameSave>(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); return stored ? normalizeSave(JSON.parse(stored)) : freshSave(); } catch { return freshSave(); }
  });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* private browsing may deny storage */ } }, [save]);
  const train = () => setSave(current => {
    if (current.trainedThisWeek || current.balance < 120) return current;
    const attributes = improveAttribute(current.player.attributes, current.trainingFocus);
    return { ...current, player: { ...current.player, attributes, overall: Math.min(99, current.player.overall + (current.player.overall < 90 ? 0.15 : 0)) }, trainedThisWeek: true, balance: current.balance - 120 };
  });
  const reset = () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } setSave(freshSave()); };
  return { save, setSave, train, reset };
}
