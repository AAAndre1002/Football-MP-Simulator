import type { Fixture, LeagueRow, MatchResult, Team } from '../types';

export function seededRandom(seedText: string): () => number {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
  return () => { seed += 0x6D2B79F5; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function tableFromFixtures(teams: Team[], fixtures: Fixture[]): LeagueRow[] {
  const rows = new Map(teams.map(team => [team.id, { teamId: team.id, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }]));
  fixtures.forEach(fixture => {
    const result = fixture.result; if (!result) return;
    const home = rows.get(fixture.homeTeamId), away = rows.get(fixture.awayTeamId); if (!home || !away) return;
    home.played++; away.played++; home.goalsFor += result.homeScore; home.goalsAgainst += result.awayScore;
    away.goalsFor += result.awayScore; away.goalsAgainst += result.homeScore;
    if (result.homeScore > result.awayScore) { home.wins++; away.losses++; home.points += 3; }
    else if (result.homeScore < result.awayScore) { away.wins++; home.losses++; away.points += 3; }
    else { home.draws++; away.draws++; home.points++; away.points++; }
  });
  return [...rows.values()].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.teamId.localeCompare(b.teamId));
}
export function settleRound(fixtures: Fixture[], week: number, userResult: MatchResult, simulate: (fixture: Fixture) => MatchResult): Fixture[] {
  return fixtures.map(fixture => {
    if (fixture.week !== week || fixture.result) return fixture;
    if (userResult.homeTeamId === fixture.homeTeamId && userResult.awayTeamId === fixture.awayTeamId) return { ...fixture, result: { ...userResult, matchId: fixture.id } };
    return { ...fixture, result: simulate(fixture) };
  });
}
export function goalDiff(row: LeagueRow) { return row.goalsFor - row.goalsAgainst; }
