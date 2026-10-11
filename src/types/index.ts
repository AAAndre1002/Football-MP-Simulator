export type AttributeScore = number;
export type PlayerPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';

export interface PlayerAttributes {
  physical: { pace: AttributeScore; acceleration: AttributeScore; stamina: AttributeScore; strength: AttributeScore; agility: AttributeScore };
  technical: { passing: AttributeScore; shooting: AttributeScore; dribbling: AttributeScore; tackling: AttributeScore; vision: AttributeScore; ballControl: AttributeScore };
  mental: { decisions: AttributeScore; positioning: AttributeScore; teamwork: AttributeScore; composure: AttributeScore; leadership: AttributeScore };
  goalkeeping?: { reflexes: AttributeScore; handling: AttributeScore; positioning: AttributeScore };
}

export interface Contract {
  id: string; playerId: string; teamId: string; startDate: string; endDate: string;
  weeklyWage: number; releaseClause: number; signingBonus?: number; goalBonus?: number; assistBonus?: number;
}
export interface Player {
  id: string; name: string; age: number; nationality: string; position: PlayerPosition; overall: AttributeScore; attributes: PlayerAttributes;
  /** Current dynamic potential; absent on legacy saves by design. */
  potential?: AttributeScore;
  /** Potential assigned when the player was created; remains unchanged as potential develops. */
  initialPotential?: AttributeScore;
  /** Small accumulated weekly potential-development signal, persisted with saves. */
  potentialMomentum?: number;
  /** Most recent weekly potential movement: -1, 0 or +1. */
  potentialTrend?: -1 | 0 | 1;
  role?: string; secondaryPositions?: PlayerPosition[]; appearance?: { hairStyle: string; hairColor: string; eyeColor: string };
  heightCm?: number; weightKg?: number; preferredFoot?: 'right' | 'left' | 'ambidextrous'; birthCountry?: string; birthRegion?: string; birthCity?: string;
  contract?: Contract; marketValue?: number; morale?: number; coachRelationship?: number; fanRelationship?: number; mediaReputation?: number;
}
export type TacticalStyle = 'balanced' | 'possession' | 'counterAttack' | 'highPress';
export type MatchInstruction = 'balanced' | 'keepPossession' | 'throughBall' | 'longShot' | 'pressHigh';
export interface Team { id: string; name: string; shortName: string; league: string; rating: number; players: Player[]; startingXI: string[]; substitutes: string[]; tacticalStyle?: TacticalStyle; }
export type MatchEventType = 'chance' | 'goal' | 'yellowCard' | 'redCard' | 'substitution' | 'injury';
export interface MatchEvent {
  minute: number; type: MatchEventType; teamId: string; description: string; playerId?: string; playerName?: string;
  relatedPlayerId?: string; relatedPlayerName?: string; assistPlayerId?: string; assistPlayerName?: string;
}
export interface TeamMatchStats { shots: number; shotsOnTarget: number; possession: number; yellowCards: number; redCards: number; passes?: number; passAccuracy?: number; tackles?: number; }
export interface PlayerMatchStats { minutes: number; goals: number; assists: number; shots: number; yellowCards: number; redCards: number; rating: number; }
export interface MatchResult {
  matchId: string; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number;
  events: MatchEvent[]; stats: Record<string, TeamMatchStats>; playerFatigue: Record<string, number>; playerStats?: Record<string, PlayerMatchStats>;
}
export interface MatchSimulationOptions {
  duration?: number; random?: () => number; maxSubstitutions?: number; matchId?: string;
  initialFatigue?: Record<string, number>; instruction?: MatchInstruction; instructionTeamId?: string; minuteOffset?: number;
  initialPlayerStats?: Record<string, PlayerMatchStats>; sentOffPlayerIds?: string[];
}
export interface Fixture { id: string; week: number; homeTeamId: string; awayTeamId: string; result?: MatchResult; }
export interface LeagueRow { teamId: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number; }
export interface ValuePoint { week: number; value: number; }
export interface MatchHistoryEntry { week: number; opponent: string; score: string; rating: number; /** Optional to keep older saves valid. */ minutes?: number; goals: number; assists: number; yellowCards: number; redCards: number; }
export interface CareerStats {
  appearances: number; goals: number; assists: number; yellowCards: number; redCards: number; ratingTotal: number;
  /** Cumulative minutes played; optional for backward compatibility with older saves. */
  totalMinutes?: number;
  matchHistory: MatchHistoryEntry[]; fatigue: number; marketValueHistory?: ValuePoint[]; overallHistory?: ValuePoint[];
}
export interface TransferOffer { id: string; playerId: string; clubId: string; fee: number; joiningBonus: number; weeklyWage: number; contractYears: number; status: 'pending' | 'accepted' | 'rejected' | 'countered'; }
export interface SponsorOffer { id: string; brand: string; weeklyIncome: number; durationWeeks: number; status: 'pending' | 'active' | 'declined' | 'expired'; weeksRemaining: number; }
export type TrainingFocus = keyof PlayerAttributes['technical'] | keyof PlayerAttributes['physical'] | keyof PlayerAttributes['mental'];
export interface TrainingSummary {
  week: number; focus: TrainingFocus; intensity: 'recovery' | 'balanced' | 'high'; previousValue: number; currentValue: number; attributeGain: number; fatigueChange: number; injuryName?: string;
}
export type InjurySeverity = 'minor' | 'moderate' | 'serious';
export interface InjuryStatus { id: string; name: string; severity: InjurySeverity; weeksRemaining: number; occurredWeek: number; }
export type PressAnswer = 'team_first' | 'confident' | 'humble';
export interface PendingPress { id: string; week: number; opponent: string; score: string; outcome: 'win' | 'draw' | 'loss'; rating: number; }
export interface PressHistoryEntry { week: number; opponent: string; answer: PressAnswer; headline: string; }
export type RecoveryAsset = 'recoveryBoots' | 'personalTrainer';

export interface GameSave {
  version: number; player: Player; clubId: string; balance: number; week: number; trainingFocus: TrainingFocus; tacticalStyle: TacticalStyle;
  trainedThisWeek: boolean; matchPlayedThisWeek: boolean; lastMatch?: MatchResult; playedMatches: number; agentHired: boolean;
  fixtures: Fixture[]; leagueTable: LeagueRow[]; career: CareerStats; transferOffers: TransferOffer[]; sponsorships: SponsorOffer[];
  offersGeneratedWeek: number; sponsorOffersGeneratedWeek: number; season: number; contractActionSeason: number;
  injuries?: InjuryStatus[]; pendingPress?: PendingPress; pressHistory?: PressHistoryEntry[]; recoveryAssets?: RecoveryAsset[]; personalTrainer?: boolean; lastTraining?: TrainingSummary;
  /** Optional completed original-fiction academy chapter; absent on legacy saves. */
  academyDevelopment?: { academyLabel: string; completed: boolean; choices: string[]; route: 'first-team' | 'reserve'; promisedMinutes: number };
  /** Optional, explicitly fictional nationality-based pathway choice; not a real club contract. */
  careerPathway?: { country: 'portugal' | 'brazil' | 'italy' | 'spain'; offerId: string };
}
