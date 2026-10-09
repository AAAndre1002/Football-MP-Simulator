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
  weeklyWage: number; releaseClause?: number; signingBonus?: number;
}

export interface Player {
  id: string; name: string; age: number; nationality: string; position: PlayerPosition;
  overall: AttributeScore; attributes: PlayerAttributes; contract?: Contract;
  marketValue?: number; morale?: number; coachRelationship?: number; fanRelationship?: number;
}

export type TacticalStyle = 'balanced' | 'possession' | 'counterAttack' | 'highPress';
export interface Team {
  id: string; name: string; shortName: string; league: string; rating: number;
  players: Player[]; startingXI: string[]; substitutes: string[]; tacticalStyle?: TacticalStyle;
}

export type MatchEventType = 'chance' | 'goal' | 'yellowCard' | 'redCard' | 'substitution';
export interface MatchEvent {
  minute: number; type: MatchEventType; teamId: string; description: string;
  playerId?: string; playerName?: string; relatedPlayerId?: string; relatedPlayerName?: string;
}
export interface TeamMatchStats {
  shots: number; shotsOnTarget: number; possession: number; yellowCards: number; redCards: number;
}
export interface MatchResult {
  matchId: string; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number;
  events: MatchEvent[]; stats: Record<string, TeamMatchStats>; playerFatigue: Record<string, number>;
}
export interface MatchSimulationOptions { duration?: number; random?: () => number; maxSubstitutions?: number; }

export interface GameSave {
  player: Player;
  clubId: string;
  balance: number;
  week: number;
  trainingFocus: keyof PlayerAttributes['technical'] | keyof PlayerAttributes['physical'] | keyof PlayerAttributes['mental'];
  lastMatch?: MatchResult;
  playedMatches: number;
  agentHired: boolean;
}

export interface TransferOffer { id: string; playerId: string; clubId: string; fee: number; weeklyWage: number; contractYears: number; status: 'pending' | 'accepted' | 'rejected'; }
export interface Sponsorship { id: string; brand: string; weeklyIncome: number; durationWeeks: number; }
