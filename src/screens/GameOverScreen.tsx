import { GameState } from '../types/game';
import { createNewGame } from '../engine/gameManager';
import { RotateCcw, Bug } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

export default function GameOverScreen({ gameState, onStateChange }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center scanlines">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 to-gray-950" />
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px,transparent 1px), linear-gradient(90deg,rgba(239,68,68,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 text-center max-w-sm px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gray-950 border-2 border-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900/40">
              <Bug className="w-12 h-12 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-red-600 mb-1 tracking-widest">PROCESS_TERMINATED</div>
        <h1 className="text-5xl font-black text-red-400 mb-1 font-mono">FATAL_ERROR</h1>
        <p className="text-gray-600 text-sm font-mono mb-8">// 漏洞终于反噬了你</p>

        {/* Stats */}
        <div className="bg-gray-900/60 border border-red-900/40 rounded-2xl p-5 mb-8 text-left space-y-2 font-mono">
          <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-3">RUN_SUMMARY</div>
          {[
            { label: 'FLOOR_REACHED', value: String(gameState.floor), color: 'text-white' },
            { label: 'DECK_SIZE', value: String(gameState.player.deck.length), color: 'text-white' },
            { label: 'MODULES_HELD', value: String(gameState.player.relics.length), color: 'text-amber-300' },
            { label: 'GOLD_REMAINING', value: String(gameState.player.gold), color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className={`font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onStateChange(createNewGame())}
          className="flex items-center gap-2 bg-red-900/80 hover:bg-red-800 text-white font-black px-8 py-3 rounded-xl border-2 border-red-600 hover:scale-105 transition-all mx-auto text-base font-mono tracking-wide"
        >
          <RotateCcw className="w-5 h-5" /> RESTART_PROCESS
        </button>

        <p className="mt-4 text-gray-800 text-xs font-mono">
          // All fatal errors are unintentional. Probably.
        </p>
      </div>
    </div>
  );
}
