import { useCallback, useEffect, useRef, useState } from 'react';
import App from './App';
import { OpeningMenu } from './components/OpeningMenu';
import { useAuth } from './hooks/useAuth';
import { useCareerSaves, type CareerSaveSlot } from './hooks/useCareerSaves';
import { createFreshSave, normalizeGameSave } from './hooks/useGameState';
import type { GameSave } from './types';

type ViewMode = 'menu' | 'guest' | 'cloud';

export default function AppRoot() {
  const auth = useAuth();
  const cloud = useCareerSaves(auth.user?.id);
  const [mode, setMode] = useState<ViewMode>('menu');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guestSave, setGuestSave] = useState<GameSave | undefined>();
  const latestSave = useRef<GameSave | null>(null);
  const saveTimer = useRef<number | null>(null);
  const selectedSlot = cloud.saves.find(slot => slot.id === selectedId);

  const onSaveChange = useCallback((save: GameSave) => {
    latestSave.current = save;
    if (mode !== 'cloud' || !selectedId) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void cloud.update(selectedId, save); }, 900);
  }, [cloud.update, mode, selectedId]);

  useEffect(() => () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
  }, []);

  const startGuest = (newCareer: boolean) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    latestSave.current = null;
    setSelectedId(null);
    setGuestSave(newCareer ? createFreshSave() : undefined);
    setMode('guest');
  };

  const createCloudSave = async (name: string) => {
    const slot = await cloud.create(name, createFreshSave());
    setSelectedId(slot.id);
    latestSave.current = slot.saveData;
    setGuestSave(undefined);
    setMode('cloud');
  };

  const openCloudSave = (slot: CareerSaveSlot) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    setSelectedId(slot.id);
    latestSave.current = slot.saveData;
    setGuestSave(undefined);
    setMode('cloud');
  };

  const exitGame = () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    if (mode === 'cloud' && selectedId && latestSave.current) void cloud.update(selectedId, latestSave.current);
    setMode('menu');
  };

  const deleteCloudSave = async (id: string) => {
    await cloud.remove(id);
    if (selectedId === id) setSelectedId(null);
  };

  const signOut = async () => {
    await auth.signOut();
    setSelectedId(null);
  };

  if (mode === 'guest') {
    return <App key={guestSave ? 'guest-new-career' : 'guest-local-career'} initialSave={guestSave} onExit={exitGame} />;
  }
  if (mode === 'cloud' && selectedSlot) {
    return <App key={selectedSlot.id} initialSave={normalizeGameSave(selectedSlot.saveData)} onSaveChange={onSaveChange} onExit={exitGame} />;
  }

  const userName = typeof auth.user?.user_metadata?.display_name === 'string' ? auth.user.user_metadata.display_name : undefined;

  return <OpeningMenu
    authConfigured={auth.configured}
    authLoading={auth.loading}
    userName={userName}
    userEmail={auth.user?.email}
    slots={cloud.saves}
    slotsLoading={cloud.loading}
    slotsError={cloud.error}
    onSignIn={auth.signIn}
    onSignUp={auth.signUp}
    onResetPassword={auth.resetPassword}
    onSignOut={signOut}
    onOpenSlot={openCloudSave}
    onCreateSlot={createCloudSave}
    onDeleteSlot={deleteCloudSave}
    onStartGuest={startGuest}
  />;
}
