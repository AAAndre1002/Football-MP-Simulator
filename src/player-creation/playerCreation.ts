import type { Player, PlayerAttributes, PlayerPosition } from '../types';
import { COUNTRY_OPTIONS, PORTUGAL_REGIONS } from './geographyData';

export const CAREER_SEASON = '2026/27';
export const STARTING_AGE = 16;
export type PreferredFoot = 'right' | 'left' | 'ambidextrous';
export type FlatAttribute = 'pace' | 'acceleration' | 'stamina' | 'strength' | 'agility' | 'passing' | 'shooting' | 'dribbling' | 'tackling' | 'vision' | 'ballControl' | 'decisions' | 'positioning' | 'teamwork' | 'composure' | 'leadership' | 'gkReflexes' | 'gkHandling' | 'gkPositioning';
export type AttributeProfile = Record<FlatAttribute, number>;
export interface PlayerAppearance { hairStyle: string; hairColor: string; eyeColor: string; }
export interface PlayerCreationInput {
  name: string; nationality: string; birthCountry: string; birthRegion: string; birthCity: string;
  appearance: PlayerAppearance; heightCm: number; weightKg: number; preferredFoot: PreferredFoot;
  primaryPosition: PlayerPosition; roleId: string; secondaryPositions: PlayerPosition[]; attributes: AttributeProfile;
}
export interface RoleDefinition { id: string; label: string; description: string; weights: Partial<Record<FlatAttribute, number>>; profileAdjustments: Partial<Record<FlatAttribute, number>>; potentialBonus: number; }
interface PositionDefinition { position: PlayerPosition; label: string; roles: RoleDefinition[]; compatible: PlayerPosition[]; profile: AttributeProfile; }

const attrs = (values: Partial<AttributeProfile>): AttributeProfile => ({ pace: 60, acceleration: 60, stamina: 60, strength: 60, agility: 60, passing: 60, shooting: 60, dribbling: 60, tackling: 60, vision: 60, ballControl: 60, decisions: 60, positioning: 60, teamwork: 60, composure: 60, leadership: 45, gkReflexes: 15, gkHandling: 15, gkPositioning: 15, ...values });
const role = (id: string, label: string, description: string, weights: Partial<Record<FlatAttribute, number>>, profileAdjustments: Partial<Record<FlatAttribute, number>> = {}, potentialBonus = 0): RoleDefinition => ({ id, label, description, weights, profileAdjustments, potentialBonus });
const commonAttack = { shooting: 1.5, ballControl: 1.2, decisions: 1.2, positioning: 1.1 };
const commonDefence = { tackling: 1.6, positioning: 1.4, strength: 1.2, decisions: 1.1 };
export const POSITION_DEFINITIONS: PositionDefinition[] = [
  { position: 'GK', label: 'Guarda-redes', compatible: [], profile: attrs({ agility: 70, strength: 68, passing: 57, tackling: 15, positioning: 72, composure: 68, decisions: 70, gkReflexes: 72, gkHandling: 68, gkPositioning: 70 }), roles: [
    role('sweeper-keeper', 'Guarda-redes líbero', 'Sai da baliza e participa na construção curta.', { gkReflexes: 1.6, gkHandling: 1, gkPositioning: 1.2, passing: 1.2, decisions: 1.1 }, { passing: 5, pace: 3, vision: 4 }),
    role('line-keeper', 'Guarda-redes de linha', 'Prioriza reflexos, posicionamento e controlo da área.', { gkReflexes: 1.7, gkHandling: 1.5, gkPositioning: 1.5, composure: 1, decisions: 1.1 }, { gkReflexes: 4, gkHandling: 3, gkPositioning: 3 }),
  ] },
  { position: 'CB', label: 'Defesa-central', compatible: ['LB','RB','CDM'], profile: attrs({ pace: 56, acceleration: 53, stamina: 66, strength: 76, agility: 55, passing: 58, shooting: 40, dribbling: 49, tackling: 75, vision: 54, ballControl: 57, decisions: 68, positioning: 76, teamwork: 72, composure: 70, leadership: 59 }), roles: [
    role('stopper', 'Central de contenção', 'Forte nos duelos e na proteção da área.', { ...commonDefence, composure: 1, teamwork: 1 }, { strength: 5, tackling: 3, pace: -2 }),
    role('ball-playing', 'Central construtor', 'Ajuda a iniciar ataques com passe e leitura de jogo.', { ...commonDefence, passing: 1.5, vision: 1.4, ballControl: 1.2, decisions: 1.3 }, { passing: 5, vision: 5, ballControl: 3 }),
    role('cover-defender', 'Central de cobertura', 'Compensa profundidade com mobilidade e antecipação.', { pace: 1.4, acceleration: 1.3, positioning: 1.5, decisions: 1.3, tackling: 1.2 }, { pace: 5, acceleration: 4, positioning: 3, strength: -2 }),
  ] },
  ...(['LB','RB'] as const).map((position): PositionDefinition => ({ position, label: position === 'LB' ? 'Lateral-esquerdo' : 'Lateral-direito', compatible: position === 'LB' ? ['LM','LW','CB'] : ['RM','RW','CB'], profile: attrs({ pace: 70, acceleration: 70, stamina: 73, strength: 61, agility: 68, passing: 65, shooting: 50, dribbling: 65, tackling: 68, vision: 61, ballControl: 64, decisions: 65, positioning: 67, teamwork: 70, composure: 61 }), roles: [
    role('fullback', 'Lateral equilibrado', 'Equilibra apoio ofensivo e responsabilidade defensiva.', { pace: 1.1, stamina: 1.2, tackling: 1.2, passing: 1.1, teamwork: 1.1 }, { stamina: 3, tackling: 2 }),
    role('wingback', 'Ala ofensivo', 'Dá largura e profundidade com corridas constantes.', { pace: 1.4, acceleration: 1.3, stamina: 1.4, dribbling: 1.1, passing: 1 }, { pace: 4, stamina: 4, dribbling: 3, tackling: -2 }),
    role('inverted-fullback', 'Lateral invertido', 'Fecha por dentro para apoiar o meio-campo na posse.', { passing: 1.4, vision: 1.3, ballControl: 1.2, decisions: 1.2, tackling: 1.1 }, { passing: 4, vision: 4, ballControl: 3 }),
  ] })),
  { position: 'CDM', label: 'Médio defensivo', compatible: ['CB','CM'], profile: attrs({ pace: 62, acceleration: 58, stamina: 71, strength: 70, agility: 60, passing: 68, shooting: 49, dribbling: 60, tackling: 73, vision: 68, ballControl: 67, decisions: 72, positioning: 73, teamwork: 75, composure: 69, leadership: 58 }), roles: [
    role('anchor', 'Âncora', 'Protege a defesa e ocupa espaços centrais.', { tackling: 1.5, positioning: 1.5, decisions: 1.3, strength: 1.1, teamwork: 1.1 }, { tackling: 4, positioning: 4, strength: 3 }),
    role('deep-playmaker', 'Organizador recuado', 'Oferece linhas de passe e distribui a partir de trás.', { passing: 1.5, vision: 1.5, ballControl: 1.2, decisions: 1.3, teamwork: 1 }, { passing: 4, vision: 4, composure: 2 }),
  ] },
  { position: 'CM', label: 'Médio-centro', compatible: ['CDM','CAM','LM','RM'], profile: attrs({ pace: 66, acceleration: 64, stamina: 75, strength: 64, agility: 67, passing: 72, shooting: 60, dribbling: 68, tackling: 64, vision: 71, ballControl: 72, decisions: 71, positioning: 67, teamwork: 76, composure: 68, leadership: 57 }), roles: [
    role('box-to-box', 'Médio de área a área', 'Liga setores e contribui nos dois lados do campo.', { stamina: 1.5, teamwork: 1.3, passing: 1.1, tackling: 1.1, decisions: 1.1 }, { stamina: 5, pace: 2 }),
    role('playmaker', 'Organizador', 'Gere a posse e procura passes de progressão.', { passing: 1.5, vision: 1.5, ballControl: 1.3, decisions: 1.2 }, { vision: 4, passing: 4, ballControl: 2 }),
    role('holding-midfielder', 'Médio de equilíbrio', 'Mantém posição e dá segurança à equipa.', { tackling: 1.2, positioning: 1.3, teamwork: 1.3, decisions: 1.2 }, { tackling: 3, positioning: 3, teamwork: 2 }),
  ] },
  { position: 'CAM', label: 'Médio ofensivo', compatible: ['CM','ST','LW','RW'], profile: attrs({ pace: 70, acceleration: 70, stamina: 66, strength: 52, agility: 75, passing: 73, shooting: 68, dribbling: 76, tackling: 43, vision: 77, ballControl: 77, decisions: 71, positioning: 66, teamwork: 66, composure: 69 }), roles: [
    role('creator', 'Criativo', 'Procura espaços entre linhas e cria ocasiões.', { vision: 1.6, passing: 1.4, ballControl: 1.3, decisions: 1.2 }, { vision: 5, passing: 3, dribbling: 2 }, 2),
    role('attacking-midfielder', 'Médio de chegada', 'Ataca a área e combina criatividade com finalização.', { ...commonAttack, dribbling: 1.2, vision: 1.1 }, { shooting: 4, positioning: 3, pace: 2 }, 1),
  ] },
  ...(['LM','RM'] as const).map((position): PositionDefinition => ({ position, label: position === 'LM' ? 'Médio-esquerdo' : 'Médio-direito', compatible: position === 'LM' ? ['LB','LW','CM'] : ['RB','RW','CM'], profile: attrs({ pace: 72, acceleration: 73, stamina: 71, strength: 57, agility: 72, passing: 68, shooting: 61, dribbling: 72, tackling: 57, vision: 66, ballControl: 70, decisions: 66, positioning: 65, teamwork: 70 }), roles: [
    role('wide-midfielder', 'Médio de ala', 'Ajuda a equipa a manter largura e acompanha o lateral adversário.', { stamina: 1.3, teamwork: 1.3, passing: 1.2, tackling: 1, dribbling: 1 }, { stamina: 3, tackling: 2 }),
    role('wide-playmaker', 'Criativo de ala', 'Cria jogo a partir do corredor e procura combinações.', { passing: 1.3, vision: 1.3, dribbling: 1.2, ballControl: 1.2 }, { vision: 3, passing: 3 }),
  ] })),
  ...(['LW','RW'] as const).map((position): PositionDefinition => ({ position, label: position === 'LW' ? 'Extremo-esquerdo' : 'Extremo-direito', compatible: position === 'LW' ? ['LM','ST','CAM'] : ['RM','ST','CAM'], profile: attrs({ pace: 82, acceleration: 83, stamina: 67, strength: 54, agility: 81, passing: 67, shooting: 71, dribbling: 82, tackling: 38, vision: 68, ballControl: 81, decisions: 67, positioning: 68, teamwork: 61 }), roles: [
    role('winger', 'Extremo de linha', 'Usa velocidade e drible para ganhar a linha e criar perigo.', { pace: 1.5, acceleration: 1.4, dribbling: 1.5, ballControl: 1.2, vision: 1 }, { pace: 4, dribbling: 4 }, 2),
    role('inside-forward', 'Extremo interior', 'Parte do corredor para procurar remate e diagonais.', { ...commonAttack, pace: 1.2, dribbling: 1.3 }, { shooting: 4, positioning: 3, dribbling: 2 }, 2),
    role('wide-creator', 'Extremo criativo', 'Combina no corredor e privilegia a criação para colegas.', { vision: 1.4, passing: 1.3, dribbling: 1.2, ballControl: 1.2 }, { vision: 4, passing: 3 }),
  ] })),
  { position: 'ST', label: 'Ponta de lança', compatible: ['CAM','LW','RW'], profile: attrs({ pace: 75, acceleration: 74, stamina: 67, strength: 72, agility: 70, passing: 60, shooting: 79, dribbling: 68, tackling: 31, vision: 59, ballControl: 70, decisions: 69, positioning: 79, teamwork: 62, composure: 72 }), roles: [
    role('target-forward', 'Ponta de lança de referência', 'Segura a bola, disputa cruzamentos e liga o ataque.', { strength: 1.5, shooting: 1.3, positioning: 1.4, composure: 1.1 }, { strength: 5, shooting: 2 }),
    role('mobile-striker', 'Avançado móvel', 'Explora espaços com movimentos e acelerações constantes.', { pace: 1.4, acceleration: 1.4, shooting: 1.3, positioning: 1.2 }, { pace: 4, acceleration: 4, agility: 2 }),
    role('poacher', 'Finalizador', 'Prioriza posicionamento e eficácia perto da baliza.', { shooting: 1.7, positioning: 1.5, composure: 1.3, decisions: 1.1 }, { shooting: 5, positioning: 4, passing: -2 }),
    role('false-nine', 'Falso 9', 'Recuo entre linhas para associar e abrir espaços.', { passing: 1.3, vision: 1.3, ballControl: 1.3, decisions: 1.3, dribbling: 1.1 }, { passing: 4, vision: 4, ballControl: 3, strength: -2 }, 2),
  ] },
];
// Attribute emphasis is unique to this simulator; it is a role-weighted evaluation, not a licensed rating system.
export const ALL_FLAT_ATTRIBUTES: FlatAttribute[] = ['pace','acceleration','stamina','strength','agility','passing','shooting','dribbling','tackling','vision','ballControl','decisions','positioning','teamwork','composure','leadership','gkReflexes','gkHandling','gkPositioning'];
export const POSITIONS = POSITION_DEFINITIONS.map(({ position, label }) => ({ position, label }));
export const HAIR_STYLES = ['Curto', 'Médio', 'Comprido', 'Rapado', 'Caracóis', 'Tranças'] as const;
export const HAIR_COLORS = ['Preto', 'Castanho escuro', 'Castanho', 'Loiro', 'Ruivo', 'Grisalho'] as const;
export const EYE_COLORS = ['Castanhos', 'Azuis', 'Verdes', 'Avelã', 'Cinzentos'] as const;
export const DEFAULT_CREATION: PlayerCreationInput = {
  name: '', nationality: '', birthCountry: '', birthRegion: '', birthCity: '',
  appearance: { hairStyle: HAIR_STYLES[0], hairColor: HAIR_COLORS[0], eyeColor: EYE_COLORS[0] },
  heightCm: 175, weightKg: 70, preferredFoot: 'right', primaryPosition: 'CM', roleId: 'box-to-box', secondaryPositions: [],
  attributes: { ...POSITION_DEFINITIONS.find(p => p.position === 'CM')!.profile },
};
export const positionDefinition = (position: PlayerPosition) => POSITION_DEFINITIONS.find(item => item.position === position)!;
export const compatibleSecondaryPositions = (position: PlayerPosition) => positionDefinition(position).compatible;
export const rolesForPosition = (position: PlayerPosition) => positionDefinition(position).roles;
export function profileForRole(position: PlayerPosition, roleId: string): AttributeProfile {
  const definition = positionDefinition(position);
  const selected = definition.roles.find(item => item.id === roleId);
  if (!selected) throw new Error('A função não pertence à posição escolhida.');
  return Object.fromEntries(ALL_FLAT_ATTRIBUTES.map(key => [key, clampAttribute(definition.profile[key] + (selected.profileAdjustments[key] ?? 0))])) as AttributeProfile;
}
export function calculateOverall(attributes: AttributeProfile, position: PlayerPosition, roleId: string): number {
  const selected = rolesForPosition(position).find(item => item.id === roleId);
  if (!selected) throw new Error('A função não pertence à posição escolhida.');
  const weights: Record<FlatAttribute, number> = Object.fromEntries(ALL_FLAT_ATTRIBUTES.map(key => [key, selected.weights[key] ?? (key.startsWith('gk') ? 0 : 0.5)])) as Record<FlatAttribute, number>;
  const total = ALL_FLAT_ATTRIBUTES.reduce((sum, key) => sum + weights[key], 0);
  return Math.round(ALL_FLAT_ATTRIBUTES.reduce((sum, key) => sum + clampAttribute(attributes[key]) * weights[key], 0) / total);
}
export function calculatePotential(overall: number, roleId: string, position: PlayerPosition): number {
  const selected = rolesForPosition(position).find(item => item.id === roleId);
  if (!selected || !Number.isInteger(overall) || overall < 0 || overall > 100) throw new Error('Não foi possível calcular o potencial.');
  return Math.min(100, Math.max(overall, overall + 10 + selected.potentialBonus));
}
export const clampAttribute = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
export function isCountryNameValid(name: string): boolean { return COUNTRY_OPTIONS.some(country => country.name === name); }
export function isPortugueseMunicipalityValid(regionName: string, municipality: string): boolean {
  return PORTUGAL_REGIONS.some(region => region.name === regionName && region.municipalities.includes(municipality));
}
export function validateCreation(input: PlayerCreationInput): string[] {
  const errors: string[] = [];
  if (!input.name.trim() || input.name.trim().length > 60) errors.push('Indica um nome com 1 a 60 caracteres.');
  if (!isCountryNameValid(input.nationality)) errors.push('Escolhe uma nacionalidade da lista de países disponível.');
  const birthCountry = COUNTRY_OPTIONS.find(country => country.name === input.birthCountry);
  if (!birthCountry) errors.push('Escolhe o país de nascimento da lista disponível.');
  else if (birthCountry.code === 'PT') {
    if (!isPortugueseMunicipalityValid(input.birthRegion, input.birthCity)) errors.push('Seleciona um distrito/região e um concelho válidos da lista.');
  } else if (input.birthRegion.trim() || input.birthCity.trim()) errors.push('Para este país, não introduzas uma região ou cidade sem dados validados.');
  if (!HAIR_STYLES.includes(input.appearance.hairStyle as typeof HAIR_STYLES[number]) || !HAIR_COLORS.includes(input.appearance.hairColor as typeof HAIR_COLORS[number]) || !EYE_COLORS.includes(input.appearance.eyeColor as typeof EYE_COLORS[number])) errors.push('Escolhe uma aparência disponível.');
  if (!Number.isInteger(input.heightCm) || input.heightCm < 140 || input.heightCm > 220) errors.push('A altura tem de estar entre 140 e 220 cm.');
  if (!Number.isInteger(input.weightKg) || input.weightKg < 40 || input.weightKg > 130) errors.push('O peso tem de estar entre 40 e 130 kg.');
  if (!(['right','left','ambidextrous'] as string[]).includes(input.preferredFoot)) errors.push('Escolhe um pé preferido válido.');
  const definition = POSITION_DEFINITIONS.find(item => item.position === input.primaryPosition);
  if (!definition || !definition.roles.some(item => item.id === input.roleId)) errors.push('A função tem de ser compatível com a posição principal.');
  const allowed = definition?.compatible ?? [];
  if (!Array.isArray(input.secondaryPositions) || input.secondaryPositions.length > 2 || new Set(input.secondaryPositions).size !== input.secondaryPositions.length || input.secondaryPositions.some(p => p === input.primaryPosition || !allowed.includes(p))) errors.push('As posições secundárias têm de ser compatíveis, únicas e no máximo duas.');
  if (ALL_FLAT_ATTRIBUTES.some(key => !Number.isInteger(input.attributes[key]) || input.attributes[key] < 0 || input.attributes[key] > 100)) errors.push('Todos os atributos têm de ser números inteiros entre 0 e 100.');
  return errors;
}
export interface CreatedPlayer { player: Player & { potential: number; role: string; secondaryPositions: PlayerPosition[]; appearance: PlayerAppearance; heightCm: number; weightKg: number; preferredFoot: PreferredFoot; birthCountry: string; birthRegion: string; birthCity: string; }; season: typeof CAREER_SEASON; }
function toPlayerAttributes(values: AttributeProfile): PlayerAttributes {
  return {
    physical: { pace: values.pace, acceleration: values.acceleration, stamina: values.stamina, strength: values.strength, agility: values.agility },
    technical: { passing: values.passing, shooting: values.shooting, dribbling: values.dribbling, tackling: values.tackling, vision: values.vision, ballControl: values.ballControl },
    mental: { decisions: values.decisions, positioning: values.positioning, teamwork: values.teamwork, composure: values.composure, leadership: values.leadership },
    ...(values.gkReflexes > 15 || values.gkHandling > 15 || values.gkPositioning > 15 ? { goalkeeping: { reflexes: values.gkReflexes, handling: values.gkHandling, positioning: values.gkPositioning } } : {}),
  };
}
function createPlayerId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return `player-${cryptoApi.randomUUID()}`;
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function createPlayer(input: PlayerCreationInput, id = createPlayerId()): CreatedPlayer {
  const errors = validateCreation(input);
  if (errors.length) throw new Error(errors.join(' '));
  const selected = rolesForPosition(input.primaryPosition).find(item => item.id === input.roleId)!;
  const overall = calculateOverall(input.attributes, input.primaryPosition, input.roleId);
  return {
    season: CAREER_SEASON,
    player: {
      id, name: input.name.trim(), age: STARTING_AGE, nationality: input.nationality.trim(), position: input.primaryPosition,
      overall, potential: calculatePotential(overall, input.roleId, input.primaryPosition), initialPotential: calculatePotential(overall, input.roleId, input.primaryPosition), potentialMomentum: 0, potentialTrend: 0, role: selected.label,
      secondaryPositions: [...input.secondaryPositions], appearance: { ...input.appearance }, heightCm: input.heightCm, weightKg: input.weightKg,
      preferredFoot: input.preferredFoot, birthCountry: input.birthCountry.trim(), birthRegion: input.birthRegion.trim(), birthCity: input.birthCity.trim(),
      attributes: toPlayerAttributes(input.attributes), marketValue: 50000, morale: 65, coachRelationship: 60, fanRelationship: 50,
    },
  };
}
