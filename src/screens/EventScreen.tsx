import { useState } from 'react';
import {
  FileCode, Layers, FolderSearch,
  Heart, Coins, Shield, Zap, AlertTriangle,
  Sword, ChevronRight, SkipForward, Cpu, Bug,
} from 'lucide-react';
import { GameState, EventChoice } from '../types/game';
import { applyEventChoice } from '../data/events';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FileCode,
  Layers,
  FolderSearch,
};

// ── Outcome preview renderer ──────────────────────────────────────────────────

function OutcomePill({ text, variant }: { text: string; variant: 'bad' | 'good' | 'neutral' | 'risk' }) {
  const styles = {
    bad:     'bg-red-950/70 border-red-700/60 text-red-300',
    good:    'bg-green-950/70 border-green-700/60 text-green-300',
    neutral: 'bg-gray-900/70 border-gray-700/60 text-gray-400',
    risk:    'bg-amber-950/70 border-amber-700/60 text-amber-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[variant]}`}>
      {text}
    </span>
  );
}

function renderChoiceOutcomePills(choice: EventChoice) {
  const pills: JSX.Element[] = [];

  choice.outcomes.forEach((o, i) => {
    switch (o.type) {
      case 'hp':
        if (o.value !== undefined && o.value !== -1) {
          pills.push(
            <OutcomePill key={i} text={`HP ${o.value > 0 ? '+' : ''}${o.value}`} variant={o.value > 0 ? 'good' : 'bad'} />
          );
        }
        break;
      case 'max_hp':
        pills.push(
          <OutcomePill key={i} text={`最大HP ${o.value! > 0 ? '+' : ''}${o.value}`} variant={o.value! > 0 ? 'good' : 'bad'} />
        );
        break;
      case 'gold':
        pills.push(<OutcomePill key={i} text={`+${o.value} 金币`} variant="good" />);
        break;
      case 'add_card':
        pills.push(<OutcomePill key={i} text={`加入诅咒牌`} variant="bad" />);
        break;
      case 'bug_cards':
        pills.push(<OutcomePill key={i} text={`Bug 化 ${o.value} 张牌`} variant="risk" />);
        break;
      case 'remove_starter':
        pills.push(<OutcomePill key={i} text={`删除基础牌`} variant="good" />);
        break;
      case 'add_relic':
        pills.push(<OutcomePill key={i} text={`获得遗物`} variant={o.relicId === 'infinite_loop' ? 'risk' : 'good'} />);
        break;
      case 'start_elite_combat':
        pills.push(<OutcomePill key={i} text={`触发精英战斗`} variant="bad" />);
        break;
    }

    if (o.chance !== undefined) {
      pills.push(
        <OutcomePill key={`${i}_chance`} text={`${Math.round(o.chance * 100)}% 概率`} variant="risk" />
      );
      if (o.altOutcome?.type === 'start_elite_combat') {
        pills.push(<OutcomePill key={`${i}_alt`} text={`否则触发精英战`} variant="bad" />);
      }
    }
  });

  return pills;
}

// ── Requirement check ─────────────────────────────────────────────────────────

function meetsRequirement(choice: EventChoice, gs: GameState): boolean {
  const req = choice.requirement;
  if (!req || req.type === 'none') return true;
  if (req.type === 'min_hp') return gs.player.hp > (req.value ?? 0);
  if (req.type === 'has_relic') return gs.player.relics.some(r => r.id === req.relicId);
  return true;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EventScreen({ gameState, onStateChange }: Props) {
  const event = gameState.activeEvent!;
  const result = gameState.eventResult;
  const [chosen, setChosen] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const IconComponent = ICON_MAP[event.iconKey] ?? Cpu;

  function handleChoice(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    const next = applyEventChoice(gameState, idx);
    // If triggered combat, propagate immediately
    if (next.phase === 'combat') {
      onStateChange(next);
      return;
    }
    onStateChange(next);
  }

  function handleLeave() {
    onStateChange({ ...gameState, phase: 'map', activeEvent: null, eventResult: null });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-stretch scanlines relative overflow-hidden">
      {/* Animated grid bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-red-950/10 to-gray-950" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(239,68,68,0.6) 1px,transparent 1px), linear-gradient(90deg,rgba(239,68,68,0.6) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-red-900/40 rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-red-900/40 rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-red-900/40 rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-red-900/40 rounded-br-sm" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col justify-center px-6 py-8 gap-6">

        {/* Header badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 border border-gray-700 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-gray-500 text-xs font-mono tracking-widest">SYSTEM_EVENT</span>
          </div>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Event card */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Title bar */}
          <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-800">
            <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent" />
              <IconComponent className="w-7 h-7 text-red-400 relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-gray-600 mb-0.5 tracking-widest">EVENT.EXE</div>
              <h1 className="text-xl font-black text-white font-mono tracking-tight">{event.name}</h1>
              <div className="text-xs text-gray-600 font-mono mt-0.5">{event.flavorText}</div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4">
            <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
          </div>

          {/* Player status strip */}
          <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-800/60 bg-gray-950/40">
            <div className="flex items-center gap-1.5 text-xs font-mono text-red-300">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold">{gameState.player.hp}/{gameState.player.maxHp}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-300">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold">{gameState.player.gold}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-blue-300">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold">{gameState.player.deck.length} 张牌</span>
            </div>
          </div>
        </div>

        {/* Result box — shown after choosing */}
        {result && (
          <div className="bg-gray-900/80 border border-amber-700/60 rounded-xl px-5 py-4 flex items-start gap-3 animate-pulse-once">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-amber-400 text-xs font-mono font-bold tracking-widest mb-1">RESULT</div>
              <p className="text-gray-200 text-sm leading-relaxed">{result}</p>
            </div>
          </div>
        )}

        {/* Choices */}
        {!result ? (
          <div className="flex flex-col gap-3">
            <div className="text-gray-600 text-xs font-mono tracking-widest mb-1">// SELECT_ACTION</div>
            {event.choices.map((choice, idx) => {
              const canChoose = meetsRequirement(choice, gameState);
              const isHovered = hoveredIdx === idx;
              const pills = renderChoiceOutcomePills(choice);

              return (
                <button
                  key={idx}
                  onClick={() => canChoose && handleChoice(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  disabled={!canChoose}
                  className={`
                    relative w-full text-left rounded-xl border-2 px-5 py-4 transition-all duration-200 overflow-hidden
                    ${!canChoose
                      ? 'border-gray-800 bg-gray-900/40 opacity-40 cursor-not-allowed'
                      : isHovered
                      ? 'border-red-600 bg-red-950/40 scale-[1.01] shadow-lg shadow-red-900/20'
                      : 'border-gray-700 bg-gray-900/60 hover:border-gray-600'}
                  `}
                >
                  {/* Hover glow line */}
                  {isHovered && canChoose && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-700 rounded-l-xl" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Choice number */}
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-black font-mono border mt-0.5 transition-colors
                      ${isHovered && canChoose ? 'border-red-600 bg-red-900/60 text-red-300' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm mb-1 transition-colors ${isHovered && canChoose ? 'text-white' : 'text-gray-200'}`}>
                        {choice.label}
                      </div>
                      <div className="text-gray-500 text-xs leading-relaxed mb-2">
                        {choice.description}
                      </div>

                      {/* Outcome pills */}
                      {pills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {pills}
                        </div>
                      )}

                      {/* Requirement warning */}
                      {!canChoose && choice.requirement?.type === 'min_hp' && (
                        <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          需要 {choice.requirement.value}+ HP
                        </div>
                      )}
                    </div>

                    {canChoose && (
                      <ChevronRight className={`w-5 h-5 shrink-0 mt-0.5 transition-all ${isHovered ? 'text-red-400 translate-x-1' : 'text-gray-700'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Post-choice: leave button */
          <div className="flex flex-col gap-3">
            {/* Show what happened to deck/relics if relevant */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
                <div className="text-gray-600 text-xs font-mono mb-1">HP</div>
                <div className="flex items-center gap-1.5 text-red-300 font-bold font-mono">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  {gameState.player.hp} / {gameState.player.maxHp}
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
                <div className="text-gray-600 text-xs font-mono mb-1">GOLD</div>
                <div className="flex items-center gap-1.5 text-yellow-300 font-bold font-mono">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  {gameState.player.gold}
                </div>
              </div>
            </div>

            <button
              onClick={handleLeave}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border-2 border-gray-600 hover:border-gray-500 text-white font-bold font-mono transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <SkipForward className="w-4 h-4" />
              离开 — 返回地图
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
