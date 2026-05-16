import { Enemy, EnemyAction } from '../types/game';

function makeEnemy(
  baseId: string,
  name: string,
  hp: number,
  pattern: EnemyAction[]
): Enemy {
  return {
    id: `${baseId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    hp,
    maxHp: hp,
    block: 0,
    statusEffects: [],
    pattern,
    patternIndex: 0,
  };
}

// ── Normal Enemies (Bug Spire themed) ─────────────────────────────────────────

export function makeVirusDrone(): Enemy {
  return makeEnemy('virus_drone', '病毒无人机', 44, [
    { type: 'attack', damage: 8, label: '感染 8' },
    { type: 'attack', damage: 8, label: '感染 8' },
    { type: 'buff', status: 'strength', statusValue: 2, label: '进化 +2力量' },
    { type: 'attack', damage: 10, label: '感染 10' },
  ]);
}

export function makeCorruptedGuard(): Enemy {
  return makeEnemy('corrupt_guard', '腐败守卫', 50, [
    { type: 'defend', block: 8, label: '加载防护 8' },
    { type: 'attack', damage: 9, label: '攻击 9' },
    { type: 'attack_debuff', damage: 7, status: 'weak', statusValue: 2, label: '漏洞攻击 7 + 虚弱' },
    { type: 'attack', damage: 11, label: '攻击 11' },
  ]);
}

export function makeGlitchSprite(): Enemy {
  return makeEnemy('glitch_sprite', '故障精灵', 28, [
    { type: 'attack', damage: 6, label: '乱码 6' },
    { type: 'attack_debuff', damage: 5, status: 'vulnerable', statusValue: 2, label: '注入漏洞 5 + 易伤' },
    { type: 'attack', damage: 7, label: '乱码 7' },
  ]);
}

export function makeNullPointer(): Enemy {
  return makeEnemy('null_pointer', 'NULL指针', 36, [
    { type: 'attack', damage: 7, label: '空指针 7' },
    { type: 'attack', damage: 7, times: 2, label: '双重攻击 7×2' },
    { type: 'buff', status: 'strength', statusValue: 1, label: '自我修复 +1力量' },
  ]);
}

export function makeDataLeech(): Enemy {
  return makeEnemy('data_leech', '数据水蛭', 32, [
    { type: 'debuff', status: 'weak', statusValue: 2, label: '吸取力量 -虚弱2' },
    { type: 'attack', damage: 8, label: '侵蚀 8' },
    { type: 'attack', damage: 8, label: '侵蚀 8' },
    { type: 'debuff', status: 'vulnerable', statusValue: 1, label: '暴露漏洞 +易伤1' },
  ]);
}

// ── Elite Enemies ─────────────────────────────────────────────────────────────

export function makeExeCorruptor(): Enemy {
  return makeEnemy('exe_corruptor', 'EXE破坏者', 88, [
    { type: 'attack_debuff', damage: 14, status: 'vulnerable', statusValue: 2, label: '系统破坏 14 + 易伤' },
    { type: 'attack', damage: 16, label: '覆盖攻击 16' },
    { type: 'buff', status: 'strength', statusValue: 2, label: '升级自身 +2力量' },
    { type: 'attack', damage: 20, label: '覆盖攻击 20' },
  ]);
}

export function makeRootkit(): Enemy {
  return makeEnemy('rootkit', '根套件', 105, [
    { type: 'defend', block: 10, label: '防火墙 10' },
    { type: 'defend', block: 10, label: '防火墙 10' },
    { type: 'attack', damage: 18, label: '深度感染 18' },
    { type: 'debuff', status: 'strength', statusValue: -2, label: '系统降级 -2力量' },
    { type: 'attack', damage: 22, label: '深度感染 22' },
  ]);
}

// ── Boss Enemies ──────────────────────────────────────────────────────────────

// Act 1 Boss
export function makeMasterVirus(): Enemy {
  return makeEnemy('master_virus', '主病毒', 150, [
    { type: 'attack', damage: 10, label: '多态攻击 10' },
    { type: 'buff', status: 'strength', statusValue: 2, label: '自我复制 +2力量' },
    { type: 'attack', damage: 12, times: 2, label: '双核攻击 12×2' },
    { type: 'defend', block: 12, label: '加密防护 12' },
    { type: 'attack', damage: 18, label: '全面感染 18' },
  ]);
}

// Act 2 Boss
export function makeKernelGuardian(): Enemy {
  return makeEnemy('kernel_guardian', '内核守护者', 200, [
    { type: 'defend', block: 18, label: '内核屏障 18' },
    { type: 'attack', damage: 14, label: '权限攻击 14' },
    { type: 'attack_debuff', damage: 12, status: 'vulnerable', statusValue: 3, label: '漏洞注入 12 + 易伤3' },
    { type: 'buff', status: 'strength', statusValue: 3, label: 'RING0超载 +3力量' },
    { type: 'attack', damage: 20, label: '系统调用 20' },
    { type: 'attack', damage: 8, times: 3, label: '中断风暴 8×3' },
  ]);
}

// Act 3 Boss (final)
export function makeTheSpire(): Enemy {
  return makeEnemy('the_spire', '系统核心', 280, [
    { type: 'attack', damage: 3, times: 5, label: '5×3 数据流' },
    { type: 'buff', status: 'strength', statusValue: 3, label: '核心超载 +3力量' },
    { type: 'attack', damage: 14, label: '崩溃波 14' },
    { type: 'defend', block: 15, label: '系统防护 15' },
    { type: 'attack', damage: 20, label: '终端冲击 20' },
    { type: 'attack', damage: 6, times: 4, label: '4×6 数据风暴' },
  ]);
}

// ── Factory helpers ───────────────────────────────────────────────────────────

const NORMAL_POOL = [makeVirusDrone, makeCorruptedGuard, makeGlitchSprite, makeNullPointer, makeDataLeech];
const ELITE_POOL = [makeExeCorruptor, makeRootkit];

const ACT_BOSSES: Record<number, () => Enemy> = {
  1: makeMasterVirus,
  2: makeKernelGuardian,
  3: makeTheSpire,
};

export function getRandomNormalEnemy(floor: number): Enemy {
  const factory = NORMAL_POOL[Math.floor(Math.random() * NORMAL_POOL.length)];
  const e = factory();
  const scale = 1 + Math.floor((floor - 1) / 3) * 0.12;
  return { ...e, hp: Math.round(e.hp * scale), maxHp: Math.round(e.maxHp * scale) };
}

export function getRandomEliteEnemy(): Enemy {
  return ELITE_POOL[Math.floor(Math.random() * ELITE_POOL.length)]();
}

export function getBossEnemy(act: number): Enemy {
  const factory = ACT_BOSSES[act] ?? ACT_BOSSES[3];
  return factory();
}

export function getEnemiesForNode(nodeType: 'combat' | 'elite' | 'boss', floor: number, act = 1): Enemy[] {
  if (nodeType === 'boss') return [getBossEnemy(act)];
  if (nodeType === 'elite') return [getRandomEliteEnemy()];
  if (Math.random() < 0.3 && floor <= 5) {
    return [makeGlitchSprite(), makeGlitchSprite()];
  }
  return [getRandomNormalEnemy(floor)];
}
