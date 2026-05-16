import { Relic } from '../types/game';

export const ALL_RELICS: Relic[] = [
  {
    id: 'burning_blood',
    name: '燃烧芯片',
    description: '战斗结束时回复 6 点 HP',
    emoji: '🔥',
  },
  {
    id: 'akabeko',
    name: '超频模块',
    description: '每场战斗首次攻击额外造成 8 点伤害',
    emoji: '⚡',
  },
  {
    id: 'anchor',
    name: '防火墙',
    description: '战斗开始时获得 10 点格挡',
    emoji: '🛡️',
  },
  {
    id: 'bag_of_prep',
    name: '预载缓冲',
    description: '首回合额外抽 2 张牌',
    emoji: '📦',
  },
  {
    id: 'vajra',
    name: '电压升压器',
    description: '战斗开始时获得 1 点力量',
    emoji: '⚡',
  },
  {
    id: 'orichalcum',
    name: '纳米装甲',
    description: '若你在回合结束时没有格挡，获得 6 点格挡',
    emoji: '🤖',
  },
  {
    id: 'bronze_scales',
    name: '刺针协议',
    description: '受到攻击时反弹 3 点伤害',
    emoji: '🦔',
  },
  {
    id: 'lizard_tail',
    name: '备份副本',
    description: '致命伤害时，保留 1 点 HP（一次性）',
    emoji: '💾',
  },
  {
    id: 'bug_scanner',
    name: '漏洞扫描仪',
    description: '每次打出漏洞牌时，额外获得 1 点格挡',
    emoji: '🔍',
  },
  {
    id: 'compiler',
    name: '优化编译器',
    description: '每场战斗结束时，牌组中一张随机牌永久+1伤害',
    emoji: '💻',
  },
  // ── Archetype relics ──────────────────────────────────────────────────────
  {
    id: 'rusty_usb',
    name: '生锈的U盘',
    description: '战斗开始时，对所有敌人施加 3 层木马',
    emoji: '🗝️',
  },
  {
    id: 'liquid_nitrogen',
    name: '液氮散热器',
    description: '当你因自己卡牌效果受到伤害时，获得 2 点格挡',
    emoji: '🧊',
  },
  {
    id: 'dual_memory',
    name: '双倍内存条',
    description: '最大手牌上限从 10 提升至 12；每回合开始额外抽 1 张牌',
    emoji: '🔲',
  },
];

export function getStarterRelic(): Relic {
  return ALL_RELICS.find(r => r.id === 'burning_blood')!;
}

export function getRandomRelics(count: number, exclude: string[]): Relic[] {
  const pool = ALL_RELICS.filter(r => !exclude.includes(r.id));
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}
