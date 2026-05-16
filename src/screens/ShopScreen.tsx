import { useState } from 'react';
import { GameState } from '../types/game';
import { shopBuy, shopRemoveCard, leaveShop } from '../engine/gameManager';
import CardComponent from '../components/CardComponent';
import { ShoppingCart, Coins, X, Trash2, Terminal } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

export default function ShopScreen({ gameState, onStateChange }: Props) {
  const [removeMode, setRemoveMode] = useState(false);
  const { shopItems, player } = gameState;

  const cardItems = shopItems.filter(i => i.kind === 'card');
  const relicItems = shopItems.filter(i => i.kind === 'relic');
  const removeItem = shopItems.find(i => i.kind === 'remove');

  if (removeMode) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col p-6 scanlines">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 to-gray-950" />
        <div className="relative z-10 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-500 mb-1 tracking-widest">GARBAGE_COLLECTOR</div>
              <h2 className="text-2xl font-black text-white font-mono">选择要删除的牌</h2>
              <p className="text-gray-600 text-xs font-mono mt-0.5">// 永久从牌组移除</p>
            </div>
            <button onClick={() => setRemoveMode(false)} className="text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {player.deck.map(card => (
              <div
                key={card.id}
                onClick={() => { onStateChange(shopRemoveCard(gameState, card.id)); setRemoveMode(false); }}
                className="cursor-pointer hover:scale-105 transition-transform"
              >
                <CardComponent card={card} playable />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-6 scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 to-gray-950" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px,transparent 1px), linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <div className="text-xs font-mono text-blue-500 tracking-widest">VENDOR_NODE</div>
            </div>
            <h2 className="text-2xl font-black text-white font-mono">漏洞黑市</h2>
            <p className="text-gray-600 text-xs font-mono mt-0.5">// 获取未授权的程序组件</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-900/20 border border-yellow-800/50 rounded-xl px-4 py-1.5 font-bold font-mono">
              <Coins className="w-4 h-4" /> {player.gold}
            </div>
            <button
              onClick={() => onStateChange(leaveShop(gameState))}
              className="flex items-center gap-1.5 text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl px-3 py-1.5 text-sm transition-all font-mono"
            >
              <Terminal className="w-3.5 h-3.5" /> EXIT
            </button>
          </div>
        </div>

        {/* Cards for sale */}
        {cardItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-gray-600 text-xs font-mono font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              AVAILABLE_CARDS
            </h3>
            <div className="flex flex-wrap gap-5">
              {cardItems.map((item, i) => {
                const gIdx = shopItems.indexOf(item);
                const canAfford = player.gold >= item.price;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={item.sold ? 'opacity-30' : ''}>
                      <CardComponent card={item.card!} playable={!item.sold && canAfford} />
                    </div>
                    <button
                      onClick={() => !item.sold && canAfford && onStateChange(shopBuy(gameState, gIdx))}
                      disabled={item.sold || !canAfford}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all font-mono
                        ${item.sold ? 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed' :
                          canAfford ? 'bg-yellow-900/60 hover:bg-yellow-800/60 border-yellow-600 text-yellow-300 hover:scale-105' :
                          'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'}`}
                    >
                      <Coins className="w-3 h-3" />
                      {item.sold ? 'SOLD' : item.price}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Relics for sale */}
        {relicItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-gray-600 text-xs font-mono font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              AVAILABLE_MODULES
            </h3>
            {relicItems.map((item, i) => {
              const gIdx = shopItems.indexOf(item);
              const canAfford = player.gold >= item.price;
              return (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border mb-2 transition-all
                  ${item.sold ? 'bg-gray-900/30 border-gray-800/30 opacity-40' :
                    canAfford ? 'bg-amber-950/30 border-amber-800/50 hover:border-amber-600' :
                    'bg-gray-900/30 border-gray-800/50'}`}
                >
                  <div className="text-3xl shrink-0">{item.relic!.emoji ?? '🔮'}</div>
                  <div className="flex-1">
                    <div className="text-amber-300 font-bold font-mono">{item.relic!.name}</div>
                    <div className="text-gray-500 text-xs font-mono mt-0.5">{item.relic!.description}</div>
                  </div>
                  <button
                    onClick={() => !item.sold && canAfford && onStateChange(shopBuy(gameState, gIdx))}
                    disabled={item.sold || !canAfford}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold border transition-all font-mono
                      ${item.sold ? 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed' :
                        canAfford ? 'bg-yellow-900/60 hover:bg-yellow-800/60 border-yellow-600 text-yellow-300 hover:scale-105' :
                        'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'}`}
                  >
                    <Coins className="w-4 h-4" /> {item.sold ? 'SOLD' : item.price}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Remove card */}
        {removeItem && (
          <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
            ${removeItem.sold ? 'bg-gray-900/30 border-gray-800/30 opacity-40' :
              player.gold >= removeItem.price ? 'bg-red-950/30 border-red-900/50 hover:border-red-700' :
              'bg-gray-900/30 border-gray-800/50'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold font-mono">DELETE_CARD()</div>
              <div className="text-gray-500 text-xs font-mono mt-0.5">// 从牌组永久移除一张牌</div>
            </div>
            <button
              onClick={() => !removeItem.sold && player.gold >= removeItem.price && setRemoveMode(true)}
              disabled={removeItem.sold || player.gold < removeItem.price}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold border transition-all font-mono
                ${removeItem.sold ? 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed' :
                  player.gold >= removeItem.price ? 'bg-yellow-900/60 hover:bg-yellow-800/60 border-yellow-600 text-yellow-300 hover:scale-105' :
                  'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              <Coins className="w-4 h-4" /> {removeItem.sold ? 'SOLD' : removeItem.price}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
