import type { InjuryStatus, Player, PlayerAttributes, TrainingFocus } from '../types';

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

export function calculateMarketValue(player: Player, recentRatings: number[] = []): number {
  const recent = recentRatings.slice(-5);
  const form = recent.length ? recent.reduce((sum, rating) => sum + rating, 0) / recent.length : 6;
  const ageFactor = player.age <= 20 ? 1.28 : player.age <= 23 ? 1.18 : player.age <= 27 ? 1 : player.age <= 30 ? 0.78 : player.age <= 33 ? 0.55 : 0.32;
  const formFactor = clamp(1 + (form - 6) * 0.07, 0.62, 1.42);
  const reputationFactor = clamp(0.8 + (player.mediaReputation ?? 50) / 250, 0.8, 1.25);
  const talentValue = Math.pow(clamp(player.overall, 1, 99), 3) * 7.5;
  return Math.round(clamp(talentValue * ageFactor * formFactor * reputationFactor, 10_000, 250_000_000));
}
