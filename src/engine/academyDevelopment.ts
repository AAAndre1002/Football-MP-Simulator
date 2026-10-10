import type { GameSave, Player, PlayerAttributes, PlayerPosition, Team } from '../types';

export type AcademyRoute = 'first-team' | 'reserve';
export interface AcademyDevelopment {
  academyLabel: 'Academia Horizonte';
  completed: boolean;
  choices: string[];
  route: AcademyRoute;
  promisedMinutes: number;
}
export interface AcademyOutcome { player: Player; development: AcademyDevelopment; }
interface ChoiceEffect { id: string; attribute?: keyof PlayerAttributes['physical'] | keyof PlayerAttributes['technical'] | keyof PlayerAttributes['mental']; amount?: number; secondAttribute?: keyof PlayerAttributes['physical'] | keyof PlayerAttributes['technical'] | keyof PlayerAttributes['mental']; secondAmount?: number; potential?: number; morale?: number; coachRelationship?: number; route?: AcademyRoute; promisedMinutes?: number; }
const chapters: Record<number, ChoiceEffect[]> = {
  1: [
    { id: 'first-touch', attribute: 'ballControl', amount: 2, secondAttribute: 'stamina', secondAmount: -1, coachRelationship: 2 },
    { id: 'speed-circuit', attribute: 'pace', amount: 2, secondAttribute: 'composure', secondAmount: -1, morale: 2 },
  ],
  2: [
    { id: 'video-review', attribute: 'decisions', amount: 2, potential: 1, morale: -1, coachRelationship: 2 },
    { id: 'peer-captain', attribute: 'teamwork', amount: 2, secondAttribute: 'leadership', secondAmount: 2, potential: 1, coachRelationship: -1 },
  ],
  3: [
    { id: 'first-team-route', attribute: 'composure', amount: 1, potential: 2, morale: 2, coachRelationship: 1, route: 'first-team', promisedMinutes: 180 },
    { id: 'reserve-route', attribute: 'stamina', amount: 1, secondAttribute: 'teamwork', secondAmount: 1, potential: 1, morale: 1, coachRelationship: 2, route: 'reserve', promisedMinutes: 360 },
  ],
};
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Maps the chosen fictional academy route to an actual initial place in the fictional sample squad. */
export function academyEntryPlayerSlot(team: Team, position: PlayerPosition, route?: AcademyRoute): Player | undefined {
  const candidateIds = route === 'reserve' ? team.substitutes : team.startingXI;
  const routeMatch = team.players.find(player => player.position === position && candidateIds.includes(player.id));
  if (routeMatch) return routeMatch;
  // Some sample squads have no reserve at every position (notably goalkeeper); never place a player in a wrong-position slot.
  return route === 'reserve'
    ? team.players.find(player => player.position === position && team.startingXI.includes(player.id))
    : team.players.find(player => player.position === position);
}
const changedAttrs = (player: Player, key: ChoiceEffect['attribute'], amount: number) => {
  if (!key) return player.attributes;
  if (key in player.attributes.physical) return { ...player.attributes, physical: { ...player.attributes.physical, [key]: clamp(player.attributes.physical[key as keyof PlayerAttributes['physical']] + amount) } };
  if (key in player.attributes.technical) return { ...player.attributes, technical: { ...player.attributes.technical, [key]: clamp(player.attributes.technical[key as keyof PlayerAttributes['technical']] + amount) } };
  return { ...player.attributes, mental: { ...player.attributes.mental, [key]: clamp(player.attributes.mental[key as keyof PlayerAttributes['mental']] + amount) } };
};

/** Applies one chapter choice once and in order. All scenes/options are original fiction. */
export function applyAcademyChoice(player: Player, choices: string[], chapter: number, choiceId: string): AcademyOutcome {
  if (!Number.isInteger(chapter) || chapter !== choices.length + 1 || chapter > 3) throw new Error('A escolha da academia não está na ordem esperada.');
  const effect = chapters[chapter]?.find(item => item.id === choiceId);
  if (!effect) throw new Error('Escolhe uma opção válida para este capítulo.');
  let attributes = changedAttrs(player, effect.attribute, effect.amount ?? 0);
  attributes = changedAttrs({ ...player, attributes }, effect.secondAttribute, effect.secondAmount ?? 0);
  const updated: Player = {
    ...player,
    attributes,
    potential: clamp(Math.max(player.overall, (player.potential ?? player.overall) + (effect.potential ?? 0))),
    morale: clamp((player.morale ?? 60) + (effect.morale ?? 0)),
    coachRelationship: clamp((player.coachRelationship ?? 60) + (effect.coachRelationship ?? 0)),
  };
  const nextChoices = [...choices, choiceId];
  const route: AcademyRoute = effect.route ?? 'reserve';
  const development: AcademyDevelopment = {
    academyLabel: 'Academia Horizonte', completed: nextChoices.length === 3, choices: nextChoices,
    route: nextChoices.length === 3 ? route : 'reserve', promisedMinutes: nextChoices.length === 3 ? (effect.promisedMinutes ?? 0) : 0,
  };
  return { player: updated, development };
}

export function attachAcademyDevelopment(save: GameSave, development: AcademyDevelopment): GameSave {
  return { ...save, academyDevelopment: development };
}
