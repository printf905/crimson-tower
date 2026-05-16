import { Enemy } from '../types/game';
import { Sword, Shield, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Props {
  enemy: Enemy;
  targeted?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

const ENEMY_EMOJI: Record<string, string> = {
  virus_drone: '🦠',
  corrupt_guard: '🤖',
  glitch_sprite: '👾',
  null_pointer: '❌',
  data_leech: '🐛',
  exe_corruptor: '💀',
  rootkit: '🔒',
  master_virus: '☣️',
  the_spire: '🏰',
};

function getEmoji(id: string): string {
  for (const [key, val] of Object.entries(ENEMY_EMOJI)) {
    if (id.includes(key)) return val;
  }
  return '👾';
}

function IntentIcon({ type }: { type: string }) {
  const sz = 'w-4 h-4';
  switch (type) {
    case 'attack':       return <Sword className={`${sz} text-red-400`} />;
    case 'attack_debuff': return <Zap className={`${sz} text-orange-400`} />;
    case 'defend':       return <Shield className={`${sz} text-blue-400`} />;
    case 'buff':         return <TrendingUp className={`${sz} text-yellow-400`} />;
    case 'debuff':       return <TrendingDown className={`${sz} text-purple-400`} />;
    default:             return <Zap className={`${sz} text-gray-400`} />;
  }
}

const INTENT_STYLE: Record<string, string> = {
  attack:       'text-red-300 bg-red-950/60 border-red-700/60',
  attack_debuff:'text-orange-300 bg-orange-950/60 border-orange-700/60',
  defend:       'text-blue-300 bg-blue-950/60 border-blue-700/60',
  buff:         'text-yellow-300 bg-yellow-950/60 border-yellow-700/60',
  debuff:       'text-purple-300 bg-purple-950/60 border-purple-700/60',
};

export default function EnemyComponent({ enemy, targeted, selectable, onClick }: Props) {
  const hpPct = (enemy.hp / enemy.maxHp) * 100;
  const hpColor = hpPct > 60 ? 'bg-green-500' : hpPct > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const action = enemy.pattern[enemy.patternIndex];

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 min-w-[152px]
        ${selectable ? 'cursor-crosshair' : 'cursor-default'}
        ${targeted
          ? 'bg-red-950/40 border-red-500 shadow-red-500/30 shadow-lg scale-105'
          : selectable
          ? 'bg-gray-900/60 border-orange-600/50 hover:border-red-400 hover:bg-red-950/20'
          : 'bg-gray-900/40 border-gray-800'}
      `}
    >
      {/* Intent */}
      {action && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold
          ${INTENT_STYLE[action.type] ?? INTENT_STYLE.buff}`}>
          <IntentIcon type={action.type} />
          <span>{action.label}</span>
        </div>
      )}

      {/* Sprite */}
      <div className={`text-5xl transition-all duration-200 ${targeted ? 'animate-bounce' : ''}`}>
        {getEmoji(enemy.id)}
      </div>

      {/* Name */}
      <div className="text-white font-bold text-sm font-mono">{enemy.name}</div>

      {/* HP bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300 font-mono">{enemy.hp}/{enemy.maxHp}</span>
          {enemy.block > 0 && (
            <span className="flex items-center gap-1 text-blue-300">
              <Shield className="w-3 h-3" />{enemy.block}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${hpColor}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      {/* Status effects */}
      {enemy.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {enemy.statusEffects.map((s, i) => (
            <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full font-mono font-medium
              ${s.type === 'strength'   ? 'bg-red-950/80 text-red-300 border border-red-800' :
                s.type === 'vulnerable' ? 'bg-orange-950/80 text-orange-300 border border-orange-800' :
                s.type === 'weak'       ? 'bg-yellow-950/80 text-yellow-300 border border-yellow-800' :
                s.type === 'poison'     ? 'bg-green-950/80 text-green-300 border border-green-800' :
                'bg-gray-800 text-gray-300 border border-gray-700'}`}>
              {s.type === 'strength' ? '⚔' : s.type === 'vulnerable' ? '💢' :
               s.type === 'weak' ? '🌀' : s.type === 'poison' ? '☠' : s.type[0].toUpperCase()}
              {s.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
