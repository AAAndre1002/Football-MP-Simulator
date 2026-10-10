import { describe, expect, it } from 'vitest';
import { canAdvanceWeek, nextSeasonWeek, weekProgressionBlock, type WeekProgressionState } from './weekProgression';

const readyForWeekEnd: WeekProgressionState = { matchPlayedThisWeek: true, trainedThisWeek: true, balance: 900, pendingPress: undefined, injuries: [] };

describe('week-by-week progression gate', () => {
  it('does not allow a week to advance before the match', () => {
    expect(weekProgressionBlock({ ...readyForWeekEnd, matchPlayedThisWeek: false })).toBe('match');
  });
  it('requires an answer to the post-match press conference', () => {
    expect(weekProgressionBlock({ ...readyForWeekEnd, pendingPress: { week: 1 } })).toBe('press');
  });
  it('requires the available weekly training to be completed', () => {
    expect(weekProgressionBlock({ ...readyForWeekEnd, trainedThisWeek: false })).toBe('training');
  });
  it('allows the week to close without training when injury or insufficient funds makes training unavailable', () => {
    expect(canAdvanceWeek({ ...readyForWeekEnd, trainedThisWeek: false, injuries: [{ weeksRemaining: 2 }] })).toBe(true);
    expect(canAdvanceWeek({ ...readyForWeekEnd, trainedThisWeek: false, balance: 79 })).toBe(true);
  });
  it('allows advancement only when all available week actions are resolved', () => {
    expect(canAdvanceWeek(readyForWeekEnd)).toBe(true);
    expect(canAdvanceWeek({ ...readyForWeekEnd, pendingPress: { week: 1 } })).toBe(false);
  });
  it('moves one week at a time and starts a fresh season after the final round', () => {
    expect(nextSeasonWeek(1, 1)).toEqual({ week: 2, season: 1, newSeason: false });
    expect(nextSeasonWeek(2, 1)).toEqual({ week: 3, season: 1, newSeason: false });
    expect(nextSeasonWeek(10, 1)).toEqual({ week: 1, season: 2, newSeason: true });
  });
});
