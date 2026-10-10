import { describe, expect, it } from 'vitest';
import { emptyLeagueTable, leagueTeams, makeFixtures } from '../data/mockTeams';
import { simulateMatch } from './matchEngine';
import { seededRandom, settleRound, tableFromFixtures } from './season';

describe('season scheduling and settlement', () => {
  it('creates a double round robin: 10 rounds and home/away fixtures for every pair', () => {
    const fixtures = makeFixtures(leagueTeams);
    expect(fixtures).toHaveLength(30);
    expect(new Set(fixtures.map(f => f.week)).size).toBe(10);
    for (const team of leagueTeams) expect(fixtures.filter(f => f.homeTeamId === team.id || f.awayTeamId === team.id)).toHaveLength(10);
    for (let i = 0; i < leagueTeams.length; i++) for (let j = i + 1; j < leagueTeams.length; j++) {
      const pair = fixtures.filter(f => [f.homeTeamId, f.awayTeamId].includes(leagueTeams[i].id) && [f.homeTeamId, f.awayTeamId].includes(leagueTeams[j].id));
      expect(pair).toHaveLength(2); expect(pair[0].homeTeamId).not.toBe(pair[1].homeTeamId);
    }
  });
  it('returns identical match events for the same seeded stream', () => {
    const first = simulateMatch(leagueTeams[0], leagueTeams[1], { random: seededRandom('fixed-fixture'), matchId: 'fixed-fixture' });
    const second = simulateMatch(leagueTeams[0], leagueTeams[1], { random: seededRandom('fixed-fixture'), matchId: 'fixed-fixture' });
    expect(second).toEqual(first);
  });
  it('settles every match once and calculates points and goal difference from scores', () => {
    const week = 1; const round = makeFixtures(leagueTeams).filter(f => f.week === week);
    const userFixture = round[0]; const home = leagueTeams.find(t => t.id === userFixture.homeTeamId)!; const away = leagueTeams.find(t => t.id === userFixture.awayTeamId)!;
    const userResult = simulateMatch(home, away, { random: seededRandom(userFixture.id), matchId: userFixture.id });
    const settled = settleRound(makeFixtures(leagueTeams), week, userResult, fixture => simulateMatch(leagueTeams.find(t => t.id === fixture.homeTeamId)!, leagueTeams.find(t => t.id === fixture.awayTeamId)!, { random: seededRandom(fixture.id), matchId: fixture.id }));
    expect(settled.filter(f => f.week === week && f.result)).toHaveLength(round.length);
    const table = tableFromFixtures(leagueTeams, settled);
    expect(table.reduce((total, row) => total + row.played, 0)).toBe(round.length * 2);
    expect(table.reduce((total, row) => total + row.points, 0)).toBeGreaterThanOrEqual(round.length * 2);
    expect(emptyLeagueTable(leagueTeams).every(row => row.played === 0)).toBe(true);
    expect(settleRound(settled, week, userResult, () => { throw new Error('already played fixture was simulated twice'); })).toEqual(settled);
  });
});
