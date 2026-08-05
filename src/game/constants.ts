// ═══════════════════════════════════════════════════════════════
//  BlockDrop — Constants
//  Game configuration, piece definitions, scoring tables
// ═══════════════════════════════════════════════════════════════

import { PieceType, PieceDefinition, GameConfig } from './types';

// ─── Board Dimensions ────────────────────────────────────────
export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 28;
export const NEXT_CELL_SIZE = 18;

// ─── Default Config ──────────────────────────────────────────
export const DEFAULT_CONFIG: GameConfig = {
  cols: COLS,
  rows: ROWS,
  cellSize: CELL_SIZE,
  nextCellSize: NEXT_CELL_SIZE,
  startLevel: 1,
  linesPerLevel: 5,
};

// ─── Piece Color Palette ─────────────────────────────────────
const PIECE_COLORS: Record<PieceType, { color: string; shadow: string }> = {
  [PieceType.I]: { color: '#00f5ff', shadow: 'rgba(0,245,255,0.4)' },
  [PieceType.O]: { color: '#ffd700', shadow: 'rgba(255,215,0,0.4)' },
  [PieceType.T]: { color: '#8b5cf6', shadow: 'rgba(139,92,246,0.4)' },
  [PieceType.S]: { color: '#00ff88', shadow: 'rgba(0,255,136,0.4)' },
  [PieceType.Z]: { color: '#ff6b35', shadow: 'rgba(255,107,53,0.4)' },
  [PieceType.J]: { color: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
  [PieceType.L]: { color: '#ff00e5', shadow: 'rgba(255,0,229,0.4)' },
};

// ─── Helper: Precalculate all 4 rotations ────────────────────
function generateRotations(baseShape: number[][]): number[][][] {
  const rotations: number[][][] = [baseShape];
  let current = baseShape;
  for (let i = 0; i < 3; i++) {
    const maxX = Math.max(...current.map(p => p[0]));
    const maxY = Math.max(...current.map(p => p[1]));
    const rotated = current.map(([x, y]) => [maxY - y, x]);
    // Normalize to origin
    const minX = Math.min(...rotated.map(p => p[0]));
    const minY = Math.min(...rotated.map(p => p[1]));
    const normalized = rotated.map(([x, y]) => [x - minX, y - minY]);
    rotations.push(normalized);
    current = normalized;
  }
  return rotations;
}

// ─── 7 Classic Tetrominoes with Precalculated Rotations ──────
export const PIECES: PieceDefinition[] = [
  {
    name: PieceType.I,
    ...PIECE_COLORS[PieceType.I],
    rotations: generateRotations([[0,0],[1,0],[2,0],[3,0]]),
  },
  {
    name: PieceType.O,
    ...PIECE_COLORS[PieceType.O],
    rotations: [
      [[0,0],[1,0],[0,1],[1,1]], // O doesn't rotate
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
    ],
  },
  {
    name: PieceType.T,
    ...PIECE_COLORS[PieceType.T],
    rotations: generateRotations([[0,0],[1,0],[2,0],[1,1]]),
  },
  {
    name: PieceType.S,
    ...PIECE_COLORS[PieceType.S],
    rotations: generateRotations([[1,0],[2,0],[0,1],[1,1]]),
  },
  {
    name: PieceType.Z,
    ...PIECE_COLORS[PieceType.Z],
    rotations: generateRotations([[0,0],[1,0],[1,1],[2,1]]),
  },
  {
    name: PieceType.J,
    ...PIECE_COLORS[PieceType.J],
    rotations: generateRotations([[0,0],[0,1],[1,1],[2,1]]),
  },
  {
    name: PieceType.L,
    ...PIECE_COLORS[PieceType.L],
    rotations: generateRotations([[2,0],[0,1],[1,1],[2,1]]),
  },
];

// ─── Scoring Table ───────────────────────────────────────────
// Points awarded per number of lines cleared simultaneously
export const LINE_SCORES: Record<number, number> = {
  1: 100,   // Single
  2: 300,   // Double
  3: 500,   // Triple
  4: 800,   // Tetris
};

// ─── Speed Table ─────────────────────────────────────────────
// Drop interval in ms per level
export function getDropInterval(level: number): number {
  return Math.max(100, 800 - (level - 1) * 60);
}

// ─── Soft/Hard Drop Points ───────────────────────────────────
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;

// ─── Wall Kick Offsets ───────────────────────────────────────
// Basic wall kick attempts: [dx, dy]
export const WALL_KICKS: number[][] = [
  [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1],
];

// I-piece has special wall kick data
export const I_WALL_KICKS: number[][] = [
  [0, 0], [-2, 0], [2, 0], [-1, 0], [1, 0], [0, -1], [0, -2],
];
