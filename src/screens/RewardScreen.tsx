import { GameState } from '../types/game';
import { chooseCardReward, skipCardReward } from '../engine/gameManager';
import CardComponent from '../components/CardComponent';
import { Coins, X, Bug } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

export default function RewardScreen({ gameState, onStateChange }: Props) {
  const { cardReward, goldReward } = gameState;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 to-gray-950" />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px,transparent 1px), linear-gradient(90deg,rgba(239,68,68,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-green-500 mb-2 tracking-widest">PROCESS_TERMINATED</div>
          <h2 className="text-3xl font-black text-white font-mono mb-1">区域清除</h2>
          {goldReward > 0 && (
            <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold font-mono mt-2">
              <Coins className="w-4 h-4" /> +{goldReward} 金币已记入账户
            </div>
          )}
        </div>

        {cardReward ? (
          <div>
            <div className="text-gray-500 text-center text-xs font-mono mb-6 tracking-wider">
              SELECT_REWARD :: CHOOSE ONE CARD TO ADD TO DECK
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Normal card */}
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

              {/* Bugged card */}
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

            {/* Bug meter hint */}
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
                <X className="w-3.5 h-3.5" /> 跳过奖励
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-600 mb-6 font-mono text-sm">-- NO PENDING REWARDS --</div>
            <button
              onClick={() => onStateChange(skipCardReward(gameState))}
              className="px-8 py-3 bg-green-900/60 hover:bg-green-800/60 border border-green-700 text-green-400 font-bold font-mono rounded-xl transition-all hover:scale-105"
            >
              CONTINUE →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
