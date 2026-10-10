import { describe, expect, it } from 'vitest';
import { createFreshSave, normalizeGameSave } from './useGameState';

describe('potential save compatibility', () => {
  it('migrates legacy careers without changing existing player identity or career data', () => {
    const legacy = createFreshSave();
    legacy.player = { ...legacy.player, id: 'custom-player', name: 'Nome Personalizado', overall: 61, potential: 82 };
    legacy.career = { ...legacy.career, appearances: 4, goals: 2, matchHistory: [{ week: 3, opponent: 'Clube de Teste', score: '2–1', rating: 7.2, goals: 1, assists: 0, yellowCards: 0, redCards: 0 }] };
    const migrated = normalizeGameSave({ ...legacy, version: 3, player: { ...legacy.player, initialPotential: undefined, potentialMomentum: undefined, potentialTrend: undefined } });
    expect(migrated.version).toBe(4);
    expect(migrated.player.name).toBe('Nome Personalizado');
    expect(migrated.player.id).toBe('custom-player');
    expect(migrated.player.potential).toBe(82);
    expect(migrated.player.initialPotential).toBe(82);
    expect(migrated.player.potentialMomentum).toBe(0);
    expect(migrated.career.appearances).toBe(4);
    expect(migrated.career.goals).toBe(2);
    expect(migrated.career.matchHistory[0].opponent).toBe('Clube de Teste');
  });

  it('preserves a legacy starting potential even when its Overall has since overtaken it', () => {
    const legacy = createFreshSave();
    const migrated = normalizeGameSave({ ...legacy, player: { ...legacy.player, name: 'Legado', overall: 82, potential: 76 } });
    expect(migrated.player.overall).toBe(82);
    expect(migrated.player.initialPotential).toBe(76);
    expect(migrated.player.potential).toBe(82);
  });

  it('persists current and initial potential, momentum, trend and match minutes through JSON saves', () => {
    const save = createFreshSave();
    save.player = { ...save.player, name: 'Carreira de Teste', overall: 62, potential: 78, initialPotential: 75, potentialMomentum: 1.35, potentialTrend: 1 };
    save.career.matchHistory = [{ week: 2, opponent: 'Equipa', score: '1–0', rating: 7.4, minutes: 82, goals: 1, assists: 0, yellowCards: 0, redCards: 0 }];
    const restored = normalizeGameSave(JSON.parse(JSON.stringify(save)));
    expect(restored.player.name).toBe('Carreira de Teste');
    expect(restored.player.overall).toBe(62);
    expect(restored.player.potential).toBe(78);
    expect(restored.player.initialPotential).toBe(75);
    expect(restored.player.potentialMomentum).toBe(1.35);
    expect(restored.player.potentialTrend).toBe(1);
    expect(restored.career.matchHistory[0].minutes).toBe(82);
  });
});
