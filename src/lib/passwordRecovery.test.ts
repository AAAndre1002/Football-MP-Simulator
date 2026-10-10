import { describe, expect, it } from 'vitest';
import { nextPasswordRecoveryState, passwordRecoveryError, submitNewPassword, validateNewPassword } from './passwordRecovery';

describe('password recovery auth state', () => {
  it('enters recovery mode when Supabase emits PASSWORD_RECOVERY', () => {
    expect(nextPasswordRecoveryState(null, 'PASSWORD_RECOVERY')).toBe('required');
  });
  it('keeps recovery active through ordinary auth updates until completion', () => {
    expect(nextPasswordRecoveryState('required', 'USER_UPDATED')).toBe('required');
    expect(nextPasswordRecoveryState('required', 'SIGNED_IN')).toBe('required');
  });
  it('keeps the success state through user updates and clears recovery on sign-out', () => {
    expect(nextPasswordRecoveryState('success', 'USER_UPDATED')).toBe('success');
    expect(nextPasswordRecoveryState('success', 'SIGNED_OUT')).toBeNull();
  });
  it('can enter a new recovery flow after a prior completion', () => {
    expect(nextPasswordRecoveryState('success', 'PASSWORD_RECOVERY')).toBe('required');
  });
});

describe('new-password form validation', () => {
  it('rejects passwords shorter than eight characters', () => {
    expect(validateNewPassword('short', 'short')).toBe('A palavra-passe deve ter pelo menos 8 caracteres.');
  });
  it('rejects a confirmation that does not match', () => {
    expect(validateNewPassword('new-password', 'different-password')).toBe('As palavras-passe não coincidem.');
  });
  it('accepts a matching password of at least eight characters', () => {
    expect(validateNewPassword('new-password', 'new-password')).toBeNull();
  });
  it('does not call Supabase when a password is too short or confirmation mismatches', async () => {
    let submitted = false;
    const updatePassword = async () => { submitted = true; return 'ok'; };
    await expect(submitNewPassword('short', 'short', updatePassword)).rejects.toThrow('pelo menos 8 caracteres');
    await expect(submitNewPassword('new-password', 'other-password', updatePassword)).rejects.toThrow('não coincidem');
    expect(submitted).toBe(false);
  });
  it('submits the matching new password and returns the success message', async () => {
    let submittedPassword = '';
    const result = await submitNewPassword('new-password', 'new-password', async value => {
      submittedPassword = value;
      return 'Palavra-passe atualizada.';
    });
    expect(submittedPassword).toBe('new-password');
    expect(result).toBe('Palavra-passe atualizada.');
  });
  it('translates expiry and provider failures into Portuguese recovery guidance', () => {
    expect(passwordRecoveryError('Invalid or expired OTP')).toContain('Solicita um novo email');
    expect(passwordRecoveryError('Password is too weak')).toContain('palavra-passe mais forte');
    expect(passwordRecoveryError('Unexpected provider failure')).toContain('Não foi possível atualizar');
  });
});
