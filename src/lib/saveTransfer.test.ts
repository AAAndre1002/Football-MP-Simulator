import { describe, expect, it } from 'vitest';
import { createFreshSave } from '../hooks/useGameState';
import { exportCareerSave, importCareerSave } from './saveTransfer';

describe('offline JSON save portability', () => {
  it('exports a versioned envelope and restores the player and career state', () => {
    const save = createFreshSave();
    const encoded = exportCareerSave({ ...save, week: 4 }, '2026-10-10T12:00:00Z');
    const parsed = JSON.parse(encoded);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.exportedAt).toBe('2026-10-10T12:00:00Z');
    expect(importCareerSave(encoded).week).toBe(4);
    expect(importCareerSave(encoded).player.name).toBe(save.player.name);
  });
  it('accepts backward-compatible raw saves but rejects malformed or future formats', () => {
    const legacy = { ...createFreshSave(), version: 1 };
    expect(importCareerSave(JSON.stringify(legacy)).version).toBe(4);
    expect(() => importCareerSave('{oops')).toThrow(/JSON válido/);
    expect(() => importCareerSave(JSON.stringify({ format: 'football-mp-simulator-save', schemaVersion: 99, gameSave: legacy }))).toThrow(/não suportada/);
    expect(() => importCareerSave(JSON.stringify({ version: 3, week: 2 }))).toThrow(/jogador/);
    expect(() => importCareerSave('x'.repeat(2_000_001))).toThrow(/2 MB/);
  });
});
