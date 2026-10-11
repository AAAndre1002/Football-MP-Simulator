import type { GameSave } from '../types';
import type { OfflineCareerSlot } from '../components/OpeningMenu';

/** New careers are appended to their own versioned slot list; existing legacy key data is never replaced. */
export function addOfflineCareerSlot(slots: OfflineCareerSlot[], created: OfflineCareerSlot): OfflineCareerSlot[] {
  return [...slots, created];
}
export function updateOfflineCareerSlot(slots: OfflineCareerSlot[], id: string, saveData: GameSave, updatedAt = new Date().toISOString()): OfflineCareerSlot[] {
  return slots.map(slot => slot.id === id ? { ...slot, saveData, updatedAt } : slot);
}
export function deleteOfflineCareerSlot(slots: OfflineCareerSlot[], id: string): OfflineCareerSlot[] {
  return slots.filter(slot => slot.id !== id);
}
export function renameOfflineCareerSlot(slots: OfflineCareerSlot[], id: string, name: string, updatedAt = new Date().toISOString()): OfflineCareerSlot[] {
  const cleanName = name.trim().slice(0, 40);
  if (!cleanName) return slots;
  return slots.map(slot => slot.id === id ? { ...slot, name: cleanName, updatedAt } : slot);
}
