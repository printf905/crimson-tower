import {
  GameState, PlayerState, ShopItem, CardReward,
} from '../types/game';
import { makeStarterDeck, getRewardCard, getRewardCards, cloneCard, upgradeCard } from '../data/cards';
import { getStarterRelic, getRandomRelics } from '../data/relics';
import { generateMap, advanceMap } from './mapGenerator';
import { initCombat } from './combat';
import { getEnemiesForNode } from '../data/enemies';
import { makeBuggedCard } from './bugSystem';
import { getRandomEvent } from '../data/events';

// ── New game ──────────────────────────────────────────────────────────────────

export function createNewGame(): GameState {
  const player: PlayerState = {
    hp: 80,
    maxHp: 80,
    block: 0,
    gold: 99,
    deck: makeStarterDeck(),
    relics: [getStarterRelic()],
    statusEffects: [],
  };

  return {
    phase: 'map',
    player,
    map: generateMap(),
    currentNodeId: null,
    floor: 0,
    act: 1,
    combat: null,
    cardReward: null,
    goldReward: 0,
    shopItems: [],
    activeEvent: null,
    eventResult: null,
  };
}

// ── Enter a map node ──────────────────────────────────────────────────────────

export function enterNode(state: GameState, nodeId: string): GameState {
  const node = state.map.find(n => n.id === nodeId);
  if (!node) return state;

  const newMap = advanceMap(state.map, nodeId);
  const base: GameState = { ...state, map: newMap, currentNodeId: nodeId, floor: state.floor + 1 };

  switch (node.type) {
    case 'combat':
    case 'elite':
    case 'boss':
      return startCombat(base, node.type);
    case 'rest':
      return { ...base, phase: 'rest' };
    case 'shop':
      return openShop(base);
    case 'event':
      return handleEvent(base);
    case 'treasure':
      return handleTreasure(base);
    default:
      return base;
  }
}

function startCombat(state: GameState, nodeType: 'combat' | 'elite' | 'boss'): GameState {
  const enemies = getEnemiesForNode(nodeType, state.floor, state.act);
  const { combat, player } = initCombat(state.player, enemies);
  return { ...state, phase: 'combat', combat, player };
}

// ── Combat victory ────────────────────────────────────────────────────────────

export function resolveCombatVictory(state: GameState): GameState {
  const node = state.map.find(n => n.id === state.currentNodeId);
  const isBoss = node?.type === 'boss';
  const isElite = node?.type === 'elite';

  const goldAmt = isBoss ? 100
    : isElite ? Math.floor(Math.random() * 26) + 25
    : Math.floor(Math.random() * 16) + 10;

  const combatPlayer = state.combat!;
  const hasBurningBlood = state.player.relics.some(r => r.id === 'burning_blood');

  // Carry over HP changes from combat
  let updatedPlayer: PlayerState = {
    ...state.player,
    hp: combatPlayer.enemies.length === 0 ? combatPlayer.hand.length >= 0
      ? state.player.hp  // will be set below via combat state
      : state.player.hp
      : state.player.hp,
    block: 0,
    statusEffects: [],
    gold: state.player.gold + goldAmt,
  };

  // The combat state holds the latest player HP — we need to pick it up from combat.player
  // but combat.ts doesn't store player inside combat. We store player separately in GameState.
  // So player HP is already updated via setGameState calls in CombatScreen.
  updatedPlayer = {
    ...state.player,
    block: 0,
    statusEffects: [],
    gold: state.player.gold + goldAmt,
  };

  if (hasBurningBlood) {
    updatedPlayer = { ...updatedPlayer, hp: Math.min(updatedPlayer.maxHp, updatedPlayer.hp + 6) };
  }

  // Compiler relic: boost one random card
  if (state.player.relics.some(r => r.id === 'compiler')) {
    const deck = [...updatedPlayer.deck];
    if (deck.length > 0) {
      const idx = Math.floor(Math.random() * deck.length);
      deck[idx] = {
        ...deck[idx],
        effects: deck[idx].effects.map(e =>
          e.type === 'damage' ? { ...e, value: e.value + 1 } : e
        ),
      };
      updatedPlayer = { ...updatedPlayer, deck };
    }
  }

  // Card reward: one normal + one bugged version of same pool
  const normalCard = getRewardCard();
  const buggedCard = makeBuggedCard(getRewardCard());

  const cardReward: CardReward = {
    normalCard,
    buggedCard,
    chosen: false,
  };

  if (isBoss) {
    const isLastAct = state.act >= 3;
    if (isLastAct) {
      return {
        ...state,
        phase: 'victory',
        player: updatedPlayer,
        combat: null,
        cardReward,
        goldReward: goldAmt,
      };
    }
    // Advance to next act: new map, preserve player
    const nextAct = state.act + 1;
    return {
      ...state,
      phase: 'act_transition',
      act: nextAct,
      floor: 0,
      map: generateMap(),
      currentNodeId: null,
      player: updatedPlayer,
      combat: null,
      cardReward,
      goldReward: goldAmt,
    };
  }

  return {
    ...state,
    phase: 'card_reward',
    player: updatedPlayer,
    combat: null,
    cardReward,
    goldReward: goldAmt,
  };
}

// ── Card reward ───────────────────────────────────────────────────────────────

export function chooseCardReward(state: GameState, which: 'normal' | 'bugged'): GameState {
  if (!state.cardReward) return state;
  const chosen = which === 'normal' ? state.cardReward.normalCard : state.cardReward.buggedCard;
  return {
    ...state,
    phase: 'map',
    player: {
      ...state.player,
      deck: [...state.player.deck, cloneCard(chosen)],
    },
    cardReward: null,
  };
}

export function skipCardReward(state: GameState): GameState {
  return { ...state, phase: 'map', cardReward: null };
}

// ── Rest site ─────────────────────────────────────────────────────────────────

export function restHeal(state: GameState): GameState {
  const heal = Math.floor(state.player.maxHp * 0.3);
  return {
    ...state,
    phase: 'map',
    player: { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + heal) },
  };
}

export function restUpgradeCard(state: GameState, cardId: string): GameState {
  return {
    ...state,
    phase: 'map',
    player: {
      ...state.player,
      deck: state.player.deck.map(c => c.id === cardId ? upgradeCard(c) : c),
    },
  };
}

// ── Shop ──────────────────────────────────────────────────────────────────────

function openShop(state: GameState): GameState {
  const cards = getRewardCards(4);
  const relics = getRandomRelics(1, state.player.relics.map(r => r.id));

  const items: ShopItem[] = [
    ...cards.map(c => ({
      kind: 'card' as const,
      card: c,
      price: c.rarity === 'rare' ? 150 : c.rarity === 'uncommon' ? 75 : 45,
      sold: false,
    })),
    ...relics.map(r => ({
      kind: 'relic' as const,
      relic: r,
      price: 250,
      sold: false,
    })),
    { kind: 'remove' as const, price: 75, sold: false },
  ];

  return { ...state, phase: 'shop', shopItems: items };
}

export function shopBuy(state: GameState, index: number): GameState {
  const item = state.shopItems[index];
  if (!item || item.sold || state.player.gold < item.price) return state;

  let player = { ...state.player, gold: state.player.gold - item.price };

  if (item.kind === 'card' && item.card) {
    player = { ...player, deck: [...player.deck, cloneCard(item.card)] };
  } else if (item.kind === 'relic' && item.relic) {
    player = { ...player, relics: [...player.relics, item.relic] };
  }

  return {
    ...state,
    player,
    shopItems: state.shopItems.map((it, i) => i === index ? { ...it, sold: true } : it),
  };
}

export function shopRemoveCard(state: GameState, cardId: string): GameState {
  const removeIdx = state.shopItems.findIndex(i => i.kind === 'remove');
  if (removeIdx === -1) return state;
  const item = state.shopItems[removeIdx];
  if (item.sold || state.player.gold < item.price) return state;

  return {
    ...state,
    player: {
      ...state.player,
      gold: state.player.gold - item.price,
      deck: state.player.deck.filter(c => c.id !== cardId),
    },
    shopItems: state.shopItems.map((it, i) => i === removeIdx ? { ...it, sold: true } : it),
  };
}

export function leaveShop(state: GameState): GameState {
  return { ...state, phase: 'map', shopItems: [] };
}

// ── Event / Treasure ──────────────────────────────────────────────────────────

function handleEvent(state: GameState): GameState {
  const event = getRandomEvent();
  return {
    ...state,
    phase: 'event',
    activeEvent: event,
    eventResult: null,
  };
}

function handleTreasure(state: GameState): GameState {
  const goldAmt = Math.floor(Math.random() * 30) + 25;
  const normalCard = getRewardCard();
  const buggedCard = makeBuggedCard(getRewardCard());
  return {
    ...state,
    phase: 'card_reward',
    player: { ...state.player, gold: state.player.gold + goldAmt },
    cardReward: { normalCard, buggedCard, chosen: false },
    goldReward: goldAmt,
  };
}
