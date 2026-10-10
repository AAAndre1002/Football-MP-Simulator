import { describe, expect, it } from 'vitest';
import { countryRouteForNationality, offersForCountry, getCareerPathway } from './clubOffers';
import { competitionForCountry, competitionClubReferences } from '../data/competitionClubs';

describe('second-tier pathway simulations', () => {
  it('recognizes supported nationalities and includes only cited club-name references', () => {
    expect(countryRouteForNationality('Português')).toBe('portugal');
    expect(countryRouteForNationality('Portugal')).toBe('portugal');
    expect(countryRouteForNationality('Brasileiro')).toBe('brazil');
    expect(countryRouteForNationality('Itália')).toBe('italy');
    expect(countryRouteForNationality('Español')).toBe('spain');
    expect(competitionClubReferences.map(item => item.names.length)).toEqual([18, 20, 20, 22]);
    for (const country of ['portugal', 'brazil', 'italy', 'spain'] as const) {
      const offers = offersForCountry(country);
      expect(offers).toHaveLength(3);
      expect(new Set(offers.map(item => item.id)).size).toBe(3);
      expect(offers.every(item => item.competition && item.clubName && item.sourceUrl && item.sourceSeason && item.sourceCheckedAt === '2026-10-10' && competitionForCountry(country)?.names.includes(item.clubName))).toBe(true);
    }
    expect(getCareerPathway({ country: 'portugal', offerId: 'portugal-offer-2' })?.clubName).toBe('Feirense');
    expect(getCareerPathway({ country: 'portugal', offerId: 'portugal-real-club-1' })).toBeUndefined();
  });
});
