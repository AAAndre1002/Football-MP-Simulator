export interface WeekProgressionState {
  matchPlayedThisWeek: boolean;
  pendingPress?: unknown;
  trainedThisWeek: boolean;
  balance: number;
  injuries?: Array<{ weeksRemaining: number }>;
}

export type WeekProgressionBlock = 'match' | 'press' | 'training' | null;

/**
 * The season advances only after the user's match and post-match media response,
 * plus any training session that is currently available, have been resolved.
 * Recovery training is the cheapest valid session (€80).
 */
export function weekProgressionBlock(save: WeekProgressionState): WeekProgressionBlock {
  if (!save.matchPlayedThisWeek) return 'match';
  if (save.pendingPress) return 'press';
  const injured = (save.injuries ?? []).some(injury => injury.weeksRemaining > 0);
  const trainingAvailable = !save.trainedThisWeek && !injured && save.balance >= 80;
  if (trainingAvailable) return 'training';
  return null;
}

export function canAdvanceWeek(save: WeekProgressionState): boolean {
  return weekProgressionBlock(save) === null;
}

export function nextSeasonWeek(week: number, season: number, finalWeek = 10): { week: number; season: number; newSeason: boolean } {
  if (week >= finalWeek) return { week: 1, season: season + 1, newSeason: true };
  return { week: week + 1, season, newSeason: false };
}
