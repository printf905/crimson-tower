import { GameState } from '../types/game';
import { createNewGame } from '../engine/gameManager';
import { Terminal, Bug, Cpu, GitBranch } from 'lucide-react';

interface Props {
  onStart: (gs: GameState) => void;
}

export default function TitleScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden scanlines">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px,transparent 1px), linear-gradient(90deg,rgba(239,68,68,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600/15 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gray-950 border-2 border-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900/30">
              <Bug className="w-12 h-12 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-black text-white tracking-tight mb-0.5 font-mono">
          BUG<span className="text-red-500"> SPIRE</span>
        </h1>
        <p className="text-gray-600 text-sm mb-1 font-mono tracking-widest uppercase">
          v0.0.1-alpha — unstable build
        </p>
        <p className="text-gray-500 text-sm mb-10">
          漏洞不是缺陷，是特性。
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            { icon: Terminal,  text: '卡牌战斗系统',     sub: '3 能量/回合，策略打牌' },
            { icon: Bug,       text: '漏洞牌机制',       sub: '负面效果被跳过，效果翻倍' },
            { icon: Cpu,       text: 'Bug Meter',        sub: '满格触发 System Crash' },
            { icon: GitBranch, text: '随机地图',          sub: '每局随机路线与奖励' },
          ].map(({ icon: Icon, text, sub }, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-900/60 border border-gray-800 rounded-xl p-3.5 text-left">
              <Icon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm font-semibold font-mono">{text}</div>
                <div className="text-gray-500 text-xs mt-0.5 leading-tight">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={() => onStart(createNewGame())}
          className="group px-14 py-4 bg-red-800 hover:bg-red-700 text-white font-black text-xl rounded-2xl transition-all duration-200 hover:scale-105 border-2 border-red-600 shadow-2xl shadow-red-900/50 font-mono tracking-wide"
        >
          ./run_game.sh
        </button>

        <p className="mt-5 text-gray-700 text-xs font-mono">
          init deck: 5× strike · 4× defend · 1× bash &nbsp;|&nbsp; HP: 80 &nbsp;|&nbsp; ENERGY: 3/turn
        </p>

        <p className="mt-2 text-gray-800 text-xs font-mono">
          WARNING: Unexpected bugs may occur. All unexpected bugs are intentional.
        </p>
      </div>
    </div>
  );
}
