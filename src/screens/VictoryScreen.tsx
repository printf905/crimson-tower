import { GameState } from '../types/game';
import { createNewGame, chooseCardReward, skipCardReward } from '../engine/gameManager';
import CardComponent from '../components/CardComponent';
import { Trophy, RotateCcw, Coins, X, Bug } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

export default function VictoryScreen({ gameState, onStateChange }: Props) {
  const { cardReward, goldReward, player } = gameState;
  const showReward = cardReward && !cardReward.chosen;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/20 to-gray-950" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(234,179,8,1) 1px,transparent 1px), linear-gradient(90deg,rgba(234,179,8,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 text-center max-w-2xl mx-auto w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gray-950 border-2 border-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-900/40">
              <Trophy className="w-12 h-12 text-yellow-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-yellow-600 mb-1 tracking-widest">SYSTEM_CONQUERED</div>
        <h1 className="text-5xl font-black text-yellow-400 mb-1 font-mono">STACK_OVERFLOW</h1>
        <p className="text-gray-500 text-sm font-mono mb-1">// 你用漏洞征服了尖塔</p>

        {goldReward > 0 && (
          <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold font-mono mt-2 mb-6">
            <Coins className="w-4 h-4" /> +{goldReward} 金币已记入账户
          </div>
        )}

        {showReward ? (
          <div className="mb-8">
            <div className="text-gray-500 text-center text-xs font-mono mb-6 tracking-wider">
              FINAL_REWARD :: CHOOSE ONE CARD TO ADD TO DECK
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
          <>
            <div className="bg-gray-900/60 border border-yellow-800/40 rounded-2xl p-5 mb-8 text-left max-w-sm mx-auto font-mono">
              <div className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-3">RUN_SUMMARY</div>
              {[
                { label: 'FLOOR_REACHED', value: String(gameState.floor), color: 'text-white' },
                { label: 'HP_REMAINING', value: `${player.hp}/${player.maxHp}`, color: 'text-red-300' },
                { label: 'DECK_SIZE', value: String(player.deck.length), color: 'text-white' },
                { label: 'MODULES_HELD', value: String(player.relics.length), color: 'text-amber-300' },
                { label: 'GOLD_REMAINING', value: String(player.gold), color: 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onStateChange(createNewGame())}
              className="flex items-center gap-2 bg-yellow-900/80 hover:bg-yellow-800 text-white font-black px-8 py-3 rounded-xl border-2 border-yellow-600 hover:scale-105 transition-all mx-auto text-base font-mono tracking-wide"
            >
              <RotateCcw className="w-5 h-5" /> NEW_RUN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
