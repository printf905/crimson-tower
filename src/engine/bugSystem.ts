import { BugModifier, BugRarity, Card, CardEffect } from '../types/game';

// ── Bug modifier definitions ──────────────────────────────────────────────────

// Bug meter gain per rarity (used in combat.ts to award meter on play)
export const BUG_METER_GAIN: Record<BugRarity, number> = {
  minor: 10,
  major: 20,
  legendary: 35,
};

const MINOR_BUGS: BugModifier[] = [
  {
    id: 'double_tap',
    rarity: 'minor',
    label: 'Minor Bug',
    flavorText: 'Bug detected. Benefit retained.',
    damageMultiplier: 2,
    bugMeterGain: BUG_METER_GAIN.minor,
  },
  {
    id: 'free_block',
    rarity: 'minor',
    label: 'Minor Bug',
    flavorText: 'Negative effect skipped.',
    suppressEffectIndices: [1],
    blockMultiplier: 1.5,
    bugMeterGain: BUG_METER_GAIN.minor,
  },
  {
    id: 'zero_cost',
    rarity: 'minor',
    label: 'Minor Bug',
    flavorText: 'Cost value: undefined. Defaulting to 0.',
    costOverride: 0,
    bugMeterGain: BUG_METER_GAIN.minor,
  },
  {
    id: 'extra_draw',
    rarity: 'minor',
    label: 'Minor Bug',
    flavorText: 'Undefined behavior favors you.',
    bonusEffects: [{ type: 'draw', value: 1, target: 'none' }],
    bugMeterGain: BUG_METER_GAIN.minor,
  },
];

const MAJOR_BUGS: BugModifier[] = [
  {
    id: 'echo_strike',
    rarity: 'major',
    label: 'Major Bug',
    flavorText: 'Stack overflow detected. Running twice.',
    repeatTimes: 1,
    bugMeterGain: BUG_METER_GAIN.major,
  },
  {
    id: 'inverted_downside',
    rarity: 'major',
    label: 'Major Bug',
    flavorText: 'Enemy expected damage. Player disagreed.',
    suppressEffectIndices: [1, 2],
    damageMultiplier: 1.5,
    bugMeterGain: BUG_METER_GAIN.major,
  },
  {
    id: 'free_energy',
    rarity: 'major',
    label: 'Major Bug',
    flavorText: 'Energy deduction: NULL. Proceeding.',
    costOverride: 0,
    bonusEffects: [{ type: 'energy', value: 1, target: 'self' }],
    bugMeterGain: BUG_METER_GAIN.major,
  },
  {
    id: 'toxic_dump',
    rarity: 'major',
    label: 'Major Bug',
    flavorText: 'Memory leak redirected to enemy.',
    bonusEffects: [{ type: 'poison', value: 4, target: 'enemy' }],
    bugMeterGain: BUG_METER_GAIN.major,
  },
];

const LEGENDARY_BUGS: BugModifier[] = [
  {
    id: 'infinite_loop',
    rarity: 'legendary',
    label: 'Legendary Bug',
    flavorText: 'for(;;) — loop detected, terminated after 3 iterations.',
    repeatTimes: 2,
    bugMeterGain: BUG_METER_GAIN.legendary,
  },
  {
    id: 'heap_overflow',
    rarity: 'legendary',
    label: 'Legendary Bug',
    flavorText: 'Heap overflow. All values promoted to maximum.',
    damageMultiplier: 3,
    blockMultiplier: 3,
    costOverride: 0,
    bugMeterGain: BUG_METER_GAIN.legendary,
  },
  {
    id: 'kernel_panic',
    rarity: 'legendary',
    label: 'Legendary Bug',
    flavorText: 'KERNEL PANIC — rerouting all damage to enemies.',
    suppressEffectIndices: [1, 2, 3],
    bonusEffects: [
      { type: 'damage', value: 12, target: 'all_enemies' },
      { type: 'draw', value: 2, target: 'none' },
    ],
    bugMeterGain: BUG_METER_GAIN.legendary,
  },
];

const ALL_BUGS: BugModifier[] = [...MINOR_BUGS, ...MAJOR_BUGS, ...LEGENDARY_BUGS];

// ── Bug application ───────────────────────────────────────────────────────────

export function applyBugToCard(card: Card, bug?: BugModifier): Card {
  if (!bug) return card;

  let newEffects = card.effects.map((e, i): CardEffect => {
    if (bug.suppressEffectIndices?.includes(i)) {
      // Suppressed: keep the type but set value to 0 so it's a no-op (or skip)
      return { ...e, value: 0 };
    }
    let val = e.value;
    if (e.type === 'damage' && bug.damageMultiplier) val = Math.ceil(val * bug.damageMultiplier);
    if (e.type === 'block' && bug.blockMultiplier) val = Math.ceil(val * bug.blockMultiplier);
    return { ...e, value: val };
  });

  if (bug.bonusEffects) {
    newEffects = [...newEffects, ...bug.bonusEffects];
  }

  const newCost = bug.costOverride !== undefined ? bug.costOverride : card.cost;

  // Build bugged description
  const bugDesc = buildBugDescription(card, bug);

  return {
    ...card,
    cost: newCost,
    effects: newEffects,
    description: bugDesc,
    bugged: true,
    bugModifier: bug,
  };
}

function buildBugDescription(card: Card, bug: BugModifier): string {
  const parts: string[] = [];

  if (bug.costOverride === 0 && card.cost > 0) parts.push('费用变为 0');
  if (bug.damageMultiplier && bug.damageMultiplier > 1) {
    parts.push(`伤害 ×${bug.damageMultiplier}`);
  }
  if (bug.blockMultiplier && bug.blockMultiplier > 1) {
    parts.push(`格挡 ×${bug.blockMultiplier}`);
  }
  if (bug.repeatTimes) {
    parts.push(`触发 ${bug.repeatTimes + 1} 次`);
  }
  if (bug.suppressEffectIndices?.length) {
    parts.push('负面效果已跳过');
  }
  if (bug.bonusEffects?.length) {
    for (const e of bug.bonusEffects) {
      if (e.type === 'draw') parts.push(`额外抽 ${e.value} 张`);
      if (e.type === 'energy') parts.push(`+${e.value} 能量`);
      if (e.type === 'poison') parts.push(`+${e.value} 中毒`);
      if (e.type === 'damage') parts.push(`额外 ${e.value} 伤害`);
    }
  }

  const bugLabel = `[${bug.label.toUpperCase()}]`;
  const baseDesc = card.description.split('【BUG】')[0].trim();
  return `${baseDesc} 【BUG: ${parts.join(' · ')}】`;
}

// ── Random bug generation ────────────────────────────────────────────────────

export function getRandomBug(targetRarity?: BugRarity): BugModifier {
  const r = targetRarity ?? rollBugRarity();
  const pool = ALL_BUGS.filter(b => b.rarity === r);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rollBugRarity(): BugRarity {
  const roll = Math.random();
  if (roll < 0.6) return 'minor';
  if (roll < 0.9) return 'major';
  return 'legendary';
}

export function makeBuggedCard(baseCard: Card): Card {
  const bug = getRandomBug();
  return applyBugToCard(baseCard, bug);
}

// ── System Crash ─────────────────────────────────────────────────────────────

export const SYSTEM_CRASH_DURATION = 3; // turns

export const SYSTEM_CRASH_MESSAGES = [
  'SYSTEM CRASH — Reality.exe has stopped working.',
  'CRITICAL ERROR: All damage overflow to enemies.',
  'NULL POINTER EXCEPTION — The enemies are confused.',
  'SEGFAULT in enemy AI. Player gains control.',
  'STACK OVERFLOW — Good things keep happening.',
];

export function getSystemCrashMessage(): string {
  return SYSTEM_CRASH_MESSAGES[Math.floor(Math.random() * SYSTEM_CRASH_MESSAGES.length)];
}

export const BUG_MESSAGES = [
  'Bug detected. Benefit retained.',
  'Negative effect skipped.',
  'Enemy expected damage. Player disagreed.',
  'Undefined behavior favors you.',
  'Exception handled in your favor.',
  'Error 404: Downside not found.',
  'Patch rejected. Bug preserved.',
  'Warning: card performing above specification.',
  'This should not be possible. Proceeding anyway.',
  'Memory leak redirected to enemy health pool.',
];

export function getBugPlayMessage(): string {
  return BUG_MESSAGES[Math.floor(Math.random() * BUG_MESSAGES.length)];
}

// ── System Crash activation (called when player clicks the DEBUG button) ──────

export const CRASH_MESSAGES = [
  'OS REINSTALL — Forcing all processes to comply.',
  'KERNEL OVERRIDE — Cost.exe terminated.',
  'SYSTEM REINSTALL: Memory flushed. Hand refilled.',
  'BIOS OVERRIDE — Performance limiters disabled.',
  'CRITICAL PATCH DEPLOYED — All bugs weaponized.',
];

export function getCrashActivationMessage(): string {
  return CRASH_MESSAGES[Math.floor(Math.random() * CRASH_MESSAGES.length)];
}
