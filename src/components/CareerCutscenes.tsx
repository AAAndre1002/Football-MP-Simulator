import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clapperboard, Sparkles } from 'lucide-react';
import type { GameSave, Player } from '../types';

type Scene = { location: string; title: string; narration: string; dialogue: string };
const focusLabels: Record<string, string> = {
  shooting: 'finalização', passing: 'passe', dribbling: 'drible', tackling: 'desarme', vision: 'visão de jogo', ballControl: 'controlo de bola',
  pace: 'velocidade', acceleration: 'aceleração', stamina: 'resistência', strength: 'força', agility: 'agilidade', decisions: 'decisões', positioning: 'posicionamento', teamwork: 'trabalho de equipa', composure: 'sangue-frio', leadership: 'liderança',
};
function scenesFor(save: GameSave, player: Player, clubName: string, nextOpponent: string): Scene[] {
  const firstName = player.name.trim().split(/\s+/)[0] || 'O jogador';
  const latest = save.career.matchHistory[save.career.matchHistory.length - 1];
  const latestPress = save.pressHistory?.[Math.max(0, (save.pressHistory?.length ?? 1) - 1)];
  const lastScore = latest ? `${latest.score} frente a ${latest.opponent}` : 'o primeiro desafio ainda está por chegar';
  const lastRating = latest ? `Nota ${latest.rating.toFixed(1)} · ${latest.minutes ?? 0} minutos` : 'A oportunidade de estreia aproxima-se';
  const focus = focusLabels[save.trainingFocus] ?? 'desenvolvimento individual';
  const currentPotential = player.potential ?? player.overall;
  const initialPotential = player.initialPotential ?? currentPotential;
  const seasonWeek = `Época ${save.season} · Jornada ${save.week}`;
  const fatigue = Math.round(save.career.fatigue);
  const training = save.lastTraining?.week === save.week ? `A última sessão melhorou ${focusLabels[save.lastTraining.focus] ?? 'um atributo'} em ${save.lastTraining.attributeGain.toFixed(1)}.` : `Hoje o foco é ${focus}.`;
  const route = save.academyDevelopment?.route === 'first-team' ? 'O caminho foi pela equipa principal.' : save.academyDevelopment?.route === 'reserve' ? 'O caminho começou por ganhar minutos na equipa de desenvolvimento.' : 'O percurso ainda está a ser escrito.';
  return [
    { location: 'A cidade · antes do primeiro contrato', title: 'Antes de todos os holofotes', narration: `Em ${player.birthCity || player.birthCountry || 'casa'}, o sonho ainda cabia num saco de treino. Agora, ${firstName} leva as mesmas raízes para cada sessão em ${clubName}.`, dialogue: '“Não esqueci de onde comecei.”' },
    { location: 'Centro de treinos · manhã cedo', title: 'A primeira luz acesa', narration: `${firstName} chega antes do resto do plantel. O relvado está húmido, as bancadas vazias — e a jornada ${save.week} começa com uma escolha: ${focus}.`, dialogue: '“Mais uma repetição. Só mais uma.”' },
    { location: 'Balneário · minutos antes do jogo', title: 'O nome na camisola', narration: `A camisola de ${clubName} espera por ${firstName}. No quadro tático está escrito o nome de ${nextOpponent}; o barulho do estádio já atravessa as paredes.`, dialogue: '“Joga simples. Joga por todos.”' },
    { location: 'Túnel · saída para o relvado', title: 'O túnel parece mais longo', narration: `As luzes crescem a cada passo. ${firstName} olha para a braçadeira do capitão, respira fundo e recorda cada treino que o trouxe até aqui.`, dialogue: '“Quando a porta abrir, é a nossa vez.”' },
    { location: 'Relvado · o momento decisivo', title: 'Um segundo para escolher', narration: latest ? `O último capítulo terminou com ${lastScore}. ${lastRating}. A próxima decisão, porém, ainda pertence a ${firstName}.` : `${nextOpponent} fecha espaços e o jogo pede coragem. Um passe bem escolhido pode mudar a história da jornada.`, dialogue: '“Levanta a cabeça. Há sempre uma linha.”' },
    { location: 'Apito final · regresso ao balneário', title: 'Depois do último apito', narration: `A jornada passada ficou marcada por ${lastScore}. O resultado já está no registo; a forma como ${firstName} responde é que decide o próximo capítulo.`, dialogue: '“Amanhã voltamos a trabalhar.”' },
    { location: 'Gabinete técnico · conversa reservada', title: 'A confiança ganha-se', narration: `${player.coachRelationship ?? 60}% de relação com o treinador. Não é uma promessa de minutos: é uma porta que se abre um pouco mais quando o trabalho aparece em campo.`, dialogue: '“Continua a merecer cada oportunidade.”' },
    { location: 'Bancada · voz dos adeptos', title: 'Uma cidade começa a acreditar', narration: `Os adeptos de ${clubName} já reconhecem o nome de ${firstName}. ${save.career.goals} golos e ${save.career.assists} assistências contam parte da história; o resto constrói-se jogo a jogo.`, dialogue: '“Este emblema também é teu.”' },
    { location: 'Sala de vídeo · análise individual', title: 'Ver o jogo de outra maneira', narration: `${lastRating}. A equipa técnica pára a imagem num instante: o posicionamento antes da bola chegar. Às vezes, evoluir começa por perceber o que ninguém viu.`, dialogue: '“Na próxima vez, vou chegar um segundo mais cedo.”' },
    { location: 'Ginásio · recuperação', title: 'Saber quando parar', narration: `A fadiga está nos ${fatigue}%. Recuperar também faz parte do treino: pernas frescas ajudam a transformar boas decisões em boas exibições.`, dialogue: '“A época é longa. Vou cuidar do meu corpo.”' },
    { location: 'Campo de treino · sessão concluída', title: 'Pequenas margens', narration: training, dialogue: '“Hoje melhorei um detalhe. Amanhã volto a melhorá-lo.”' },
    { location: 'Ecrã do estádio · anúncio das equipas', title: 'Uma oportunidade não é acaso', narration: `${firstName}, ${player.overall} de Overall e ${player.age} anos. Cada convocatória pode parecer pequena — até se tornar o início de algo maior.`, dialogue: '“Estou pronto para deixar a minha marca.”' },
    { location: 'Academia · primeiro capítulo', title: 'O caminho escolhido', narration: route, dialogue: '“O começo não define o fim. As minhas escolhas, sim.”' },
    { location: 'Zona mista · depois da entrevista', title: 'As palavras também jogam', narration: latestPress ? `A manchete mais recente diz: “${latestPress.headline}”. ${firstName} aprendeu que uma resposta pode aproximar o balneário — ou criar ruído.` : 'A primeira entrevista ainda está por acontecer. O resultado vai chegar antes das perguntas; as palavras de resposta ficam nas mãos do jogador.', dialogue: '“Falo com respeito, mas não escondo a ambição.”' },
    { location: 'Escritório do clube · futuro em aberto', title: 'O próximo contrato', narration: `O contrato atual paga €${(player.contract?.weeklyWage ?? 0).toLocaleString('pt-PT')} por semana. Para ${firstName}, o valor importante é outro: provar que merece continuar a vestir estas cores.`, dialogue: '“Quero que o meu futebol fale primeiro.”' },
    { location: 'Estádio · luzes acesas', title: 'A história continua', narration: `${seasonWeek}. O potencial atual é ${currentPotential}, partindo de ${initialPotential}; é apenas um sinal de margem, não um destino escrito. O próximo adversário é ${nextOpponent}.`, dialogue: '“Ainda não mostrei tudo o que posso ser.”' },
  ];
}

export function CareerCutscenes({ save, player, clubName, nextOpponent }: { save: GameSave; player: Player; clubName: string; nextOpponent: string }) {
  const phase = (save.matchPlayedThisWeek ? 1 : 0) + (save.trainedThisWeek ? 2 : 0);
  const timelineSeed = ((save.season - 1) * 10 + (save.week - 1)) * 4 + phase;
  const [offset, setOffset] = useState(0);
  const scenes = scenesFor(save, player, clubName, nextOpponent);
  useEffect(() => setOffset(0), [timelineSeed]);
  const index = ((timelineSeed + offset) % scenes.length + scenes.length) % scenes.length;
  const scene = scenes[index];
  return <section aria-label="Cenas da carreira do jogador" className="relative isolate overflow-hidden rounded-2xl border border-amber-200/15 bg-[#111514] shadow-xl">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_12%,rgba(205,172,93,0.18),transparent_42%),linear-gradient(115deg,#181a17,#111514_58%,#101315)]" />
    <div className="pointer-events-none absolute -right-10 -top-12 -z-10 h-64 w-64 rounded-full border border-white/[.04]" />
    <div className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-amber-200"><Clapperboard size={14} /> CENA DA CARREIRA <span className="text-white/25">·</span> {String(index + 1).padStart(2, '0')} / {scenes.length}</p><p className="mt-2 text-[10px] uppercase tracking-[.18em] text-slate-500">{scene.location} <span className="mx-1 text-white/20">·</span> Época {save.season} · Jornada {save.week}</p></div>
        <Sparkles size={18} className="shrink-0 text-amber-200/70" />
      </div>
      <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl">{scene.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{scene.narration}</p>
      <blockquote className="mt-4 border-l-2 border-amber-200/50 pl-4 text-sm font-semibold italic text-amber-100 sm:text-base">{scene.dialogue}</blockquote>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-4">
        <p className="text-[10px] uppercase tracking-[.16em] text-slate-500">Cada escolha acrescenta um capítulo novo</p>
        <div className="flex items-center gap-2"><button type="button" aria-label="Cena anterior" onClick={() => setOffset(value => value - 1)} className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-amber-200/30 hover:text-amber-100"><ChevronLeft size={17} /></button><button type="button" onClick={() => setOffset(value => value + 1)} className="flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/[.06] px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/[.12]"><span>Próxima cena</span><ChevronRight size={15} /></button></div>
      </div>
    </div>
  </section>;
}
