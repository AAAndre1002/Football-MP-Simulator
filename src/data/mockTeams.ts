import type { Player, PlayerPosition, Team, Fixture, LeagueRow } from '../types';

const positions: PlayerPosition[] = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST', 'LW'];
const names = ['Tiago Reis', 'Miguel Costa', 'Rui Santos', 'João Neves', 'Diogo Lima', 'André Martins', 'Bruno Rocha', 'Fábio Alves', 'Rafael Pinto', 'Tomás Silva', 'Nuno Correia'];
function makePlayer(id: string, name: string, position: PlayerPosition, overall: number): Player {
  const value = (offset: number) => Math.max(35, Math.min(95, overall + offset));
  return { id, name, position, age: 19 + (overall % 11), nationality: 'Portugal', overall, marketValue: overall * 85000, morale: 70, coachRelationship: 65, fanRelationship: 60,
    attributes: { physical: { pace: value(3), acceleration: value(2), stamina: value(-2), strength: value(0), agility: value(1) }, technical: { passing: value(0), shooting: value(-1), dribbling: value(1), tackling: value(-2), vision: value(0), ballControl: value(1) }, mental: { decisions: value(-1), positioning: value(0), teamwork: value(2), composure: value(0), leadership: value(-5) }, ...(position === 'GK' ? { goalkeeping: { reflexes: value(1), handling: value(0), positioning: value(2) } } : {}) } };
}
function makeSquad(prefix: string, club: string, base: number): Team {
  const players = [...positions.map((position, i) => makePlayer(`${prefix}-${i + 1}`, prefix === 'smf' && i === 10 ? 'André Costa' : names[i], position, base + (i % 4))),
    makePlayer(`${prefix}-12`, 'Gonçalo Mendes', 'CM', base - 2), makePlayer(`${prefix}-13`, 'Pedro Carvalho', 'ST', base - 1), makePlayer(`${prefix}-14`, 'Vasco Ferreira', 'CB', base - 3), makePlayer(`${prefix}-15`, 'Sérgio Ramos', 'LW', base - 2)];
  return { id: prefix, name: club, shortName: club.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(), league: 'Liga Portuguesa', rating: base, players, startingXI: players.slice(0, 11).map(p => p.id), substitutes: players.slice(11).map(p => p.id), tacticalStyle: 'balanced' };
}
export const playerClub = makeSquad('smf', 'Feira Athletic', 68);
export const opponentClub = makeSquad('porto-norte', 'Porto Norte', 70);
export const leagueTeams: Team[] = [playerClub, opponentClub, makeSquad('lisboa', 'Lisboa Real', 72), makeSquad('braga', 'Braga SC', 69), makeSquad('coimbra', 'Coimbra União', 66), makeSquad('algarve', 'Algarve FC', 65)];
export const playerCharacter = playerClub.players.find(p => p.id === 'smf-11')!;
export function makeFixtures(teams: Team[], season = 1): Fixture[] {
  // Circle-method double round robin: each club plays every other club home and away.
  const ids = teams.map(t => t.id); if (ids.length % 2) ids.push('BYE');
  const rounds = ids.length - 1; const half = ids.length / 2; let rotation = [...ids]; const fixtures: Fixture[] = [];
  for (let round = 0; round < rounds * 2; round++) {
    for (let i = 0; i < half; i++) {
      let home = rotation[i], away = rotation[rotation.length - 1 - i];
      if (home === 'BYE' || away === 'BYE') continue;
      const firstLegSwap = (round % rounds) % 2 === 1;
      if (round >= rounds ? !firstLegSwap : firstLegSwap) [home, away] = [away, home];
      fixtures.push({ id: `s${season}-w${round + 1}-${home}-${away}`, week: round + 1, homeTeamId: home, awayTeamId: away });
    }
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }
  return fixtures;
}
export function emptyLeagueTable(teams: Team[]): LeagueRow[] { return teams.map(team => ({ teamId: team.id, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 })); }
