import type { Contract, Player, Team, TransferOffer } from '../types';
import { calculateMarketValue } from './playerDevelopment';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export interface OfferContext { player: Player; currentClubId: string; clubs: Team[]; season: number; week: number; agentHired: boolean; recentRatings?: number[]; random: () => number; }

export function generateTransferOffers(context: OfferContext): TransferOffer[] {
  const { player, currentClubId, clubs, season, week, agentHired, random } = context;
  const value = player.marketValue ?? calculateMarketValue(player, context.recentRatings);
  const form = context.recentRatings?.length ? context.recentRatings.slice(-5).reduce((sum, x) => sum + x, 0) / Math.min(5, context.recentRatings.length) : 6;
  const reputation = player.mediaReputation ?? 50;
  const interest = clamp(0.12 + (player.overall - 55) * 0.017 + (form - 5.5) * 0.045 + (reputation - 40) * 0.003 + (agentHired ? 0.22 : 0), 0.05, 0.96);
  return clubs
    .filter(club => club.id !== currentClubId)
    .map(club => ({ club, fit: clamp(0.45 + (player.overall - club.rating) * 0.025 + random() * 0.28 + (agentHired ? 0.12 : 0), 0, 1) }))
    .filter(candidate => random() < interest * candidate.fit)
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 2)
    .map(({ club }, index) => {
      const salaryFactor = clamp(0.82 + (club.rating - player.overall) * 0.012 + (agentHired ? 0.16 : 0) + random() * 0.2, 0.65, 1.65);
      const wage = Math.round((player.contract?.weeklyWage ?? 800) * salaryFactor);
      return {
        id: `offer-${season}-${week}-${club.id}-${index}`,
        playerId: player.id,
        clubId: club.id,
        fee: Math.round(value * (0.82 + random() * 0.38) * (agentHired ? 1.12 : 1)),
        joiningBonus: Math.round(wage * (agentHired ? 8 : 4)),
        weeklyWage: wage,
        contractYears: 2 + Math.floor(random() * 3),
        status: 'pending' as const,
      };
    });
}

export function counterOffer(offer: TransferOffer, player: Player, agentHired: boolean): TransferOffer {
  const floor = player.contract?.weeklyWage ?? 800;
  const multiplier = agentHired ? 1.18 : 1.1;
  const ceiling = Math.max(floor * 2.1, offer.weeklyWage * 1.35);
  return { ...offer, status: 'countered', weeklyWage: Math.round(clamp(offer.weeklyWage * multiplier, floor, ceiling)), fee: Math.round(offer.fee * (agentHired ? 1.08 : 1.04)), joiningBonus: Math.round(offer.joiningBonus * (agentHired ? 1.15 : 1.08)) };
}

export function evaluateOffer(offer: TransferOffer, player: Player): { score: number; recommendation: 'accept' | 'negotiate' | 'reject' } {
  const value = player.marketValue ?? calculateMarketValue(player);
  const wageRatio = offer.weeklyWage / Math.max(1, player.contract?.weeklyWage ?? 1);
  const score = Math.round(clamp((offer.fee / Math.max(value, 1)) * 55 + clamp(wageRatio, 0, 2.5) * 18 + (offer.contractYears >= 3 ? 8 : 0), 0, 100));
  return { score, recommendation: score >= 72 ? 'accept' : score >= 48 ? 'negotiate' : 'reject' };
}

export function contractFromOffer(offer: TransferOffer, player: Player, season: number): Contract {
  const year = 2026 + Math.max(0, season - 1);
  return {
    id: `contract-${season}-${offer.clubId}-${player.id}`,
    playerId: player.id,
    teamId: offer.clubId,
    startDate: `${year}-07-01`,
    endDate: `${year + offer.contractYears}-06-30`,
    weeklyWage: offer.weeklyWage,
    signingBonus: offer.joiningBonus,
    goalBonus: Math.round(offer.weeklyWage * 0.45),
    assistBonus: Math.round(offer.weeklyWage * 0.3),
    releaseClause: Math.max(offer.fee * 2, offer.fee + 250_000),
  };
}
