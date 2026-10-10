import type { MatchInstruction, MatchResult, PlayerMatchStats, Team, TeamMatchStats } from '../types';
import { seededRandom } from './season';
import { simulateMatch } from './matchEngine';

export interface MatchSnapshot { minute: number; homeScore: number; awayScore: number; events: MatchResult['events']; homeStats: TeamMatchStats; awayStats: TeamMatchStats; playerFatigue: Record<string, number>; playerStats: Record<string, PlayerMatchStats>; finished: boolean; }
export interface LiveMatchConfig { matchId: string; userTeamId: string; initialFatigue?: Record<string, number>; duration?: number; }
const emptyStats = (): TeamMatchStats => ({ shots: 0, shotsOnTarget: 0, possession: 0, yellowCards: 0, redCards: 0, passes: 0, passAccuracy: 0, tackles: 0 });
const blankPlayerStats = (): PlayerMatchStats => ({ minutes: 0, goals: 0, assists: 0, shots: 0, yellowCards: 0, redCards: 0, rating: 6 });
const clampRating = (value: number) => Math.round(Math.max(3, Math.min(10, value)) * 10) / 10;

/** Persistent deterministic match state; each call advances exactly one minute. */
export function createMatchSession(home: Team, away: Team, config: LiveMatchConfig) {
  const duration = Math.max(1, Math.min(150, config.duration ?? 90));
  let homeTeam = home; let awayTeam = away; let minute = 0; let homeScore = 0; let awayScore = 0;
  let homeStats = emptyStats(); let awayStats = emptyStats();
  let fatigue = { ...(config.initialFatigue ?? {}) };
  const events: MatchResult['events'] = [];
  let players: Record<string, PlayerMatchStats> = Object.fromEntries([...home.players, ...away.players].map(p => [p.id, blankPlayerStats()]));
  const sentOff = new Set<string>();
  let homeSubs = 0; let awaySubs = 0;

  const replaceLineup = (team: Team, outgoingId: string, incomingId?: string): Team => ({
    ...team,
    startingXI: [...team.startingXI.filter(id => id !== outgoingId), ...(incomingId ? [incomingId] : [])],
    substitutes: team.substitutes.filter(id => id !== incomingId),
  });
  const addEvents = (incoming: MatchResult['events']) => {
    for (const event of incoming) {
      if (event.type === 'substitution' && event.relatedPlayerId && event.playerId) {
        if (event.teamId === home.id) { homeTeam = replaceLineup(homeTeam, event.relatedPlayerId, event.playerId); homeSubs++; if (homeSubs >= 5) homeTeam = { ...homeTeam, substitutes: [] }; }
        else { awayTeam = replaceLineup(awayTeam, event.relatedPlayerId, event.playerId); awaySubs++; if (awaySubs >= 5) awayTeam = { ...awayTeam, substitutes: [] }; }
      }
      if (event.type === 'redCard' && event.playerId) {
        sentOff.add(event.playerId);
        if (event.teamId === home.id) homeTeam = replaceLineup(homeTeam, event.playerId);
        else awayTeam = replaceLineup(awayTeam, event.playerId);
      }
      if (event.type === 'goal') {
        if (event.teamId === home.id) homeScore++; else if (event.teamId === away.id) awayScore++;
        if (event.playerId) players[event.playerId] = { ...players[event.playerId], goals: players[event.playerId].goals + 1 };
        if (event.assistPlayerId) players[event.assistPlayerId] = { ...players[event.assistPlayerId], assists: players[event.assistPlayerId].assists + 1 };
      }
      if (event.type === 'yellowCard' && event.playerId) players[event.playerId] = { ...players[event.playerId], yellowCards: players[event.playerId].yellowCards + 1 };
      if (event.type === 'redCard' && event.playerId) players[event.playerId] = { ...players[event.playerId], redCards: players[event.playerId].redCards + 1 };
      events.push({ ...event, minute });
    }
  };
  const snapshot = (): MatchSnapshot => ({ minute, homeScore, awayScore, events: [...events], homeStats: { ...homeStats }, awayStats: { ...awayStats }, playerFatigue: { ...fatigue }, playerStats: { ...players }, finished: minute >= duration });
  const addTeamStats = (previous: TeamMatchStats, incoming: TeamMatchStats, elapsed: number): TeamMatchStats => {
    const oldPasses = previous.passes ?? 0; const newPasses = incoming.passes ?? 0;
    const completed = Math.round(oldPasses * (previous.passAccuracy ?? 0) / 100) + Math.round(newPasses * (incoming.passAccuracy ?? 0) / 100);
    const passes = oldPasses + newPasses;
    return { shots: previous.shots + incoming.shots, shotsOnTarget: previous.shotsOnTarget + incoming.shotsOnTarget,
      possession: Math.round((previous.possession * elapsed + incoming.possession) / (elapsed + 1)),
      yellowCards: previous.yellowCards + incoming.yellowCards, redCards: previous.redCards + incoming.redCards,
      passes, passAccuracy: passes ? Math.round(completed / passes * 100) : 0, tackles: (previous.tackles ?? 0) + (incoming.tackles ?? 0) };
  };
  return {
    step(instruction: MatchInstruction = 'balanced'): MatchSnapshot {
      if (minute >= duration) return snapshot();
      minute++;
      const one = simulateMatch(homeTeam, awayTeam, { duration: 1, minuteOffset: minute - 1, matchId: config.matchId,
        random: seededRandom(`${config.matchId}:minute:${minute}`), initialFatigue: fatigue, initialPlayerStats: players,
        sentOffPlayerIds: [...sentOff], instruction, instructionTeamId: config.userTeamId, maxSubstitutions: 5 });
      fatigue = { ...one.playerFatigue };
      addEvents(one.events);
      homeStats = addTeamStats(homeStats, one.stats[home.id] ?? emptyStats(), minute - 1);
      awayStats = addTeamStats(awayStats, one.stats[away.id] ?? emptyStats(), minute - 1);
      for (const [id, stat] of Object.entries(one.playerStats ?? {})) {
        const previous = players[id] ?? blankPlayerStats();
        players[id] = { ...previous, minutes: Math.max(previous.minutes, stat.minutes), shots: stat.shots, rating: stat.rating };
      }
      return snapshot();
    },
    snapshot,
    result(): MatchResult {
      const finalPlayers = Object.fromEntries(Object.entries(players).map(([id, p]) => [id, { ...p, rating: clampRating(6 + p.goals * 1.15 + p.assists * 0.7 + p.shots * 0.1 - p.yellowCards * 0.4 - p.redCards * 2 + (homeScore > awayScore && home.players.some(x => x.id === id) ? 0.25 : 0)) }]));
      return { matchId: config.matchId, homeTeamId: home.id, awayTeamId: away.id, homeScore, awayScore, events: [...events], stats: { [home.id]: { ...homeStats }, [away.id]: { ...awayStats } }, playerFatigue: { ...fatigue }, playerStats: finalPlayers };
    },
  };
}
