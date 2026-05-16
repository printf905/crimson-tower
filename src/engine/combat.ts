import {
  Card, CombatState, Enemy, PlayerState,
  StatusEffect, StatusType, FloatingNumber,
} from '../types/game';
import { cloneCard, makeCurseCard } from '../data/cards';
import {
  SYSTEM_CRASH_DURATION,
  getSystemCrashMessage,
  getBugPlayMessage,
  getCrashActivationMessage,
  BUG_METER_GAIN,
} from './bugSystem';

const HAND_SIZE = 5;
const MAX_HAND_SIZE = 10;
const BUG_METER_MAX = 100;

// ── Pure helpers ──────────────────────────────────────────────────────────────

let _fnId = 0;
function mkFloat(
  value: number,
  kind: FloatingNumber['kind'],
  slot: number   // 0 = player side, 1+ = enemy index+1
): FloatingNumber {
  return {
    id: `fn_${++_fnId}`,
    value,
    kind,
    // x/y are visual hints; CombatScreen positions floats relative to slots
    x: slot === 0 ? 80 : 160 + (slot - 1) * 220,
    y: slot === 0 ? 320 : 180,
  };
}

export function getStat(effects: StatusEffect[], type: StatusType): number {
  return effects.find(s => s.type === type)?.value ?? 0;
}

function addStat(effects: StatusEffect[], type: StatusType, delta: number): StatusEffect[] {
  if (delta === 0) return effects;
  const existing = effects.find(s => s.type === type);
  if (existing) {
    const next = existing.value + delta;
    if (next <= 0) return effects.filter(s => s.type !== type);
    return effects.map(s => s.type === type ? { ...s, value: next } : s);
  }
  if (delta <= 0) return effects;
  return [...effects, { type, value: delta }];
}

/** Correct damage formula: base + strength, then ×0.75 if attacker weak, then ×1.5 if target vulnerable */
function calcDamage(
  base: number,
  strength: number,
  attackerWeak: boolean,
  targetVulnerable: boolean
): number {
  let dmg = Math.max(0, base + strength);
  if (attackerWeak) dmg = Math.floor(dmg * 0.75);
  if (targetVulnerable) dmg = Math.floor(dmg * 1.5);
  return Math.max(0, dmg);
}

/** Block absorbs damage first, then HP */
function damageEnemy(e: Enemy, dmg: number): Enemy {
  const absorbed = Math.min(e.block, dmg);
  return { ...e, block: e.block - absorbed, hp: Math.max(0, e.hp - (dmg - absorbed)) };
}

function damagePlayer(p: PlayerState, dmg: number): PlayerState {
  const absorbed = Math.min(p.block, dmg);
  return { ...p, block: p.block - absorbed, hp: Math.max(0, p.hp - (dmg - absorbed)) };
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initCombat(
  player: PlayerState,
  enemies: Enemy[]
): { combat: CombatState; player: PlayerState } {
  const relicIds = player.relics.map(r => r.id);

  let p: PlayerState = {
    ...player,
    block: relicIds.includes('anchor') ? 10 : 0,
    statusEffects: relicIds.includes('vajra')
      ? addStat(player.statusEffects, 'strength', 1)
      : [...player.statusEffects],
  };

  const shuffled = [...player.deck].sort(() => Math.random() - 0.5).map(cloneCard);
  const initialDraw = HAND_SIZE + (relicIds.includes('bag_of_prep') ? 2 : 0);

  // Rusty USB relic: apply 3 trojan to all enemies at start
  let initEnemies = enemies.map(e => ({ ...e }));
  if (relicIds.includes('rusty_usb')) {
    initEnemies = initEnemies.map(e => ({
      ...e,
      statusEffects: addStat(e.statusEffects, 'trojan', 3),
    }));
  }

  let c: CombatState = {
    enemies: initEnemies,
    hand: [],
    drawPile: shuffled,
    discardPile: [],
    exhaustPile: [],
    energy: 3,
    maxEnergy: 3,
    turn: 1,
    isPlayerTurn: true,
    combatOver: false,
    won: false,
    log: relicIds.includes('rusty_usb')
      ? ['⚡ 战斗开始！', '  🗝️ 生锈的U盘：所有敌人感染 3 层木马']
      : ['⚡ 战斗开始！'],
    floatingNumbers: [],
    firstAttackUsed: false,
    tookSelfDamageThisTurn: false,
    bugMeter: 0,
    bugMeterReady: false,
    systemCrashActive: false,
    systemCrashTurnsLeft: 0,
    lastBugMessage: null,
  };

  c = drawCards(c, initialDraw);
  return { combat: c, player: p };
}

// ── Draw cards ────────────────────────────────────────────────────────────────

export function drawCards(c: CombatState, count: number, maxHand = MAX_HAND_SIZE): CombatState {
  let state = { ...c };
  for (let i = 0; i < count; i++) {
    if (state.hand.length >= maxHand) break; // hand full
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      // Reshuffle discard into draw
      state = {
        ...state,
        drawPile: [...state.discardPile].sort(() => Math.random() - 0.5),
        discardPile: [],
        log: [...state.log, '↺ 弃牌堆洗入牌库'],
      };
    }
    const [top, ...rest] = state.drawPile;
    state = { ...state, hand: [...state.hand, top], drawPile: rest };
  }
  return state;
}

// ── Execute a single set of card effects ──────────────────────────────────────

function executeEffects(
  c: CombatState,
  p: PlayerState,
  card: Card,
  targetEnemyId: string | undefined
): { c: CombatState; p: PlayerState } {
  const strength = getStat(p.statusEffects, 'strength');
  const playerWeak = getStat(p.statusEffects, 'weak') > 0;
  const hasAkabeko = p.relics.some(r => r.id === 'akabeko');
  const hasBugScanner = p.relics.some(r => r.id === 'bug_scanner');

  for (const effect of card.effects) {
    // Skip suppressed effects (value 0 from bug modifier)
    if (['damage', 'block', 'hp_cost', 'burn', 'add_curse', 'strength', 'vulnerable', 'weak', 'poison', 'exhaust_random'].includes(effect.type) && effect.value === 0 && effect.type !== 'damage_per_block') {
      if (effect.value === 0 && effect.type !== 'damage_per_block' && effect.type !== 'double_block') {
        // Only skip non-zero-by-design effects when bugged
        if (card.bugged) continue;
      }
    }

    switch (effect.type) {
      case 'damage': {
        const times = effect.times ?? 1;
        for (let t = 0; t < times; t++) {
          const isFirstAttack = !c.firstAttackUsed && card.type === 'attack';
          const akaBonus = isFirstAttack && hasAkabeko ? 8 : 0;
          if (isFirstAttack) c = { ...c, firstAttackUsed: true };

          if (effect.target === 'all_enemies') {
            const xTimes = card.cost === -1 ? (c.energy + 1) : 1; // X-cost uses energy spent
            for (let x = 0; x < xTimes; x++) {
              c = {
                ...c,
                enemies: c.enemies.map((e, idx) => {
                  const vuln = getStat(e.statusEffects, 'vulnerable') > 0;
                  const dmg = calcDamage(effect.value + akaBonus, strength, playerWeak, vuln);
                  c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', idx + 1)] };
                  return damageEnemy(e, dmg);
                }),
              };
            }
          } else if (effect.target === 'enemy' && targetEnemyId) {
            c = {
              ...c,
              enemies: c.enemies.map((e, idx) => {
                if (e.id !== targetEnemyId) return e;
                const vuln = getStat(e.statusEffects, 'vulnerable') > 0;
                const dmg = calcDamage(effect.value + akaBonus, strength, playerWeak, vuln);
                c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', idx + 1)] };
                return damageEnemy(e, dmg);
              }),
            };
          }
        }
        break;
      }

      case 'damage_per_block': {
        if (targetEnemyId) {
          const dmgAmt = Math.max(0, p.block);
          c = {
            ...c,
            enemies: c.enemies.map((e, idx) => {
              if (e.id !== targetEnemyId) return e;
              const vuln = getStat(e.statusEffects, 'vulnerable') > 0;
              const finalDmg = calcDamage(dmgAmt, 0, playerWeak, vuln);
              c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(finalDmg, 'damage', idx + 1)] };
              return damageEnemy(e, finalDmg);
            }),
          };
        }
        break;
      }

      case 'block': {
        if (effect.value > 0) {
          p = { ...p, block: p.block + effect.value };
          c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(effect.value, 'block', 0)] };
          // Bug Scanner relic: bugged card gives +1 bonus block
          if (card.bugged && hasBugScanner) {
            p = { ...p, block: p.block + 1 };
          }
        }
        break;
      }

      case 'double_block': {
        const doubled = p.block * 2;
        p = { ...p, block: doubled };
        c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(doubled, 'block', 0)] };
        break;
      }

      case 'draw': {
        if (effect.value > 0) c = drawCards(c, effect.value);
        break;
      }

      case 'energy': {
        if (effect.value !== 0) c = { ...c, energy: Math.max(0, c.energy + effect.value) };
        break;
      }

      case 'hp_cost': {
        // Only apply HP cost when NOT bugged (bug suppresses by setting value to 0)
        if (effect.value > 0) {
          p = { ...p, hp: Math.max(1, p.hp - effect.value) };
          c = { ...c, log: [...c.log, `  失去 ${effect.value} 点生命（代价）`] };
        }
        break;
      }

      case 'burn': {
        if (effect.value > 0) {
          // Burn deals immediate damage (not a DoT for simplicity)
          p = { ...p, hp: Math.max(1, p.hp - effect.value) };
          c = {
            ...c,
            floatingNumbers: [...c.floatingNumbers, mkFloat(effect.value, 'burn', 0)],
            log: [...c.log, `  灼烧造成 ${effect.value} 点伤害`],
          };
        }
        break;
      }

      case 'add_curse': {
        if (effect.value > 0) {
          const curse = makeCurseCard();
          c = {
            ...c,
            discardPile: [...c.discardPile, curse],
            log: [...c.log, `  诅咒牌【故障】加入弃牌堆`],
          };
        }
        break;
      }

      case 'strength': {
        if (effect.target === 'self') {
          p = { ...p, statusEffects: addStat(p.statusEffects, 'strength', effect.value) };
        } else if (effect.target === 'enemy' && targetEnemyId) {
          c = {
            ...c,
            enemies: c.enemies.map(e =>
              e.id === targetEnemyId
                ? { ...e, statusEffects: addStat(e.statusEffects, 'strength', effect.value) }
                : e
            ),
          };
        }
        break;
      }

      case 'vulnerable': {
        if (effect.target === 'enemy' && targetEnemyId) {
          c = {
            ...c,
            enemies: c.enemies.map(e =>
              e.id === targetEnemyId
                ? { ...e, statusEffects: addStat(e.statusEffects, 'vulnerable', effect.value) }
                : e
            ),
          };
        } else if (effect.target === 'self') {
          p = { ...p, statusEffects: addStat(p.statusEffects, 'vulnerable', effect.value) };
        }
        break;
      }

      case 'weak': {
        if (effect.target === 'enemy' && targetEnemyId) {
          c = {
            ...c,
            enemies: c.enemies.map(e =>
              e.id === targetEnemyId
                ? { ...e, statusEffects: addStat(e.statusEffects, 'weak', effect.value) }
                : e
            ),
          };
        } else if (effect.target === 'self') {
          p = { ...p, statusEffects: addStat(p.statusEffects, 'weak', effect.value) };
        }
        break;
      }

      case 'poison': {
        if (effect.target === 'enemy' && targetEnemyId) {
          c = {
            ...c,
            enemies: c.enemies.map(e =>
              e.id === targetEnemyId
                ? { ...e, statusEffects: addStat(e.statusEffects, 'poison', effect.value) }
                : e
            ),
          };
        }
        break;
      }

      case 'trojan': {
        const applyToAll = effect.target === 'all_enemies';
        if ((effect.target === 'enemy' && targetEnemyId) || applyToAll) {
          c = {
            ...c,
            enemies: c.enemies.map(e => {
              if (!applyToAll && e.id !== targetEnemyId) return e;
              return { ...e, statusEffects: addStat(e.statusEffects, 'trojan', effect.value) };
            }),
            log: [...c.log, `  🦠 施加 ${effect.value} 层木马`],
          };
        }
        break;
      }

      case 'trojan_double': {
        // Double existing trojan stacks AFTER the trojan effect has been applied
        if (effect.target === 'enemy' && targetEnemyId) {
          c = {
            ...c,
            enemies: c.enemies.map(e => {
              if (e.id !== targetEnemyId) return e;
              const existing = getStat(e.statusEffects, 'trojan');
              if (existing <= 0) return e;
              return { ...e, statusEffects: addStat(e.statusEffects, 'trojan', existing) };
            }),
            log: [...c.log, `  🦠 木马层数翻倍！`],
          };
        }
        break;
      }

      case 'overclock_mode': {
        // Grant energy and mark the overclock flag — subsequent self-damage triggers liquid_nitrogen
        const energyGain = effect.value;
        c = { ...c, energy: c.energy + energyGain, tookSelfDamageThisTurn: false };
        // Each subsequent card played will deal 1 true damage; handled in playCard wrapper
        p = { ...p, statusEffects: addStat(p.statusEffects, 'overclock', 1) };
        c = { ...c, log: [...c.log, `  ⚡ 极限超频：+${energyGain} 能量，本回合出牌自损 1 HP`] };
        break;
      }

      case 'bsod_strike': {
        if (effect.target === 'enemy' && targetEnemyId) {
          const baseDmg = effect.value;
          const multiplier = c.tookSelfDamageThisTurn ? 2 : 1;
          const finalDmg = baseDmg * multiplier;
          c = {
            ...c,
            enemies: c.enemies.map((e, idx) => {
              if (e.id !== targetEnemyId) return e;
              const vuln = getStat(e.statusEffects, 'vulnerable') > 0;
              const dmg = calcDamage(finalDmg, strength, playerWeak, vuln);
              c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', idx + 1)] };
              return damageEnemy(e, dmg);
            }),
            log: [...c.log, multiplier > 1
              ? `  💥 蓝屏打击！伤害翻倍 (${finalDmg})`
              : `  蓝屏打击 (${finalDmg})`],
          };
        }
        break;
      }

      case 'discard_all_deal': {
        const perCard = effect.value; // block per discard AND damage per discard
        const discarded = [...c.hand];
        const count = discarded.length;
        if (count > 0) {
          // Discard all
          c = {
            ...c,
            hand: [],
            discardPile: [...c.discardPile, ...discarded],
            log: [...c.log, `  ♻ 垃圾回收：丢弃 ${count} 张牌`],
          };
          // Block
          const blockGain = perCard * count;
          p = { ...p, block: p.block + blockGain };
          c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(blockGain, 'block', 0)] };
          // Damage to target
          if (targetEnemyId) {
            const totalDmg = perCard * count;
            c = {
              ...c,
              enemies: c.enemies.map((e, idx) => {
                if (e.id !== targetEnemyId) return e;
                const vuln = getStat(e.statusEffects, 'vulnerable') > 0;
                const dmg = calcDamage(totalDmg, strength, playerWeak, vuln);
                c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', idx + 1)] };
                return damageEnemy(e, dmg);
              }),
              log: [...c.log, `  ♻ 造成 ${totalDmg} 点伤害，获得 ${blockGain} 点格挡`],
            };
          }
        }
        break;
      }

      case 'heal': {
        if (effect.target === 'self' && effect.value > 0) {
          const healAmt = effect.value * Math.max(1, c.enemies.length);
          p = { ...p, hp: Math.min(p.maxHp, p.hp + healAmt) };
          c = { ...c, floatingNumbers: [...c.floatingNumbers, mkFloat(healAmt, 'heal', 0)] };
        }
        break;
      }

      case 'exhaust_random': {
        if (c.hand.length > 0 && effect.value > 0) {
          const idx = Math.floor(Math.random() * c.hand.length);
          const removed = c.hand[idx];
          c = {
            ...c,
            hand: c.hand.filter((_, i) => i !== idx),
            exhaustPile: [...c.exhaustPile, removed],
            log: [...c.log, `  消耗了【${removed.name}】`],
          };
        }
        break;
      }
    }
  }

  return { c, p };
}

// ── Play a card ───────────────────────────────────────────────────────────────

export function playCard(
  combat: CombatState,
  player: PlayerState,
  card: Card,
  targetEnemyId: string | undefined
): { combat: CombatState; player: PlayerState } {
  if (!combat.isPlayerTurn || combat.combatOver) return { combat, player };

  // During System Crash all card costs become 0
  const crashZeroCost = combat.systemCrashActive;
  const actualCost = crashZeroCost ? 0 : (card.cost < 0 ? combat.energy : card.cost);
  if (!crashZeroCost && combat.energy < actualCost) return { combat, player };

  let c: CombatState = {
    ...combat,
    energy: crashZeroCost ? combat.energy : (card.cost < 0 ? 0 : combat.energy - card.cost),
    hand: combat.hand.filter(h => h.id !== card.id),
    floatingNumbers: [],
    log: [...combat.log, `▶ 打出【${card.name}】${card.bugged ? ' ⚠️' : ''}`],
    lastBugMessage: null,
  };
  let p = { ...player };

  // Overclock mode: each card played costs 1 HP (true damage, ignores block)
  const overclockActive = getStat(p.statusEffects, 'overclock') > 0;
  const isOverclockCard = card.effects.some(e => e.type === 'overclock_mode');
  if (overclockActive && !isOverclockCard) {
    p = { ...p, hp: Math.max(1, p.hp - 1) };
    c = {
      ...c,
      tookSelfDamageThisTurn: true,
      floatingNumbers: [...c.floatingNumbers, mkFloat(1, 'burn', 0)],
      log: [...c.log, '  ⚡ 超频灼烧 -1 HP'],
    };
    // Liquid Nitrogen relic: self-damage via card → +2 block
    if (p.relics.some(r => r.id === 'liquid_nitrogen')) {
      p = { ...p, block: p.block + 2 };
      c = { ...c, log: [...c.log, '  🧊 液氮散热器：+2 格挡'] };
    }
  }

  // System Crash doubles all damage
  const crashBonus = c.systemCrashActive ? 2 : 1;

  // Apply crash multiplier to damage effects temporarily
  const effectsToRun = card.effects.map(e =>
    e.type === 'damage' && crashBonus > 1
      ? { ...e, value: Math.ceil(e.value * crashBonus) }
      : e
  );
  const cardWithCrash: Card = { ...card, effects: effectsToRun };

  const result = executeEffects(c, p, cardWithCrash, targetEnemyId);
  c = result.c;
  p = result.p;

  // Infinite Recursion: if hand is now full (>= max), deal 8 damage to random enemy
  if (card.baseId === 'infinite_recursion' && c.enemies.length > 0) {
    const handLimit = p.relics.some(r => r.id === 'dual_memory') ? 12 : MAX_HAND_SIZE;
    if (c.hand.length >= handLimit) {
      const targetIdx = Math.floor(Math.random() * c.enemies.length);
      const tgt = c.enemies[targetIdx];
      const vuln = getStat(tgt.statusEffects, 'vulnerable') > 0;
      const dmg = calcDamage(8, getStat(p.statusEffects, 'strength'), getStat(p.statusEffects, 'weak') > 0, vuln);
      c = {
        ...c,
        enemies: c.enemies.map((e, i) => i === targetIdx ? damageEnemy(e, dmg) : e),
        floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', targetIdx + 1)],
        log: [...c.log, `  📡 手牌溢出！无限递归爆发 ${dmg} 伤害`],
      };
    }
  }

  // Also trigger liquid_nitrogen for hp_cost effects
  if (p.hp < player.hp && !overclockActive) {
    const hpCostTaken = player.hp - p.hp;
    if (hpCostTaken > 0 && p.relics.some(r => r.id === 'liquid_nitrogen')) {
      p = { ...p, block: p.block + 2 };
      c = { ...c, tookSelfDamageThisTurn: true, log: [...c.log, '  🧊 液氮散热器：+2 格挡'] };
    }
  }

  // Bug modifier: repeat if repeatTimes set
  if (card.bugged && card.bugModifier?.repeatTimes) {
    for (let r = 0; r < card.bugModifier.repeatTimes; r++) {
      const repeatResult = executeEffects(c, p, cardWithCrash, targetEnemyId);
      c = repeatResult.c;
      p = repeatResult.p;
    }
  }

  // Bug meter: gain based on rarity (minor=10, major=20, legendary=35)
  if (card.bugged && card.bugModifier) {
    const rarity = card.bugModifier.rarity;
    const gain = BUG_METER_GAIN[rarity] ?? card.bugModifier.bugMeterGain;
    const newMeter = Math.min(BUG_METER_MAX, c.bugMeter + gain);
    const bugMsg = getBugPlayMessage();
    const nowReady = newMeter >= BUG_METER_MAX && !c.systemCrashActive;

    c = {
      ...c,
      bugMeter: nowReady ? BUG_METER_MAX : newMeter,
      bugMeterReady: nowReady || (c.bugMeterReady && !c.systemCrashActive),
      lastBugMessage: bugMsg,
      log: [...c.log,
        `  ⚡ ${bugMsg}`,
        ...(nowReady && !c.bugMeterReady ? ['  🔴 BUG METER FULL — 点击 DEBUG 按钮释放系统崩溃！'] : []),
      ],
    };
  }

  // Remove dead enemies
  const dead = c.enemies.filter(e => e.hp <= 0);
  if (dead.length > 0) {
    c = {
      ...c,
      log: [...c.log, ...dead.map(e => `💀 ${e.name} 已被消灭`)],
      enemies: c.enemies.filter(e => e.hp > 0),
    };
  }

  // Card goes to discard (not exhaust pile — exhaust handled separately)
  if (card.exhaust) {
    c = { ...c, exhaustPile: [...c.exhaustPile, card] };
  } else {
    c = { ...c, discardPile: [...c.discardPile, card] };
  }

  // Win check
  if (c.enemies.length === 0) {
    c = { ...c, combatOver: true, won: true, log: [...c.log, '🏆 区域已清除！'] };
  }

  return { combat: c, player: p };
}

// ── End player turn ───────────────────────────────────────────────────────────

export function endTurn(
  combat: CombatState,
  player: PlayerState
): { combat: CombatState; player: PlayerState } {
  if (!combat.isPlayerTurn || combat.combatOver) return { combat, player };

  // Discard remaining hand
  let c: CombatState = {
    ...combat,
    discardPile: [...combat.discardPile, ...combat.hand],
    hand: [],
    isPlayerTurn: false,
    floatingNumbers: [],
    lastBugMessage: null,
    log: [...combat.log, '── 系统处理中 ──'],
  };
  let p = { ...player };

  // Orichalcum: if no block, gain 6 — must check BEFORE block is cleared
  if (p.relics.some(r => r.id === 'orichalcum') && p.block === 0) {
    p = { ...p, block: 6 };
    c = { ...c, log: [...c.log, '  纳米装甲激活：+6 格挡'] };
  }

  // Tick down player debuffs; clear overclock at end of turn
  p = {
    ...p,
    statusEffects: p.statusEffects
      .map(s => (['vulnerable', 'weak', 'overclock'].includes(s.type) ? { ...s, value: s.value - 1 } : s))
      .filter(s => s.value > 0),
  };

  // ── Enemy phase ───────────────────────────────────────────────────────────
  for (let ei = 0; ei < c.enemies.length; ei++) {
    const enemy = c.enemies[ei];
    if (!enemy) continue;

    // Trojan tick: deal stacks as damage, then reduce stacks by 1
    const trojan = getStat(enemy.statusEffects, 'trojan');
    if (trojan > 0) {
      const newHp = Math.max(0, enemy.hp - trojan);
      c = {
        ...c,
        enemies: c.enemies.map((e, i) =>
          i === ei
            ? { ...e, hp: newHp, statusEffects: addStat(e.statusEffects, 'trojan', -1) }
            : e
        ),
        floatingNumbers: [...c.floatingNumbers, mkFloat(trojan, 'poison', ei + 1)],
        log: [...c.log, `  🦠 ${enemy.name} 木马爆发 ${trojan} 伤害 (剩余 ${trojan - 1} 层)`],
      };
      if (newHp <= 0) {
        c = {
          ...c,
          enemies: c.enemies.filter((_, i) => i !== ei),
          log: [...c.log, `💀 ${enemy.name} 已被消灭`],
        };
        if (c.enemies.length === 0) {
          c = { ...c, combatOver: true, won: true };
          return { combat: c, player: p };
        }
        continue;
      }
    }

    // Poison tick — re-read from current state since trojan tick may have updated it
    const poisonEnemy = c.enemies.find(e => e.id === enemy.id);
    if (!poisonEnemy) continue;
    const poison = getStat(poisonEnemy.statusEffects, 'poison');
    if (poison > 0) {
      const newHp = Math.max(0, poisonEnemy.hp - poison);
      c = {
        ...c,
        enemies: c.enemies.map(e =>
          e.id === enemy.id ? { ...e, hp: newHp, statusEffects: addStat(e.statusEffects, 'poison', -1) } : e
        ),
        floatingNumbers: [...c.floatingNumbers, mkFloat(poison, 'poison', ei + 1)],
        log: [...c.log, `  ☠️ ${enemy.name} 中毒受 ${poison} 伤`],
      };
      if (newHp <= 0) {
        c = {
          ...c,
          enemies: c.enemies.filter(e => e.id !== enemy.id),
          log: [...c.log, `💀 ${enemy.name} 已被消灭`],
        };
        if (c.enemies.length === 0) {
          c = { ...c, combatOver: true, won: true };
          return { combat: c, player: p };
        }
        continue;
      }
    }

    const live = c.enemies.find(e => e.id === enemy.id);
    if (!live) continue;

    const action = live.pattern[live.patternIndex];
    const eStr = getStat(live.statusEffects, 'strength');
    const eWeak = getStat(live.statusEffects, 'weak') > 0;

    if (action.type === 'attack' || action.type === 'attack_debuff') {
      const times = action.times ?? 1;
      for (let t = 0; t < times; t++) {
        const vuln = getStat(p.statusEffects, 'vulnerable') > 0;
        const rawDmg = action.damage ?? 0;
        const dmg = calcDamage(rawDmg, eStr, eWeak, vuln);

        // Bronze Scales relic
        if (p.relics.some(r => r.id === 'bronze_scales')) {
          c = {
            ...c,
            enemies: c.enemies.map(e => e.id === live.id ? damageEnemy(e, 3) : e),
            log: [...c.log, `  🦔 刺针协议反弹 3 伤害`],
          };
        }

        const hpBefore = p.hp;
        p = damagePlayer(p, dmg);
        const actualDmgTaken = hpBefore - p.hp; // real HP lost after block
        c = {
          ...c,
          floatingNumbers: [...c.floatingNumbers, mkFloat(dmg, 'damage', 0)],
          log: [...c.log, `  ${live.name} 造成 ${dmg} 点伤害`],
        };

        // Bug meter: +1 per actual HP damage received (only if player has bugged cards)
        if (actualDmgTaken > 0 && !c.systemCrashActive) {
          const hasBuggedCards = p.deck.some(card => card.bugged);
          if (hasBuggedCards) {
            const meterGain = actualDmgTaken;
            const newMeter = Math.min(BUG_METER_MAX, c.bugMeter + meterGain);
            const nowReady = newMeter >= BUG_METER_MAX;
            c = {
              ...c,
              bugMeter: nowReady ? BUG_METER_MAX : newMeter,
              bugMeterReady: nowReady || c.bugMeterReady,
              log: nowReady && !c.bugMeterReady
                ? [...c.log, '  🔴 BUG METER FULL — 点击 DEBUG 按钮释放系统崩溃！']
                : c.log,
            };
          }
        }

        // Backup Copy relic (lizard tail)
        if (p.hp <= 0 && p.relics.some(r => r.id === 'lizard_tail')) {
          p = { ...p, hp: 1, relics: p.relics.filter(r => r.id !== 'lizard_tail') };
          c = { ...c, log: [...c.log, '💾 备份副本激活！保留 1 点 HP'] };
        }

        if (p.hp <= 0) {
          c = { ...c, combatOver: true, won: false, log: [...c.log, '💀 进程终止...'] };
          return { combat: c, player: p };
        }
      }

      if (action.type === 'attack_debuff' && action.status && action.statusValue) {
        p = { ...p, statusEffects: addStat(p.statusEffects, action.status, action.statusValue) };
        c = { ...c, log: [...c.log, `  ${live.name} 施加了 ${action.label}`] };
      }
    }

    if (action.type === 'defend') {
      const blk = action.block ?? 0;
      c = {
        ...c,
        enemies: c.enemies.map(e => e.id === live.id ? { ...e, block: e.block + blk } : e),
        log: [...c.log, `  ${live.name} 获得 ${blk} 点格挡`],
      };
    }

    if (action.type === 'buff' && action.status && action.statusValue) {
      c = {
        ...c,
        enemies: c.enemies.map(e => {
          if (e.id !== live.id) return e;
          return { ...e, statusEffects: addStat(e.statusEffects, action.status!, action.statusValue!) };
        }),
        log: [...c.log, `  ${live.name}: ${action.label}`],
      };
    }

    if (action.type === 'debuff' && action.status && action.statusValue) {
      p = { ...p, statusEffects: addStat(p.statusEffects, action.status, action.statusValue) };
      c = { ...c, log: [...c.log, `  ${live.name} 对你施加 ${action.label}`] };
    }

    // Advance pattern index
    const nextIdx = (live.patternIndex + 1) % live.pattern.length;
    c = {
      ...c,
      enemies: c.enemies.map(e => e.id === live.id ? { ...e, patternIndex: nextIdx } : e),
    };
  }

  if (c.combatOver) return { combat: c, player: p };

  // ── Start new player turn ─────────────────────────────────────────────────
  // Player block and enemy block both reset at start of next player turn
  p = { ...p, block: 0 };
  const hasDualMemory = p.relics.some(r => r.id === 'dual_memory');
  const handLimit = hasDualMemory ? 12 : MAX_HAND_SIZE;
  c = {
    ...c,
    energy: c.maxEnergy,
    turn: c.turn + 1,
    isPlayerTurn: true,
    floatingNumbers: [],
    tookSelfDamageThisTurn: false,
    enemies: c.enemies.map(e => ({ ...e, block: 0 })),
    log: [...c.log, `── 回合 ${c.turn + 1} ──`],
  };

  // System Crash countdown — crash lasts 1 turn, then clears bugMeter
  if (c.systemCrashActive) {
    const left = c.systemCrashTurnsLeft - 1;
    c = {
      ...c,
      systemCrashTurnsLeft: left,
      systemCrashActive: left > 0,
      // Bug meter resets to 0 when crash ends
      bugMeter: left > 0 ? c.bugMeter : 0,
      bugMeterReady: false,
      log: left > 0
        ? [...c.log, `  💥 系统崩溃激活 (${left}回合剩余)`]
        : [...c.log, '  ✅ 系统恢复正常 — Bug 槽已清空'],
    };
  }

  const drawCount = HAND_SIZE + (hasDualMemory ? 1 : 0);
  c = drawCards(c, drawCount, handLimit);
  return { combat: c, player: p };
}

// ── Activate System Crash (player manually triggers via DEBUG button) ──────────

export function activateCrash(
  combat: CombatState,
  player: PlayerState,
): { combat: CombatState; player: PlayerState } {
  if (!combat.isPlayerTurn || combat.combatOver) return { combat, player };
  if (!combat.bugMeterReady || combat.systemCrashActive) return { combat, player };

  const hasDualMemory = player.relics.some(r => r.id === 'dual_memory');
  const handLimit = hasDualMemory ? 12 : MAX_HAND_SIZE;
  const msg = getCrashActivationMessage();

  // Zero out all card costs for this turn by marking crash active immediately
  // Draw hand up to max limit
  let c: CombatState = {
    ...combat,
    bugMeter: BUG_METER_MAX, // stays full during crash turn, reset on end turn
    bugMeterReady: false,
    systemCrashActive: true,
    systemCrashTurnsLeft: 1, // lasts 1 turn; endTurn will decrement → 0 and reset
    floatingNumbers: [],
    lastBugMessage: msg,
    log: [...combat.log, `💥 SYSTEM CRASH ACTIVATED — ${msg}`],
  };

  // Fill hand to limit
  const needed = handLimit - c.hand.length;
  if (needed > 0) {
    c = drawCards(c, needed, handLimit);
  }

  c = { ...c, log: [...c.log, `  ✦ 抽牌至 ${c.hand.length} 张 · 本回合所有伤害 ×2 · 手牌费用归零`] };

  return { combat: c, player };
}
