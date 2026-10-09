import { useEffect, useState } from 'react';
import type { GameSave, PlayerAttributes } from '../types';
import { playerCharacter, playerClub, opponentClub } from '../data/mockTeams';

const STORAGE_KEY = 'football-mp-simulator-save-v1';
const initialSave: GameSave = {
  player: playerCharacter,
  clubId: playerClub.id,
  balance: 12_500,
  week: 1,
  trainingFocus: 'shooting',
  playedMatches: 0,
  agentHired: false,
};

const technicalFocus = ['passing', 'shooting', 'dribbling', 'tackling', 'vision', 'ballControl'] as const;
const physicalFocus = ['pace', 'acceleration', 'stamina', 'strength', 'agility'] as const;

function improveAttribute(attributes: PlayerAttributes, focus: GameSave['trainingFocus']): PlayerAttributes {
  if ((technicalFocus as readonly string[]).includes(focus)) {
    const key = focus as keyof PlayerAttributes['technical'];
    return { ...attributes, technical: { ...attributes.technical, [key]: Math.min(99, attributes.technical[key] + 1) } };
  }
  if ((physicalFocus as readonly string[]).includes(focus)) {
    const key = focus as keyof PlayerAttributes['physical'];
    return { ...attributes, physical: { ...attributes.physical, [key]: Math.min(99, attributes.physical[key] + 1) } };
  }
  const key = focus as keyof PlayerAttributes['mental'];
  return { ...attributes, mental: { ...attributes.mental, [key]: Math.min(99, attributes.mental[key] + 1) } };
}

export function useGameState() {
  const [save, setSave] = useState<GameSave>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...initialSave, ...(JSON.parse(stored) as Partial<GameSave>) } : initialSave;
    } catch {
      return initialSave;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  const train = () => setSave(current => ({
    ...current,
    player: {
      ...current.player,
      attributes: improveAttribute(current.player.attributes, current.trainingFocus),
      overall: Math.min(99, current.player.overall + (current.playedMatches % 3 === 2 ? 1 : 0)),
    },
    week: current.week + 1,
    balance: current.balance - 120,
  }));

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSave(initialSave);
  };

  return { save, setSave, train, reset, playerClub, opponentClub };
}
