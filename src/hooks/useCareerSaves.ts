import { useCallback, useEffect, useState } from 'react';
import type { GameSave } from '../types';
import { supabase } from '../lib/supabase';

export interface CareerSaveSlot {
  id: string;
  name: string;
  saveData: GameSave;
  updatedAt: string;
}
interface SaveRow { id: string; name: string; save_data: unknown; updated_at: string; }
const mapRow = (row: SaveRow): CareerSaveSlot => ({ id: row.id, name: row.name, saveData: row.save_data as GameSave, updatedAt: row.updated_at });

export function useCareerSaves(userId?: string) {
  const [saves, setSaves] = useState<CareerSaveSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setSaves([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('career_saves')
      .select('id,name,save_data,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setSaves(((data ?? []) as SaveRow[]).map(mapRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (name: string, saveData: GameSave) => {
    if (!supabase || !userId) throw new Error('Inicia sessão para guardar uma carreira online.');
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) throw new Error('Dá um nome à carreira.');
    if (saves.length >= 5) throw new Error('Já tens 5 carreiras guardadas. Apaga uma antes de criar outra.');
    const { data, error: insertError } = await supabase
      .from('career_saves')
      .insert({ user_id: userId, name: cleanName, save_data: saveData })
      .select('id,name,save_data,updated_at')
      .single();
    if (insertError) throw insertError;
    const slot = mapRow(data as SaveRow);
    setSaves(current => [slot, ...current]);
    return slot;
  }, [saves.length, userId]);

  const update = useCallback(async (id: string, saveData: GameSave) => {
    if (!supabase || !userId) return;
    const updatedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('career_saves')
      .update({ save_data: saveData, updated_at: updatedAt })
      .eq('id', id)
      .eq('user_id', userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaves(current => current.map(slot => slot.id === id ? { ...slot, saveData, updatedAt } : slot));
  }, [userId]);

  const rename = useCallback(async (id: string, name: string) => {
    if (!supabase || !userId) return;
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) throw new Error('O nome da carreira não pode ficar vazio.');
    const { error: renameError } = await supabase.from('career_saves').update({ name: cleanName, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    if (renameError) throw renameError;
    const updatedAt = new Date().toISOString();
    setSaves(current => current.map(slot => slot.id === id ? { ...slot, name: cleanName, updatedAt } : slot));
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    if (!supabase || !userId) return;
    const { error: deleteError } = await supabase.from('career_saves').delete().eq('id', id).eq('user_id', userId);
    if (deleteError) throw deleteError;
    setSaves(current => current.filter(slot => slot.id !== id));
  }, [userId]);

  return { saves, loading, error, refresh, create, update, rename, remove };
}
