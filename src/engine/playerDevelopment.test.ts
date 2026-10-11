import { describe, expect, it } from 'vitest';
import { leagueTeams } from '../data/mockTeams';
import { applyTraining } from './playerDevelopment';

describe('player training development', () => {
  const sourcePlayer = leagueTeams[0].players[0];
  const player = {
    ...sourcePlayer,
    id: 'training-test-player',
    age: 20,
    attributes: {
      ...sourcePlayer.attributes,
      technical: { ...sourcePlayer.attributes.technical, shooting: 52 },
    },
  };
  const deterministicRandom = () => {
    let calls = 0;
    return () => (++calls === 1 ? 0.5 : 0.99);
  };

  it('improves the selected attribute while leaving other attributes unchanged', () => {
    const result = applyTraining({ player, focus: 'shooting', fatigue: 25, week: 1, intensity: 'balanced', random: deterministicRandom() });
    expect(result.player.attributes.technical.shooting).toBeGreaterThan(52);
    expect(result.player.attributes.technical.passing).toBe(player.attributes.technical.passing);
    expect(result.attributeGain).toBeGreaterThan(0);
  });

  it('gives higher intensity more gain than recovery for identical player and randomness', () => {
    const high = applyTraining({ player, focus: 'shooting', fatigue: 25, week: 1, intensity: 'high', random: deterministicRandom() });
    const recovery = applyTraining({ player, focus: 'shooting', fatigue: 25, week: 1, intensity: 'recovery', random: deterministicRandom() });
    expect(high.attributeGain).toBeGreaterThan(recovery.attributeGain);
    expect(high.fatigue).toBeGreaterThan(recovery.fatigue);
  });
});
