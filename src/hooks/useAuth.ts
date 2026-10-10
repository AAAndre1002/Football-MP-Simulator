import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const CONFIG_MESSAGE = 'O login online ainda não está ligado. Configura o projeto Supabase com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para ativar contas e sincronização.';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error(CONFIG_MESSAGE);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return 'Sessão iniciada. A carregar as tuas carreiras…';
  };

  const signUp = async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error(CONFIG_MESSAGE);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    if (!data.session) return 'Conta criada. Confirma o email para ativares o acesso e depois inicia sessão.';
    return 'Conta criada. Bem-vindo à tua carreira!';
  };

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error(CONFIG_MESSAGE);
    if (!email.trim()) throw new Error('Escreve primeiro o teu email.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) throw error;
    return 'Enviámos um email com instruções para redefinir a palavra-passe.';
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, configured: isSupabaseConfigured, signIn, signUp, resetPassword, signOut };
}
