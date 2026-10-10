export type FootballCountry = 'portugal' | 'brazil' | 'italy' | 'spain';
export interface ClubOfferOption {
  id: string; competition: string; clubName: string; level: number; role: string; promisedMinutes: number;
  sourceSeason: string; sourceUrl: string; sourceLabel: string; sourceCheckedAt: string;
}
export interface CareerPathway { country: FootballCountry; offerId: string; }
type OfferSeed = Omit<ClubOfferOption, 'id' | 'sourceCheckedAt'>;
const SOURCE_CHECKED_AT = '2026-10-10';

// Club/competition names are factual references only. Ratings, role, promised minutes and
// offer scenarios are gameplay approximations, not real club offers or current sporting data.
const options: Record<FootballCountry, OfferSeed[]> = {
  portugal: [
    { competition: 'Liga Portugal 2 Meu Super', clubName: 'Portimonense', level: 62, role: 'Extremo de rotação', promisedMinutes: 720, sourceSeason: '2026/27', sourceUrl: 'https://www.portimonensesad.pt/calendario-definido-liga-portugal-2-meu-super-26-27-ja-tem-datas-oficiais_25755', sourceLabel: 'Portimonense SAD · notícia da época 2026/27' },
    { competition: 'Liga Portugal 2 Meu Super', clubName: 'Feirense', level: 60, role: 'Médio de desenvolvimento', promisedMinutes: 1080, sourceSeason: '2026/27', sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Liga_Portugal_2', sourceLabel: 'Lista pública de participantes 2026/27' },
    { competition: 'Liga Portugal 2 Meu Super', clubName: 'Amarante', level: 58, role: 'Projeto de titularidade', promisedMinutes: 450, sourceSeason: '2026/27', sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Liga_Portugal_2', sourceLabel: 'Lista pública de participantes 2026/27' },
  ],
  brazil: [
    { competition: 'Campeonato Brasileiro Série B', clubName: 'Juventude', level: 64, role: 'Extremo de rotação', promisedMinutes: 720, sourceSeason: '2026', sourceUrl: 'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2026', sourceLabel: 'CBF · tabela oficial Série B 2026' },
    { competition: 'Campeonato Brasileiro Série B', clubName: 'Vila Nova', level: 62, role: 'Médio de desenvolvimento', promisedMinutes: 1080, sourceSeason: '2026', sourceUrl: 'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2026', sourceLabel: 'CBF · tabela oficial Série B 2026' },
    { competition: 'Campeonato Brasileiro Série B', clubName: 'Criciúma', level: 61, role: 'Projeto de titularidade', promisedMinutes: 450, sourceSeason: '2026', sourceUrl: 'https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2026', sourceLabel: 'CBF · tabela oficial Série B 2026' },
  ],
  italy: [
    { competition: 'Serie BKT', clubName: 'Pisa', level: 64, role: 'Extremo de rotação', promisedMinutes: 720, sourceSeason: '2026/27', sourceUrl: 'https://www.legab.it/news/serie-bkt-2026-2027-curiosita-e-statistiche-delle-20-squadre', sourceLabel: 'Lega B · clubes da Serie BKT 2026/27' },
    { competition: 'Serie BKT', clubName: 'Carrarese', level: 61, role: 'Médio de desenvolvimento', promisedMinutes: 1080, sourceSeason: '2026/27', sourceUrl: 'https://www.legab.it/news/serie-bkt-2026-2027-curiosita-e-statistiche-delle-20-squadre', sourceLabel: 'Lega B · clubes da Serie BKT 2026/27' },
    { competition: 'Serie BKT', clubName: 'Empoli', level: 65, role: 'Projeto de titularidade', promisedMinutes: 450, sourceSeason: '2026/27', sourceUrl: 'https://www.legab.it/news/serie-bkt-2026-2027-curiosita-e-statistiche-delle-20-squadre', sourceLabel: 'Lega B · clubes da Serie BKT 2026/27' },
  ],
  spain: [
    { competition: 'LaLiga Hypermotion', clubName: 'UD Almería', level: 65, role: 'Extremo de rotação', promisedMinutes: 720, sourceSeason: '2026/27', sourceUrl: 'https://www.udalmeriasad.com/en/news/los-22-de-la-proxima-liga-hypermotion', sourceLabel: 'UD Almería · lista confirmada 2026/27' },
    { competition: 'LaLiga Hypermotion', clubName: 'CD Castellón', level: 62, role: 'Médio de desenvolvimento', promisedMinutes: 1080, sourceSeason: '2026/27', sourceUrl: 'https://www.udalmeriasad.com/en/news/los-22-de-la-proxima-liga-hypermotion', sourceLabel: 'UD Almería · lista confirmada 2026/27' },
    { competition: 'LaLiga Hypermotion', clubName: 'Burgos CF', level: 60, role: 'Projeto de titularidade', promisedMinutes: 450, sourceSeason: '2026/27', sourceUrl: 'https://www.udalmeriasad.com/en/news/los-22-de-la-proxima-liga-hypermotion', sourceLabel: 'UD Almería · lista confirmada 2026/27' },
  ],
};

export function countryRouteForNationality(nationality: string): FootballCountry | null {
  const value = nationality.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (['portugal', 'portugues', 'portuguesa', 'portuguese'].includes(value)) return 'portugal';
  if (['brasil', 'brasileiro', 'brasileira', 'brazil', 'brazilian'].includes(value)) return 'brazil';
  if (['italia', 'italiano', 'italiana', 'italian'].includes(value)) return 'italy';
  if (['espanha', 'espana', 'espanhol', 'espanhola', 'espanol', 'espanola', 'spanish'].includes(value)) return 'spain';
  return null;
}

export function offersForCountry(country: FootballCountry): ClubOfferOption[] {
  return options[country].map((offer, index) => ({ ...offer, id: `${country}-offer-${index + 1}`, sourceCheckedAt: SOURCE_CHECKED_AT }));
}

export function getCareerPathway(pathway: CareerPathway | undefined): ClubOfferOption | undefined {
  if (!pathway) return undefined;
  return offersForCountry(pathway.country).find(offer => offer.id === pathway.offerId);
}
