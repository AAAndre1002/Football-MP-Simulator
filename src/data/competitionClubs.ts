export type CompetitionCountry = 'portugal' | 'brazil' | 'italy' | 'spain';
export interface CompetitionClubReference {
  country: CompetitionCountry;
  competition: string;
  sourceSeason: string;
  names: readonly string[];
  sourceUrl: string;
  sourceType: 'league' | 'club' | 'public-secondary';
  sourceCheckedAt: string;
}
const checked = '2026-10-10';

/** Team-name snapshots only; no badges, images, rosters, staff, live ranking or inferred statistics. */
export const competitionClubReferences: readonly CompetitionClubReference[] = [
  {
    country: 'portugal', competition: 'Liga Portugal 2 Meu Super', sourceSeason: '2026/27',
    names: ['Académica de Coimbra', 'AFS', 'Amarante', 'Benfica B', 'Chaves', 'Farense', 'Feirense', 'Felgueiras', 'Leixões', 'Lusitânia Lourosa', 'Penafiel', 'Portimonense', 'Porto B', 'Sporting CP B', 'Tondela', 'Torreense', 'União de Leiria', 'Vizela'],
    sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Liga_Portugal_2', sourceType: 'public-secondary', sourceCheckedAt: checked,
  },
  {
    country: 'brazil', competition: 'Campeonato Brasileiro Série B', sourceSeason: '2026',
    names: ['Juventude', 'Vila Nova', 'Grêmio Novorizontino', 'Fortaleza', 'Criciúma', 'Atlético Goianiense', 'CRB', 'Sport Recife', 'Operário', 'Cuiabá', 'Goiás', 'São Bernardo', 'Náutico', 'Ceará', 'Athletic', 'Botafogo', 'Avaí', 'Londrina', 'América', 'Ponte Preta'],
    sourceUrl: 'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2026', sourceType: 'league', sourceCheckedAt: checked,
  },
  {
    country: 'italy', competition: 'Serie BKT', sourceSeason: '2026/27',
    names: ['Arezzo', 'Ascoli', 'Avellino', 'Benevento', 'Carrarese', 'Catanzaro', 'Cesena', 'Cremonese', 'Empoli', 'Hellas Verona', 'Juve Stabia', 'L.R. Vicenza', 'Mantova', 'Modena', 'Padova', 'Palermo', 'Pisa', 'Sampdoria', 'Südtirol', 'Virtus Entella'],
    sourceUrl: 'https://www.legab.it/news/serie-bkt-2026-2027-curiosita-e-statistiche-delle-20-squadre', sourceType: 'league', sourceCheckedAt: checked,
  },
  {
    country: 'spain', competition: 'LaLiga Hypermotion', sourceSeason: '2026/27',
    names: ['UD Almería', 'CD Castellón', 'UD Las Palmas', 'Burgos CF', 'SD Eibar', 'Real Sporting de Gijón', 'Córdoba CF', 'AD Ceuta FC', 'Albacete Balompié', 'FC Andorra', 'Granada CF', 'Real Sociedad B', 'Cádiz CF', 'CD Leganés', 'Real Valladolid CF', 'RCD Mallorca', 'Girona FC', 'Real Oviedo', 'CD Tenerife', 'CD Eldense', 'CE Sabadell', 'Celta Fortuna'],
    sourceUrl: 'https://www.udalmeriasad.com/en/news/los-22-de-la-proxima-liga-hypermotion', sourceType: 'club', sourceCheckedAt: checked,
  },
];

export function competitionForCountry(country: CompetitionCountry): CompetitionClubReference | undefined {
  return competitionClubReferences.find(item => item.country === country);
}
