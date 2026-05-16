import { Card, CardEffect } from '../types/game';

let _uid = 0;
export function freshId(baseId: string): string {
  return `${baseId}_${++_uid}_${Math.random().toString(36).slice(2, 6)}`;
}

function card(
  baseId: string,
  name: string,
  type: Card['type'],
  rarity: Card['rarity'],
  cost: number,
  description: string,
  effects: CardEffect[],
  opts: { exhaust?: boolean; ethereal?: boolean } = {}
): Card {
  return {
    id: freshId(baseId),
    baseId,
    name,
    type,
    rarity,
    cost,
    description,
    effects,
    upgraded: false,
    bugged: false,
    ...opts,
  };
}

// ── Starter Deck ──────────────────────────────────────────────────────────────

export function makeStrike(): Card {
  return card('strike', '打击', 'attack', 'starter', 1,
    '造成 6 点伤害',
    [{ type: 'damage', value: 6, target: 'enemy' }]
  );
}

export function makeDefend(): Card {
  return card('defend', '防御', 'skill', 'starter', 1,
    '获得 5 点格挡',
    [{ type: 'block', value: 5, target: 'self' }]
  );
}

export function makeBash(): Card {
  return card('bash', '猛击', 'attack', 'starter', 2,
    '造成 8 点伤害，施加 2 层易伤',
    [
      { type: 'damage', value: 8, target: 'enemy' },
      { type: 'vulnerable', value: 2, target: 'enemy' },
    ]
  );
}

export function makeStarterDeck(): Card[] {
  return [
    makeStrike(), makeStrike(), makeStrike(), makeStrike(), makeStrike(),
    makeDefend(), makeDefend(), makeDefend(), makeDefend(),
    makeBash(),
  ];
}

// ── Card Pool ─────────────────────────────────────────────────────────────────
// Bug Spire themed cards — some have intentional "bad" effects that bugged version skips

export const CARD_TEMPLATES: Omit<Card, 'id'>[] = [
  // ── Common Attacks ────────────────────────────────────────────────────────
  {
    baseId: 'twin_strike', name: '双重打击', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '造成 2×5 点伤害',
    effects: [{ type: 'damage', value: 5, target: 'enemy', times: 2 }],
  },
  {
    baseId: 'iron_wave', name: '铁浪', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '获得 5 点格挡，造成 5 点伤害',
    effects: [
      { type: 'block', value: 5, target: 'self' },
      { type: 'damage', value: 5, target: 'enemy' },
    ],
  },
  {
    baseId: 'pommel_strike', name: '剑柄击', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '造成 9 点伤害，抽取 1 张牌',
    effects: [
      { type: 'damage', value: 9, target: 'enemy' },
      { type: 'draw', value: 1, target: 'none' },
    ],
  },
  {
    baseId: 'cleave', name: '劈砍', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '对所有敌人造成 8 点伤害',
    effects: [{ type: 'damage', value: 8, target: 'all_enemies' }],
  },
  {
    baseId: 'body_slam', name: '猛烈撞击', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '造成等于你当前格挡值的伤害',
    effects: [{ type: 'damage_per_block', value: 0, target: 'enemy' }],
  },
  // Sacrifice: normally lose 4 HP to gain 3 strength — bugged version skips HP loss
  {
    baseId: 'sacrifice', name: '献祭', type: 'attack', rarity: 'common', cost: 1, upgraded: false,
    description: '失去 4 点生命，造成 12 点伤害',
    effects: [
      { type: 'hp_cost', value: 4, target: 'self' },
      { type: 'damage', value: 12, target: 'enemy' },
    ],
  },
  // ── Common Skills ─────────────────────────────────────────────────────────
  {
    baseId: 'shrug_it_off', name: '满不在乎', type: 'skill', rarity: 'common', cost: 1, upgraded: false,
    description: '获得 8 点格挡，抽取 1 张牌',
    effects: [
      { type: 'block', value: 8, target: 'self' },
      { type: 'draw', value: 1, target: 'none' },
    ],
  },
  {
    baseId: 'true_grit', name: '真正的勇气', type: 'skill', rarity: 'common', cost: 1, upgraded: false,
    description: '获得 7 点格挡，消耗手牌中的一张随机牌',
    effects: [
      { type: 'block', value: 7, target: 'self' },
      { type: 'exhaust_random', value: 1, target: 'none' },
    ],
  },
  {
    baseId: 'flex', name: '弯曲', type: 'skill', rarity: 'common', cost: 0, upgraded: false,
    description: '获得 2 点力量（本回合）',
    effects: [{ type: 'strength', value: 2, target: 'self' }],
  },
  // Risky Draw: draw 3 but add a Curse to discard — bugged version skips the curse
  {
    baseId: 'risky_draw', name: '险中求胜', type: 'skill', rarity: 'common', cost: 1, upgraded: false,
    description: '抽取 3 张牌，将一张诅咒牌加入弃牌堆',
    effects: [
      { type: 'draw', value: 3, target: 'none' },
      { type: 'add_curse', value: 1, target: 'none' },
    ],
  },
  // ── Uncommon Attacks ──────────────────────────────────────────────────────
  {
    baseId: 'sword_boomerang', name: '飞剑', type: 'attack', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '随机对敌人造成 3×3 点伤害',
    effects: [{ type: 'damage', value: 3, target: 'enemy', times: 3 }],
  },
  {
    baseId: 'carnage', name: '大屠杀', type: 'attack', rarity: 'uncommon', cost: 2, upgraded: false,
    description: '造成 20 点伤害（消耗）',
    effects: [{ type: 'damage', value: 20, target: 'enemy' }],
    exhaust: true,
  },
  {
    baseId: 'pummel', name: '连击', type: 'attack', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '造成 4×2 点伤害（消耗）',
    effects: [{ type: 'damage', value: 2, target: 'enemy', times: 4 }],
    exhaust: true,
  },
  {
    baseId: 'whirlwind', name: '旋风斩', type: 'attack', rarity: 'uncommon', cost: -1, upgraded: false,
    description: '消耗所有能量，每点能量对所有敌人造成 5 点伤害',
    effects: [{ type: 'damage', value: 5, target: 'all_enemies' }],
  },
  {
    baseId: 'poison_stab', name: '毒刃', type: 'attack', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '造成 6 点伤害，施加 3 层中毒',
    effects: [
      { type: 'damage', value: 6, target: 'enemy' },
      { type: 'poison', value: 3, target: 'enemy' },
    ],
  },
  // ── Uncommon Skills ───────────────────────────────────────────────────────
  {
    baseId: 'battle_trance', name: '战斗恍惚', type: 'skill', rarity: 'uncommon', cost: 0, upgraded: false,
    description: '抽取 3 张牌（消耗）',
    effects: [{ type: 'draw', value: 3, target: 'none' }],
    exhaust: true,
  },
  // Overclock: gain 2 energy but apply Burn — bugged version skips the burn
  {
    baseId: 'overclock', name: '超频', type: 'skill', rarity: 'uncommon', cost: 0, upgraded: false,
    description: '获得 2 点能量，受到 5 点灼烧伤害',
    effects: [
      { type: 'energy', value: 2, target: 'self' },
      { type: 'burn', value: 5, target: 'self' },
    ],
  },
  {
    baseId: 'entrench', name: '加固', type: 'skill', rarity: 'uncommon', cost: 2, upgraded: false,
    description: '将你的格挡值翻倍',
    effects: [{ type: 'double_block', value: 0, target: 'self' }],
  },
  {
    baseId: 'disarm', name: '解除武装', type: 'skill', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '目标失去 2 点力量（消耗）',
    effects: [{ type: 'strength', value: -2, target: 'enemy' }],
    exhaust: true,
  },
  // ── Powers ────────────────────────────────────────────────────────────────
  // Power Surge: gain 3 strength, lose 6 HP — bugged version skips HP loss
  {
    baseId: 'power_surge', name: '能量涌动', type: 'power', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '获得 3 点力量，失去 6 点生命',
    effects: [
      { type: 'strength', value: 3, target: 'self' },
      { type: 'hp_cost', value: 6, target: 'self' },
    ],
  },
  {
    baseId: 'inflame', name: '激怒', type: 'power', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '获得 2 点力量',
    effects: [{ type: 'strength', value: 2, target: 'self' }],
  },
  {
    baseId: 'demon_form', name: '恶魔形态', type: 'power', rarity: 'rare', cost: 3, upgraded: false,
    description: '每回合开始获得 2 点力量',
    effects: [{ type: 'strength', value: 2, target: 'self' }],
  },
  // ── Trojan / Poison archetype ─────────────────────────────────────────────
  {
    baseId: 'trojan_inject', name: '植入木马', type: 'attack', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '造成 5 点伤害，施加 4 层木马',
    effects: [
      { type: 'damage', value: 5, target: 'enemy' },
      { type: 'trojan', value: 4, target: 'enemy' },
    ],
  },
  {
    baseId: 'background_dl', name: '后台下载', type: 'skill', rarity: 'uncommon', cost: 2, upgraded: false,
    description: '施加 8 层木马。若目标已有木马，层数翻倍',
    effects: [
      { type: 'trojan', value: 8, target: 'enemy' },
      { type: 'trojan_double', value: 0, target: 'enemy' },
    ],
  },
  // ── Overclock / Self-Damage archetype ──────────────────────────────────────
  {
    baseId: 'extreme_overclock', name: '极限超频', type: 'skill', rarity: 'uncommon', cost: 0, upgraded: false,
    description: '获得 2 点能量，本回合出每张牌对自己造成 1 点真实伤害',
    effects: [
      { type: 'overclock_mode', value: 2, target: 'self' },
    ],
    exhaust: true,
  },
  {
    baseId: 'bsod_strike', name: '蓝屏打击', type: 'attack', rarity: 'rare', cost: 2, upgraded: false,
    description: '造成 24 点伤害。若本回合自身受过伤害，伤害翻倍',
    effects: [
      { type: 'bsod_strike', value: 24, target: 'enemy' },
    ],
  },
  // ── Stack Overflow / Overdraw archetype ────────────────────────────────────
  {
    baseId: 'infinite_recursion', name: '无限递归', type: 'skill', rarity: 'common', cost: 1, upgraded: false,
    description: '抽 2 张牌。若手牌已满，对随机敌人造成 8 点伤害',
    effects: [
      { type: 'draw', value: 2, target: 'none' },
    ],
  },
  {
    baseId: 'garbage_collect', name: '垃圾回收', type: 'skill', rarity: 'uncommon', cost: 1, upgraded: false,
    description: '丢弃所有手牌，每丢弃一张获得 3 点格挡并造成 3 点伤害',
    effects: [
      { type: 'discard_all_deal', value: 3, target: 'enemy' },
    ],
  },
  // ── Rare ─────────────────────────────────────────────────────────────────
  {
    baseId: 'reaper', name: '死神', type: 'attack', rarity: 'rare', cost: 2, upgraded: false,
    description: '对所有敌人造成 4 点伤害，回复等量 HP（消耗）',
    effects: [
      { type: 'damage', value: 4, target: 'all_enemies' },
      { type: 'heal', value: 4, target: 'self' },
    ],
    exhaust: true,
  },
  {
    baseId: 'feed', name: '吞噬', type: 'attack', rarity: 'rare', cost: 1, upgraded: false,
    description: '造成 10 点伤害（消耗）',
    effects: [{ type: 'damage', value: 10, target: 'enemy' }],
    exhaust: true,
  },
  // Curse card template (added to deck as penalty)
  {
    baseId: 'curse_glitch', name: '故障', type: 'skill', rarity: 'starter', cost: 1, upgraded: false,
    description: '无效果。系统杂音。',
    effects: [],
    ethereal: false,
  },
];

export function cloneCard(template: Omit<Card, 'id'>): Card {
  return {
    ...template,
    id: freshId(template.baseId),
    effects: template.effects.map(e => ({ ...e })),
  };
}

export function makeStarterDeckCards(): Card[] {
  return makeStarterDeck();
}

export function getRewardCard(): Card {
  const pool = CARD_TEMPLATES.filter(c => c.rarity !== 'starter');
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return cloneCard(pick);
}

export function getRewardCards(count = 3): Card[] {
  const pool = [...CARD_TEMPLATES.filter(c => c.rarity !== 'starter')]
    .sort(() => Math.random() - 0.5);
  return pool.slice(0, count).map(cloneCard);
}

export function makeCurseCard(): Card {
  const template = CARD_TEMPLATES.find(c => c.baseId === 'curse_glitch')!;
  return cloneCard(template);
}

export function upgradeCard(c: Card): Card {
  if (c.upgraded) return c;
  return {
    ...c,
    upgraded: true,
    name: c.name + '+',
    effects: c.effects.map(e => ({
      ...e,
      value: e.value > 0 ? Math.ceil(e.value * 1.5) : e.value,
    })),
    description: c.description
      .replace(/(\d+)/g, (n) => Number(n) > 0 ? String(Math.ceil(Number(n) * 1.5)) : n)
      + ' ✦',
  };
}
