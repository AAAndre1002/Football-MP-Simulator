import { describe, expect, it } from 'vitest';
import { developPotential } from './potentialDevelopment';

const promisingWeek = () => developPotential({
  currentPotential: 75,
  overall: 60,
  age: 18,
  trainedThisWeek: true,
  recentMatches: [{ rating: 7.6, minutes: 90 }, { rating: 7.4, minutes: 80 }],
  morale: 90,
  coachRelationship: 90,
});

describe('dynamic potential', () => {
  it('rises gradually after sustained development, training and strong match performances', () => {
    let state = { potential: 75, momentum: 0, change: 0 as -1 | 0 | 1 };
    for (let week = 0; week < 9; week++) {
      const next = developPotential({ currentPotential: state.potential, overall: 60, age: 18, momentum: state.momentum, trainedThisWeek: true, recentMatches: [{ rating: 7.6, minutes: 90 }, { rating: 7.4, minutes: 80 }], morale: 90, coachRelationship: 90 });
      expect(Math.abs(next.potential - state.potential)).toBeLessThanOrEqual(1);
      state = next;
    }
    expect(state.potential).toBeGreaterThan(75);
  });

  it('falls gradually after sustained poor form, limited minutes and weak relationships', () => {
    let state = { potential: 75, momentum: 0, change: 0 as -1 | 0 | 1 };
    for (let week = 0; week < 9; week++) {
      const next = developPotential({ currentPotential: state.potential, overall: 60, age: 35, momentum: state.momentum, trainedThisWeek: false, recentMatches: [{ rating: 5, minutes: 10 }, { rating: 5.2, minutes: 10 }], morale: 20, coachRelationship: 20 });
      expect(Math.abs(next.potential - state.potential)).toBeLessThanOrEqual(1);
      state = next;
    }
    expect(state.potential).toBeLessThan(75);
  });

  it('stays stable when applicable signals are neutral', () => {
    const stable = developPotential({ currentPotential: 75, overall: 60, age: 26, momentum: 0, trainedThisWeek: false, recentMatches: [], morale: 60, coachRelationship: 60 });
    expect(stable).toEqual({ potential: 75, momentum: 0, change: 0 });
  });

  it('clamps potential between current overall and 100 and never makes a multi-point weekly jump', () => {
    const maxed = developPotential({ currentPotential: 100, overall: 70, momentum: 4, age: 18, trainedThisWeek: true, recentMatches: [], morale: 100, coachRelationship: 100 });
    expect(maxed.potential).toBe(100);
    const belowOverall = developPotential({ currentPotential: 1, overall: 70, momentum: -4, age: 40, trainedThisWeek: false, recentMatches: [{ rating: 1, minutes: 90 }, { rating: 1, minutes: 90 }], morale: 0, coachRelationship: 0 });
    expect(belowOverall.potential).toBe(70);
    expect(Math.abs(belowOverall.potential - 70)).toBeLessThanOrEqual(1);
    expect(promisingWeek().potential - 75).toBeLessThanOrEqual(1);
  });
});
