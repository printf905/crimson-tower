import { GameState, MapNode, NodeType } from '../types/game';
import { enterNode } from '../engine/gameManager';
import { Sword, Star, Crown, Zap, ShoppingCart, Activity, Gift, Heart, Coins } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

const NODE_W = 48;
const NODE_H = 48;
const COL_GAP = 68;
const ROW_GAP = 62;

const NODE_META: Record<NodeType, { icon: React.FC<{ className?: string }>; bg: string; border: string; label: string; text: string }> = {
  combat:   { icon: Sword,        bg: 'bg-red-950/70',    border: 'border-red-800',    label: 'PROCESS', text: 'text-red-400' },
  elite:    { icon: Star,         bg: 'bg-amber-950/70',  border: 'border-amber-700',  label: 'ELITE',   text: 'text-amber-400' },
  boss:     { icon: Crown,        bg: 'bg-rose-950/70',   border: 'border-rose-600',   label: 'BOSS',    text: 'text-rose-400' },
  rest:     { icon: Zap,          bg: 'bg-green-950/70',  border: 'border-green-800',  label: 'CHARGE',  text: 'text-green-400' },
  shop:     { icon: ShoppingCart, bg: 'bg-blue-950/70',   border: 'border-blue-800',   label: 'VENDOR',  text: 'text-blue-400' },
  event:    { icon: Activity,     bg: 'bg-cyan-950/70',   border: 'border-cyan-800',   label: 'EVENT',   text: 'text-cyan-400' },
  treasure: { icon: Gift,         bg: 'bg-yellow-950/70', border: 'border-yellow-700', label: 'CACHE',   text: 'text-yellow-400' },
};

export default function MapScreen({ gameState, onStateChange }: Props) {
  const { map, player, floor, act, currentNodeId } = gameState;
  const maxRow = Math.max(...map.map(n => n.row));
  const canvasW = 7 * COL_GAP + NODE_W + 20;
  const canvasH = (maxRow + 1) * ROW_GAP + NODE_H + 40;

  function getPos(node: MapNode) {
    return { x: node.col * COL_GAP + 10, y: (maxRow - node.row) * ROW_GAP + 20 };
  }

  function handleClick(node: MapNode) {
    if (!node.available || node.visited) return;
    onStateChange(enterNode(gameState, node.id));
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col scanlines">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-gray-800/80 bg-black/50 backdrop-blur-sm">
        <div>
          <div className="text-red-500 font-black text-lg font-mono tracking-tight">BUG SPIRE</div>
          <div className="text-xs font-mono flex items-center gap-2">
            <span className={`font-bold ${act === 3 ? 'text-red-400' : act === 2 ? 'text-amber-400' : 'text-gray-400'}`}>
              ACT {act}
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-600">floor={floor}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 font-mono text-sm">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-red-300 font-bold">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-300 font-bold">{player.gold}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
              {map.map(node =>
                node.connections.map(tid => {
                  const target = map.find(n => n.id === tid);
                  if (!target) return null;
                  const from = getPos(node);
                  const to = getPos(target);
                  const active = node.visited || node.available;
                  return (
                    <line
                      key={`${node.id}-${tid}`}
                      x1={from.x + NODE_W / 2} y1={from.y + NODE_H / 2}
                      x2={to.x + NODE_W / 2}   y2={to.y + NODE_H / 2}
                      stroke={active ? '#374151' : '#111827'}
                      strokeWidth={active ? 2 : 1.5}
                      strokeDasharray={active ? undefined : '6 4'}
                      opacity={active ? 1 : 0.3}
                    />
                  );
                })
              )}
            </svg>

            {map.map(node => {
              const pos = getPos(node);
              const meta = NODE_META[node.type];
              const Icon = meta.icon;
              const isCurrent = node.id === currentNodeId;
              const isAvail = node.available && !node.visited;

              return (
                <div
                  key={node.id}
                  onClick={() => handleClick(node)}
                  style={{ position: 'absolute', left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                  className={`
                    flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 font-mono
                    ${meta.bg} ${meta.border}
                    ${isCurrent ? 'ring-2 ring-white/60 scale-110' : ''}
                    ${isAvail
                      ? 'cursor-pointer hover:scale-110 hover:brightness-125'
                      : node.visited ? 'opacity-20 cursor-default' : 'opacity-15 cursor-default'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${meta.text}`} />
                  <span className={`text-xs font-bold mt-0.5 ${meta.text}`} style={{ fontSize: '9px' }}>{meta.label}</span>

                  {isCurrent && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-black" style={{ fontSize: '8px' }}>★</span>
                    </div>
                  )}
                  {isAvail && (
                    <div className="absolute inset-0 rounded-xl animate-ping border-2 border-white/20 opacity-60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 border-l border-gray-800/80 bg-black/30 flex flex-col overflow-y-auto font-mono">
          {/* Relics */}
          <div className="p-4 border-b border-gray-800/50">
            <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-2">MODULES</h3>
            {player.relics.length === 0
              ? <p className="text-gray-800 text-xs">none</p>
              : (
                <div className="space-y-2">
                  {player.relics.map(r => (
                    <div key={r.id} className="flex items-start gap-2 text-xs">
                      <span className="text-base shrink-0">{r.emoji}</span>
                      <div>
                        <div className="text-amber-400 font-bold">{r.name}</div>
                        <div className="text-gray-500 text-xs leading-tight">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Deck */}
          <div className="p-4 flex-1">
            <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-2">
              DECK [{player.deck.length}]
            </h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {[...player.deck]
                .sort((a, b) => (a.bugged === b.bugged ? a.name.localeCompare(b.name) : a.bugged ? -1 : 1))
                .map((card, i) => (
                  <div key={card.id + i}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border
                      ${card.bugged
                        ? 'bg-red-950/40 border-red-900/60 text-red-300'
                        : card.type === 'attack' ? 'bg-red-950/20 border-red-900/30 text-red-400' :
                          card.type === 'skill'  ? 'bg-blue-950/20 border-blue-900/30 text-blue-400' :
                          'bg-amber-950/20 border-amber-900/30 text-amber-400'}`}
                  >
                    <span className="font-bold w-4 text-center shrink-0">
                      {card.cost < 0 ? 'X' : card.cost}
                    </span>
                    <span className="font-medium truncate">{card.name}</span>
                    {card.bugged && <span className="text-red-500 text-xs ml-auto shrink-0">⚠</span>}
                    {card.upgraded && <span className="text-yellow-500 text-xs ml-auto shrink-0">✦</span>}
                  </div>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-800/50">
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(NODE_META) as [NodeType, typeof NODE_META[NodeType]][]).map(([type, m]) => {
                const Icon = m.icon;
                return (
                  <div key={type} className="flex items-center gap-1 text-xs">
                    <Icon className={`w-3 h-3 ${m.text}`} />
                    <span className={`${m.text} text-xs`}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
