import { Check, Dumbbell, HeartPulse } from 'lucide-react';
import type { GameSave, Player } from '../types';

const focuses = [
  { key: 'shooting', name: 'Finalização', group: 'Técnica' },
  { key: 'passing', name: 'Passe', group: 'Técnica' },
  { key: 'dribbling', name: 'Drible', group: 'Técnica' },
  { key: 'stamina', name: 'Resistência', group: 'Físico' },
  { key: 'pace', name: 'Velocidade', group: 'Físico' },
  { key: 'decisions', name: 'Decisão', group: 'Mental' },
] as const;

export function Lifestyle({
  save,
  player,
  onFocus,
  onTrain,
}: {
  save: GameSave;
  player: Player;
  onFocus: (focus: GameSave['trainingFocus']) => void;
  onTrain: () => void;
}) {
  const selectedFocus = focuses.find(item => item.key === save.trainingFocus)?.name ?? 'Finalização';
  const relationships = [
    ['Treinador', player.coachRelationship ?? 0],
    ['Adeptos', player.fanRelationship ?? 0],
    ['Moral', player.morale ?? 0],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-lime-400">Rotina de atleta</p>
        <h1 className="mt-1 text-3xl font-bold">Estilo de vida</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-5">
          <div className="flex items-center gap-3">
            <Dumbbell className="text-lime-300" />
            <div>
              <h2 className="font-semibold">Plano de treino semanal</h2>
              <p className="text-sm text-slate-500">Semana {save.week} · escolhe um atributo para desenvolver</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {focuses.map(item => (
              <button
                key={item.key}
                onClick={() => onFocus(item.key)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${save.trainingFocus === item.key ? 'border-lime-400/50 bg-lime-400/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
              >
                <span>
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-slate-500">{item.group}</span>
                </span>
                {save.trainingFocus === item.key && <Check size={17} className="text-lime-300" />}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <p className="text-sm text-slate-400">Sessão: <strong className="text-white">{selectedFocus}</strong> · Custo €120</p>
            <button className="btn-primary" disabled={save.trainedThisWeek || save.balance < 120} onClick={onTrain}>
              {save.trainedThisWeek ? 'Treino concluído esta semana' : 'Treinar esta semana'}
            </button>
          </div>
        </section>
        <section className="panel p-5">
          <div className="flex items-center gap-3"><HeartPulse className="text-pink-300" /><h2 className="font-semibold">Bem-estar e relações</h2></div>
          <p className="mt-4 text-sm text-slate-400">A tua relação com o treinador e os adeptos influencia a carreira. Mantém boas exibições e cumpre o plano.</p>
          {relationships.map(([label, value]) => (
            <div key={label} className="mt-5">
              <div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span>{value}%</span></div>
              <div className="h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-lime-400" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </section>
      </div>
      <section className="panel p-5">
        <h2 className="font-semibold">Finanças pessoais</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Saldo atual</p><p className="mt-1 text-xl font-bold">€{save.balance.toLocaleString('pt-PT')}</p></div>
          <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Salário semanal</p><p className="mt-1 text-xl font-bold">€1.250</p></div>
          <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Patrocínios</p><p className="mt-1 text-xl font-bold">Nenhum</p></div>
        </div>
      </section>
    </div>
  );
}
