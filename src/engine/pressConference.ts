import type { PendingPress, Player, PressAnswer } from '../types';

export interface PressChoice { id: PressAnswer; title: string; response: string; description: string; }
export const pressChoices: PressChoice[] = [
  { id: 'team_first', title: 'Dar o mérito à equipa', response: '“O resultado é mérito de todo o grupo.”', description: 'Ganha confiança do treinador e dos colegas.', },
  { id: 'confident', title: 'Assumir ambição', response: '“Quero ser decisivo em todos os jogos.”', description: 'Aumenta a reputação nos media; mais pressão nas próximas jornadas.', },
  { id: 'humble', title: 'Manter os pés assentes na terra', response: '“Ainda tenho muito para aprender.”', description: 'Protege a moral e melhora a relação com os adeptos.', },
];

export function answerPressConference(player: Player, question: PendingPress, answer: PressAnswer): Player {
  const deltas = answer === 'team_first'
    ? { morale: 2, coachRelationship: 6, fanRelationship: 1, mediaReputation: 0 }
    : answer === 'confident'
      ? { morale: question.outcome === 'win' ? 4 : -2, coachRelationship: question.rating >= 7 ? 2 : -4, fanRelationship: 1, mediaReputation: 7 }
      : { morale: 4, coachRelationship: 1, fanRelationship: 5, mediaReputation: 2 };
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return {
    ...player,
    morale: clamp((player.morale ?? 60) + deltas.morale),
    coachRelationship: clamp((player.coachRelationship ?? 60) + deltas.coachRelationship),
    fanRelationship: clamp((player.fanRelationship ?? 60) + deltas.fanRelationship),
    mediaReputation: clamp((player.mediaReputation ?? 50) + deltas.mediaReputation),
  };
}

export function pressHeadline(answer: PressAnswer, outcome: PendingPress['outcome'], playerName: string): string {
  if (answer === 'team_first') return `${playerName} destaca a força do balneário após ${outcome === 'win' ? 'a vitória' : outcome === 'draw' ? 'o empate' : 'a derrota'}.`;
  if (answer === 'confident') return `${playerName} promete voltar mais forte e assume a responsabilidade.`;
  return `${playerName} mantém a humildade e agradece o apoio dos adeptos.`;
}
