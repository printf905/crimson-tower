import { MapNode, NodeType } from '../types/game';

const ROWS = 15;
const COLS = 7;

function pickNodeType(row: number): NodeType {
  if (row === 0) return 'combat';
  if (row === ROWS - 1) return 'boss';
  if (row === ROWS - 2) return 'rest';

  const r = Math.random();
  const isLate = row > ROWS * 0.6;

  if (r < (isLate ? 0.10 : 0.05)) return 'elite';
  if (r < (isLate ? 0.20 : 0.15)) return 'rest';
  if (r < (isLate ? 0.28 : 0.24)) return 'shop';
  if (r < (isLate ? 0.34 : 0.31)) return 'event';
  if (r < (isLate ? 0.38 : 0.35)) return 'treasure';
  return 'combat';
}

export function generateMap(): MapNode[] {
  const nodes: MapNode[] = [];
  const grid: (MapNode | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );

  for (let row = 0; row < ROWS; row++) {
    const count = row === ROWS - 1 ? 1 : Math.floor(Math.random() * 3) + 2;
    const cols = shuffle(Array.from({ length: COLS }, (_, i) => i)).slice(0, count);
    for (const col of cols) {
      const node: MapNode = {
        id: `n_${row}_${col}`,
        type: pickNodeType(row),
        row,
        col,
        connections: [],
        visited: false,
        available: row === 0,
      };
      nodes.push(node);
      grid[row][col] = node;
    }
  }

  // Connect rows
  for (let row = 0; row < ROWS - 1; row++) {
    const cur = nodes.filter(n => n.row === row);
    const next = nodes.filter(n => n.row === row + 1);
    if (next.length === 0) continue;

    for (const node of cur) {
      const candidates = next.filter(n => Math.abs(n.col - node.col) <= 1);
      const target = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : next[Math.floor(Math.random() * next.length)];
      if (!node.connections.includes(target.id)) node.connections.push(target.id);
    }

    // Ensure every next-row node is reachable
    for (const nxt of next) {
      const hasIncoming = cur.some(n => n.connections.includes(nxt.id));
      if (!hasIncoming) {
        const src = cur[Math.floor(Math.random() * cur.length)];
        if (!src.connections.includes(nxt.id)) src.connections.push(nxt.id);
      }
    }
  }

  return nodes;
}

export function advanceMap(nodes: MapNode[], visitedId: string): MapNode[] {
  const visited = nodes.find(n => n.id === visitedId);
  if (!visited) return nodes;
  return nodes.map(n => {
    if (n.id === visitedId) return { ...n, visited: true, available: false };
    if (visited.connections.includes(n.id)) return { ...n, available: true };
    if (visited.row === 0 && n.row === 0) return { ...n, available: false };
    return n;
  });
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
