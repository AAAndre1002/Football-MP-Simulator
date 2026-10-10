import type { InjuryStatus, Player, PlayerAttributes, TrainingFocus, ValuePoint } from '../types';

export type TrainingIntensity = 'recovery' | 'balanced' | 'high';
export interface TrainingInput {
  player: Player;
  focus: TrainingFocus;
  fatigue: number;
  week: number;
  intensity: TrainingIntensity;
  personalTrainer?: boolean;
  random: () => number;
}
export interface TrainingResult { player: Player; fatigue: number; injury?: InjuryStatus; attributeGain: number; }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const technicalKeys: (keyof PlayerAttributes['technical'])[] = ['passing','shooting','dribbling','tackling','vision','ballControl'];
const physicalKeys: (keyof PlayerAttributes['physical'])[] = ['pace','acceleration','stamina','strength','agility'];

function improve(attributes: PlayerAttributes, focus: TrainingFocus, gain: number): PlayerAttributes {
  if (technicalKeys.includes(focus as keyof PlayerAttributes['technical'])) {
    const key = focus as keyof PlayerAttributes['technical'];
    return { ...attributes, technical: { ...attributes.technical, [key]: Math.round(Math.min(99, attributes.technical[key] + gain) * 10) / 10 } };
  }
  if (physicalKeys.includes(focus as keyof PlayerAttributes['physical'])) {
    const key = focus as keyof PlayerAttributes['physical'];
    return { ...attributes, physical: { ...attributes.physical, [key]: Math.round(Math.min(99, attributes.physical[key] + gain) * 10) / 10 } };
  }
  const key = focus as keyof PlayerAttributes['mental'];
  return { ...attributes, mental: { ...attributes.mental, [key]: Math.round(Math.min(99, attributes.mental[key] + gain) * 10) / 10 } };
}

/** Applies one training session using explicit randomness, so saves and tests are reproducible. */
export function applyTraining(input: TrainingInput): TrainingResult {
  const { player, focus, random } = input;
  const intensityMultiplier = input.intensity === 'high' ? 1.45 : input.intensity === 'recovery' ? 0.5 : 1;
  const ageMultiplier = player.age <= 21 ? 1.18 : player.age <= 27 ? 1 : player.age <= 31 ? 0.78 : 0.58;
  const trainerMultiplier = input.personalTrainer ? 1.2 : 1;
  const currentValue = focus in player.attributes.technical
    ? player.attributes.technical[focus as keyof PlayerAttributes['technical']]
    : focus in player.attributes.physical
      ? player.attributes.physical[focus as keyof PlayerAttributes['physical']]
      : player.attributes.mental[focus as keyof PlayerAttributes['mental']];
  const potentialFactor = clamp((102 - currentValue) / 42, 0.08, 1);
  const baseGain = (0.24 + random() * 0.48) * intensityMultiplier * ageMultiplier * trainerMultiplier * potentialFactor;
  const attributeGain = Math.round(baseGain * 10) / 10;
  const fatigueCost = input.intensity === 'high' ? 19 : input.intensity === 'recovery' ? 4 : 10;
  const fatigue = clamp(input.fatigue + fatigueCost - (input.personalTrainer ? 3 : 0), 0, 100);
  const overload = Math.max(0, input.fatigue - 55);
  const injuryChance = clamp(overload * (input.intensity === 'high' ? 0.0017 : 0.00055) + (input.intensity === 'high' ? 0.008 : 0.001) - (input.personalTrainer ? 0.004 : 0), 0, 0.12);
  let injury: InjuryStatus | undefined;
  if (random() < injuryChance) {
    const severity = input.fatigue > 86 && input.intensity === 'high' ? 'serious' : input.fatigue > 72 ? 'moderate' : 'minor';
    const duration = severity === 'serious' ? 4 : severity === 'moderate' ? 2 : 1;
    injury = { id: `training-${player.id}-${input.week}`, name: severity === 'serious' ? 'Lesão muscular' : severity === 'moderate' ? 'Distensão' : 'Sobrecarga', severity, weeksRemaining: duration, occurredWeek: input.week };
  }
  return { player: { ...player, attributes: improve(player.attributes, focus, attributeGain), overall: Math.min(99, Math.round((player.overall + attributeGain * 0.08) * 10) / 10) }, fatigue, injury, attributeGain };
}

export function checkMatchInjury(player: Player, fatigue: number, week: number, random: () => number): InjuryStatus | undefined {
  const ageRisk = Math.max(0, player.age - 27) * 0.001;
  const risk = clamp(Math.max(0, fatigue - 58) * 0.0012 + ageRisk, 0, 0.12);
  if (random() >= risk) return undefined;
  const severity = fatigue > 90 && player.age > 30 ? 'serious' : fatigue > 78 ? 'moderate' : 'minor';
  return { id: `match-${player.id}-${week}`, name: severity === 'serious' ? 'Lesão muscular' : severity === 'moderate' ? 'Distensão' : 'Sobrecarga', severity, weeksRemaining: severity === 'serious' ? 4 : severity === 'moderate' ? 2 : 1, occurredWeek: week };
}

export function recoverFatigue(fatigue: number, assets: string[] = [], personalTrainer = false): number {
  const recovery = 32 + (assets.includes('recoveryBoots') ? 12 : 0) + (personalTrainer ? 8 : 0);
  return Math.round(clamp(fatigue - recovery, 0, 100) * 10) / 10;
}

export function recoverInjuries(injuries: InjuryStatus[] = []): InjuryStatus[] {
  return injuries.map(injury => ({ ...injury, weeksRemaining: Math.max(0, injury.weeksRemaining - 1) })).filter(injury => injury.weeksRemaining > 0);
}

export interface MarketValueContext {
  appearances?: number;
  totalMinutes?: number;
  goals?: number;
  assists?: number;
  /** Remaining contract years, clamped to 0–5. Omit to derive from contract dates. */
  contractYearsRemaining?: number;
}
export interface MarketValueBreakdown {
  estimatedValue: number;
  baseTalentValue: number;
  ageFactor: number;
  potentialFactor: number;
  formFactor: number;
  minutesFactor: number;
  contributionFactor: number;
  contractFactor: number;
  reputationFactor: number;
  formRating: number;
}

/** Simulated career date: season 1 opens 1 July 2026; the ten rounds are spaced across the season. */
export function remainingContractYears(player: Player, season = 1, week = 1): number | undefined {
  const endDate = player.contract?.endDate;
  if (!endDate) return undefined;
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(end)) return undefined;
  const monthOffset = Math.max(0, Math.min(9, Math.floor(week) - 1));
  const currentSeasonDate = Date.UTC(2026 + Math.max(0, Math.floor(season) - 1), 6 + monthOffset, 1);
  return Math.max(0, (end - currentSeasonDate) / (365.25 * 24 * 60 * 60 * 1000));
}

/** Transparent, deterministic game-economy estimate; not a real-world appraisal. */
export function explainMarketValue(player: Player, recentRatings: number[] = [], context: MarketValueContext = {}): MarketValueBreakdown {
  const recent = recentRatings.slice(-5).filter(Number.isFinite);
  const formRating = recent.length ? recent.reduce((sum, rating) => sum + clamp(rating, 0, 10), 0) / recent.length : 6;
  const ageFactor = player.age <= 20 ? 1.28 : player.age <= 23 ? 1.18 : player.age <= 27 ? 1 : player.age <= 30 ? 0.78 : player.age <= 33 ? 0.55 : 0.32;
  const formFactor = clamp(1 + (formRating - 6) * 0.07, 0.62, 1.42);
  const appearances = Math.max(0, context.appearances ?? 0);
  const minutesPerAppearance = appearances > 0 ? Math.max(0, context.totalMinutes ?? appearances * 70) / appearances : 0;
  const minutesFactor = appearances === 0 ? 0.8 : clamp(0.55 + (minutesPerAppearance / 90) * 0.45, 0.55, 1);
  const contributionRate = appearances > 0 ? ((Math.max(0, context.goals ?? 0) + Math.max(0, context.assists ?? 0)) / appearances) : 0;
  const contributionFactor = clamp(0.9 + contributionRate * 0.2, 0.9, 1.35);
  let remainingYears = context.contractYearsRemaining;
  if (remainingYears === undefined && player.contract?.endDate) {
    const end = Date.parse(`${player.contract.endDate.slice(0, 10)}T00:00:00Z`);
    if (Number.isFinite(end)) remainingYears = (end - Date.UTC(2026, 6, 1)) / (365.25 * 24 * 60 * 60 * 1000);
  }
  const contractFactor = remainingYears === undefined ? 1 : clamp(0.72 + clamp(remainingYears, 0, 5) * 0.09, 0.72, 1.17);
  const reputationFactor = clamp(0.8 + (player.mediaReputation ?? 50) / 250, 0.8, 1.25);
  const overall = clamp(player.overall, 1, 99);
  const potential = clamp(player.potential ?? overall, overall, 99);
  const baseTalentValue = Math.pow(overall, 3) * 6_000;
  const potentialFactor = clamp(1 + (potential - overall) * 0.012, 1, 1.6);
  const estimatedValue = Math.round(clamp(baseTalentValue * ageFactor * potentialFactor * formFactor * minutesFactor * contributionFactor * contractFactor * reputationFactor, 10_000, 250_000_000));
  return { estimatedValue, baseTalentValue, ageFactor, potentialFactor, formFactor, minutesFactor, contributionFactor, contractFactor, reputationFactor, formRating };
}

export function calculateMarketValue(player: Player, recentRatings: number[] = [], context: MarketValueContext = {}): number {
  return explainMarketValue(player, recentRatings, context).estimatedValue;
}

export function recordMarketValuePoint(points: ValuePoint[] | undefined, week: number, value: number): ValuePoint[] {
  const history = points ?? [];
  const last = history[history.length - 1];
  const next = last?.week === week ? [...history.slice(0, -1), { week, value }] : [...history, { week, value }];
  return next.slice(-30);
}
