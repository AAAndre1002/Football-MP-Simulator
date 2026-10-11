import { useId } from 'react';
import type { Player } from '../types';

type Appearance = NonNullable<Player['appearance']>;
const hairTones: Record<string, string> = {
  Preto: '#171516', 'Castanho escuro': '#30201c', Castanho: '#68402c', Loiro: '#c39a52', Ruivo: '#a64d32', Grisalho: '#aaa9a3',
};
const eyeTones: Record<string, string> = { Castanhos: '#70442c', Azuis: '#4b9bc4', Verdes: '#4f9b69', Avelã: '#9a7941', Cinzentos: '#8b9aa0' };

/** Original, locally rendered player portrait. No player photography or club marks are used. */
export function PlayerAvatar({ player, className = '', compact = false }: { player: Pick<Player, 'name' | 'appearance'>; className?: string; compact?: boolean }) {
  const patternId = `avatar-lines-${useId().replace(/:/g, '')}`;
  const appearance: Appearance = player.appearance ?? { hairStyle: 'Curto', hairColor: 'Preto', eyeColor: 'Castanhos' };
  const hair = hairTones[appearance.hairColor] ?? hairTones.Preto;
  const eyes = eyeTones[appearance.eyeColor] ?? eyeTones.Castanhos;
  const hairstyle = appearance.hairStyle;
  const longHair = hairstyle === 'Comprido' || hairstyle === 'Tranças';
  const curls = hairstyle === 'Caracóis';
  const shaved = hairstyle === 'Rapado';
  const hairShape = shaved
    ? 'M64 106 Q66 46 120 43 Q174 46 176 106 Q162 77 144 74 Q119 82 96 73 Q75 78 64 106Z'
    : curls
      ? 'M61 112 Q52 82 67 65 Q62 39 91 42 Q100 21 121 39 Q145 23 154 48 Q182 47 175 75 Q190 94 174 119 L161 100 Q157 72 137 68 Q120 84 101 67 Q80 76 76 101Z'
      : hairstyle === 'Médio'
        ? 'M60 112 Q53 50 92 40 Q130 22 159 45 Q185 63 177 116 L160 98 Q160 73 143 67 Q117 77 96 67 Q75 75 75 100Z'
        : hairstyle === 'Comprido'
          ? 'M60 111 Q51 50 91 40 Q129 22 159 45 Q185 64 178 119 L180 191 Q162 179 160 144 L159 98 Q151 74 139 68 Q116 78 97 67 Q76 75 75 100 L77 185 Q59 178 59 151Z'
          : hairstyle === 'Tranças'
            ? 'M60 111 Q51 51 91 40 Q130 22 159 45 Q184 63 178 116 L166 102 L171 169 L158 174 L155 97 Q146 74 136 68 Q116 77 97 67 Q76 75 75 101 L80 170 L67 174 L61 131Z'
            : 'M62 110 Q55 50 91 40 Q130 22 159 45 Q184 62 177 110 L161 98 Q158 75 143 68 Q119 77 97 67 Q75 75 75 101Z';
  const initial = player.name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'J';

  return <div className={`relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#111719] ${className}`}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_24%,rgba(190,158,92,.22),transparent_60%)]" aria-hidden="true" />
    <svg className="relative h-full w-full" viewBox="0 0 240 280" role="img" aria-label={`Retrato ilustrado de ${player.name || 'jogador'}, cabelo ${appearance.hairStyle.toLowerCase()} ${appearance.hairColor.toLowerCase()}, olhos ${appearance.eyeColor.toLowerCase()}`}>
      <defs><pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 8 0" stroke="#fff" strokeOpacity=".035" /></pattern></defs>
      <path d="M0 0h240v280H0z" fill={`url(#${patternId})`} />
      <path d="M24 280 Q31 221 68 205 L96 193 H144 L172 205 Q209 221 216 280Z" fill="#bdc8c4" />
      <path d="M75 207 Q94 223 120 226 Q147 223 165 207 L181 218 Q158 255 120 258 Q81 255 59 218Z" fill="#f4f1e8" />
      <path d="M105 177h30v29q-14 18-30 0Z" fill="#b87959" />
      <path d="M74 93 Q74 55 120 52 Q166 55 166 93 L160 153 Q153 180 120 189 Q87 180 80 153Z" fill="#c98d6b" />
      <path d={hairShape} fill={hair} />
      {longHair && <path d="M69 94 Q61 127 68 184 L80 188 82 108ZM171 96 Q180 133 171 186 L159 188 158 107Z" fill={hair} />}
      <path d="M91 116 Q101 109 110 115" fill="none" stroke="#59382f" strokeWidth="3" strokeLinecap="round" />
      <path d="M130 115 Q140 109 149 116" fill="none" stroke="#59382f" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="101" cy="126" rx="4.3" ry="3.2" fill="#f5eee2" /><ellipse cx="139" cy="126" rx="4.3" ry="3.2" fill="#f5eee2" />
      <circle cx="102" cy="126" r="2.4" fill={eyes} /><circle cx="140" cy="126" r="2.4" fill={eyes} />
      <path d="M119 126 Q113 143 116 149 Q120 152 125 149" fill="none" stroke="#a96951" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M108 162 Q120 168 132 162" fill="none" stroke="#75483d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 280 Q37 239 71 219 Q88 238 120 240 Q151 239 169 219 Q203 238 214 280" fill="#203b38" />
      <path d="M101 211 120 231 139 211 132 200H108Z" fill="#e0e0d7" />
      <path d="M113 238h14l-3 42h-8Z" fill="#d6b56e" opacity=".9" />
      {!compact && <text x="120" y="271" textAnchor="middle" fill="#ffffff" fillOpacity=".75" fontSize="9" fontFamily="sans-serif" fontWeight="700" letterSpacing="2">{initial}</text>}
    </svg>
    <span className="sr-only">Avatar original com aparência definida na criação do jogador.</span>
  </div>;
}
