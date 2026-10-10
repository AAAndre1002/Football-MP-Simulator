import type { AuthChangeEvent } from '@supabase/supabase-js';

export type PasswordRecoveryState = 'required' | 'success' | null;

/** Preserve the recovery UI across ordinary session updates; end it on sign-out. */
export function nextPasswordRecoveryState(
  current: PasswordRecoveryState,
  event: AuthChangeEvent,
): PasswordRecoveryState {
  if (event === 'PASSWORD_RECOVERY') return 'required';
  if (event === 'SIGNED_OUT') return null;
  return current;
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres.';
  if (password !== confirmation) return 'As palavras-passe não coincidem.';
  return null;
}

export async function submitNewPassword(
  password: string,
  confirmation: string,
  updatePassword: (newPassword: string) => Promise<string>,
): Promise<string> {
  const validationError = validateNewPassword(password, confirmation);
  if (validationError) throw new Error(validationError);
  return updatePassword(password);
}

export function passwordRecoveryError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('password') && (normalized.includes('weak') || normalized.includes('strength') || normalized.includes('characters'))) {
    return 'A palavra-passe não cumpre os requisitos de segurança. Usa uma palavra-passe mais forte e tenta novamente.';
  }
  if (normalized.includes('expired') || normalized.includes('invalid') || normalized.includes('session')) {
    return 'A ligação de recuperação expirou ou já foi utilizada. Solicita um novo email de recuperação.';
  }
  return 'Não foi possível atualizar a palavra-passe. Tenta novamente ou solicita um novo email de recuperação.';
}
