import { GameState } from '../types/game';
import { chooseCardReward, skipCardReward } from '../engine/gameManager';
import CardComponent from '../components/CardComponent';
import { ChevronRight, Coins, Bug } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

const ACT_LABELS: Record<number, { title: string; sub: string; color: string; border: string }> = {
  2: { title: 'ACT II', sub: '// 内核层', color: 'text-amber-400', border: 'border-amber-700' },
  3: { title: 'ACT III', sub: '// 系统核心', color: 'text-red-400', border: 'border-red-700' },
};

export default function ActTransitionScreen({ gameState, onStateChange }: Props) {
  const { cardReward, goldReward, act } = gameState;
  const showReward = cardReward && !cardReward.chosen;
  const meta = ACT_LABELS[act] ?? ACT_LABELS[2];

  function proceedToMap() {
    onStateChange({ ...gameState, phase: 'map' });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 to-gray-950" />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(239,68,68,0.8) 1px,transparent 1px), linear-gradient(90deg,rgba(239,68,68,0.8) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 text-center max-w-2xl mx-auto w-full">
        {/* Act header */}
        <div className="mb-8">
          <div className="text-xs font-mono text-gray-600 mb-1 tracking-widest">LEVEL_CLEARED</div>
          <div className={`text-6xl font-black font-mono mb-2 ${meta.color}`}>{meta.title}</div>
          <div className={`inline-block px-4 py-1 border ${meta.border} rounded-full font-mono text-sm ${meta.color} mb-2`}>
            {meta.sub}
          </div>
          <p className="text-gray-500 text-sm font-mono">
            // 区域已清除。进入更深的系统层...
          </p>
          {goldReward > 0 && (
            <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold font-mono mt-3">
              <Coins className="w-4 h-4" /> +{goldReward} 金币
            </div>
          )}
        </div>

        {/* Card reward */}
        {showReward ? (
          <div className="mb-8">
            <div className="text-gray-500 text-center text-xs font-mono mb-6 tracking-wider">
              SELECT_REWARD :: CHOOSE ONE CARD
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="text-gray-400 text-xs font-mono font-bold tracking-widest">STANDARD BUILD</div>
                <div
                  onClick={() => onStateChange(chooseCardReward(gameState, 'normal'))}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <CardComponent card={cardReward.normalCard} playable />
                </div>
                <button
                  onClick={() => onStateChange(chooseCardReward(gameState, 'normal'))}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-white text-sm font-mono rounded-xl transition-all"
                >
                  选择此牌
                </button>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="text-red-400 text-xs font-mono font-black tracking-widest animate-pulse">
                  ⚠ BUGGED BUILD
                </div>
                <div
                  onClick={() => onStateChange(chooseCardReward(gameState, 'bugged'))}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <CardComponent card={cardReward.buggedCard} playable />
                </div>
                <button
                  onClick={() => onStateChange(chooseCardReward(gameState, 'bugged'))}
                  className="px-5 py-2 bg-red-950/80 hover:bg-red-900/80 border border-red-700 hover:border-red-500 text-red-300 text-sm font-mono rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Bug className="w-3.5 h-3.5" /> 选择漏洞牌
                </button>
              </div>
            </div>

            {cardReward.buggedCard.bugModifier && (
              <div className="mt-4 text-center text-xs font-mono text-gray-600">
                漏洞牌将增加 <span className="text-red-400">{cardReward.buggedCard.bugModifier.bugMeterGain}</span> Bug Meter
                &nbsp;·&nbsp; "{cardReward.buggedCard.bugModifier.flavorText}"
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={() => onStateChange(skipCardReward(gameState))}
                className="flex items-center gap-1.5 text-gray-700 hover:text-gray-500 transition-colors text-xs font-mono"
              >
                跳过奖励 →
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={proceedToMap}
            className={`flex items-center gap-3 mx-auto px-10 py-4 font-black text-xl rounded-2xl border-2 transition-all hover:scale-105 font-mono tracking-wide
              ${meta.color} ${meta.border} bg-gray-900/80 hover:bg-gray-800/80`}
          >
            进入 {meta.title} <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
