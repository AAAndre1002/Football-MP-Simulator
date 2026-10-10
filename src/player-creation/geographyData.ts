

// The birthplace catalogue remains complete; only clearly non-nationality entries are omitted from the flag picker.
// This is a practical exclusion list, not a claim that every remaining option is a FIFA member.
const NON_FOOTBALL_NATIONALITY_CODES = new Set(['AQ', 'BV', 'GS', 'HM', 'IO', 'TF', 'UM', 'SJ']);
export const NATIONALITY_OPTIONS: readonly CountryOption[] = COUNTRY_OPTIONS.filter(country => !NON_FOOTBALL_NATIONALITY_CODES.has(country.code));
