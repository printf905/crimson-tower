import { PlayerState } from '../types/game';
import { Heart, Shield, Zap } from 'lucide-react';

interface Props {
  player: PlayerState;
  energy: number;
  maxEnergy: number;
  drawCount: number;
  discardCount: number;
}

export default function PlayerStatus({ player, energy, maxEnergy, drawCount, discardCount }: Props) {
  const hpPct = (player.hp / player.maxHp) * 100;
  const hpColor = hpPct > 60 ? 'bg-green-600' : hpPct > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-end gap-3">
      {/* Character card */}
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-900/70 rounded-2xl border border-gray-700 min-w-[148px]">
        <div className="text-4xl">🧑‍💻</div>
        <div className="text-white font-bold text-xs font-mono tracking-wide">DEBUGGER</div>

        {/* HP */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 text-red-300 text-xs font-mono">
              <Heart className="w-3 h-3 text-red-400" />
              {player.hp}/{player.maxHp}
            </div>
            {player.block > 0 && (
              <div className="flex items-center gap-1 text-blue-300 text-xs font-mono">
                <Shield className="w-3 h-3 text-blue-400" />
                {player.block}
              </div>
            )}
          </div>
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${hpColor}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Status effects */}
        {player.statusEffects.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {player.statusEffects.map((s, i) => (
              <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full font-mono font-medium border
                ${s.type === 'strength'   ? 'bg-red-950/80 text-red-300 border-red-800' :
                  s.type === 'vulnerable' ? 'bg-orange-950/80 text-orange-300 border-orange-800' :
                  s.type === 'weak'       ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800' :
                  s.type === 'poison'     ? 'bg-green-950/80 text-green-300 border-green-800' :
                  'bg-gray-800 text-gray-300 border-gray-700'}`}>
                {s.type === 'strength' ? `⚔${s.value}` :
                 s.type === 'vulnerable' ? `💢${s.value}` :
                 s.type === 'weak' ? `🌀${s.value}` :
                 s.type === 'poison' ? `☠${s.value}` :
                 `${s.type} ${s.value}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Energy + piles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxEnergy }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200
                ${i < energy
                  ? 'bg-amber-500 border-amber-300 shadow-md shadow-amber-500/50'
                  : 'bg-gray-900 border-gray-700 opacity-35'}`}
            >
              <Zap className={`w-3.5 h-3.5 ${i < energy ? 'text-white' : 'text-gray-700'}`} />
            </div>
          ))}
          <span className="text-amber-400 font-bold text-sm ml-1 font-mono">{energy}/{maxEnergy}</span>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col items-center bg-gray-900/60 rounded-xl border border-gray-700 px-3 py-1.5 min-w-[52px]">
            <span className="text-white font-bold text-sm font-mono">{drawCount}</span>
            <span className="text-gray-500 text-xs">牌库</span>
          </div>
          <div className="flex flex-col items-center bg-gray-900/60 rounded-xl border border-gray-700 px-3 py-1.5 min-w-[52px]">
            <span className="text-white font-bold text-sm font-mono">{discardCount}</span>
            <span className="text-gray-500 text-xs">弃牌</span>
          </div>
        </div>
      </div>
    </div>
  );
}
