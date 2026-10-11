import { describe, expect, it } from 'vitest';
import { createFreshSave, normalizeGameSave } from '../hooks/useGameState';
import { addOfflineCareerSlot, deleteOfflineCareerSlot, renameOfflineCareerSlot, updateOfflineCareerSlot } from './offlineCareers';
import { createCareerSave } from '../hooks/useGameState';
import { createPlayer, DEFAULT_CREATION } from '../player-creation/playerCreation';
import type { Player } from '../types';
import { applyAcademyChoice } from '../engine/academyDevelopment';

const createdPlayer = createPlayer({ ...DEFAULT_CREATION, name: 'Test Player', nationality: 'Portugal', birthCountry: 'Portugal', birthRegion: 'Aveiro', birthCity: 'Santa Maria da Feira' }, 'offline-slot-player').player;

describe('offline career slots and save compatibility', () => {
  it('adds a new slot without modifying the pre-existing legacy save', () => {
    const legacy = createFreshSave();
    const originalSerialized = JSON.stringify(legacy);
    const newSave = createCareerSave(createdPlayer);
    const slots = addOfflineCareerSlot([], { id: 'new-slot', name: 'New Career', saveData: newSave, updatedAt: '2026-10-10T10:00:00Z' });
    expect(slots).toHaveLength(1);
    expect(JSON.stringify(legacy)).toBe(originalSerialized);
    expect(slots[0].saveData.player.id).toBe('offline-slot-player');
    expect(slots[0].saveData.player.marketValue).toBeGreaterThanOrEqual(10_000);
  });

  it('updates only the selected offline slot', () => {
    const a = { id: 'a', name: 'A', saveData: createFreshSave(), updatedAt: 'old' };
    const b = { id: 'b', name: 'B', saveData: createCareerSave(createdPlayer), updatedAt: 'old' };
    const next = updateOfflineCareerSlot([a, b], 'b', { ...b.saveData, week: 2 }, 'new');
    expect(next[0]).toEqual(a);
    expect(next[1].saveData.week).toBe(2);
    expect(next[1].updatedAt).toBe('new');
  });

  it('renames and deletes only the targeted local slot', () => {
    const slots = [{ id: 'a', name: 'A', saveData: createFreshSave(), updatedAt: 'old' }, { id: 'b', name: 'B', saveData: createFreshSave(), updatedAt: 'old' }];
    const renamed = renameOfflineCareerSlot(slots, 'b', '  Nova  ', 'new');
    expect(renamed[0]).toEqual(slots[0]);
    expect(renamed[1].name).toBe('Nova');
    expect(deleteOfflineCareerSlot(renamed, 'a').map(slot => slot.id)).toEqual(['b']);
    expect(renameOfflineCareerSlot(slots, 'b', '  ')).toEqual(slots);
  });

  it('preserves the created player appearance when an offline save is normalized and reloaded', () => {
    const player = createPlayer({ ...DEFAULT_CREATION, name: 'QA Avatar', nationality: 'Portugal', birthCountry: 'Portugal', birthRegion: 'Aveiro', birthCity: 'Santa Maria da Feira', appearance: { hairStyle: 'Caracóis', hairColor: 'Ruivo', eyeColor: 'Verdes' } }, 'qa-avatar').player;
    const createdSave = createCareerSave(player);
    const loaded = normalizeGameSave(JSON.parse(JSON.stringify(createdSave)));
    expect(loaded.player.id).toBe('qa-avatar');
    expect(loaded.player.appearance).toEqual({ hairStyle: 'Caracóis', hairColor: 'Ruivo', eyeColor: 'Verdes' });
  });

  it('keeps completed academy choices when normalized and accepts a legacy v1-style save', () => {
    let player: Player = createdPlayer;
    let choices: string[] = [];
    let finalDevelopment;
    for (const [chapter, choice] of [[1, 'first-touch'], [2, 'video-review'], [3, 'reserve-route']] as const) {
      const result = applyAcademyChoice(player, choices, chapter, choice);
      player = result.player;
      choices = result.development.choices;
      finalDevelopment = result.development;
    }
    const developedSave = { ...createCareerSave(player), academyDevelopment: finalDevelopment, careerPathway: { country: 'portugal' as const, offerId: 'portugal-offer-2' } };
    const normalized = normalizeGameSave(developedSave);
    expect(normalized.academyDevelopment?.choices).toEqual(['first-touch', 'video-review', 'reserve-route']);
    expect(normalized.player.potential).toBe(player.potential);
    expect(normalized.careerPathway?.offerId).toBe('portugal-offer-2');
    const legacy = normalizeGameSave({ version: 1, week: 4, player: { ...createFreshSave().player, name: 'Legacy Player' } });
    expect(legacy.version).toBe(4);
    expect(legacy.week).toBe(4);
    expect(legacy.player.name).toBe('Legacy Player');
    expect(legacy.academyDevelopment).toBeUndefined();
    expect(normalizeGameSave({ ...legacy, careerPathway: { country: 'portugal', offerId: 'portugal-offer-999' } }).careerPathway).toBeUndefined();
  });
});
