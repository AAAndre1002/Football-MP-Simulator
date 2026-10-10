import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Shield, UserRound, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  CAREER_SEASON, DEFAULT_CREATION, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, POSITIONS,
  calculateOverall, calculatePotential, compatibleSecondaryPositions, profileForRole, rolesForPosition, submitPlayerCreation, validateCreation,
  type CreatedPlayer, type FlatAttribute, type PlayerCreationInput,
} from './playerCreation';

const steps = [
  { title: 'Identidade', icon: UserRound, hint: 'Nome, nacionalidade e local de nascimento.' },
  { title: 'Aparência e físico', icon: Sparkles, hint: 'Define o aspeto e as características físicas.' },
  { title: 'Posição e função', icon: Shield, hint: 'Escolhe uma posição e uma função compatível.' },
  { title: 'Atributos', icon: SlidersHorizontal, hint: 'Revê o perfil 0–100 e confirma o jogador.' },
];
const attributeLabels: Record<FlatAttribute, string> = {
  pace: 'Velocidade', acceleration: 'Aceleração', stamina: 'Resistência', strength: 'Força', agility: 'Agilidade',
  passing: 'Passe', shooting: 'Remate', dribbling: 'Drible', tackling: 'Desarme', vision: 'Visão de jogo', ballControl: 'Controlo de bola',
  decisions: 'Decisões', positioning: 'Posicionamento', teamwork: 'Trabalho de equipa', composure: 'Frieza', leadership: 'Liderança',
  gkReflexes: 'Reflexos', gkHandling: 'Agarrar a bola', gkPositioning: 'Posicionamento de guarda-redes',
};
const attributeGroups: { title: string; keys: FlatAttribute[] }[] = [
  { title: 'Físicos', keys: ['pace','acceleration','stamina','strength','agility'] },
  { title: 'Técnicos', keys: ['passing','shooting','dribbling','tackling','vision','ballControl'] },
  { title: 'Mentais', keys: ['decisions','positioning','teamwork','composure','leadership'] },
  { title: 'Guarda-redes', keys: ['gkReflexes','gkHandling','gkPositioning'] },
];
const labelFor = (position: string) => POSITIONS.find(item => item.position === position)?.label ?? position;

export interface PlayerCreationWizardProps {
  onComplete: (created: CreatedPlayer) => void;
  onCancel?: () => void;
  initialValues?: Partial<PlayerCreationInput>;
}
export function PlayerCreationWizard({ onComplete, onCancel, initialValues }: PlayerCreationWizardProps) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<PlayerCreationInput>(() => ({ ...DEFAULT_CREATION, ...initialValues, appearance: { ...DEFAULT_CREATION.appearance, ...initialValues?.appearance }, attributes: { ...DEFAULT_CREATION.attributes, ...initialValues?.attributes } }));
  const [submittedError, setSubmittedError] = useState('');
  const errors = useMemo(() => validateCreation(input), [input]);
  const setField = <K extends keyof PlayerCreationInput>(key: K, value: PlayerCreationInput[K]) => setInput(current => ({ ...current, [key]: value }));
  const changePosition = (position: PlayerCreationInput['primaryPosition']) => {
    const firstRole = rolesForPosition(position)[0];
    setInput(current => ({ ...current, primaryPosition: position, roleId: firstRole.id, secondaryPositions: current.secondaryPositions.filter(item => compatibleSecondaryPositions(position).includes(item)).slice(0, 2), attributes: profileForRole(position, firstRole.id) }));
  };
  const changeRole = (roleId: string) => setInput(current => ({ ...current, roleId, attributes: profileForRole(current.primaryPosition, roleId) }));
  const toggleSecondary = (position: PlayerCreationInput['primaryPosition']) => setInput(current => {
    const selected = current.secondaryPositions.includes(position) ? current.secondaryPositions.filter(item => item !== position) : current.secondaryPositions.length < 2 ? [...current.secondaryPositions, position] : current.secondaryPositions;
    return { ...current, secondaryPositions: selected };
  });
  const completeCreation = () => { setSubmittedError('HANDLER_REACHED');
    let issue: string | null = null;     try {       issue = submitPlayerCreation(input, created => { setSubmittedError('CALLBACK_REACHED'); onComplete(created); });     } catch (error) {       setSubmittedError(`THREW: ${error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)}`);       return;     }
    if (issue) { setSubmittedError(issue); return; }
    setSubmittedError('HELPER_RETURNED');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    completeCreation();
  };
  const canAdvance = step === 0
    ? !!input.name.trim() && !!input.nationality.trim() && !!input.birthCountry.trim() && !!input.birthRegion.trim() && !!input.birthCity.trim()
    : step === 1 ? input.heightCm >= 140 && input.heightCm <= 220 && input.weightKg >= 40 && input.weightKg <= 130
      : step === 2 ? rolesForPosition(input.primaryPosition).some(item => item.id === input.roleId)
        : errors.length === 0;

  return (
    <main className="opening-screen min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="stadium-glow" aria-hidden="true" />
      <section className="relative mx-auto max-w-3xl">
        <header className="mb-7 flex items-center justify-between gap-3">
          <div><p className="opening-eyebrow"><span /> CRIADOR DE JOGADOR</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Constrói o teu atleta</h1><p className="mt-1 text-sm text-neutral-400">Início aos 16 anos · Época {CAREER_SEASON}</p></div>
          {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Sair</button>}
        </header>
        <div className="mb-5 grid grid-cols-4 gap-2" aria-label={`Passo ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => <div key={item.title} className={`rounded-lg border p-2 sm:p-3 ${index === step ? 'border-yellow-300/50 bg-yellow-300/[.08]' : index < step ? 'border-yellow-300/20 bg-white/[.03]' : 'border-white/[.07] bg-black/30'}`}>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide sm:gap-2 sm:text-[10px]">{index < step ? <Check size={14} className="text-yellow-300" /> : <item.icon size={14} className={index === step ? 'text-yellow-300' : 'text-neutral-500'} />}<span className={index === step ? 'text-yellow-100' : 'text-neutral-500'}>{item.title}</span></div>
          </div>)}
        </div>
        <form className="opening-card" onSubmit={submit} noValidate>
          <div className="mb-6"><p className="opening-eyebrow small"><span /> PASSO {step + 1} DE {steps.length}</p><h2 className="mt-2 text-xl font-bold">{steps[step].title}</h2><p className="mt-1 text-sm text-neutral-400">{steps[step].hint}</p></div>
          {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">NOME DO JOGADOR<input autoFocus className="field-input" maxLength={60} value={input.name} onChange={event => setField('name', event.target.value)} placeholder="Ex.: Alex Silva" /></label>
            <label className="field-label">NACIONALIDADE<input className="field-input" maxLength={60} value={input.nationality} onChange={event => setField('nationality', event.target.value)} placeholder="Ex.: Portugal" /></label>
            <label className="field-label">PAÍS DE NASCIMENTO<input className="field-input" maxLength={60} value={input.birthCountry} onChange={event => setField('birthCountry', event.target.value)} placeholder="Ex.: Portugal" /></label>
            <label className="field-label">REGIÃO / DISTRITO<input className="field-input" maxLength={80} value={input.birthRegion} onChange={event => setField('birthRegion', event.target.value)} placeholder="Ex.: Aveiro" /></label>
            <label className="field-label">CIDADE<input className="field-input" maxLength={80} value={input.birthCity} onChange={event => setField('birthCity', event.target.value)} placeholder="Ex.: Santa Maria da Feira" /></label>
          </div>}
          {step === 1 && <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="field-label">ESTILO DE CABELO<select className="field-input" value={input.appearance.hairStyle} onChange={event => setField('appearance', { ...input.appearance, hairStyle: event.target.value })}>{HAIR_STYLES.map(value => <option key={value}>{value}</option>)}</select></label>
              <label className="field-label">COR DO CABELO<select className="field-input" value={input.appearance.hairColor} onChange={event => setField('appearance', { ...input.appearance, hairColor: event.target.value })}>{HAIR_COLORS.map(value => <option key={value}>{value}</option>)}</select></label>
              <label className="field-label">COR DOS OLHOS<select className="field-input" value={input.appearance.eyeColor} onChange={event => setField('appearance', { ...input.appearance, eyeColor: event.target.value })}>{EYE_COLORS.map(value => <option key={value}>{value}</option>)}</select></label>
              <label className="field-label">ALTURA (CM)<input className="field-input" type="number" min={140} max={220} step={1} value={input.heightCm} onChange={event => setField('heightCm', Number(event.target.value))} /></label>
              <label className="field-label">PESO (KG)<input className="field-input" type="number" min={40} max={130} step={1} value={input.weightKg} onChange={event => setField('weightKg', Number(event.target.value))} /></label>
              <label className="field-label">PÉ PREFERIDO<select className="field-input" value={input.preferredFoot} onChange={event => setField('preferredFoot', event.target.value as PlayerCreationInput['preferredFoot'])}><option value="right">Direito</option><option value="left">Esquerdo</option><option value="ambidextrous">Ambidestro</option></select></label>
            </div>
            <p className="text-xs text-neutral-500">Altura válida: 140–220 cm · Peso válido: 40–130 kg.</p>
          </div>}
          {step === 2 && <div className="space-y-5">
            <label className="field-label">POSIÇÃO PRINCIPAL<select className="field-input" value={input.primaryPosition} onChange={event => changePosition(event.target.value as PlayerCreationInput['primaryPosition'])}>{POSITIONS.map(item => <option key={item.position} value={item.position}>{item.label}</option>)}</select></label>
            <div className="grid gap-2 sm:grid-cols-2">{rolesForPosition(input.primaryPosition).map(item => <button key={item.id} type="button" onClick={() => changeRole(item.id)} className={`rounded-lg border p-3 text-left transition ${input.roleId === item.id ? 'border-yellow-300/60 bg-yellow-300/[.08]' : 'border-white/[.08] bg-black/30 hover:border-white/20'}`}><span className="block text-sm font-bold text-white">{item.label}</span><span className="mt-1 block text-xs leading-5 text-neutral-400">{item.description}</span></button>)}</div>
            <div><div className="mb-2 flex items-center justify-between"><span className="field-label">POSIÇÕES SECUNDÁRIAS</span><span className="text-[10px] text-neutral-500">Até 2 · {input.secondaryPositions.length}/2</span></div><div className="flex flex-wrap gap-2">{compatibleSecondaryPositions(input.primaryPosition).length ? compatibleSecondaryPositions(input.primaryPosition).map(position => <button key={position} type="button" aria-pressed={input.secondaryPositions.includes(position)} onClick={() => toggleSecondary(position)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${input.secondaryPositions.includes(position) ? 'border-yellow-300 bg-yellow-300 text-black' : 'border-white/10 bg-black text-neutral-300 hover:border-yellow-300/40'}`}>{labelFor(position)}</button>) : <span className="text-xs text-neutral-500">Esta posição não tem posições secundárias compatíveis.</span>}</div></div>
            <p className="rounded-lg border border-yellow-300/10 bg-yellow-300/[.035] p-3 text-xs leading-5 text-neutral-400">As opções variam conforme a posição principal. O guarda-redes não tem posições secundárias; o ponta de lança pode adaptar-se a médio ofensivo ou extremo, nunca a médio defensivo.</p>
          </div>}
          {step === 3 && <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-white/[.07] bg-black/30 p-3 sm:grid-cols-3"><div><span className="text-[9px] uppercase tracking-wider text-neutral-500">Posição / função</span><p className="mt-1 text-sm font-bold">{labelFor(input.primaryPosition)} · {rolesForPosition(input.primaryPosition).find(item => item.id === input.roleId)?.label}</p></div><div><span className="text-[9px] uppercase tracking-wider text-neutral-500">Perfil geral</span><p className="mt-1 text-sm font-bold text-yellow-200">Overall {calculateOverall(input.attributes, input.primaryPosition, input.roleId)} · Potencial {calculatePotential(calculateOverall(input.attributes, input.primaryPosition, input.roleId), input.roleId, input.primaryPosition)}</p></div><div><span className="text-[9px] uppercase tracking-wider text-neutral-500">Época inicial</span><p className="mt-1 text-sm font-bold">Idade 16 · {CAREER_SEASON}</p></div></div>
            <p className="text-xs leading-5 text-neutral-400">Perfil predefinido por posição e função. Podes ajustar cada atributo; todos têm de permanecer entre 0 e 100. Overall usa pesos da função; potencial é calculado em separado.</p>
            <div className="grid gap-4 sm:grid-cols-2">{attributeGroups.map(group => <fieldset key={group.title} className="rounded-lg border border-white/[.07] bg-black/25 p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-yellow-200">{group.title}</legend>{group.keys.map(key => <label key={key} className={`my-2 grid grid-cols-[1fr_auto] items-center gap-x-3 ${group.title === 'Guarda-redes' && input.primaryPosition !== 'GK' ? 'opacity-40' : ''}`}><span className="text-xs text-neutral-300">{attributeLabels[key]}</span><span className="text-xs font-bold tabular-nums text-yellow-100">{input.attributes[key]}</span><input aria-label={attributeLabels[key]} type="range" min={0} max={100} step={1} value={input.attributes[key]} onChange={event => setField('attributes', { ...input.attributes, [key]: Number(event.target.value) })} className="col-span-2 h-2 w-full accent-yellow-300" /></label>)}</fieldset>)}</div>
            {errors.length > 0 && <div role="alert" className="rounded-lg border border-yellow-300/20 bg-yellow-300/[.06] p-3 text-xs text-yellow-100">{errors[0]}</div>}
            <div className="rounded-lg border border-white/[.07] p-3 text-xs leading-5 text-neutral-400"><strong className="text-white">{input.name || 'Nome por definir'}</strong> · {input.nationality || 'Nacionalidade por definir'} · {input.heightCm} cm / {input.weightKg} kg · Pé {input.preferredFoot === 'right' ? 'direito' : input.preferredFoot === 'left' ? 'esquerdo' : 'ambidestro'}<br />Nascimento: {[input.birthCity,input.birthRegion,input.birthCountry].filter(Boolean).join(', ') || 'Por definir'} · Secundárias: {input.secondaryPositions.map(labelFor).join(', ') || 'Nenhuma'}</div>
          </div>}
          {submittedError && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-sm text-red-200">{submittedError}</p>}
          <div className="mt-7 flex items-center justify-between border-t border-white/[.07] pt-5">
            <button type="button" onClick={() => { setSubmittedError('HELPER_RETURNED'); setStep(value => Math.max(0, value - 1)); }} disabled={step === 0} className="btn-secondary"><ArrowLeft size={15} /> Anterior</button>
            {step < steps.length - 1 ? <button type="button" onClick={() => { setSubmittedError(''); setStep(value => Math.min(steps.length - 1, value + 1)); }} disabled={!canAdvance} className="opening-cta">Continuar <ArrowRight size={15} /></button> : <button type="button" onClick={completeCreation} disabled={!canAdvance} className="opening-cta">Criar jogador <Check size={15} /></button>}
          </div>
        </form>
      </section>
    </main>
  );
}
