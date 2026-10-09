import type { ReactNode } from 'react';
export function StatCard({ label, value, note, icon }: { label: string; value: string; note?: string; icon: ReactNode }) {
  return <div className="panel p-4"><div className="flex items-center justify-between text-slate-400"><span className="text-xs uppercase tracking-wider">{label}</span><span className="text-lime-400">{icon}</span></div><div className="mt-3 text-2xl font-bold text-white">{value}</div>{note && <div className="mt-1 text-xs text-slate-500">{note}</div>}</div>;
}
