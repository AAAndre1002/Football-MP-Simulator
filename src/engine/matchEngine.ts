import type { MatchEvent, MatchResult, MatchSimulationOptions, Player, Team } from '../types';

interface PlayerState { player: Player; fatigue: number; onPitch: boolean; sentOff: boolean; }
interface TeamState {
  team: Team; players: Map<string, PlayerState>; activeIds: string[]; benchIds: string[];
  subsUsed: number; shots: number; shotsOnTarget: number; yellows: number; reds: number; possessionTicks: number;
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function setup(team: Team, initialFatigue: Record<string, number> = {}): TeamState {
  const players = new Map(team.players.map(player => [player.id, { player, fatigue: clamp(initialFatigue[player.id] ?? 0, 0, 100), onPitch: false, sentOff: false }]));
  const starters = (team.startingXI.length ? team.startingXI : team.players.slice(0, 11).map(p => p.id)).filter(id => players.has(id));
  starters.forEach(id => { const state = players.get(id); if (state) state.onPitch = true; });
  return {
    team, players, activeIds: starters,
    benchIds: team.substitutes.filter(id => players.has(id) && !starters.includes(id)),
    subsUsed: 0, shots: 0, shotsOnTarget: 0, yellows: 0, reds: 0, possessionTicks: 0,
  };
}
function active(team: TeamState) {
  return team.activeIds.map(id => team.players.get(id)).filter((p): p is PlayerState => !!p && p.onPitch && !p.sentOff);
}
function attackPower(team: TeamState) {
  const players = active(team);
  return mean(players.map(({ player }) => {
    const a = player.attributes;
    return (a.technical.passing + a.technical.shooting + a.technical.dribbling + a.technical.vision + a.mental.decisions) / 5;
  })) * (1 - mean(players.map(p => p.fatigue)) / 250) * (0.9 + (mean(players.map(p => p.player.morale ?? 60)) / 600));
}
function defencePower(team: TeamState) {
  const players = active(team);
  return mean(players.map(({ player }) => {
    const a = player.attributes;
    return (a.technical.tackling + a.mental.positioning + a.mental.decisions + a.physical.strength) / 4;
  })) * (1 - mean(players.map(p => p.fatigue)) / 300) * (0.9 + (mean(players.map(p => p.player.morale ?? 60)) / 600));
}
function styleBonus(team: Team) {
  switch (team.tacticalStyle) {
    case 'possession': return 0.012;
    case 'counterAttack': return 0.008;
    case 'highPress': return 0.018;
    default: return 0;
  }
}
function keeperRating(team: TeamState) {
  const keeper = active(team).find(p => p.player.position === 'GK');
  const stats = keeper?.player.attributes.goalkeeping;
  return stats ? (stats.reflexes + stats.handling + stats.positioning) / 3 : keeper ? 55 : 42;
}
function updateFatigue(team: TeamState) {
  active(team).forEach(state => {
    const stamina = clamp(state.player.attributes.physical.stamina, 0, 99);
    state.fatigue = clamp(state.fatigue + 0.28 + ((99 - stamina) / 99) * 0.34, 0, 100);
  });
}
function substitute(team: TeamState, minute: number, limit: number, events: MatchEvent[]) {
  if (minute < 60 || team.subsUsed >= limit || !team.benchIds.length) return;
  const tired = active(team).filter(p => p.player.position !== 'GK').sort((a, b) => b.fatigue - a.fatigue)[0];
  if (!tired || tired.fatigue < 68) return;
  const incomingId = team.benchIds.shift();
  const incoming = incomingId ? team.players.get(incomingId) : undefined;
  if (!incoming || !incomingId) return;
  tired.onPitch = false;
  incoming.onPitch = true;
  team.activeIds = team.activeIds.filter(id => id !== tired.player.id).concat(incomingId);
  team.subsUsed++;
  events.push({ minute, type: 'substitution', teamId: team.team.id, playerId: incoming.player.id, playerName: incoming.player.name, relatedPlayerId: tired.player.id, relatedPlayerName: tired.player.name, description: `${incoming.player.name} substitui ${tired.player.name}.` });
}
function card(team: TeamState, minute: number, random: () => number, events: MatchEvent[]) {
  if (random() > 0.012) return;
  const candidates = active(team).filter(p => p.player.position !== 'GK');
  if (!candidates.length) return;
  const player = candidates[Math.floor(random() * candidates.length)];
  if (random() < 0.06) {
    player.sentOff = true; player.onPitch = false; team.activeIds = team.activeIds.filter(id => id !== player.player.id); team.reds++;
    events.push({ minute, type: 'redCard', teamId: team.team.id, playerId: player.player.id, playerName: player.player.name, description: `Cartão vermelho para ${player.player.name}.` });
  } else {
    team.yellows++;
    events.push({ minute, type: 'yellowCard', teamId: team.team.id, playerId: player.player.id, playerName: player.player.name, description: `Cartão amarelo para ${player.player.name}.` });
  }
}
function attack(attacking: TeamState, defending: TeamState, minute: number, random: () => number, events: MatchEvent[]) {
  const candidates = active(attacking).filter(p => p.player.position !== 'GK');
  if (!candidates.length) return;
  const shooter = candidates[Math.floor(random() * candidates.length)];
  attacking.shots++;
  const shooting = shooter.player.attributes.technical.shooting * (1 - shooter.fatigue / 220);
  const onTarget = clamp(0.32 + (shooting - defencePower(defending)) * 0.004, 0.18, 0.78);
  if (random() > onTarget) {
    events.push({ minute, type: 'chance', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, description: `${shooter.player.name} remata, mas a bola sai ao lado.` });
    return;
  }
  attacking.shotsOnTarget++;
  const goalChance = clamp(0.12 + (shooting - keeperRating(defending)) * 0.003, 0.04, 0.42);
  if (random() < goalChance) {
    const helpers = candidates.filter(p => p.player.id !== shooter.player.id);
    const assist = helpers.length && random() < 0.62 ? helpers[Math.floor(random() * helpers.length)] : undefined;
    events.push({ minute, type: 'goal', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, assistPlayerId: assist?.player.id, assistPlayerName: assist?.player.name, description: `GOLO! ${shooter.player.name}${assist ? `, após assistência de ${assist.player.name},` : ''} marca para ${attacking.team.name}.` });
  } else {
    events.push({ minute, type: 'chance', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, description: `Remate de ${shooter.player.name}; o guarda-redes defende.` });
  }
}

export function simulateMatch(homeTeam: Team, awayTeam: Team, options: MatchSimulationOptions = {}): MatchResult {
  if (homeTeam.id === awayTeam.id) throw new Error('As equipas têm de ser diferentes.');
  const duration = Math.max(1, Math.floor(options.duration ?? 90));
  const maxSubs = Math.max(0, Math.floor(options.maxSubstitutions ?? 5));
  const random = options.random ?? Math.random;
  const home = setup(homeTeam, options.initialFatigue); const away = setup(awayTeam, options.initialFatigue);
  const events: MatchEvent[] = [];

  for (let minute = 1; minute <= duration; minute++) {
    updateFatigue(home); updateFatigue(away);
    substitute(home, minute, maxSubs, events); substitute(away, minute, maxSubs, events);
    card(home, minute, random, events); card(away, minute, random, events);
    const homePressure = Math.max(1, attackPower(home) - defencePower(away) + 50 + styleBonus(homeTeam) * 100);
    const awayPressure = Math.max(1, attackPower(away) - defencePower(home) + 50 + styleBonus(awayTeam) * 100);
    const attacking = random() < homePressure / (homePressure + awayPressure) ? home : away;
    const defending = attacking === home ? away : home;
    attacking.possessionTicks++;
    const chance = clamp(0.14 + (attackPower(attacking) - defencePower(defending)) * 0.001 + styleBonus(attacking.team), 0.07, 0.24);
    if (random() < chance) attack(attacking, defending, minute, random, events);
  }

  const totalPossession = home.possessionTicks + away.possessionTicks || 1;
  const homeScore = events.filter(e => e.type === 'goal' && e.teamId === homeTeam.id).length;
  const awayScore = events.filter(e => e.type === 'goal' && e.teamId === awayTeam.id).length;
  const stats = (team: TeamState, possession: number) => ({ shots: team.shots, shotsOnTarget: team.shotsOnTarget, possession, yellowCards: team.yellows, redCards: team.reds });
  const playerFatigue: Record<string, number> = {};
  [home, away].forEach(team => team.players.forEach((state, id) => { playerFatigue[id] = Math.round(state.fatigue * 10) / 10; }));

  return {
    matchId: options.matchId ?? `${homeTeam.id}-${awayTeam.id}-${Math.floor(random() * 1_000_000_000)}`, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id,
    homeScore, awayScore, events,
    stats: { [homeTeam.id]: stats(home, Math.round(home.possessionTicks / totalPossession * 100)), [awayTeam.id]: stats(away, Math.round(away.possessionTicks / totalPossession * 100)) },
    playerFatigue,
  };
}
