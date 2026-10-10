import { describe, expect, it } from 'vitest';
import {
  ALL_FLAT_ATTRIBUTES, CAREER_SEASON, DEFAULT_CREATION, POSITION_DEFINITIONS, STARTING_AGE,
  calculateOverall, calculatePotential, compatibleSecondaryPositions, createPlayer, profileForRole,
  rolesForPosition, validateCreation, type PlayerCreationInput,
} from './playerCreation';

function validInput(overrides: Partial<PlayerCreationInput> = {}): PlayerCreationInput {
  return {
    ...DEFAULT_CREATION,
    name: 'Jogador Teste', nationality: 'Portugal', birthCountry: 'Portugal', birthRegion: 'Aveiro', birthCity: 'Feira',
    ...overrides,
    appearance: { ...DEFAULT_CREATION.appearance, ...overrides.appearance },
    attributes: { ...DEFAULT_CREATION.attributes, ...overrides.attributes },
  };
}

describe('position and role compatibility', () => {
  it('restricts goalkeepers to the goal and offers only goalkeeper role families', () => {
    expect(compatibleSecondaryPositions('GK')).toEqual([]);
    expect(rolesForPosition('GK').length).toBeGreaterThan(0);
    expect(validateCreation(validInput({ primaryPosition: 'GK', roleId: 'false-nine' }))).toContain('A função tem de ser compatível com a posição principal.');
  });
  it('allows central defenders compatible fullback and defensive-midfield options', () => {
    expect(compatibleSecondaryPositions('CB')).toEqual(expect.arrayContaining(['LB','RB','CDM']));
  });
  it('limits left and right fullback options to same-side wide positions and centre-back', () => {
    expect(compatibleSecondaryPositions('LB')).toEqual(['LM','LW','CB']);
    expect(compatibleSecondaryPositions('RB')).toEqual(['RM','RW','CB']);
  });
  it('allows a striker CAM/wide-forward cover, but never defensive midfield', () => {
    expect(compatibleSecondaryPositions('ST')).toEqual(['CAM','LW','RW']);
    expect(validateCreation(validInput({ primaryPosition: 'ST', roleId: 'poacher', secondaryPositions: ['CDM'] })).length).toBeGreaterThan(0);
  });
  it('limits and rejects duplicate, primary-as-secondary, or incompatible choices', () => {
    expect(validateCreation(validInput({ primaryPosition: 'CM', roleId: 'box-to-box', secondaryPositions: ['CM','CDM','CAM'] })).length).toBeGreaterThan(0);
    expect(validateCreation(validInput({ primaryPosition: 'CM', roleId: 'box-to-box', secondaryPositions: ['CDM','CDM'] })).length).toBeGreaterThan(0);
  });
});

describe('attribute profiles, bounds and derived ratings', () => {
  it('provides templates for every supported position and matching role', () => {
    for (const item of POSITION_DEFINITIONS) {
      for (const definition of item.roles) {
        const profile = profileForRole(item.position, definition.id);
        expect(ALL_FLAT_ATTRIBUTES.every(key => Number.isInteger(profile[key]) && profile[key] >= 0 && profile[key] <= 100)).toBe(true);
      }
    }
  });
  it('produces position/function-specific profiles and role-weighted overall', () => {
    const cb = profileForRole('CB', 'stopper');
    const cm = profileForRole('CM', 'playmaker');
    const falseNine = profileForRole('ST', 'false-nine');
    expect(cb.tackling).toBeGreaterThan(cm.tackling);
    expect(cm.vision).toBeGreaterThan(profileForRole('CM', 'holding-midfielder').vision);
    expect(falseNine.vision).toBeGreaterThan(profileForRole('ST', 'poacher').vision);
    expect(calculateOverall(cb, 'CB', 'stopper')).not.toBe(calculateOverall(cm, 'CM', 'playmaker'));
    expect(calculatePotential(70, 'false-nine', 'ST')).toBeGreaterThan(calculateOverall(profileForRole('ST','false-nine'), 'ST', 'false-nine'));
  });
  it('rejects non-integer and out-of-range attribute values rather than silently accepting them', () => {
    const invalid = validInput({ attributes: { ...DEFAULT_CREATION.attributes, pace: 101 } });
    expect(validateCreation(invalid)).toContain('Todos os atributos têm de ser números inteiros entre 0 e 100.');
    expect(() => createPlayer(invalid)).toThrow();
    expect(validateCreation(validInput({ attributes: { ...DEFAULT_CREATION.attributes, passing: 3.4 } })).length).toBeGreaterThan(0);
  });
  it('clamps a derived profile to the supported inclusive range 0–100', () => {
    const profile = profileForRole('CB', 'stopper');
    expect(Math.min(...Object.values(profile))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...Object.values(profile))).toBeLessThanOrEqual(100);
  });
});

describe('new career defaults', () => {
  it('always creates the player at 16 in the 2026/27 season', () => {
    const created = createPlayer(validInput(), 'test-player');
    expect(created.player.age).toBe(STARTING_AGE);
    expect(created.season).toBe(CAREER_SEASON);
    expect(created.player.position).toBe('CM');
    expect(created.player.potential).toBeGreaterThanOrEqual(created.player.overall);
  });
  it('keeps appearance, physical details, dominant foot and birthplace on the created player', () => {
    const created = createPlayer(validInput({ preferredFoot: 'ambidextrous', heightCm: 188, weightKg: 83, birthCity: 'Porto' }), 'created');
    expect(created.player.preferredFoot).toBe('ambidextrous');
    expect(created.player.heightCm).toBe(188);
    expect(created.player.weightKg).toBe(83);
    expect(created.player.birthCity).toBe('Porto');
  });
});
