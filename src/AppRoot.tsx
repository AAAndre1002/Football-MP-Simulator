import { useCallback, useEffect, useRef, useState } from 'react';
import App from './App';
import { OpeningMenu, type OfflineCareerSlot } from './components/OpeningMenu';
import { useAuth } from './hooks/useAuth';
import { useCareerSaves, type CareerSaveSlot } from './hooks/useCareerSaves';
import { createCareerSave, normalizeGameSave } from './hooks/useGameState';
import { PlayerCreationWizard } from './player-creation/PlayerCreationWizard';
import { AcademyChapter } from './player-creation/AcademyChapter';
import { CareerPathwayPicker } from './player-creation/CareerPathwayPicker';
import type { CareerPathway } from './player-creation/clubOffers';
import type { GameSave, Player } from './types';
import type { AcademyDevelopment } from './engine/academyDevelopment';
import { addOfflineCareerSlot, deleteOfflineCareerSlot, renameOfflineCareerSlot, updateOfflineCareerSlot } from './lib/offlineCareers';
import { importCareerSave } from './lib/saveTransfer';

type ViewMode = 'menu' | 'guest' | 'cloud' | 'offline-slot' | 'creator' | 'academy' | 'pathway';
type CreationTarget = { kind: 'offline' } | { kind: 'cloud'; name: string };
const OFFLINE_SLOTS_KEY = 'football-mp-simulator-offline-careers-v1';
function loadOfflineSaves(): OfflineCareerSlot[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(OFFLINE_SLOTS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && item.saveData && typeof item.saveData === 'object')
      .map(item => ({ id: item.id.slice(0, 100), name: item.name.slice(0, 40), saveData: normalizeGameSave(item.saveData), updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(0).toISOString() }));
  } catch { return []; }
}
function newId() { return `offline-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }

export default function AppRoot() {
  const auth = useAuth();
  const cloud = useCareerSaves(auth.user?.id);
  const [mode, setMode] = useState<ViewMode>('menu');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOfflineId, setSelectedOfflineId] = useState<string | null>(null);
  const [guestSave, setGuestSave] = useState<GameSave | undefined>();
  const [offlineSaves, setOfflineSaves] = useState<OfflineCareerSlot[]>(loadOfflineSaves);
  const [creationTarget, setCreationTarget] = useState<CreationTarget | null>(null);
  const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);
  const [createdDevelopment, setCreatedDevelopment] = useState<AcademyDevelopment | null>(null);
  const [academyError, setAcademyError] = useState('');
  const latestSave = useRef<GameSave | null>(null);
  const saveTimer = useRef<number | null>(null);
  const selectedSlot = cloud.saves.find(slot => slot.id === selectedId);
  const selectedOffline = offlineSaves.find(slot => slot.id === selectedOfflineId);

  const persistOfflineUpdate = useCallback((id: string, save: GameSave) => {
    setOfflineSaves(current => {
      const next = updateOfflineCareerSlot(current, id, save);
      try { localStorage.setItem(OFFLINE_SLOTS_KEY, JSON.stringify(next)); } catch { /* Keep the current session playable if storage is unavailable. */ }
      return next;
    });
  }, []);

  const removeOfflineSave = (id: string) => {
    setOfflineSaves(current => {
      const next = deleteOfflineCareerSlot(current, id);
      try { localStorage.setItem(OFFLINE_SLOTS_KEY, JSON.stringify(next)); } catch { /* Current session remains usable. */ }
      return next;
    });
    if (selectedOfflineId === id) { setSelectedOfflineId(null); setMode('menu'); }
  };
  const renameOfflineSave = (id: string, name: string) => setOfflineSaves(current => {
    const next = renameOfflineCareerSlot(current, id, name);
    try { localStorage.setItem(OFFLINE_SLOTS_KEY, JSON.stringify(next)); } catch { /* Current session remains usable. */ }
    return next;
  });
  const importOfflineSave = async (text: string, filename: string) => {
    const save = importCareerSave(text);
    const slot: OfflineCareerSlot = { id: newId(), name: (filename.trim() || `Carreira ${save.player.name}`).slice(0, 40), saveData: save, updatedAt: new Date().toISOString() };
    const next = addOfflineCareerSlot(offlineSaves, slot);
    try { localStorage.setItem(OFFLINE_SLOTS_KEY, JSON.stringify(next)); } catch { throw new Error('Não foi possível guardar o save neste dispositivo.'); }
    setOfflineSaves(next);
  };

  const onSaveChange = useCallback((save: GameSave) => {
    latestSave.current = save;
    if (mode === 'offline-slot' && selectedOfflineId) {
      persistOfflineUpdate(selectedOfflineId, save);
      return;
    }
    if (mode !== 'cloud' || !selectedId) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void cloud.update(selectedId, save); }, 900);
  }, [cloud.update, mode, selectedId, selectedOfflineId, persistOfflineUpdate]);

  useEffect(() => () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
  }, []);

  const startGuest = (newCareer: boolean) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    latestSave.current = null;
    setSelectedId(null);
    setSelectedOfflineId(null);
    if (newCareer) {
      setCreationTarget({ kind: 'offline' });
      setCreatedPlayer(null);
      setCreatedDevelopment(null);
      setAcademyError('');
      setMode('creator');
      return;
    }
    setGuestSave(undefined);
    setMode('guest');
  };

  // Auth remains the existing gate: this callback is exposed only in the signed-in menu.
  const createCloudSave = async (name: string) => {
    setCreationTarget({ kind: 'cloud', name: name.trim() || 'A minha carreira' });
    setCreatedPlayer(null);
    setCreatedDevelopment(null);
    setAcademyError('');
    setMode('creator');
  };

  const openCloudSave = (slot: CareerSaveSlot) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    setSelectedId(slot.id);
    setSelectedOfflineId(null);
    latestSave.current = slot.saveData;
    setGuestSave(undefined);
    setMode('cloud');
  };

  const openOfflineSave = (slot: OfflineCareerSlot) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    setSelectedOfflineId(slot.id);
    setSelectedId(null);
    latestSave.current = slot.saveData;
    setGuestSave(undefined);
    setMode('offline-slot');
  };

  const exitGame = () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    if (mode === 'cloud' && selectedId && latestSave.current) void cloud.update(selectedId, latestSave.current);
    if (mode === 'offline-slot' && selectedOfflineId && latestSave.current) persistOfflineUpdate(selectedOfflineId, latestSave.current);
    setMode('menu');
  };

  const completeAcademy = (player: Player, development: AcademyDevelopment) => {
    setCreatedPlayer(player);
    setCreatedDevelopment(development);
    setAcademyError('');
    setMode('pathway');
  };

  const finishCareer = async (pathway?: CareerPathway) => {
    if (!creationTarget || !createdPlayer || !createdDevelopment) return;
    const player = createdPlayer;
    const development = createdDevelopment;
    setAcademyError('');
    const save: GameSave = { ...createCareerSave(player), academyDevelopment: development, ...(pathway ? { careerPathway: pathway } : {}) };
    latestSave.current = save;
    if (creationTarget.kind === 'offline') {
      const slot: OfflineCareerSlot = { id: newId(), name: `Carreira ${player.name}`.slice(0, 40), saveData: save, updatedAt: new Date().toISOString() };
      setOfflineSaves(current => {
        const next = addOfflineCareerSlot(current, slot);
        try { localStorage.setItem(OFFLINE_SLOTS_KEY, JSON.stringify(next)); } catch { /* In-memory session remains available. */ }
        return next;
      });
      setSelectedOfflineId(slot.id);
      setSelectedId(null);
      setCreationTarget(null);
      setCreatedPlayer(null);
      setCreatedDevelopment(null);
      setMode('offline-slot');
      return;
    }
    try {
      // create() uses the already authenticated user's existing cloud slot flow; no auth behavior is changed.
      const slot = await cloud.create(creationTarget.name, save);
      setSelectedId(slot.id);
      setSelectedOfflineId(null);
      latestSave.current = slot.saveData;
      setCreationTarget(null);
      setCreatedPlayer(null);
      setCreatedDevelopment(null);
      setMode('cloud');
    } catch (error) {
      setAcademyError(error instanceof Error ? error.message : 'Não foi possível guardar esta carreira na nuvem. Tenta novamente.');
    }
  };

  const deleteCloudSave = async (id: string) => {
    await cloud.remove(id);
    if (selectedId === id) setSelectedId(null);
  };
  const renameCloudSave = async (id: string, name: string) => { await cloud.rename(id, name); };
  const importCloudSave = async (text: string, filename: string) => {
    const save = importCareerSave(text);
    await cloud.create(filename.trim() || `Importada · ${save.player.name}`.slice(0, 40), save);
  };

  const signOut = async () => {
    await auth.signOut();
    setSelectedId(null);
  };

  if (mode === 'guest') {
    return <App key="legacy-offline-career" initialSave={guestSave} onExit={exitGame} />;
  }
  if (mode === 'offline-slot' && selectedOffline) {
    return <App key={selectedOffline.id} initialSave={normalizeGameSave(selectedOffline.saveData)} onSaveChange={onSaveChange} onExit={exitGame} />;
  }
  if (mode === 'cloud' && selectedSlot) {
    return <App key={selectedSlot.id} initialSave={normalizeGameSave(selectedSlot.saveData)} onSaveChange={onSaveChange} onExit={exitGame} />;
  }
  if (mode === 'creator' && creationTarget) {
    return <PlayerCreationWizard onComplete={created => { setCreatedPlayer(created.player); setAcademyError(''); setMode('academy'); }} onCancel={() => { setCreationTarget(null); setMode('menu'); }} />;
  }
  if (mode === 'academy' && createdPlayer) {
    return <AcademyChapter player={createdPlayer} onComplete={(player, development) => completeAcademy(player, development)} onCancel={() => { setCreationTarget(null); setCreatedPlayer(null); setCreatedDevelopment(null); setMode('menu'); }} saveError={academyError} />;
  }
  if (mode === 'pathway' && createdPlayer) {
    return <CareerPathwayPicker player={createdPlayer} onComplete={pathway => { void finishCareer(pathway); }} onSkip={() => { void finishCareer(); }} saveError={academyError} />;
  }

  return <OpeningMenu
    offlineSaves={offlineSaves}
    onOpenOfflineSave={openOfflineSave}
    onCreateOfflineCareer={() => startGuest(true)}
    onDeleteOfflineSave={removeOfflineSave}
    onRenameOfflineSave={renameOfflineSave}
    onImportOfflineSave={importOfflineSave}
    onRenameSlot={renameCloudSave}
    onImportCloudSave={importCloudSave}
    authConfigured={auth.configured}
    authLoading={auth.loading}
    userEmail={auth.user?.email}
    slots={cloud.saves}
    slotsLoading={cloud.loading}
    slotsError={cloud.error}
    onSignIn={auth.signIn}
    onSignUp={auth.signUp}
    onResetPassword={auth.resetPassword}
    passwordRecoveryRequired={auth.passwordRecoveryRequired}
    passwordRecoverySuccess={auth.passwordRecoverySuccess}
    onUpdatePassword={auth.updatePassword}
    onDismissPasswordRecoverySuccess={auth.dismissPasswordRecoverySuccess}
    onSignOut={signOut}
    onOpenSlot={openCloudSave}
    onCreateSlot={createCloudSave}
    onDeleteSlot={deleteCloudSave}
    onStartGuest={startGuest}
  />;
}
