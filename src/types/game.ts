// ── Card ──────────────────────────────────────────────────────────────────────

export type CardType = 'attack' | 'skill' | 'power';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'starter';
export type TargetType = 'enemy' | 'self' | 'all_enemies' | 'none';

export type EffectType =
  | 'damage'
  | 'block'
  | 'draw'
  | 'energy'
  | 'strength'
  | 'vulnerable'
  | 'weak'
  | 'poison'
  | 'trojan'              // stack DoT: tick damage = stacks, then stacks-1 each turn
  | 'trojan_double'       // double existing trojan stacks on target
  | 'heal'
  | 'exhaust_random'
  | 'double_block'
  | 'damage_per_block'
  | 'hp_cost'             // lose HP as part of card cost
  | 'burn'                // apply burn status (lose HP at turn start)
  | 'add_curse'           // add a curse card to discard pile
  | 'overclock_mode'      // gain energy, flag self-damage mode this turn
  | 'bsod_strike'         // high damage; doubles if player took self-damage this turn
  | 'discard_all_deal';   // discard full hand: per card discarded +block and +damage

export interface CardEffect {
  type: EffectType;
  value: number;
  target: TargetType;
  times?: number;
}

// ── Bug System ────────────────────────────────────────────────────────────────

export type BugRarity = 'minor' | 'major' | 'legendary';

export interface BugModifier {
  id: string;
  rarity: BugRarity;
  label: string;           // e.g. "Minor Bug"
  flavorText: string;      // e.g. "Negative effect skipped."
  // Which effects to suppress (by index in the card's effects array)
  suppressEffectIndices?: number[];
  // Additional effects to add
  bonusEffects?: CardEffect[];
  // Multiply damage/block values
  damageMultiplier?: number;
  blockMultiplier?: number;
  // Cost override
  costOverride?: number;
  // Repeat entire card effects N extra times
  repeatTimes?: number;
  // Bug meter contribution
  bugMeterGain: number;
}

export interface Card {
  id: string;
  baseId: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;           // -1 = X cost (uses all energy)
  description: string;
  effects: CardEffect[];
  upgraded: boolean;
  exhaust?: boolean;
  ethereal?: boolean;
  // Bug fields
  bugged?: boolean;
  bugModifier?: BugModifier;
}

// ── Status Effects ────────────────────────────────────────────────────────────

export type StatusType =
  | 'strength'
  | 'weak'
  | 'vulnerable'
  | 'poison'
  | 'trojan'          // DoT that ticks down each turn
  | 'burn'
  | 'ritual'
  | 'thorns'
  | 'overclock'       // flag: player dealt self-damage this turn via overclock_mode
  | 'system_crash';   // powerful temp buff from full bug meter

export interface StatusEffect {
  type: StatusType;
  value: number;
}

// ── Enemy ─────────────────────────────────────────────────────────────────────

export type EnemyActionType = 'attack' | 'defend' | 'buff' | 'debuff' | 'attack_debuff';

export interface EnemyAction {
  type: EnemyActionType;
  damage?: number;
  times?: number;
  block?: number;
  status?: StatusType;
  statusValue?: number;
  label: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  statusEffects: StatusEffect[];
  pattern: EnemyAction[];
  patternIndex: number;
}

// ── Relic ─────────────────────────────────────────────────────────────────────

export interface Relic {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

// ── Map ───────────────────────────────────────────────────────────────────────

export type NodeType = 'combat' | 'elite' | 'boss' | 'rest' | 'shop' | 'event' | 'treasure';

export interface MapNode {
  id: string;
  type: NodeType;
  row: number;
  col: number;
  connections: string[];
  visited: boolean;
  available: boolean;
}

// ── Combat State ──────────────────────────────────────────────────────────────

export interface FloatingNumber {
  id: string;
  value: number;
  kind: 'damage' | 'block' | 'heal' | 'poison' | 'burn' | 'bug';
  x: number;
  y: number;
}

export interface CombatState {
  enemies: Enemy[];
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  energy: number;
  maxEnergy: number;
  turn: number;
  isPlayerTurn: boolean;
  combatOver: boolean;
  won: boolean;
  log: string[];
  floatingNumbers: FloatingNumber[];
  firstAttackUsed: boolean;
  // Overclock: tracks whether player took self-damage this turn (for BSOD Strike)
  tookSelfDamageThisTurn: boolean;
  // Bug meter: 0–100
  bugMeter: number;
  // True when meter hit 100 but player hasn't fired the crash yet
  bugMeterReady: boolean;
  // True during the crash turn (zero-cost cards, full draw, damage ×2)
  systemCrashActive: boolean;
  systemCrashTurnsLeft: number;
  lastBugMessage: string | null;
}

// ── Player ────────────────────────────────────────────────────────────────────

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  gold: number;
  deck: Card[];
  relics: Relic[];
  statusEffects: StatusEffect[];
}

// ── Events ────────────────────────────────────────────────────────────────────

export type EventOutcomeType =
  | 'hp'            // positive = heal, negative = lose HP
  | 'max_hp'        // change max HP
  | 'gold'
  | 'add_card'      // add a specific card to deck
  | 'bug_cards'     // bug N random cards in deck
  | 'upgrade_cards' // upgrade N random cards in deck
  | 'remove_starter'// remove one strike/defend from deck
  | 'add_relic'
  | 'start_elite_combat'; // trigger elite fight immediately

export interface EventOutcome {
  type: EventOutcomeType;
  value?: number;       // amount for hp/gold/max_hp; count for bug/upgrade/remove
  cardId?: string;      // for add_card
  relicId?: string;     // for add_relic (specific) — if omitted, random
  chance?: number;      // 0-1, probability for probabilistic branches
  // alt outcome if chance fails
  altOutcome?: Omit<EventOutcome, 'chance' | 'altOutcome'>;
}

export interface EventRequirement {
  type: 'min_hp' | 'has_relic' | 'none';
  value?: number;   // for min_hp
  relicId?: string; // for has_relic
}

export interface EventChoice {
  label: string;
  description: string;
  requirement?: EventRequirement;
  outcomes: EventOutcome[];
  resultText: string; // shown after choosing
}

export interface EventNode {
  id: string;
  name: string;
  description: string;
  iconKey: string; // maps to a Lucide icon name string
  flavorText: string;
  choices: EventChoice[];
}

// ── Reward / Shop ─────────────────────────────────────────────────────────────

export interface CardReward {
  normalCard: Card;
  buggedCard: Card;
  chosen: boolean;
}

export interface ShopItem {
  kind: 'card' | 'relic' | 'remove';
  card?: Card;
  relic?: Relic;
  price: number;
  sold: boolean;
}

// ── Top-level Game State ──────────────────────────────────────────────────────

export type GamePhase =
  | 'title'
  | 'map'
  | 'combat'
  | 'card_reward'
  | 'rest'
  | 'shop'
  | 'event'
  | 'game_over'
  | 'act_transition'
  | 'victory';

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  map: MapNode[];
  currentNodeId: string | null;
  floor: number;
  act: number;
  combat: CombatState | null;
  cardReward: CardReward | null;
  goldReward: number;
  shopItems: ShopItem[];
  activeEvent: EventNode | null;
  eventResult: string | null; // message shown after a choice is made
}
