import { EventNode, EventChoice, GameState, Card, Relic } from '../types/game';
import { ALL_RELICS, getRandomRelics } from './relics';
import { freshId } from './cards';
import { makeBuggedCard } from '../engine/bugSystem';
import { getEnemiesForNode } from './enemies';
import { initCombat } from '../engine/combat';

// ── Event definitions ─────────────────────────────────────────────────────────

export const ALL_EVENTS: EventNode[] = [
  {
    id: 'secret_patch',
    name: '神秘补丁',
    description:
      '一个未签名的补丁包出现在你的系统目录中。它的来源不明，但其中包含某种强力的代码重构逻辑。安装它有风险，但也许……值得？',
    iconKey: 'FileCode',
    flavorText: '// WARNING: unverified signature. Install at own risk.',
    choices: [
      {
        label: '接受补丁',
        description: '失去 15 HP，随机将牌组中 2 张牌升级为 Bugged 版本',
        requirement: { type: 'min_hp', value: 16 },
        outcomes: [
          { type: 'hp', value: -15 },
          { type: 'bug_cards', value: 2 },
        ],
        resultText: '补丁已安装。系统检测到 2 处代码异常……但它们看起来比原版更强大。',
      },
      {
        label: '拒绝补丁',
        description: '获得 50 金币，但牌组中加入【内存泄漏】诅咒卡',
        outcomes: [
          { type: 'gold', value: 50 },
          { type: 'add_card', cardId: 'memory_leak' },
        ],
        resultText: '你拒绝了补丁并出售了它的分析报告。但内存泄漏已经悄悄发生……',
      },
    ],
  },
  {
    id: 'stack_overflow',
    name: '溢出的栈',
    description:
      '你的调用栈已经满溢。一层又一层的递归调用压在彼此之上，整个系统摇摇欲坠。你必须做出选择。',
    iconKey: 'Layers',
    flavorText: '// RangeError: Maximum call stack size exceeded',
    choices: [
      {
        label: '清理调用栈',
        description: '从牌组中删除一张基础牌（打击或防御）',
        outcomes: [
          { type: 'remove_starter', value: 1 },
        ],
        resultText: '栈已清理。你的牌组更精简了。',
      },
      {
        label: '任其溢出',
        description: '获得遗物【无尽循环】，但最大 HP 减少 8 点',
        outcomes: [
          { type: 'add_relic', relicId: 'infinite_loop' },
          { type: 'max_hp', value: -8 },
        ],
        resultText: '系统在混乱中找到了一种奇异的稳定……你感觉自己变得更脆弱，却也更高效。',
      },
    ],
  },
  {
    id: 'sanctuary_404',
    name: '404 避难所',
    description:
      '你发现了一处不存在于任何系统记录中的隐藏目录。里面可能藏有珍贵的系统资源，也可能是一个精心布置的蜜罐陷阱。',
    iconKey: 'FolderSearch',
    flavorText: '// path not found, yet the door is open.',
    choices: [
      {
        label: '搜寻数据',
        description: '50% 概率获得稀有遗物，50% 概率触发精英战斗',
        outcomes: [
          {
            type: 'add_relic',
            chance: 0.5,
            altOutcome: { type: 'start_elite_combat' },
          },
        ],
        resultText: '', // set dynamically
      },
      {
        label: '安全退出',
        description: '回复 20% 已损失的生命值',
        outcomes: [
          { type: 'hp', value: -1 }, // sentinel; resolved dynamically in applyEventChoice
        ],
        resultText: '你安全地退出了隐藏目录，顺手修复了一些受损的系统数据。',
      },
    ],
  },
];

// ── Curse card factory ────────────────────────────────────────────────────────

export function makeMemoryLeakCard(): Card {
  return {
    id: freshId('memory_leak'),
    baseId: 'memory_leak',
    name: '内存泄漏',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    description: '每回合结束时失去 1 HP。无法升级。',
    effects: [{ type: 'burn', value: 1, target: 'self' }],
    upgraded: false,
    bugged: false,
    exhaust: false,
    ethereal: false,
  };
}

// Event relic not in general pool
export const INFINITE_LOOP_RELIC: Relic = {
  id: 'infinite_loop',
  name: '无尽循环',
  description: '每回合开始时获得 1 点力量，但最大 HP 减少 8 点（已在获得时结算）。',
  emoji: '🔁',
};

// ── Apply a choice to GameState ───────────────────────────────────────────────

export function applyEventChoice(
  state: GameState,
  choiceIndex: number,
): GameState {
  const event = state.activeEvent;
  if (!event) return state;

  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  let gs = { ...state };

  let resultText = choice.resultText;

  for (const outcome of choice.outcomes) {
    // Probability branch
    if (outcome.chance !== undefined) {
      const rolled = Math.random() < outcome.chance;
      const effective = rolled ? { ...outcome } : outcome.altOutcome ? { ...outcome.altOutcome } : null;
      if (!effective) continue;

      if (rolled) {
        resultText = '你找到了一件珍贵的遗物！系统没有察觉你的入侵。';
        gs = applyOutcome(gs, effective as typeof outcome);
      } else {
        resultText = '蜜罐触发！一名精英守卫正在赶来……';
        gs = applyOutcome(gs, effective as typeof outcome);
      }
      continue;
    }

    // 404 sanctuary safe exit: heal 20% lost HP
    if (event.id === 'sanctuary_404' && choiceIndex === 1 && outcome.type === 'hp') {
      const lost = gs.player.maxHp - gs.player.hp;
      const heal = Math.max(1, Math.floor(lost * 0.2));
      gs = { ...gs, player: { ...gs.player, hp: Math.min(gs.player.maxHp, gs.player.hp + heal) } };
      continue;
    }

    gs = applyOutcome(gs, outcome);
  }

  // If outcome triggered elite combat, phase is already set by applyOutcome
  if (gs.phase === 'combat') {
    return { ...gs, activeEvent: null, eventResult: null };
  }

  return {
    ...gs,
    phase: 'event',
    eventResult: resultText,
  };
}

function applyOutcome(gs: GameState, outcome: { type: string; value?: number; cardId?: string; relicId?: string }): GameState {
  switch (outcome.type) {
    case 'hp': {
      const v = outcome.value ?? 0;
      const newHp = Math.max(1, Math.min(gs.player.maxHp, gs.player.hp + v));
      return { ...gs, player: { ...gs.player, hp: newHp } };
    }
    case 'max_hp': {
      const v = outcome.value ?? 0;
      const newMax = Math.max(10, gs.player.maxHp + v);
      const newHp = Math.min(gs.player.hp, newMax);
      return { ...gs, player: { ...gs.player, maxHp: newMax, hp: newHp } };
    }
    case 'gold': {
      return { ...gs, player: { ...gs.player, gold: gs.player.gold + (outcome.value ?? 0) } };
    }
    case 'add_card': {
      const newCard = outcome.cardId === 'memory_leak' ? makeMemoryLeakCard() : null;
      if (!newCard) return gs;
      return { ...gs, player: { ...gs.player, deck: [...gs.player.deck, newCard] } };
    }
    case 'bug_cards': {
      const count = outcome.value ?? 1;
      let deck = [...gs.player.deck];
      const eligible = deck
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !c.bugged)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
      for (const { i } of eligible) {
        deck[i] = makeBuggedCard(deck[i]);
      }
      return { ...gs, player: { ...gs.player, deck } };
    }
    case 'upgrade_cards': {
      // Not used in current events but wired up for extensibility
      return gs;
    }
    case 'remove_starter': {
      const idx = gs.player.deck.findIndex(c => c.baseId === 'strike' || c.baseId === 'defend');
      if (idx === -1) return gs;
      const deck = gs.player.deck.filter((_, i) => i !== idx);
      return { ...gs, player: { ...gs.player, deck } };
    }
    case 'add_relic': {
      const relic = outcome.relicId === 'infinite_loop'
        ? INFINITE_LOOP_RELIC
        : (() => {
            const existing = gs.player.relics.map(r => r.id);
            const pool = ALL_RELICS.filter(r => !existing.includes(r.id));
            return pool.length > 0
              ? pool[Math.floor(Math.random() * pool.length)]
              : null;
          })();
      if (!relic) return gs;
      // Avoid duplicates
      if (gs.player.relics.some(r => r.id === relic.id)) return gs;
      return { ...gs, player: { ...gs.player, relics: [...gs.player.relics, relic] } };
    }
    case 'start_elite_combat': {
      const enemies = getEnemiesForNode('elite', gs.floor, gs.act);
      const { combat, player } = initCombat(gs.player, enemies);
      return { ...gs, phase: 'combat', combat, player };
    }
    default:
      return gs;
  }
}

export function getRandomEvent(): EventNode {
  return ALL_EVENTS[Math.floor(Math.random() * ALL_EVENTS.length)];
}
