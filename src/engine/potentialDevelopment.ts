export interface PotentialMatchSignal {
  rating: number;
  /** Minutes are optional for legacy history entries. */
  minutes?: number;
}

export interface PotentialDevelopmentInput {
  currentPotential: number;
  overall: number;
  age: number;
  momentum?: number;
  trainedThisWeek: boolean;
  recentMatches: PotentialMatchSignal[];
  morale?: number;
  coachRelationship?: number;
}

export interface PotentialDevelopmentResult {
  potential: number;
  momentum: number;
  change: -1 | 0 | 1;
}

const clamp = (value: number, min: number, max: number) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;

/**
 * Once-per-week potential review. Small, accumulated signals prevent weekly swings:
 * completed training, actual recent match ratings/minutes, age band, morale and
 * coach relationship feed momentum; one potential point needs 2.4 momentum and
 * no review can move more than one point. Current potential is bounded by OVR–100.
 */
export function developPotential(input: PotentialDevelopmentInput): PotentialDevelopmentResult {
  const overall = clamp(Math.round(input.overall), 1, 99);
  const potential = clamp(Math.round(input.currentPotential), overall, 100);
  const momentum = clamp(input.momentum ?? 0, -4, 4);
  const matches = input.recentMatches.filter(match => Number.isFinite(match.rating)).slice(-4);
  const ratedMatches = matches.filter(match => (match.minutes ?? 1) > 0);
  let score = 0;

  if (input.age <= 20) score += 0.1;
  else if (input.age >= 34) score -= 0.2;
  else if (input.age >= 30) score -= 0.1;
  if (input.trainedThisWeek) score += 0.18;

  if (ratedMatches.length >= 2) {
    const averageRating = ratedMatches.reduce((sum, match) => sum + clamp(match.rating, 0, 10), 0) / ratedMatches.length;
    if (averageRating >= 7.3) score += 0.4;
    else if (averageRating >= 6.8) score += 0.25;
    else if (averageRating <= 5.4) score -= 0.45;
    else if (averageRating <= 5.9) score -= 0.25;
    const withMinutes = ratedMatches.filter(match => Number.isFinite(match.minutes));
    if (withMinutes.length) {
      const averageMinutes = withMinutes.reduce((sum, match) => sum + clamp(match.minutes ?? 0, 0, 150), 0) / withMinutes.length;
      if (averageMinutes >= 60) score += 0.15;
      else if (averageMinutes <= 20) score -= 0.15;
    }
  }

  const relationships = [input.morale, input.coachRelationship].filter((value): value is number => Number.isFinite(value));
  if (relationships.length) {
    const relationshipAverage = relationships.reduce((sum, value) => sum + clamp(value, 0, 100), 0) / relationships.length;
    score += (relationshipAverage - 60) * 0.003;
  }

  let nextMomentum = clamp(momentum + clamp(score, -1, 1), -4, 4);
  let change: -1 | 0 | 1 = 0;
  if (nextMomentum >= 2.4 && potential < 100) {
    change = 1;
    nextMomentum = Math.max(-4, nextMomentum - 2.4);
  } else if (nextMomentum <= -2.4 && potential > overall) {
    change = -1;
    nextMomentum = Math.min(4, nextMomentum + 2.4);
  } else if ((potential >= 100 && nextMomentum > 0) || (potential <= overall && nextMomentum < 0)) {
    nextMomentum = 0;
  }

  return {
    potential: clamp(potential + change, overall, 100),
    momentum: clamp(nextMomentum, -4, 4),
    change,
  };
}

/** Trend since the creator assigned the starting potential. */
export function potentialDelta(current: number, initial: number): number {
  return Math.round(clamp(current, 1, 100) - clamp(initial, 1, 100));
}
