import { useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, CircleUserRound, Cloud, Crown, Eye, EyeOff, Gamepad2, KeyRound, LogOut, Mail, Plus, ShieldCheck, Trash2, Trophy } from 'lucide-react';
import type { CareerSaveSlot } from '../hooks/useCareerSaves';

interface OpeningMenuProps {
  authConfigured: boolean;
  authLoading: boolean;
  userName?: string;
  userEmail?: string;
  slots: CareerSaveSlot[];
  slotsLoading: boolean;
  slotsError: string | null;
  onSignIn: (email: string, password: string) => Promise<string>;
  onSignUp: (name: string, email: string, password: string) => Promise<string>;
  onResetPassword: (email: string) => Promise<string>;
  onSignOut: () => Promise<void>;
  onOpenSlot: (slot: CareerSaveSlot) => void;
  onCreateSlot: (name: string) => Promise<void>;
  onDeleteSlot: (id: string) => Promise<void>;
  onStartGuest: (newCareer: boolean) => void;
}

type AuthMode = 'signin' | 'register' | 'reset' | null;
const friendlyError = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tenta novamente.';
const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export function OpeningMenu(props: OpeningMenuProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newSaveName, setNewSaveName] = useState('A minha carreira');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const changeMode = (mode: AuthMode) => { setAuthMode(mode); setMessage(''); setError(''); };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const result = authMode === 'register'
        ? await props.onSignUp(displayName, email, password)
        : authMode === 'reset'
          ? await props.onResetPassword(email)
          : await props.onSignIn(email, password);
      setMessage(result);
      if (authMode !== 'register' && authMode !== 'reset') setPassword('');
    } catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  };

  const createSave = async () => {
    setBusy(true); setError('');
    try { await props.onCreateSlot(newSaveName); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true); setError('');
    try { await props.onSignOut(); setAuthMode(null); setMessage('Sessão terminada.'); }
    catch (reason) { setError(friendlyError(reason)); }
    finally { setBusy(false); }
  };

  return (
    <main className="opening-screen relative min-h-screen overflow-hidden bg-pitch-950 text-white">
      <div className="stadium-glow" aria-hidden="true" />
      <div className="stadium-lines" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><div className="opening-mark"><Trophy size={21} /></div><div><p className="font-black tracking-wide">FOOTBALL <span className="text-lime-300">MP</span></p><p className="text-[10px] uppercase tracking-[.24em] text-slate-500">Career simulator</p></div></div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[.18em] text-slate-300 sm:flex"><span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_#9fe34d]" /> Nova época · 2026/27</div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-8 sm:px-8 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.1fr_.8fr] lg:gap-16 lg:px-12 lg:pb-16 lg:pt-2">
        <section className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.26em] text-lime-300"><span className="h-px w-8 bg-lime-400" /> O teu próximo capítulo</div>
          <h1 className="font-black uppercase leading-[.92] tracking-[-.055em] text-white"><span className="block text-5xl sm:text-6xl lg:text-[5.2rem]">Constrói</span><span className="opening-outline block text-5xl sm:text-6xl lg:text-[5.2rem]">a tua</span><span className="block text-5xl text-lime-300 sm:text-6xl lg:text-[5.2rem]">lenda.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Cada treino conta. Cada decisão muda o teu futuro. Começa a tua carreira dentro e fora do relvado.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => changeMode(props.userEmail ? null : 'signin')} className="btn-primary min-h-12 px-6 text-sm"><CircleUserRound size={18} /> {props.userEmail ? 'As minhas carreiras' : 'Entrar / Criar conta'}</button>
            <button onClick={() => props.onStartGuest(false)} className="btn-secondary min-h-12 border-white/15 bg-white/[0.04] px-6"><Gamepad2 size={17} /> Jogar offline</button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-lime-400" /> Conta segura</span><span className="flex items-center gap-2"><Cloud size={14} className="text-sky-300" /> Saves na nuvem</span><span className="flex items-center gap-2"><Crown size={14} className="text-amber-300" /> A tua carreira</span></div>
        </section>

        <section className="opening-card mx-auto w-full max-w-xl">
          {!props.userEmail ? (
            <>
              <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-lime-300">Bem-vindo ao clube</p><h2 className="mt-2 text-2xl font-bold">{authMode === 'register' ? 'Cria a tua conta' : authMode === 'reset' ? 'Recuperar acesso' : authMode === 'signin' ? 'Continua a carreira' : 'Pronto para jogar?'}</h2></div><div className="rounded-xl bg-white/[.06] p-3 text-lime-300"><BadgeCheck size={22} /></div></div>
              {!authMode ? (
                <div className="space-y-3"><button onClick={() => changeMode('signin')} className="menu-action"><span><KeyRound size={18} /> Iniciar sessão</span><ArrowRight size={17} /></button><button onClick={() => changeMode('register')} className="menu-action"><span><Plus size={18} /> Criar conta nova</span><ArrowRight size={17} /></button><div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-200/[.05] p-4"><p className="text-xs font-semibold text-amber-200">Modo offline disponível</p><p className="mt-1 text-xs leading-5 text-slate-400">Podes jogar já neste dispositivo. Para ativar contas e sincronizar saves na nuvem, falta ligar o backend Supabase.</p></div></div>
              ) : (
                <form onSubmit={submitAuth} className="space-y-4">
                  {authMode === 'register' && <label className="field-label">Nome de jogador<input autoComplete="name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="field-input" placeholder="Como te chamamos?" maxLength={50} required /></label>}
                  <label className="field-label">Email<div className="relative"><Mail size={16} className="field-icon" /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input pl-10" placeholder="tu@email.com" required /></div></label>
                  {authMode !== 'reset' && <label className="field-label">Palavra-passe<div className="relative"><KeyRound size={16} className="field-icon" /><input type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="field-input px-10" placeholder={authMode === 'register' ? 'Pelo menos 8 caracteres' : 'A tua palavra-passe'} minLength={8} required /><button type="button" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setShowPassword(v => !v)} className="field-eye">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
                  {!props.authConfigured && <div className="rounded-xl border border-amber-300/15 bg-amber-200/[.05] p-3 text-xs leading-5 text-amber-100/80">O serviço de contas ainda não está configurado. As credenciais serão ligadas depois de configurar o projeto Supabase.</div>}
                  {message && <p role="status" className="rounded-lg bg-lime-400/10 p-3 text-sm text-lime-200">{message}</p>}
                  {error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
                  <button disabled={busy || props.authLoading} className="btn-primary min-h-12 w-full justify-center">{busy ? 'Aguarda…' : authMode === 'register' ? 'Criar conta' : authMode === 'reset' ? 'Enviar instruções' : 'Entrar'} <ArrowRight size={16} /></button>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><button type="button" onClick={() => changeMode(authMode === 'register' ? 'signin' : 'register')} className="text-lime-300 hover:text-lime-200">{authMode === 'register' ? 'Já tens conta? Inicia sessão' : 'Ainda não tens conta? Regista-te'}</button>{authMode === 'signin' && <button type="button" onClick={() => changeMode('reset')} className="text-slate-400 hover:text-white">Esqueci-me da palavra-passe</button>}</div>
                  <button type="button" onClick={() => changeMode(null)} className="w-full pt-1 text-xs text-slate-500 hover:text-slate-300">Voltar ao menu</button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-lime-300">Conta ligada</p><h2 className="mt-2 text-2xl font-bold">Olá, {props.userName || 'jogador'}.</h2><p className="mt-1 text-sm text-slate-400">{props.userEmail}</p></div><button title="Terminar sessão" onClick={() => void signOut()} disabled={busy} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"><LogOut size={17} /></button></div>
              <div className="mt-6 flex items-center justify-between"><h3 className="font-semibold">Carreiras guardadas</h3><span className="text-xs text-slate-500">{props.slots.length}/5 slots</span></div>
              {props.slotsLoading ? <div className="py-8 text-center text-sm text-slate-400">A carregar os teus saves…</div> : props.slots.length ? <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">{props.slots.map(slot => <div key={slot.id} className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-black/20 p-3"><button onClick={() => props.onOpenSlot(slot)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{slot.name}</span><span className="mt-1 block text-xs text-slate-500">Época {slot.saveData.season} · Jornada {slot.saveData.week} · Atualizada {dateLabel(slot.updatedAt)}</span></button><button aria-label={`Apagar ${slot.name}`} onClick={() => { if (window.confirm(`Apagar a carreira “${slot.name}”?`)) { setDeletingId(slot.id); void props.onDeleteSlot(slot.id).finally(() => setDeletingId(null)); } }} className="rounded-lg p-2 text-slate-500 hover:bg-red-400/10 hover:text-red-300">{deletingId === slot.id ? '…' : <Trash2 size={16} />}</button></div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center"><p className="text-sm text-slate-300">Ainda não tens saves na nuvem.</p><p className="mt-1 text-xs text-slate-500">Cria uma carreira para começar.</p></div>}
              {props.slotsError && <p role="alert" className="mt-3 rounded-lg bg-red-400/10 p-3 text-xs text-red-200">{props.slotsError}</p>}
              <div className="mt-4 flex gap-2"><input value={newSaveName} onChange={e => setNewSaveName(e.target.value)} maxLength={40} className="field-input min-w-0 flex-1" aria-label="Nome da nova carreira" /><button onClick={() => void createSave()} disabled={busy || props.slots.length >= 5 || !newSaveName.trim()} className="btn-primary shrink-0"><Plus size={16} /> Nova carreira</button></div>
              <button onClick={() => props.onStartGuest(false)} className="mt-4 w-full text-xs text-slate-400 hover:text-white">Jogar offline neste dispositivo</button>
            </>
          )}
        </section>
      </div>
      <footer className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 pb-5 text-[10px] uppercase tracking-[.18em] text-slate-600 sm:px-8 lg:px-12"><span>Football MP Simulator</span><span>Feito para viveres o jogo</span></footer>
    </main>
  );
}
