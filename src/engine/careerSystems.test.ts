import { describe, expect, it } from 'vitest';
import { leagueTeams, playerCharacter } from '../data/mockTeams';
import { seededRandom } from './season';
import { simulateMatch } from './matchEngine';
import { createMatchSession } from './matchSession';
import { applyTraining, recoverFatigue, recoverInjuries, calculateMarketValue, explainMarketValue, recordMarketValuePoint, remainingContractYears } from './playerDevelopment';
import { counterOffer, evaluateOffer, generateTransferOffers } from './transferMarket';
import { answerPressConference, pressChoices, pressHeadline } from './pressConference';
import type { PendingPress } from '../types';
const [home, away] = leagueTeams;

describe('career simulation systems', () => {
  it('produces deterministic match results for the same match id', () => {
    const a = simulateMatch(home, away, { matchId: 'fixed-1' });
    const b = simulateMatch(home, away, { matchId: 'fixed-1' });
    expect(a).toEqual(b);
  });
  it('runs a persistent, deterministic minute-by-minute session and returns final stats', () => {
    const run = () => { const session = createMatchSession(home, away, { matchId: 'live-1', userTeamId: home.id, duration: 30 }); for (let i = 0; i < 30; i++) session.step(i < 15 ? 'throughBall' : 'pressHigh'); return session.result(); };
    expect(run()).toEqual(run());
    expect(run().stats[home.id].passes).toBeGreaterThan(0);
    expect(run().playerStats?.[home.players[10].id]?.minutes).toBe(30);
  });
  it('applies instruction-driven fatigue and attack changes rather than cosmetic choices', () => {
    const player = playerCharacter.id;
    const calm = simulateMatch(home, away, { matchId: 'tactic', duration: 40, instruction: 'keepPossession', instructionTeamId: home.id });
    const press = simulateMatch(home, away, { matchId: 'tactic', duration: 40, instruction: 'pressHigh', instructionTeamId: home.id });
    expect(press.playerFatigue[player]).toBeGreaterThan(calm.playerFatigue[player]);
    expect(press.stats[home.id]).not.toEqual(calm.stats[home.id]);
  });
  it('training improves the selected attribute, fatigue recovery and injury recovery work', () => {
    const result = applyTraining({ player: playerCharacter, focus: 'shooting', intensity: 'balanced', fatigue: 0, week: 2, random: () => 0.7 });
    expect(result.player.attributes.technical.shooting).toBeGreaterThan(playerCharacter.attributes.technical.shooting);
    expect(recoverFatigue(80, ['recoveryBoots'])).toBeLessThan(recoverFatigue(80));
    expect(recoverInjuries([{ id: 'i', name: 'Distensão', severity: 'moderate', weeksRemaining: 2, occurredWeek: 1 }])[0].weeksRemaining).toBe(1);
  });
  it('values players by form and generates reproducible, evaluable offers', () => {
    const player = { ...playerCharacter, mediaReputation: 75 };
    expect(calculateMarketValue(player, [8, 8, 8])).toBeGreaterThan(calculateMarketValue(player, [4, 4, 4]));
    const make = () => generateTransferOffers({ player, currentClubId: home.id, clubs: leagueTeams, season: 1, week: 2, agentHired: true, recentRatings: [8, 7, 8], random: seededRandom('offers') });
    expect(make()).toEqual(make());
    const offer = make()[0];
    if (offer) { expect(['accept','negotiate','reject']).toContain(evaluateOffer(offer, player).recommendation); expect(counterOffer(offer, player, true).weeklyWage).toBeGreaterThanOrEqual(offer.weeklyWage); }
  });
  it('market value transparently reacts to potential, minutes, contributions and contract length', () => {
    const base = { ...playerCharacter, age: 20, overall: 65, potential: 86, mediaReputation: 50, contract: { id: 'c', playerId: 'p', teamId: 't', startDate: '2026-07-01', endDate: '2029-06-30', weeklyWage: 500, releaseClause: 100000 } };
    const context = { appearances: 20, totalMinutes: 1800, goals: 8, assists: 6, contractYearsRemaining: 3 };
    const strong = explainMarketValue(base, [8, 8, 8, 8, 8], context);
    expect(strong.estimatedValue).toBeGreaterThan(explainMarketValue(base, [5, 5, 5], { ...context, goals: 0, assists: 0, totalMinutes: 500, contractYearsRemaining: 0 }).estimatedValue);
    expect(strong.potentialFactor).toBeGreaterThan(1);
    expect(strong.minutesFactor).toBe(1);
    expect(calculateMarketValue(base, [8], context)).toBe(strong.estimatedValue);
    expect(explainMarketValue(base, [], { appearances: 0 }).estimatedValue).toBeGreaterThanOrEqual(10_000);
  });

  it('uses deterministic simulated contract dates rather than the computer clock', () => {
    const player = { ...playerCharacter, contract: { id: 'c', playerId: 'p', teamId: 't', startDate: '2026-07-01', endDate: '2027-06-30', weeklyWage: 500, releaseClause: 100000 } };
    expect(remainingContractYears(player, 1, 1)).toBeGreaterThan(0.99);
    expect(remainingContractYears(player, 1, 10)).toBeLessThan(0.3);
    expect(remainingContractYears(player, 2, 1)).toBe(0);
  });

  it('replaces the same-week market-history point and caps stored history', () => {
    expect(recordMarketValuePoint([{ week: 1, value: 100 }, { week: 2, value: 200 }], 2, 250)).toEqual([{ week: 1, value: 100 }, { week: 2, value: 250 }]);
    expect(recordMarketValuePoint(undefined, 1, 10)).toEqual([{ week: 1, value: 10 }]);
    expect(recordMarketValuePoint(Array.from({ length: 30 }, (_, i) => ({ week: i + 1, value: i })), 31, 31)).toHaveLength(30);
  });

  it('press conference answers change relationships and create a headline', () => {
    const press: PendingPress = { id: 'press', week: 1, opponent: away.name, score: '2–1', outcome: 'win', rating: 8 };
    const teamFirst = answerPressConference(playerCharacter, press, 'team_first');
    const confident = answerPressConference(playerCharacter, press, 'confident');
    expect(teamFirst.coachRelationship).toBeGreaterThan(playerCharacter.coachRelationship ?? 0);
    expect(confident.mediaReputation).toBeGreaterThan(playerCharacter.mediaReputation ?? 0);
    expect(pressHeadline(pressChoices[0].id, press.outcome, playerCharacter.name)).toContain(playerCharacter.name);
  });
});
