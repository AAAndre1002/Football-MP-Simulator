import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, CircleUserRound, Cloud, Download, Eye, EyeOff, Gamepad2, KeyRound, LogOut, Mail, Pencil, Plus, ShieldCheck, Trash2, Trophy, Upload } from 'lucide-react';
import type { CareerSaveSlot } from '../hooks/useCareerSaves';
import { submitNewPassword } from '../lib/passwordRecovery';
import { exportCareerSave } from '../lib/saveTransfer';

export interface OfflineCareerSlot { id: string; name: string; saveData: import('../types').GameSave; updatedAt: string; }
interface OpeningMenuProps {
  offlineSaves: OfflineCareerSlot[];
  onOpenOfflineSave: (slot: OfflineCareerSlot) => void;
  onCreateOfflineCareer: () => void;
  onDeleteOfflineSave: (id: string) => void;
  onRenameOfflineSave: (id: string, name: string) => void;
  onImportOfflineSave: (text: string, name: string) => Promise<void>;
  onRenameSlot: (id: string, name: string) => Promise<void>;
  onImportCloudSave: (text: string, name: string) => Promise<void>;
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
  passwordRecoveryRequired: boolean;
  passwordRecoverySuccess: boolean;
  onUpdatePassword: (password: string) => Promise<string>;
  onDismissPasswordRecoverySuccess: () => void;
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
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmation, setRecoveryConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newSaveName, setNewSaveName] = useState('A minha carreira');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [offlineError, setOfflineError] = useState('');
  const [cloudError, setCloudError] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const cloudImportInput = useRef<HTMLInputElement>(null);

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
  const submitPasswordRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const result = await submitNewPassword(recoveryPassword, recoveryConfirmation, props.onUpdatePassword);
      setRecoveryPassword('');
      setRecoveryConfirmation('');
      setMessage(result);
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
  const downloadSave = (saveData: import('../types').GameSave, name: string) => {
    const blob = new Blob([exportCareerSave(saveData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name.replace(/[^\p{L}\p{N}-]+/gu, '-')}.json`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportOffline = (slot: OfflineCareerSlot) => downloadSave(slot.saveData, slot.name);
  const exportCloud = (slot: CareerSaveSlot) => downloadSave(slot.saveData, slot.name);
  const handleOfflineImport = async (file?: File) => {
    if (!file) return;
    setOfflineError(''); setBusy(true);
    try { await props.onImportOfflineSave(await file.text(), file.name.replace(/\.json$/i, '').slice(0, 40)); setMessage('Carreira offline importada neste dispositivo.'); }
    catch (reason) { setOfflineError(friendlyError(reason)); }
    finally { setBusy(false); if (importInput.current) importInput.current.value = ''; }
  };
  const renderOfflineSlot = (slot: OfflineCareerSlot) => <div key={slot.id} className="opening-slot"><button onClick={() => props.onOpenOfflineSave(slot)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold">{slot.name}</span><span className="mt-1 block text-[11px] text-neutral-500">Época {slot.saveData.season} · Jornada {slot.saveData.week}</span></button><div className="flex shrink-0 items-center"><button aria-label={`Exportar ${slot.name}`} title="Exportar ficheiro JSON offline" onClick={() => exportOffline(slot)} className="rounded-lg p-2 text-neutral-500 hover:text-yellow-200"><Download size={14}/></button><button aria-label={`Renomear ${slot.name}`} title="Renomear" onClick={() => { const next = window.prompt('Novo nome da carreira', slot.name); if (next?.trim()) props.onRenameOfflineSave(slot.id, next); }} className="rounded-lg p-2 text-neutral-500 hover:text-yellow-200"><Pencil size={14}/></button><button aria-label={`Apagar ${slot.name}`} title="Apagar" onClick={() => { if (window.confirm(`Apagar a carreira offline “${slot.name}”?`)) props.onDeleteOfflineSave(slot.id); }} className="rounded-lg p-2 text-neutral-500 hover:text-red-300"><Trash2 size={14}/></button></div></div>;
  const handleCloudImport = async (file?: File) => {
    if (!file) return;
    setCloudError(''); setBusy(true);
    try { await props.onImportCloudSave(await file.text(), file.name.replace(/\.json$/i, '').slice(0, 40)); setMessage('Save importado para a nuvem da conta ligada.'); }
    catch (reason) { setCloudError(friendlyError(reason)); }
    finally { setBusy(false); if (cloudImportInput.current) cloudImportInput.current.value = ''; }
  };

  return (
    <main className="opening-screen relative min-h-screen overflow-hidden bg-black text-white">
      <div className="stadium-glow" aria-hidden="true" />
      <input ref={importInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Importar save offline JSON" onChange={event => { void handleOfflineImport(event.target.files?.[0]); }} />
      <input ref={cloudImportInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Importar save cloud JSON" onChange={event => { void handleCloudImport(event.target.files?.[0]); }} />
      <header className="relative z-10 border-b border-white/[.08]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5"><div className="opening-mark"><Trophy size={17} /></div><div><p className="opening-brand">FOOTBALL <span>MP</span></p><p className="opening-micro">CAREER MODE · 2026/27</p></div></div>
          <div className="flex items-center gap-2"><span className={`opening-status ${props.userEmail ? 'is-online' : ''}`}><span />{props.userEmail ? 'CONTA LIGADA' : 'MODO CARREIRA'}</span><span className="opening-language">PT</span></div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <section className="mb-7">
          <p className="opening-eyebrow"><span /> O TEU PRÓXIMO CAPÍTULO</p>
          <h1 className="opening-title">A TUA HISTÓRIA.<br /><span>O TEU JOGO.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400 sm:text-base">Cria o teu atleta, entra em campo e constrói uma carreira à tua maneira.</p>
        </section>

        <section className="opening-card">
          {message && !authMode && !props.passwordRecoveryRequired && !props.passwordRecoverySuccess && <p role="status" className="mb-4 rounded-lg border border-yellow-300/20 bg-yellow-300/[.07] p-3 text-sm text-yellow-100">{message}</p>}
          {props.passwordRecoveryRequired ? (
            <>
              <div className="mb-5 flex items-center justify-between gap-3"><div><p className="opening-eyebrow small"><span /> RECUPERAÇÃO DE CONTA</p><h2 className="mt-2 text-xl font-bold tracking-tight">Escolhe uma nova palavra-passe</h2></div><div className="opening-card-icon"><KeyRound size={19} /></div></div>
              <form onSubmit={submitPasswordRecovery} className="space-y-3.5">
                <label className="field-label">NOVA PALAVRA-PASSE<input type="password" autoComplete="new-password" value={recoveryPassword} onChange={e => setRecoveryPassword(e.target.value)} className="field-input" placeholder="Pelo menos 8 caracteres" minLength={8} required /></label>
                <label className="field-label">CONFIRMAR PALAVRA-PASSE<input type="password" autoComplete="new-password" value={recoveryConfirmation} onChange={e => setRecoveryConfirmation(e.target.value)} className="field-input" placeholder="Escreve novamente" minLength={8} required /></label>
                <p className="text-xs text-neutral-400">A nova palavra-passe será usada para entrar na tua conta e aceder às carreiras guardadas.</p>
                {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-sm text-red-200">{error}</p>}
                <button disabled={busy || props.authLoading} className="opening-cta w-full">{busy ? 'A ATUALIZAR…' : 'ATUALIZAR PALAVRA-PASSE'} <ArrowRight size={16} /></button>
              </form>
            </>
          ) : props.passwordRecoverySuccess ? (
            <div className="py-3 text-center">
              <div className="opening-card-icon mx-auto"><BadgeCheck size={20} /></div>
              <h2 className="mt-4 text-xl font-bold">Palavra-passe atualizada</h2>
              <p role="status" className="mt-2 text-sm leading-6 text-neutral-300">A palavra-passe foi alterada com sucesso. Já podes continuar para a tua conta e carreiras guardadas.</p>
              <button type="button" onClick={props.onDismissPasswordRecoverySuccess} className="opening-cta mt-5 w-full">CONTINUAR <ArrowRight size={16} /></button>
            </div>
          ) : !props.userEmail ? (
            <>
              <div className="mb-5 flex items-center justify-between gap-3"><div><p className="opening-eyebrow small"><span /> {authMode ? 'ACESSO AO JOGO' : 'COMEÇA AQUI'}</p><h2 className="mt-2 text-xl font-bold tracking-tight">{authMode === 'register' ? 'Criar conta' : authMode === 'reset' ? 'Recuperar acesso' : authMode === 'signin' ? 'Iniciar sessão' : 'Escolhe como jogar'}</h2></div><div className="opening-card-icon"><BadgeCheck size={19} /></div></div>
              {!authMode ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={() => changeMode('signin')} className="opening-choice"><span className="opening-choice-icon"><KeyRound size={17} /></span><span><strong>ENTRAR</strong><small>Já tens uma conta?</small></span><ArrowRight size={15} className="ml-auto text-yellow-300" /></button>
                    <button onClick={() => changeMode('register')} className="opening-choice"><span className="opening-choice-icon"><CircleUserRound size={17} /></span><span><strong>CRIAR CONTA</strong><small>Guarda a carreira na nuvem</small></span><ArrowRight size={15} className="ml-auto text-yellow-300" /></button>
                  </div>
                  <div className="opening-divider"><span>OU</span></div>
                  <button onClick={() => props.onStartGuest(false)} className="opening-cta"><Gamepad2 size={17} /> JOGAR OFFLINE <ArrowRight size={16} /></button>
                  <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-500"><Cloud size={13} className={props.authConfigured ? 'text-yellow-300' : 'text-neutral-600'} />{props.authConfigured ? 'Os teus saves acompanham a tua conta' : 'Sem conta online · progresso guardado neste dispositivo'}</p>
                  <button onClick={props.onCreateOfflineCareer} className="mt-4 w-full rounded-lg border border-yellow-300/20 bg-yellow-300/[.04] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-yellow-100 hover:border-yellow-300/40"><Plus size={15} className="mr-2 inline" /> Nova carreira offline</button><button type="button" onClick={() => importInput.current?.click()} disabled={busy} className="mt-2 w-full rounded-lg border border-white/10 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-white/20"><Upload size={14} className="mr-2 inline"/> Importar save offline JSON</button>{offlineError && <p role="alert" className="mt-2 text-xs text-red-200">{offlineError}</p>}
                  {props.offlineSaves.length > 0 && <div className="mt-4 space-y-2"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Carreiras offline criadas</p>{props.offlineSaves.map(renderOfflineSlot)}</div>}
                </>
              ) : (
                <form onSubmit={submitAuth} className="space-y-3.5">
                  {authMode === 'register' && <label className="field-label">NOME DE JOGADOR<input autoComplete="name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="field-input" placeholder="Como te chamamos?" maxLength={50} required /></label>}
                  <label className="field-label">EMAIL<div className="relative"><Mail size={15} className="field-icon" /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input pl-10" placeholder="tu@email.com" required /></div></label>
                  {authMode !== 'reset' && <label className="field-label">PALAVRA-PASSE<div className="relative"><KeyRound size={15} className="field-icon" /><input type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="field-input px-10" placeholder={authMode === 'register' ? 'Pelo menos 8 caracteres' : 'A tua palavra-passe'} minLength={8} required /><button type="button" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setShowPassword(v => !v)} className="field-eye">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>}
                  {!props.authConfigured && <div className="opening-notice"><strong>LOGIN ONLINE AINDA NÃO LIGADO</strong><span>O modo offline já funciona. A conta e a sincronização serão ativadas quando o Supabase estiver configurado.</span></div>}
                  {message && <p role="status" className="rounded-lg border border-yellow-300/20 bg-yellow-300/[.07] p-3 text-sm text-yellow-100">{message}</p>}
                  {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-sm text-red-200">{error}</p>}
                  <button disabled={busy || props.authLoading} className="opening-cta w-full">{busy ? 'A AGUARDAR…' : authMode === 'register' ? 'CRIAR CONTA' : authMode === 'reset' ? 'ENVIAR INSTRUÇÕES' : 'ENTRAR'} <ArrowRight size={16} /></button>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><button type="button" onClick={() => changeMode(authMode === 'register' ? 'signin' : 'register')} className="text-yellow-300 hover:text-yellow-200">{authMode === 'register' ? 'Já tens conta? Inicia sessão' : 'Ainda não tens conta? Regista-te'}</button>{authMode === 'signin' && <button type="button" onClick={() => changeMode('reset')} className="text-neutral-400 hover:text-white">Esqueci-me da palavra-passe</button>}</div>
                  <button type="button" onClick={() => changeMode(null)} className="w-full border-t border-white/[.07] pt-3 text-[11px] uppercase tracking-wider text-neutral-500 hover:text-white">Voltar ao menu</button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4"><div><p className="opening-eyebrow small"><span /> CONTA LIGADA</p><h2 className="mt-2 text-xl font-bold">Olá, {props.userName || 'jogador'}.</h2><p className="mt-1 text-sm text-neutral-400">{props.userEmail}</p></div><button title="Terminar sessão" onClick={() => void signOut()} disabled={busy} className="rounded-lg border border-white/10 p-2 text-neutral-400 hover:border-yellow-300/30 hover:text-yellow-200"><LogOut size={16} /></button></div>
              <div className="mt-6 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wider">Carreiras na nuvem</h3><span className="opening-count">{props.slots.length}/5 SLOTS</span></div>
              {props.slotsLoading ? <div className="py-8 text-center text-sm text-neutral-400">A carregar os teus saves…</div> : props.slots.length ? <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">{props.slots.map(slot => <div key={slot.id} className="opening-slot"><button onClick={() => props.onOpenSlot(slot)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold">{slot.name}</span><span className="mt-1 block text-[11px] uppercase tracking-wide text-neutral-500">Época {slot.saveData.season} · Jornada {slot.saveData.week} · {dateLabel(slot.updatedAt)}</span></button><button aria-label={`Exportar ${slot.name}`} title="Exportar save da nuvem" onClick={() => exportCloud(slot)} className="rounded-lg p-2 text-neutral-500 hover:text-yellow-200"><Download size={14}/></button><button aria-label={`Renomear ${slot.name}`} title="Renomear carreira na nuvem" onClick={() => { const name = window.prompt('Novo nome da carreira', slot.name); if (name?.trim()) void props.onRenameSlot(slot.id, name).catch(reason => setError(friendlyError(reason))); }} className="rounded-lg p-2 text-neutral-500 hover:text-yellow-200"><Pencil size={14}/></button><button aria-label={`Apagar ${slot.name}`} onClick={() => { if (window.confirm(`Apagar a carreira “${slot.name}”?`)) { setDeletingId(slot.id); void props.onDeleteSlot(slot.id).catch(reason => setError(friendlyError(reason))).finally(() => setDeletingId(null)); } }} className="rounded-lg p-2 text-neutral-500 hover:bg-red-400/10 hover:text-red-300">{deletingId === slot.id ? '…' : <Trash2 size={15} />}</button></div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center"><p className="text-sm text-neutral-300">Ainda não tens saves na nuvem.</p><p className="mt-1 text-xs text-neutral-500">Cria uma carreira para começar.</p></div>}
              {props.slotsError && <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-xs text-red-200">{props.slotsError}</p>}
              <button type="button" onClick={() => cloudImportInput.current?.click()} disabled={busy || props.slotsLoading || props.slots.length >= 5} className="mt-3 w-full rounded-lg border border-white/10 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-white/20 disabled:opacity-40"><Upload size={14} className="mr-2 inline"/> Importar ficheiro para a nuvem</button>{cloudError && <p role="alert" className="mt-2 text-xs text-red-200">{cloudError}</p>}
              <div className="mt-4 flex gap-2"><input value={newSaveName} onChange={e => setNewSaveName(e.target.value)} maxLength={40} className="field-input min-w-0 flex-1" aria-label="Nome da nova carreira" /><button onClick={() => void createSave()} disabled={busy || props.slotsLoading || props.slots.length >= 5 || !newSaveName.trim()} className="opening-cta shrink-0"><Plus size={16} /> NOVA</button></div>
              <button onClick={() => props.onStartGuest(false)} className="mt-4 w-full text-[11px] uppercase tracking-wider text-neutral-500 hover:text-white">Jogar offline neste dispositivo</button>
              <button onClick={props.onCreateOfflineCareer} className="mt-3 w-full rounded-lg border border-yellow-300/20 bg-yellow-300/[.04] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-yellow-100 hover:border-yellow-300/40"><Plus size={15} className="mr-2 inline" /> Nova carreira offline</button>
              {props.offlineSaves.length > 0 && <div className="mt-4 space-y-2"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Carreiras offline criadas</p>{props.offlineSaves.map(renderOfflineSlot)}</div>}
            </>
          )}
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/[.07]"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-[10px] uppercase tracking-[.18em] text-neutral-600 sm:px-8"><span>Football MP Simulator</span><span className="flex items-center gap-2"><ShieldCheck size={12} /> A TUA CARREIRA, O TEU JOGO</span></div></footer>
    </main>
  );
}
