import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Shield, UserRound, SlidersHorizontal, Sparkles } from 'lucide-react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  CAREER_SEASON, DEFAULT_CREATION, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, POSITIONS,
  calculateOverall, rollPotential, MAX_POTENTIAL_ROLLS, hasPotentialRollsRemaining, compatibleSecondaryPositions, createPlayer, isNationalityValid, isPortugueseMunicipalityValid, profileForRole, rolesForPosition, validateCreation,
  type CreatedPlayer, type FlatAttribute, type PlayerCreationInput,
} from './playerCreation';
import { COUNTRY_OPTIONS, NATIONALITY_OPTIONS, PORTUGAL_REGIONS } from './geographyData';

const steps = [
  { title: 'Identidade', icon: UserRound, hint: 'Nome, nacionalidade por bandeira e naturalidade validada.' },
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
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [potentialSeed, setPotentialSeed] = useState(() => Math.random());
  const [potentialRollCount, setPotentialRollCount] = useState(1);
  const potentialRollCountRef = useRef(1);
  const errors = useMemo(() => validateCreation(input), [input]);
  const visibleCountries = useMemo(() => {
    const query = nationalitySearch.trim().toLocaleLowerCase('pt-PT');
    return query ? NATIONALITY_OPTIONS.filter(country => country.name.toLocaleLowerCase('pt-PT').includes(query)) : NATIONALITY_OPTIONS;
  }, [nationalitySearch]);
  const selectedNationality = NATIONALITY_OPTIONS.find(country => country.name === input.nationality);
  const birthCountryOption = COUNTRY_OPTIONS.find(country => country.name === input.birthCountry);
  const bornInPortugal = birthCountryOption?.code === 'PT';
  const availableMunicipalities = PORTUGAL_REGIONS.find(region => region.name === input.birthRegion)?.municipalities ?? [];
  const initialOverall = calculateOverall(input.attributes, input.primaryPosition, input.roleId);
  const startingPotential = rollPotential(initialOverall, input.roleId, input.primaryPosition, () => potentialSeed);
  const canRerollPotential = hasPotentialRollsRemaining(potentialRollCount);
  const rerollPotential = () => {
    const currentCount = potentialRollCountRef.current;
    if (!hasPotentialRollsRemaining(currentCount)) return;
    const nextCount = currentCount + 1;
    potentialRollCountRef.current = nextCount;
    setPotentialRollCount(nextCount);
    setPotentialSeed(Math.random());
  };
  const setField = <K extends keyof PlayerCreationInput>(key: K, value: PlayerCreationInput[K]) => setInput(current => ({ ...current, [key]: value }));
  const chooseNationality = (name: string) => {
    setSubmittedError('');
    setInput(current => {
      const followsNationality = !current.birthCountry;
      return { ...current, nationality: name, ...(followsNationality ? { birthCountry: name, birthRegion: '', birthCity: '' } : {}) };
    });
    setNationalitySearch('');
  };
  const changeBirthCountry = (code: string) => {
    const country = COUNTRY_OPTIONS.find(item => item.code === code);
    if (!country) return;
    setInput(current => current.birthCountry === country.name ? current : { ...current, birthCountry: country.name, birthRegion: '', birthCity: '' });
  };
  const changePosition = (position: PlayerCreationInput['primaryPosition']) => {
    const firstRole = rolesForPosition(position)[0];
    setInput(current => ({ ...current, primaryPosition: position, roleId: firstRole.id, secondaryPositions: current.secondaryPositions.filter(item => compatibleSecondaryPositions(position).includes(item)).slice(0, 2), attributes: profileForRole(position, firstRole.id) }));
  };
  const changeRole = (roleId: string) => setInput(current => ({ ...current, roleId, attributes: profileForRole(current.primaryPosition, roleId) }));
  const toggleSecondary = (position: PlayerCreationInput['primaryPosition']) => setInput(current => {
    const selected = current.secondaryPositions.includes(position) ? current.secondaryPositions.filter(item => item !== position) : current.secondaryPositions.length < 2 ? [...current.secondaryPositions, position] : current.secondaryPositions;
    return { ...current, secondaryPositions: selected };
  });
  const complete = () => {
    const issue = validateCreation(input)[0];
    if (issue) { setSubmittedError(issue); return; }
    setSubmittedError('');
    try { onComplete(createPlayer(input, undefined, startingPotential)); }
    catch (reason) { setSubmittedError(reason instanceof Error ? reason.message : 'Não foi possível criar o jogador. Confirma os dados e tenta novamente.'); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); complete(); };
  const birthplaceValid = bornInPortugal
    ? isPortugueseMunicipalityValid(input.birthRegion, input.birthCity)
    : !!birthCountryOption && !input.birthRegion && !input.birthCity;
  const canAdvance = step === 0
    ? !!input.name.trim() && isNationalityValid(input.nationality) && !!birthCountryOption && birthplaceValid
    : step === 1 ? input.heightCm >= 140 && input.heightCm <= 220 && input.weightKg >= 40 && input.weightKg <= 130
      : step === 2 ? rolesForPosition(input.primaryPosition).some(item => item.id === input.roleId)
        : errors.length === 0;

  return (
    <main className="opening-screen min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="stadium-glow" aria-hidden="true" />
      <section className="relative mx-auto max-w-5xl">
        <header className="mb-7 flex items-center justify-between gap-3">
          <div><p className="opening-eyebrow"><span /> CRIADOR DE JOGADOR</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Constrói o teu atleta</h1><p className="mt-1 text-sm text-neutral-400">Início aos 16 anos · Época {CAREER_SEASON}</p></div>
          {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Sair</button>}
        </header>
        <section aria-label="Pré-visualização do jogador" className="mb-5 flex items-center gap-4 rounded-2xl border border-amber-200/15 bg-gradient-to-r from-[#171916] to-[#101214] p-3 sm:gap-5 sm:p-4">
          <PlayerAvatar player={{ name: input.name, appearance: input.appearance }} className="h-28 w-24 shrink-0 sm:h-36 sm:w-32" />
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-200">Pré-visualização ao vivo</p><h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">{input.name.trim() || 'O teu jogador'}</h2><p className="mt-1 text-sm text-neutral-400">{labelFor(input.primaryPosition)} · 16 anos · {selectedNationality ? `${selectedNationality.flag} ${selectedNationality.name}` : 'Nacionalidade por definir'}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-neutral-400"><span className="rounded-full border border-white/10 px-2.5 py-1">Cabelo {input.appearance.hairStyle}</span><span className="rounded-full border border-white/10 px-2.5 py-1">{input.appearance.hairColor}</span><span className="rounded-full border border-white/10 px-2.5 py-1">Olhos {input.appearance.eyeColor}</span></div></div>
          <div className="hidden rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center sm:block"><p className="text-[9px] uppercase tracking-widest text-neutral-500">OVR · potencial inicial</p><p className="mt-1 text-2xl font-black text-amber-200">{initialOverall}<span className="mx-1 text-neutral-600">/</span>{startingPotential}</p></div>
        </section>
        <div className="mb-5 grid grid-cols-4 gap-2" aria-label={`Passo ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => <div key={item.title} className={`rounded-lg border p-2 sm:p-3 ${index === step ? 'border-yellow-300/50 bg-yellow-300/[.08]' : index < step ? 'border-yellow-300/20 bg-white/[.03]' : 'border-white/[.07] bg-black/30'}`}>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide sm:gap-2 sm:text-[10px]">{index < step ? <Check size={14} className="text-yellow-300" /> : <item.icon size={14} className={index === step ? 'text-yellow-300' : 'text-neutral-500'} />}<span className={index === step ? 'text-yellow-100' : 'text-neutral-500'}>{item.title}</span></div>
          </div>)}
        </div>
        <form className="opening-card" onSubmit={submit}>
          <div className="mb-6"><p className="opening-eyebrow small"><span /> PASSO {step + 1} DE {steps.length}</p><h2 className="mt-2 text-xl font-bold">{steps[step].title}</h2><p className="mt-1 text-sm text-neutral-400">{steps[step].hint}</p></div>
          {step === 0 && <div className="space-y-5">
            <label className="field-label">NOME DO TEU JOGADOR<input autoFocus required aria-label="Nome do teu jogador" className="field-input player-name-input" maxLength={60} value={input.name} onChange={event => { setSubmittedError(''); setField('name', event.target.value); }} placeholder="Escreve o nome do teu jogador" /></label>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-xl border border-white/[.08] bg-black/20 p-4" aria-labelledby="nationality-label">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p id="nationality-label" className="field-label">NACIONALIDADE</p><p className="mt-1 text-xs text-neutral-500">Escolhe uma bandeira — não há texto livre.</p></div>{selectedNationality ? <span className="rounded-full border border-amber-200/20 bg-amber-200/[.06] px-3 py-1 text-xs text-amber-100">{selectedNationality.flag} {selectedNationality.name}</span> : null}</div>
                <input type="search" autoComplete="off" aria-label="Procurar nacionalidade" className="field-input mt-3" value={nationalitySearch} onChange={event=>setNationalitySearch(event.target.value)} placeholder="Procurar país para filtrar as bandeiras…" />
                <div role="group" aria-label="Selecionar nacionalidade por bandeira" className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">{visibleCountries.map(country=><button key={country.code} type="button" aria-pressed={input.nationality===country.name} onClick={()=>chooseNationality(country.name)} className={`flex min-h-12 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${input.nationality===country.name?'border-amber-200/55 bg-amber-200/[.12] text-white':'border-white/[.07] bg-white/[.02] text-neutral-300 hover:border-amber-200/25'}`}><span aria-hidden="true" className="text-lg leading-none">{country.flag}</span><span className="truncate">{country.name}</span></button>)}{visibleCountries.length===0&&<p className="col-span-full py-4 text-center text-xs text-neutral-500">Nenhum país encontrado. Escolhe um nome da lista.</p>}</div>
              </section>
              <div className="space-y-4">
                <label className="field-label">PAÍS DE NASCIMENTO<select className="field-input mt-2" value={birthCountryOption?.code ?? ''} onChange={event=>changeBirthCountry(event.target.value)}><option value="">Seleciona um país</option>{COUNTRY_OPTIONS.map(country=><option key={country.code} value={country.code}>{country.flag} {country.name}</option>)}</select></label>
                {bornInPortugal ? <div className="space-y-4 rounded-xl border border-amber-200/15 bg-amber-200/[.035] p-4"><label className="field-label block">DISTRITO / REGIÃO<select className="field-input mt-2" value={input.birthRegion} onChange={event=>setInput(current=>({...current,birthRegion:event.target.value,birthCity:''}))}><option value="">Seleciona distrito ou região</option>{PORTUGAL_REGIONS.map(region=><option key={region.name} value={region.name}>{region.name}</option>)}</select></label><label className="field-label block">CONCELHO<select className="field-input mt-2" disabled={!input.birthRegion} value={input.birthCity} onChange={event=>setField('birthCity',event.target.value)}><option value="">{input.birthRegion?'Seleciona o concelho':'Escolhe primeiro o distrito/região'}</option>{availableMunicipalities.map(municipality=><option key={municipality} value={municipality}>{municipality}</option>)}</select></label><p className="text-[10px] leading-4 text-neutral-500">Lista validada dos 308 municípios portugueses; os concelhos mudam conforme o distrito ou região.</p></div> : birthCountryOption ? <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-sm font-semibold text-neutral-200">Naturalidade selecionada: {birthCountryOption.flag} {birthCountryOption.name}</p><p className="mt-2 text-xs leading-5 text-neutral-500">Para evitar localidades inventadas, neste país fica registado apenas o país de nascimento. As listas de distrito e concelho estão validadas para Portugal.</p></div> : <p className="rounded-xl border border-white/[.07] bg-white/[.025] p-4 text-xs leading-5 text-neutral-500">Escolhe o país onde nasceu o jogador. Se for Portugal, aparecem listas ligadas de distrito e concelho.</p>}
              </div>
            </div>
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
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200/15 bg-gradient-to-br from-[#191b18] to-[#101214] p-4 sm:flex-row sm:p-5"><PlayerAvatar player={{ name: input.name, appearance: input.appearance }} className="h-52 w-44 shrink-0 sm:h-60 sm:w-52" /><div className="text-center sm:text-left"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-200">Revisão final do atleta</p><h3 className="mt-2 text-2xl font-black">{input.name}</h3><p className="mt-1 text-sm text-neutral-400">{selectedNationality?.flag} {input.nationality} · {labelFor(input.primaryPosition)} · 16 anos</p><p className="mt-3 text-xs leading-5 text-neutral-400">Este retrato ilustrado é gerado no jogo com as opções de cabelo e olhos escolhidas. Será mantido no teu perfil e no save.</p></div></div>
            <section aria-label="Cálculo inicial do jogador" className="rounded-2xl border border-amber-200/20 bg-gradient-to-r from-amber-200/[.09] via-black/30 to-black/20 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-200">Avaliação inicial · início da carreira</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[.08] bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Overall inicial (OVR)</p><p className="mt-1 text-4xl font-black text-white">{initialOverall}<span className="ml-2 text-sm font-medium text-neutral-500">/ 100</span></p><p className="mt-2 text-xs leading-5 text-neutral-400">Média ponderada dos atributos pela posição e função escolhidas.</p></div><div className="rounded-xl border border-amber-200/15 bg-amber-200/[.04] p-4"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Potencial inicial · dado</p><button type="button" aria-label={canRerollPotential ? `Lançar novamente o potencial (${MAX_POTENTIAL_ROLLS - potentialRollCount} lançamentos restantes)` : 'Não há lançamentos restantes para o potencial'} onClick={rerollPotential} disabled={!canRerollPotential} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${canRerollPotential ? 'border-amber-200/25 text-amber-100 hover:bg-amber-200/[.09]' : 'cursor-not-allowed border-white/10 text-neutral-500 opacity-60'}`}>{canRerollPotential ? `🎲 Lançar (${MAX_POTENTIAL_ROLLS - potentialRollCount} restantes)` : '🎲 Sem lançamentos'}</button></div><p className="mt-2 text-4xl font-black text-amber-100">{startingPotential}<span className="ml-2 text-sm font-medium text-neutral-500">/ 100</span></p><p className="mt-2 text-xs leading-5 text-neutral-400">Lançamento {potentialRollCount} de {MAX_POTENTIAL_ROLLS}. Sorteado entre OVR + 5 e OVR + 15, com bónus da função e limitado a 100. Não é editável.</p></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[.08] pt-3 text-xs"><span className="text-neutral-300">{labelFor(input.primaryPosition)} · {rolesForPosition(input.primaryPosition).find(item => item.id === input.roleId)?.label}</span><span className="text-neutral-500">Idade 16 · {CAREER_SEASON}</span></div><p className="mt-3 text-xs leading-5 text-neutral-400">O potencial é dinâmico: pode evoluir gradualmente durante a carreira conforme o treino concluído, os minutos e as notas recentes, a idade, a moral e a relação com o treinador.</p></section>
            <div className="grid gap-4 sm:grid-cols-2">{attributeGroups.map(group => <fieldset key={group.title} className="rounded-lg border border-white/[.07] bg-black/25 p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-yellow-200">{group.title}</legend>{group.keys.map(key => <label key={key} className={`my-2 grid grid-cols-[1fr_auto] items-center gap-x-3 ${group.title === 'Guarda-redes' && input.primaryPosition !== 'GK' ? 'opacity-40' : ''}`}><span className="text-xs text-neutral-300">{attributeLabels[key]}</span><span className="text-xs font-bold tabular-nums text-yellow-100">{input.attributes[key]}</span><input aria-label={attributeLabels[key]} type="range" min={0} max={100} step={1} value={input.attributes[key]} onChange={event => setField('attributes', { ...input.attributes, [key]: Number(event.target.value) })} className="col-span-2 h-2 w-full accent-yellow-300" /></label>)}</fieldset>)}</div>
            {errors.length > 0 && <div role="alert" className="rounded-lg border border-yellow-300/20 bg-yellow-300/[.06] p-3 text-xs text-yellow-100">{errors[0]}</div>}
            <div className="rounded-lg border border-white/[.07] p-3 text-xs leading-5 text-neutral-400"><strong className="text-white">{input.name || 'Nome por definir'}</strong> · {input.nationality || 'Nacionalidade por definir'} · {input.heightCm} cm / {input.weightKg} kg · Pé {input.preferredFoot === 'right' ? 'direito' : input.preferredFoot === 'left' ? 'esquerdo' : 'ambidestro'}<br />Nascimento: {[input.birthCity,input.birthRegion,input.birthCountry].filter(Boolean).join(', ') || 'Por definir'} · Secundárias: {input.secondaryPositions.map(labelFor).join(', ') || 'Nenhuma'}</div>
          </div>}
          {submittedError && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.07] p-3 text-sm text-red-200">{submittedError}</p>}
          <div className="mt-7 flex items-center justify-between border-t border-white/[.07] pt-5">
            <button type="button" onClick={() => { setSubmittedError(''); setStep(value => Math.max(0, value - 1)); }} disabled={step === 0} className="btn-secondary"><ArrowLeft size={15} /> Anterior</button>
            {step < steps.length - 1 ? <button type="button" onClick={() => { setSubmittedError(''); setStep(value => Math.min(steps.length - 1, value + 1)); }} disabled={!canAdvance} className="opening-cta">Continuar <ArrowRight size={15} /></button> : <button type="button" onClick={complete} disabled={!canAdvance} className="opening-cta">Criar jogador <Check size={15} /></button>}
          </div>
        </form>
      </section>
    </main>
  );
}
