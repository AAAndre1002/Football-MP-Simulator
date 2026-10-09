import { UserRound } from 'lucide-react';
import type { Player } from '../types';

function Attribute({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-3"><span className="w-32 text-sm text-slate-400">{label}</span><div className="h-2 flex-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-lime-400" style={{ width: `${value}%` }} /></div><span className="w-7 text-right text-sm font-semibold">{value}</span></div>;
}
export function PlayerProfile({ player }: { player: Player }) {
  const groups = [
    ['Físicos', Object.entries(player.attributes.physical)],
    ['Técnicos', Object.entries(player.attributes.technical)],
    ['Mentais', Object.entries(player.attributes.mental)],
  ] as const;
  const labels: Record<string, string> = { pace: 'Velocidade', acceleration: 'Aceleração', stamina: 'Resistência', strength: 'Força', agility: 'Agilidade', passing: 'Passe', shooting: 'Remate', dribbling: 'Drible', tackling: 'Corte', vision: 'Visão', ballControl: 'Controlo de bola', decisions: 'Decisão', positioning: 'Posicionamento', teamwork: 'Trabalho de equipa', composure: 'Sangue-frio', leadership: 'Liderança' };
  return <div className="space-y-5"><div><p className="text-sm text-lime-400">A tua carreira</p><h1 className="mt-1 text-3xl font-bold">Perfil do jogador</h1></div><section className="panel flex flex-wrap items-center gap-5 p-6"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-300"><UserRound size={38} /></div><div className="flex-1"><p className="text-sm text-slate-400">{player.position} · {player.age} anos · {player.nationality}</p><h2 className="text-2xl font-bold">{player.name}</h2><p className="text-sm text-slate-500">Valor estimado €{(player.marketValue ?? 0).toLocaleString('pt-PT')}</p></div><div className="rounded-xl bg-lime-400 px-4 py-3 text-center text-pitch-950"><div className="text-3xl font-black">{player.overall}</div><div className="text-[10px] font-bold uppercase tracking-widest">Overall</div></div></section><div className="grid gap-4 lg:grid-cols-3">{groups.map(([title, entries]) => <section key={title} className="panel space-y-4 p-5"><h2 className="font-semibold">{title}</h2>{entries.map(([key, value]) => <Attribute key={key} label={labels[key] ?? key} value={value} />)}</section>)}</div></div>;
}
