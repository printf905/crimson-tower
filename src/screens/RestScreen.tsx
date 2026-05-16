import { useState } from 'react';
import { GameState } from '../types/game';
import { restHeal, restUpgradeCard } from '../engine/gameManager';
import CardComponent from '../components/CardComponent';
import { Heart, ArrowUpCircle, X } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

export default function RestScreen({ gameState, onStateChange }: Props) {
  const [mode, setMode] = useState<'choose' | 'upgrade'>('choose');
  const healAmt = Math.floor(gameState.player.maxHp * 0.3);
  const upgradeable = gameState.player.deck.filter(c => !c.upgraded);

  if (mode === 'upgrade') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col p-6 scanlines">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 to-gray-950" />
        <div className="relative z-10 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-500 mb-1 tracking-widest">PATCH_MODE</div>
              <h2 className="text-2xl font-black text-white font-mono">选择要升级的牌</h2>
            </div>
            <button onClick={() => setMode('choose')} className="text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {upgradeable.length === 0 ? (
            <p className="text-gray-700 text-center py-12 font-mono text-sm">-- ALL CARDS PATCHED --</p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {upgradeable.map(card => (
                <div key={card.id} onClick={() => onStateChange(restUpgradeCard(gameState, card.id))} className="cursor-pointer hover:scale-105 transition-transform">
                  <CardComponent card={card} playable />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 to-gray-950" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚡</div>
          <div className="text-xs font-mono text-gray-600 mb-1 tracking-widest">CHECKPOINT_REACHED</div>
          <h2 className="text-3xl font-black text-white font-mono mb-1">充电站</h2>
          <p className="text-gray-600 text-sm font-mono">休息或维护你的牌组</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onStateChange(restHeal(gameState))}
            className="group flex items-center gap-4 p-5 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 hover:border-red-700 rounded-2xl transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold font-mono">REPAIR_HP()</div>
              <div className="text-gray-500 text-sm">
                回复 <span className="text-red-400 font-mono font-bold">{healAmt}</span> HP
                <span className="text-gray-700"> ({gameState.player.hp} → {Math.min(gameState.player.maxHp, gameState.player.hp + healAmt)})</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('upgrade')}
            className="group flex items-center gap-4 p-5 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-900/50 hover:border-blue-700 rounded-2xl transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <ArrowUpCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold font-mono">PATCH_CARD()</div>
              <div className="text-gray-500 text-sm">升级一张牌，效果提升 50%</div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center text-gray-800 text-xs font-mono">
          hp={gameState.player.hp}/{gameState.player.maxHp}
        </div>
      </div>
    </div>
  );
}
