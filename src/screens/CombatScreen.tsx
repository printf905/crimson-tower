import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Card, FloatingNumber } from '../types/game';
import { playCard, endTurn, activateCrash } from '../engine/combat';
import { resolveCombatVictory } from '../engine/gameManager';
import DraggableCard from '../components/DraggableCard';
import EnemyComponent from '../components/EnemyComponent';
import PlayerStatus from '../components/PlayerStatus';
import { ChevronRight, ScrollText, Zap, Bug } from 'lucide-react';

interface Props {
  gameState: GameState;
  onStateChange: (gs: GameState) => void;
}

// ── Floating damage numbers ───────────────────────────────────────────────────

interface ActiveFloat extends FloatingNumber {
  key: string;
  createdAt: number;
  driftX: number;
}

function FloatingNumbers({ floats }: { floats: FloatingNumber[] }) {
  const [active, setActive] = useState<ActiveFloat[]>([]);
  const prevIds = useRef<string>('');

  useEffect(() => {
    const ids = floats.map(f => f.id).join(',');
    if (!floats.length || ids === prevIds.current) return;
    prevIds.current = ids;
    const now = Date.now();
    const newItems: ActiveFloat[] = floats.map((f, i) => ({
      ...f,
      key: `${f.id}_${now}_${i}`,
      createdAt: now,
      driftX: (Math.random() - 0.5) * 28,
    }));
    setActive(prev => [...prev, ...newItems]);
    const t = setTimeout(() => {
      setActive(prev => prev.filter(a => Date.now() - a.createdAt < 1400));
    }, 1100);
    return () => clearTimeout(t);
  }, [floats.map(f => f.id).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const colorMap: Record<string, string> = {
    damage: 'text-red-400',
    block:  'text-blue-300',
    heal:   'text-green-400',
    poison: 'text-green-500',
    burn:   'text-orange-400',
    bug:    'text-yellow-300',
  };

  return (
    <>
      {active.map(f => (
        <div
          key={f.key}
          className={`float-number absolute text-3xl ${colorMap[f.kind] ?? 'text-white'} z-50 pointer-events-none`}
          style={{ left: f.x, top: f.y, ['--fx' as string]: `${f.driftX}px` }}
        >
          {f.kind === 'damage' ? '-' : '+'}{f.value}
          {f.kind === 'block' ? '🛡' : f.kind === 'heal' ? '💚' : f.kind === 'poison' ? '☠' : f.kind === 'burn' ? '🔥' : ''}
        </div>
      ))}
    </>
  );
}

// ── Bug Meter + DEBUG button ──────────────────────────────────────────────────

interface BugMeterProps {
  value: number;
  meterReady: boolean;
  crashActive: boolean;
  crashTurns: number;
  canActivate: boolean;
  onActivate: () => void;
}

function BugMeter({ value, meterReady, crashActive, crashTurns, canActivate, onActivate }: BugMeterProps) {
  const pct = Math.min(100, value);

  let fillClass = 'bug-meter-fill';
  let borderClass = 'border-gray-700';
  let labelText = '⚡ BUG METER';
  let labelClass = 'text-gray-400';
  let valueClass = 'text-red-400';

  if (crashActive) {
    fillClass = 'bug-meter-crash';
    labelText = `💥 CRASH (${crashTurns})`;
    labelClass = 'text-pink-400 font-black animate-pulse';
    valueClass = 'text-pink-400';
    borderClass = 'border-pink-700/60';
  } else if (meterReady) {
    fillClass = 'bug-meter-ready-fill';
    labelText = '🔴 READY TO CRASH';
    labelClass = 'text-red-300 font-black';
    valueClass = 'text-red-300';
    borderClass = 'border-red-600/80';
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[168px]">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className={labelClass}>{labelText}</span>
        <span className={valueClass}>
          {crashActive ? 'ACTIVE' : `${pct}%`}
        </span>
      </div>

      <div className={`w-full h-3.5 bg-gray-900 rounded-full overflow-hidden border relative ${borderClass} ${meterReady ? 'bug-meter-ready' : ''}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
          style={{ width: (crashActive || meterReady) ? '100%' : `${pct}%` }}
        />
        {[25, 50, 75].map(mark => (
          <div key={mark} className="absolute top-0 bottom-0 w-px bg-gray-700/40" style={{ left: `${mark}%` }} />
        ))}
      </div>

      {/* Danger warning */}
      {pct >= 75 && !crashActive && !meterReady && (
        <div className="text-red-500 text-xs font-mono animate-pulse text-center tracking-widest">
          CRITICAL...
        </div>
      )}

      {/* DEBUG button — only shown when meter is full and not yet crashing */}
      {meterReady && !crashActive && (
        <button
          onClick={canActivate ? onActivate : undefined}
          disabled={!canActivate}
          className={`
            debug-btn relative mt-0.5 w-full py-2.5 rounded-lg border-2 border-red-600
            bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90
            font-black text-sm font-mono tracking-widest overflow-hidden
            ${canActivate ? 'cursor-pointer hover:from-red-900 hover:via-red-800 active:scale-95' : 'opacity-50 cursor-not-allowed'}
            transition-transform duration-100
          `}
        >
          {/* Glitch scanline overlay on button */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-60" />
          <div className="relative flex items-center justify-center gap-2">
            <Bug className="w-4 h-4 text-red-300" />
            <span className="debug-btn-text text-red-200">DEBUG / CRASH</span>
            <Bug className="w-4 h-4 text-red-300" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
        </button>
      )}

      {/* Crash active reminder */}
      {crashActive && (
        <div className="text-center text-xs font-mono text-pink-300 font-bold animate-pulse tracking-wider">
          ✦ 费用归零 · 伤害×2 ✦
        </div>
      )}
    </div>
  );
}

// ── Screen shake hook ─────────────────────────────────────────────────────────

type ShakeLevel = 'none' | 'sm' | 'lg';

function useScreenShake() {
  const [shake, setShake] = useState<ShakeLevel>('none');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback((level: ShakeLevel) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShake('none');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShake(level);
        timerRef.current = setTimeout(() => setShake('none'), level === 'lg' ? 420 : 350);
      });
    });
  }, []);

  return { shake, trigger };
}

// ── Combat Screen ─────────────────────────────────────────────────────────────

export default function CombatScreen({ gameState, onStateChange }: Props) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showCrash, setShowCrash] = useState(false);
  const [showCrashOverlay, setShowCrashOverlay] = useState(false);
  const prevCrashRef = useRef(false);
  const prevPlayerHp = useRef<number | null>(null);

  const { shake, trigger: triggerShake } = useScreenShake();
  const combat = gameState.combat!;
  const player = gameState.player;

  useEffect(() => {
    if (combat.systemCrashActive && !prevCrashRef.current) {
      setShowCrash(true);
      triggerShake('lg');
      const t = setTimeout(() => setShowCrash(false), 800);
      prevCrashRef.current = true;
      return () => clearTimeout(t);
    }
    if (!combat.systemCrashActive) prevCrashRef.current = false;
  }, [combat.systemCrashActive, triggerShake]);

  useEffect(() => {
    if (prevPlayerHp.current !== null && player.hp < prevPlayerHp.current) {
      const dmg = prevPlayerHp.current - player.hp;
      triggerShake(dmg >= 12 ? 'lg' : 'sm');
    }
    prevPlayerHp.current = player.hp;
  }, [player.hp, triggerShake]);

  const handleActivateCrash = useCallback(() => {
    if (busy || !combat.isPlayerTurn || !combat.bugMeterReady || combat.systemCrashActive) return;
    // Show full-screen crash overlay
    setShowCrashOverlay(true);
    triggerShake('lg');
    const { combat: nc, player: np } = activateCrash(combat, player);
    const ng: GameState = { ...gameState, combat: nc, player: np };
    onStateChange(ng);
    setTimeout(() => setShowCrashOverlay(false), 700);
  }, [busy, combat, player, gameState, onStateChange, triggerShake]);

  const needsTarget = useCallback((card: Card): boolean => {
    return card.effects.some(e =>
      ['damage', 'vulnerable', 'weak', 'poison', 'strength', 'damage_per_block'].includes(e.type) &&
      e.target === 'enemy'
    ) && combat.enemies.length > 1;
  }, [combat.enemies.length]);

  const executeCard = useCallback((card: Card, targetId?: string) => {
    if (busy) return;
    setBusy(true);
    setSelected(null);

    const totalDmg = card.effects
      .filter(e => e.type === 'damage')
      .reduce((s, e) => s + e.value * (e.times ?? 1), 0);
    if (totalDmg >= 15) triggerShake('sm');

    const { combat: nc, player: np } = playCard(combat, player, card, targetId);
    const ng: GameState = { ...gameState, combat: nc, player: np };

    if (nc.combatOver && nc.won) {
      setTimeout(() => { onStateChange(resolveCombatVictory(ng)); setBusy(false); }, 700);
    } else if (nc.combatOver && !nc.won) {
      setTimeout(() => { onStateChange({ ...ng, phase: 'game_over' }); setBusy(false); }, 700);
    } else {
      onStateChange(ng);
      setBusy(false);
    }
  }, [combat, player, gameState, onStateChange, busy, triggerShake]);

  const handleCardPlay = useCallback((card: Card) => {
    if (!combat.isPlayerTurn || busy) return;
    const cost = card.cost < 0 ? combat.energy : card.cost;
    if (combat.energy < cost) return;
    if (needsTarget(card)) {
      setSelected(prev => prev?.id === card.id ? null : card);
      return;
    }
    executeCard(card, combat.enemies[0]?.id);
  }, [combat, busy, needsTarget, executeCard]);

  const handleCardSelect = useCallback((card: Card) => {
    if (!combat.isPlayerTurn || busy) return;
    const cost = card.cost < 0 ? combat.energy : card.cost;
    if (combat.energy < cost) return;
    if (needsTarget(card)) {
      setSelected(prev => prev?.id === card.id ? null : card);
    } else {
      executeCard(card, combat.enemies[0]?.id);
    }
  }, [combat, busy, needsTarget, executeCard]);

  const handleEnemyClick = useCallback((id: string) => {
    if (selected) executeCard(selected, id);
  }, [selected, executeCard]);

  const handleEndTurn = useCallback(() => {
    if (!combat.isPlayerTurn || busy) return;
    setBusy(true);
    setSelected(null);
    const { combat: nc, player: np } = endTurn(combat, player);
    const ng: GameState = { ...gameState, combat: nc, player: np };
    if (nc.combatOver && nc.won) {
      setTimeout(() => { onStateChange(resolveCombatVictory(ng)); setBusy(false); }, 700);
    } else if (nc.combatOver && !nc.won) {
      setTimeout(() => { onStateChange({ ...ng, phase: 'game_over' }); setBusy(false); }, 700);
    } else {
      onStateChange(ng);
      setBusy(false);
    }
  }, [combat, player, gameState, onStateChange, busy]);

  const nodeType = gameState.map.find(n => n.id === gameState.currentNodeId)?.type ?? 'combat';
  const handSize = combat.hand.length;
  const fanSpread = Math.min(3.2, 16 / Math.max(handSize, 1));

  return (
    <div className={`min-h-screen bg-gray-950 flex flex-col select-none overflow-hidden scanlines ${showCrash ? 'system-crash-bg' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-gray-950 to-black" />
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,0,0,0.5) 1px,transparent 1px), linear-gradient(90deg,rgba(255,0,0,0.5) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Snowflake / noise crash activation overlay ── */}
      {showCrashOverlay && (
        <div className="crash-overlay fixed inset-0 z-[9000] pointer-events-none">
          {/* White base flash */}
          <div className="absolute inset-0 bg-white/10" />
          {/* Noise texture */}
          <div className="absolute inset-0 crash-overlay-noise opacity-80" />
          {/* Horizontal scan line sweep */}
          <div className="absolute inset-0 crash-scanline" />
          {/* Red tint strips */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(239,68,68,0.12) 6px, rgba(239,68,68,0.12) 8px)',
            }}
          />
          {/* Big center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-red-400 font-black font-mono text-5xl tracking-[0.3em] drop-shadow-lg"
              style={{ textShadow: '0 0 30px rgba(239,68,68,0.9), 2px 2px 0 #7f1d1d' }}>
              CRASH
            </div>
            <div className="text-white/80 font-mono text-sm tracking-widest">SYSTEM REINSTALL IN PROGRESS</div>
            <div className="flex gap-1 mt-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {combat.systemCrashActive && (
        <div className="relative z-20 text-center py-1.5 bg-gradient-to-r from-transparent via-red-950/80 to-transparent border-b border-red-700/50">
          <span className="text-red-400 font-black text-xs font-mono animate-pulse tracking-widest">
            💥 SYSTEM CRASH ACTIVE — ALL DAMAGE ×2 — {combat.systemCrashTurnsLeft} TURNS
          </span>
        </div>
      )}

      <div className="relative z-10 flex justify-between items-center px-5 py-2 border-b border-gray-800/60 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded border
            ${nodeType === 'elite' ? 'text-amber-300 border-amber-700 bg-amber-950/50' :
              nodeType === 'boss'  ? 'text-red-300 border-red-700 bg-red-950/50' :
              'text-gray-400 border-gray-700 bg-gray-900/50'}`}>
            {nodeType === 'elite' ? '> ELITE_PROCESS' : nodeType === 'boss' ? '> BOSS_PROCESS' : '> PROCESS'}
          </span>
          <span className="text-gray-600 text-xs font-mono">floor={gameState.floor} | turn={combat.turn}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold font-mono">
          💰 {player.gold}
        </div>
      </div>

      {/* Shakeable arena */}
      <div className={`relative z-10 flex-1 flex flex-col ${shake === 'lg' ? 'shake-lg' : shake === 'sm' ? 'shake-sm' : ''}`}>
        <div className="flex justify-center items-end gap-8 pt-6 pb-3 min-h-[260px] relative">
          {combat.enemies.map(enemy => (
            <EnemyComponent
              key={enemy.id}
              enemy={enemy}
              targeted={selected !== null && combat.enemies.length === 1}
              selectable={selected !== null}
              onClick={() => handleEnemyClick(enemy.id)}
            />
          ))}
          {selected && combat.enemies.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-orange-400 text-xs font-mono font-bold animate-pulse bg-orange-950/30 px-4 py-1 rounded-full border border-orange-700/50">
              SELECT TARGET
            </div>
          )}
          <FloatingNumbers floats={combat.floatingNumbers} />
        </div>

        {combat.lastBugMessage && (
          <div className="mx-auto mb-1 px-4 py-1 bg-red-950/80 border border-red-700/60 rounded-full text-red-300 text-xs font-mono font-bold max-w-xs text-center">
            {combat.lastBugMessage}
          </div>
        )}

        <div className="mx-5 mb-2">
          <button
            onClick={() => setLogOpen(v => !v)}
            className="flex items-center gap-1.5 text-gray-700 hover:text-gray-500 transition-colors text-xs font-mono"
          >
            <ScrollText className="w-3 h-3" />
            LOG
            <ChevronRight className={`w-3 h-3 transition-transform ${logOpen ? 'rotate-90' : ''}`} />
          </button>
          {logOpen && (
            <div className="mt-1 bg-gray-950/90 border border-gray-800 rounded-xl p-3 max-h-28 overflow-y-auto font-mono">
              {[...combat.log].reverse().slice(0, 15).map((entry, i) => (
                <div key={i} className="text-gray-500 text-xs py-0.5">{entry}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player area */}
      <div className="relative z-10 border-t border-gray-800/60 bg-gray-950/60 backdrop-blur-sm">
        <div className="flex gap-4 px-5 py-3 items-end">
          <div className="shrink-0">
            <PlayerStatus
              player={player}
              energy={combat.energy}
              maxEnergy={combat.maxEnergy}
              drawCount={combat.drawPile.length}
              discardCount={combat.discardPile.length}
            />
          </div>

          {/* Hand fan */}
          <div className="flex-1 flex flex-col items-center justify-end min-h-[180px] overflow-visible relative">
            {combat.isPlayerTurn && handSize > 0 && (
              <div className="absolute top-0 w-full flex justify-center pointer-events-none">
                <span className="text-gray-800 text-xs font-mono tracking-widest select-none">↑ 向上拖拽出牌</span>
              </div>
            )}

            <div className="relative" style={{ width: Math.min(handSize * 70 + 60, 560), height: 168 }}>
              {combat.hand.map((card, i) => {
                const offset = i - (handSize - 1) / 2;
                const fanRotate = offset * fanSpread;
                const fanOffsetY = Math.abs(offset) * Math.abs(offset) * 2;
                return (
                  <div
                    key={card.id}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      marginLeft: offset * 68 - 56,
                    }}
                  >
                    <DraggableCard
                      card={card}
                      fanRotate={fanRotate}
                      fanOffsetY={fanOffsetY}
                      index={i}
                      handLength={handSize}
                      canPlay={combat.isPlayerTurn && !busy}
                      isPlayerTurn={combat.isPlayerTurn && !busy}
                      energy={combat.energy}
                      onPlay={handleCardPlay}
                      onSelect={handleCardSelect}
                      selected={selected?.id === card.id}
                    />
                  </div>
                );
              })}
              {handSize === 0 && !busy && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm font-mono">
                  -- HAND EMPTY --
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-3">
            <BugMeter
              value={combat.bugMeter}
              meterReady={combat.bugMeterReady}
              crashActive={combat.systemCrashActive}
              crashTurns={combat.systemCrashTurnsLeft}
              canActivate={combat.isPlayerTurn && !busy}
              onActivate={handleActivateCrash}
            />
            <button
              onClick={handleEndTurn}
              disabled={!combat.isPlayerTurn || busy}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm font-mono transition-all duration-200 border-2
                ${combat.isPlayerTurn && !busy
                  ? 'bg-green-900/80 hover:bg-green-800 border-green-600 text-green-300 hover:scale-105 active:scale-95'
                  : 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed'}`}
            >
              <Zap className="w-4 h-4" />
              {busy ? 'PROCESSING...' : combat.isPlayerTurn ? 'END TURN' : 'ENEMY TURN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
