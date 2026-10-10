import type { GameSave } from '../types';
import { normalizeGameSave } from '../hooks/useGameState';

const FORMAT = 'football-mp-simulator-save';
const SCHEMA_VERSION = 1;
const MAX_IMPORT_CHARS = 2_000_000;

export function exportCareerSave(save: GameSave, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt, gameSave: save }, null, 2);
}

/** Accepts this app's envelope and legacy raw GameSave JSON; validates before normalization. */
export function importCareerSave(text: string): GameSave {
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_IMPORT_CHARS) throw new Error('Ficheiro vazio ou demasiado grande (limite de 2 MB).');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('O ficheiro não contém JSON válido.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Estrutura do ficheiro inválida.');
  const root = parsed as Record<string, unknown>;
  let raw: unknown;
  if (root.format === FORMAT) {
    if (root.schemaVersion !== SCHEMA_VERSION) throw new Error('Versão do ficheiro não suportada.');
    raw = root.gameSave;
  } else {
    // Backward compatibility: accept an old direct GameSave export, never an arbitrary object.
    raw = parsed;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Dados da carreira em falta.');
  const candidate = raw as Record<string, unknown>;
  if (!candidate.player || typeof candidate.player !== 'object' || Array.isArray(candidate.player)) throw new Error('Save inválido: perfil de jogador em falta.');
  const player = candidate.player as Record<string, unknown>;
  if (typeof player.id !== 'string' || !player.id.trim() || typeof player.name !== 'string' || !player.name.trim() || !Number.isFinite(player.age) || !Number.isFinite(player.overall)) throw new Error('Save inválido: dados essenciais do jogador incompletos.');
  if (candidate.version !== undefined && (!Number.isInteger(candidate.version) || Number(candidate.version) < 1 || Number(candidate.version) > 4)) throw new Error('Versão do save não suportada.');
  return normalizeGameSave(raw);
}
