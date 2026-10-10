import { describe, expect, it } from 'vitest';
import { applyAcademyChoice } from './academyDevelopment';
import { createPlayer, DEFAULT_CREATION } from '../player-creation/playerCreation';
import { playerClub } from '../data/mockTeams';
import { academyEntryPlayerSlot } from './academyDevelopment';

const player = createPlayer({ ...DEFAULT_CREATION, name: 'Alex Example', nationality: 'Portugal', birthCountry: 'Portugal', birthRegion: 'Aveiro', birthCity: 'Feira' }, 'academy-test').player;

describe('academy chapter choices', () => {
  it('applies visible, bounded and balanced effects in persistent player fields', () => {
    const first = applyAcademyChoice(player, [], 1, 'first-touch');
    expect(first.player.attributes.technical.ballControl).toBe(player.attributes.technical.ballControl + 2);
    expect(first.player.attributes.physical.stamina).toBe(player.attributes.physical.stamina - 1);
    expect(first.player.coachRelationship).toBe(player.coachRelationship! + 2);
    const second = applyAcademyChoice(first.player, first.development.choices, 2, 'video-review');
    expect(second.player.potential).toBe(player.potential! + 1);
    expect(second.player.attributes.mental.decisions).toBe(player.attributes.mental.decisions + 2);
    const final = applyAcademyChoice(second.player, second.development.choices, 3, 'first-team-route');
    expect(final.development.completed).toBe(true);
    expect(final.development.route).toBe('first-team');
    expect(final.development.promisedMinutes).toBe(180);
    expect(final.player.potential).toBe(player.potential! + 3);
  });

  it('turns the final academy route into a different initial squad role', () => {
    const starter = academyEntryPlayerSlot(playerClub, 'CM', 'first-team');
    const reserve = academyEntryPlayerSlot(playerClub, 'CM', 'reserve');
    expect(starter?.id).toBe('smf-7');
    expect(reserve?.id).toBe('smf-12');
    expect(playerClub.startingXI).toContain(starter?.id);
    expect(playerClub.substitutes).toContain(reserve?.id);
  });

  it('rejects out-of-order or invalid repeated choices', () => {
    expect(() => applyAcademyChoice(player, [], 2, 'video-review')).toThrow();
    const first = applyAcademyChoice(player, [], 1, 'speed-circuit');
    expect(() => applyAcademyChoice(first.player, first.development.choices, 2, 'speed-circuit')).toThrow();
  });

  it('clamps development attributes and morale/potential to valid bounds', () => {
    const high = { ...player, potential: 100, morale: 100, coachRelationship: 100, attributes: { ...player.attributes, technical: { ...player.attributes.technical, ballControl: 100 } } };
    const result = applyAcademyChoice(high, [], 1, 'first-touch');
    expect(result.player.attributes.technical.ballControl).toBe(100);
    expect(result.player.potential).toBe(100);
    expect(result.player.coachRelationship).toBe(100);
  });
});
