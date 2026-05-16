import { useState } from 'react';
import { Card } from '../types/game';

interface Props {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  compact?: boolean;
}

const TYPE_STYLE: Record<string, { grad: string; border: string; badge: string; label: string }> = {
  attack: {
    grad: 'from-red-950 to-rose-900',
    border: 'border-red-700',
    badge: 'bg-red-900/80 text-red-200',
    label: '攻击',
  },
  skill: {
    grad: 'from-slate-900 to-blue-950',
    border: 'border-blue-700',
    badge: 'bg-blue-900/80 text-blue-200',
    label: '技能',
  },
  power: {
    grad: 'from-amber-950 to-yellow-950',
    border: 'border-amber-700',
    badge: 'bg-amber-900/80 text-amber-200',
    label: '能力',
  },
};

const BUG_RARITY_STYLE = {
  minor:     { label: 'MINOR BUG',     color: 'text-orange-400',  bg: 'bg-orange-900/60 border-orange-600' },
  major:     { label: 'MAJOR BUG',     color: 'text-red-400',     bg: 'bg-red-900/60 border-red-600' },
  legendary: { label: 'LEGENDARY BUG', color: 'text-yellow-300',  bg: 'bg-yellow-900/60 border-yellow-500' },
};

export default function CardComponent({ card, onClick, selected, playable = true, compact = false }: Props) {
  const [hovered, setHovered] = useState(false);
  const style = TYPE_STYLE[card.type] ?? TYPE_STYLE.attack;
  const dim = !playable && !selected;
  const costLabel = card.cost < 0 ? 'X' : String(card.cost);
  const bugStyle = card.bugged && card.bugModifier
    ? BUG_RARITY_STYLE[card.bugModifier.rarity]
    : null;

  const borderClass = card.bugged
    ? 'border-red-500'
    : style.border;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none cursor-pointer rounded-lg border-2 bg-gradient-to-b
          ${style.grad} ${borderClass}
          w-20 h-28 flex flex-col items-center justify-between p-1.5
          transition-all duration-150
          ${card.bugged ? 'glitch-card' : ''}
          ${selected ? 'scale-110 ring-2 ring-red-400 -translate-y-2' : ''}
          ${dim ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <div className="w-5 h-5 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white font-bold text-xs">
          {costLabel}
        </div>
        <div className="text-center px-0.5">
          <div className="text-white font-bold text-xs leading-tight">{card.name}</div>
          {card.bugged && (
            <div className="text-red-400 text-xs font-black mt-0.5">⚠ BUG</div>
          )}
        </div>
        <div className={`text-xs px-1 py-0.5 rounded font-medium ${style.badge}`}>{style.label}</div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={onClick}
        className={`
          relative select-none cursor-pointer rounded-xl border-2 bg-gradient-to-b
          ${style.grad} ${borderClass}
          w-28 h-40 flex flex-col items-center justify-between p-2
          transition-all duration-150
          ${card.bugged ? 'glitch-card' : ''}
          ${selected
            ? 'scale-110 ring-2 ring-red-400 -translate-y-4 z-50 shadow-xl shadow-red-900/40'
            : dim
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:scale-105 hover:-translate-y-2 hover:z-40'}
        `}
      >
        {/* Cost orb */}
        <div className="w-full flex justify-between items-start">
          <div className={`w-7 h-7 rounded-full bg-black/70 border flex items-center justify-center font-bold text-sm
            ${card.bugged ? 'border-red-500 text-red-300' : 'border-white/30 text-white'}`}>
            {costLabel}
          </div>
          {card.upgraded && <span className="text-yellow-400 text-xs font-bold">✦</span>}
          {card.bugged && <span className="text-red-400 text-xs animate-pulse">⚠</span>}
        </div>

        {/* Name + desc */}
        <div className="text-center px-1 flex-1 flex flex-col justify-center gap-0.5">
          <div className={`font-bold text-sm leading-tight ${card.bugged ? 'text-red-200' : 'text-white'}`}>
            {card.name}
          </div>
          <div className={`text-xs leading-snug ${card.bugged ? 'text-red-300/90' : 'text-gray-200'}`}>
            {card.description}
          </div>
          {card.exhaust && (
            <div className="text-orange-400 text-xs font-semibold">消耗</div>
          )}
        </div>

        {/* Bug badge or type badge */}
        {bugStyle ? (
          <div className={`text-xs px-1.5 py-0.5 rounded-full font-black border ${bugStyle.bg} ${bugStyle.color}`}>
            {bugStyle.label}
          </div>
        ) : (
          <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.badge}`}>
            {style.label}
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-56 pointer-events-none">
          <div className={`rounded-xl p-3 shadow-2xl text-xs leading-relaxed border
            ${card.bugged
              ? 'bg-red-950/95 border-red-700/80 text-red-200'
              : 'bg-gray-950 border-gray-700 text-gray-200'}`}>
            <div className={`font-bold mb-1 ${card.bugged ? 'text-red-300' : 'text-white'}`}>
              {card.name}{card.upgraded ? ' ✦' : ''}
              {card.bugged ? ' ⚠' : ''}
            </div>
            <div className="mb-2">{card.description}</div>

            {card.bugged && card.bugModifier && (
              <div className="mt-2 pt-2 border-t border-red-800/60">
                <div className={`font-black mb-0.5 ${bugStyle?.color}`}>
                  {bugStyle?.label}
                </div>
                <div className="text-red-400/80 italic text-xs">
                  "{card.bugModifier.flavorText}"
                </div>
                <div className="text-orange-400 text-xs mt-1">
                  +{card.bugModifier.bugMeterGain} Bug Meter
                </div>
              </div>
            )}

            <div className="flex gap-1.5 flex-wrap mt-2">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                费用: {costLabel}
              </span>
              {card.exhaust && (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-950 text-orange-300 border border-orange-800">消耗</span>
              )}
            </div>
          </div>
          <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent
            ${card.bugged ? 'border-t-red-950' : 'border-t-gray-950'}`} />
        </div>
      )}
    </div>
  );
}
