import type { MatchEvent, MatchInstruction, MatchResult, MatchSimulationOptions, Player, PlayerMatchStats, Team, TeamMatchStats } from '../types';

interface PlayerState { player: Player; fatigue: number; onPitch: boolean; sentOff: boolean; stats: PlayerMatchStats; }
interface TeamState {
  team: Team; players: Map<string, PlayerState>; activeIds: string[]; benchIds: string[]; subsUsed: number;
  shots: number; shotsOnTarget: number; yellows: number; reds: number; possessionTicks: number;
  passes: number; completedPasses: number; tackles: number;
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
function seededRandom(seed: string): () => number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i++) { value ^= seed.charCodeAt(i); value = Math.imul(value, 16777619); }
  return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function setup(team: Team, fatigue: Record<string, number>, initialStats: Record<string, PlayerMatchStats> = {}, dismissed: string[] = []): TeamState {
  const sentOffIds = new Set(dismissed);
  const players = new Map(team.players.map(player => [player.id, {
    player, fatigue: clamp(fatigue[player.id] ?? 0, 0, 100), onPitch: false, sentOff: sentOffIds.has(player.id),
    stats: initialStats[player.id] ? { ...initialStats[player.id] } : { minutes: 0, goals: 0, assists: 0, shots: 0, yellowCards: 0, redCards: 0, rating: 6 },
  }]));
  const starters = (team.startingXI.length ? team.startingXI : team.players.slice(0, 11).map(p => p.id)).filter(id => players.has(id) && !sentOffIds.has(id));
  starters.forEach(id => { const state = players.get(id); if (state) state.onPitch = true; });
  return { team, players, activeIds: starters, benchIds: team.substitutes.filter(id => players.has(id) && !starters.includes(id) && !sentOffIds.has(id)), subsUsed: 0, shots: 0, shotsOnTarget: 0, yellows: 0, reds: 0, possessionTicks: 0, passes: 0, completedPasses: 0, tackles: 0 };
}
function active(team: TeamState) { return team.activeIds.map(id => team.players.get(id)).filter((p): p is PlayerState => !!p && p.onPitch && !p.sentOff); }
function attackPower(team: TeamState) {
  const players = active(team);
  const skill = mean(players.map(({ player }) => { const a = player.attributes; return (a.technical.passing + a.technical.shooting + a.technical.dribbling + a.technical.vision + a.mental.decisions) / 5; }));
  return skill * (1 - mean(players.map(p => p.fatigue)) / 250) * (0.9 + mean(players.map(p => p.player.morale ?? 60)) / 600);
}
function defencePower(team: TeamState) {
  const players = active(team);
  return mean(players.map(({ player }) => { const a = player.attributes; return (a.technical.tackling + a.mental.positioning + a.mental.decisions + a.physical.strength) / 4; })) * (1 - mean(players.map(p => p.fatigue)) / 300);
}
function styleBonus(team: Team) { return team.tacticalStyle === 'possession' ? 0.012 : team.tacticalStyle === 'counterAttack' ? 0.008 : team.tacticalStyle === 'highPress' ? 0.018 : 0; }
function keeperRating(team: TeamState) {
  const keeper = active(team).find(p => p.player.position === 'GK'); const stats = keeper?.player.attributes.goalkeeping;
  return stats ? (stats.reflexes + stats.handling + stats.positioning) / 3 : keeper ? 55 : 42;
}
function updateFatigue(team: TeamState, press: boolean) {
  active(team).forEach(state => { state.stats.minutes += 1; const stamina = clamp(state.player.attributes.physical.stamina, 0, 99); state.fatigue = clamp(state.fatigue + 0.28 + ((99 - stamina) / 99) * 0.34 + (press ? 0.12 : 0), 0, 100); });
}
function substitute(team: TeamState, minute: number, limit: number, events: MatchEvent[]) {
  if (minute < 60 || team.subsUsed >= limit || !team.benchIds.length) return;
  const tired = active(team).filter(p => p.player.position !== 'GK').sort((a, b) => b.fatigue - a.fatigue)[0];
  if (!tired || tired.fatigue < 68) return;
  const incomingId = team.benchIds.shift(); const incoming = incomingId ? team.players.get(incomingId) : undefined;
  if (!incoming || !incomingId) return;
  tired.onPitch = false; incoming.onPitch = true; team.activeIds = team.activeIds.filter(id => id !== tired.player.id).concat(incomingId); team.subsUsed++;
  events.push({ minute, type: 'substitution', teamId: team.team.id, playerId: incoming.player.id, playerName: incoming.player.name, relatedPlayerId: tired.player.id, relatedPlayerName: tired.player.name, description: `${incoming.player.name} substitui ${tired.player.name}.` });
}
function card(team: TeamState, minute: number, random: () => number, events: MatchEvent[]) {
  if (random() > 0.012) return;
  const candidates = active(team).filter(p => p.player.position !== 'GK'); if (!candidates.length) return;
  const player = candidates[Math.floor(random() * candidates.length)];
  if (player.stats.yellowCards >= 1 || random() < 0.06) {
    const secondYellow = player.stats.yellowCards >= 1;
    if (secondYellow) { player.stats.yellowCards++; team.yellows++; events.push({ minute, type: 'yellowCard', teamId: team.team.id, playerId: player.player.id, playerName: player.player.name, description: `Segundo cartão amarelo para ${player.player.name}.` }); }
    player.sentOff = true; player.onPitch = false; player.stats.redCards++; team.activeIds = team.activeIds.filter(id => id !== player.player.id); team.reds++;
    events.push({ minute, type: 'redCard', teamId: team.team.id, playerId: player.player.id, playerName: player.player.name, description: `Cartão vermelho para ${player.player.name}${secondYellow ? ' (segundo amarelo)' : ''}.` });
  } else {
    player.stats.yellowCards++; team.yellows++;
    events.push({ minute, type: 'yellowCard', teamId: team.team.id, playerId: player.player.id, playerName: player.player.name, description: `Cartão amarelo para ${player.player.name}.` });
  }
}
function weightedShooter(players: PlayerState[], instruction: MatchInstruction, random: () => number) {
  const eligible = players.filter(p => p.player.position !== 'GK');
  if (!eligible.length) return undefined;
  const weight = (p: PlayerState) => {
    const positionBonus = ['ST','LW','RW','CAM'].includes(p.player.position) ? 1.7 : 1;
    const visionBonus = instruction === 'throughBall' ? p.player.attributes.technical.vision / 60 : 1;
    return positionBonus * Math.max(0.15, visionBonus) * (1 - p.fatigue / 180);
  };
  const total = eligible.reduce((sum, p) => sum + weight(p), 0); let ticket = random() * total;
  for (const p of eligible) { ticket -= weight(p); if (ticket <= 0) return p; }
  return eligible[eligible.length - 1];
}
function attack(attacking: TeamState, defending: TeamState, minute: number, random: () => number, events: MatchEvent[], instruction: MatchInstruction) {
  const shooter = weightedShooter(active(attacking), instruction, random); if (!shooter) return;
  attacking.shots++; shooter.stats.shots++;
  const fatigueFactor = 1 - shooter.fatigue / 220;
  const shooting = shooter.player.attributes.technical.shooting * fatigueFactor + (instruction === 'longShot' ? 4 : 0);
  const targetBonus = instruction === 'longShot' ? 0.06 : instruction === 'throughBall' ? 0.03 : 0;
  const onTarget = clamp(0.32 + (shooting - defencePower(defending)) * 0.004 + targetBonus, 0.18, 0.82);
  if (random() > onTarget) {
    events.push({ minute, type: 'chance', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, description: `${shooter.player.name} remata, mas a bola sai ao lado.` }); return;
  }
  attacking.shotsOnTarget++;
  const goalPenalty = instruction === 'longShot' ? 0.065 : 0;
  const goalChance = clamp(0.12 + (shooting - keeperRating(defending)) * 0.003 + (instruction === 'throughBall' ? 0.025 : 0) - goalPenalty, 0.035, 0.44);
  if (random() < goalChance) {
    const helpers = active(attacking).filter(p => p.player.id !== shooter.player.id); const assist = helpers.length && random() < (instruction === 'throughBall' ? 0.78 : 0.62) ? helpers[Math.floor(random() * helpers.length)] : undefined;
    shooter.stats.goals++;
    if (assist) assist.stats.assists++;
    events.push({ minute, type: 'goal', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, assistPlayerId: assist?.player.id, assistPlayerName: assist?.player.name, description: `GOLO! ${shooter.player.name}${assist ? `, após assistência de ${assist.player.name},` : ''} marca para ${attacking.team.name}.` });
  } else {
    events.push({ minute, type: 'chance', teamId: attacking.team.id, playerId: shooter.player.id, playerName: shooter.player.name, description: `Remate de ${shooter.player.name}; o guarda-redes defende.` });
  }
}
function playerStats(team: TeamState, score: number): Record<string, PlayerMatchStats> {
  const result: Record<string, PlayerMatchStats> = {};
  for (const [id, state] of team.players) {
    const s = state.stats;
    const rating = clamp(6 + s.goals * 1.2 + s.assists * 0.7 + s.shots * 0.12 + (score > 0 ? 0.15 : 0) - s.yellowCards * 0.4 - s.redCards * 2, 3, 10);
    result[id] = { ...s, rating: Math.round(rating * 10) / 10 };
  }
  return result;
}

/** Pure, deterministic 90-minute simulation. Inject `random` for custom test sequences. */
export function simulateMatch(homeTeam: Team, awayTeam: Team, options: MatchSimulationOptions = {}): MatchResult {
  if (homeTeam.id === awayTeam.id) throw new Error('As equipas têm de ser diferentes.');
  const duration = clamp(Math.floor(options.duration ?? 90), 1, 150);
  const maxSubs = clamp(Math.floor(options.maxSubstitutions ?? 5), 0, 15);
  const matchId = options.matchId ?? `${homeTeam.id}-${awayTeam.id}-${duration}`;
  const random = options.random ?? seededRandom(matchId);
  const instruction = options.instruction ?? 'balanced';
  const instructionTeamId = options.instructionTeamId ?? homeTeam.id;
  const home = setup(homeTeam, options.initialFatigue ?? {}, options.initialPlayerStats, options.sentOffPlayerIds); const away = setup(awayTeam, options.initialFatigue ?? {}, options.initialPlayerStats, options.sentOffPlayerIds);
  const events: MatchEvent[] = [];

  for (let localMinute = 1; localMinute <= duration; localMinute++) {
    const minute = localMinute + (options.minuteOffset ?? 0);
    updateFatigue(home, instruction === 'pressHigh' && instructionTeamId === homeTeam.id);
    updateFatigue(away, instruction === 'pressHigh' && instructionTeamId === awayTeam.id);
    substitute(home, minute, maxSubs, events); substitute(away, minute, maxSubs, events);
    card(home, minute, random, events); card(away, minute, random, events);
    const instructionBonus = instruction === 'keepPossession' ? 0.07 : instruction === 'throughBall' ? 0.025 : instruction === 'pressHigh' ? 0.035 : 0;
    const homeActionPressure = instructionTeamId === homeTeam.id ? instructionBonus * 100 : 0;
    const awayActionPressure = instructionTeamId === awayTeam.id ? instructionBonus * 100 : 0;
    const homePressure = Math.max(1, attackPower(home) - defencePower(away) + 50 + styleBonus(homeTeam) * 100 + homeActionPressure);
    const awayPressure = Math.max(1, attackPower(away) - defencePower(home) + 50 + styleBonus(awayTeam) * 100 + awayActionPressure);
    const attacking = random() < homePressure / (homePressure + awayPressure) ? home : away;
    const defending = attacking === home ? away : home;
    if (attacking === home) { home.possessionTicks++; home.passes += 4; home.completedPasses += Math.round(4 * clamp((mean(active(home).map(p => p.player.attributes.technical.passing)) + (instruction === 'keepPossession' ? 10 : 0)) / 100, 0.45, 0.96)); away.tackles += 1; }
    else { away.possessionTicks++; away.passes += 4; away.completedPasses += Math.round(4 * clamp(mean(active(away).map(p => p.player.attributes.technical.passing)) / 100, 0.45, 0.96)); home.tackles += 1; }
    const actionApplies = attacking.team.id === instructionTeamId;
    const chance = clamp(0.14 + (attackPower(attacking) - defencePower(defending)) * 0.001 + styleBonus(attacking.team) + (actionApplies ? instructionBonus : 0) - (instruction === 'keepPossession' && actionApplies ? 0.045 : 0), 0.06, 0.28);
    if (random() < chance) attack(attacking, defending, minute, random, events, actionApplies ? instruction : 'balanced');
  }

  const totalPossession = home.possessionTicks + away.possessionTicks || 1;
  const homeScore = events.filter(e => e.type === 'goal' && e.teamId === homeTeam.id).length;
  const awayScore = events.filter(e => e.type === 'goal' && e.teamId === awayTeam.id).length;
  const stats = (team: TeamState, possession: number): TeamMatchStats => ({ shots: team.shots, shotsOnTarget: team.shotsOnTarget, possession, yellowCards: team.yellows, redCards: team.reds, passes: team.passes, passAccuracy: team.passes ? Math.round(team.completedPasses / team.passes * 100) : 0, tackles: team.tackles });
  const playerFatigue: Record<string, number> = {};
  [home, away].forEach(team => team.players.forEach((state, id) => { playerFatigue[id] = Math.round(state.fatigue * 10) / 10; }));
  return {
    matchId, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, homeScore, awayScore, events,
    stats: { [homeTeam.id]: stats(home, Math.round(home.possessionTicks / totalPossession * 100)), [awayTeam.id]: stats(away, Math.round(away.possessionTicks / totalPossession * 100)) },
    playerFatigue, playerStats: { ...playerStats(home, homeScore), ...playerStats(away, awayScore) },
  };
}
