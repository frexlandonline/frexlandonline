// ═══════════════════════════════════════════════════════════════
//  BlockDrop — Type Definitions
//  Core types, interfaces and enums for the Tetris engine
// ═══════════════════════════════════════════════════════════════

/** Enum of all game events emitted by the EventBus */
export enum GameEvent {
  GAME_START   = 'game:start',
  GAME_PAUSE   = 'game:pause',
  GAME_RESUME  = 'game:resume',
  GAME_OVER    = 'game:over',
  PIECE_SPAWN  = 'piece:spawn',
  PIECE_MOVE   = 'piece:move',
  PIECE_ROTATE = 'piece:rotate',
  PIECE_LOCK   = 'piece:lock',
  PIECE_HOLD   = 'piece:hold',
  HARD_DROP    = 'piece:hardDrop',
  LINE_CLEAR   = 'line:clear',
  SCORE_UPDATE = 'score:update',
  LEVEL_UP     = 'level:up',
}

/** Standard tetromino piece types */
export enum PieceType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

/** Movement directions */
export enum Direction {
  LEFT  = 'left',
  RIGHT = 'right',
  DOWN  = 'down',
}

/** A 2D coordinate on the board */
export interface Position {
  x: number;
  y: number;
}

/** A single cell stored in the grid (null means empty) */
export interface Cell {
  color: string;
  shadow: string;
}

/** Shape data: array of [x, y] offsets relative to piece origin */
export type Shape = number[][];

/** Definition of a tetromino piece template */
export interface PieceDefinition {
  name: PieceType;
  color: string;
  shadow: string;
  /** All rotation states, precalculated */
  rotations: Shape[];
}

/** An active piece on the board */
export interface ActivePiece {
  type: PieceType;
  color: string;
  shadow: string;
  /** Current rotation state index (0-3) */
  rotationIndex: number;
  /** Current shape (reference to rotations[rotationIndex]) */
  shape: Shape;
  /** Position on the board (top-left origin of piece bounding box) */
  x: number;
  y: number;
}

/** Full snapshot of game state, used by renderer */
export interface GameState {
  grid: (Cell | null)[][];
  activePiece: ActivePiece | null;
  ghostY: number | null;
  nextPiece: PieceDefinition | null;
  holdPiece: PieceDefinition | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
}

/** Configuration for the game engine */
export interface GameConfig {
  cols: number;
  rows: number;
  cellSize: number;
  nextCellSize: number;
  /** Starting level */
  startLevel: number;
  /** Lines per level */
  linesPerLevel: number;
}

/** Data payload for GAME_OVER event */
export interface GameOverData {
  score: number;
  level: number;
  lines: number;
}

/** Data payload for SCORE_UPDATE event */
export interface ScoreUpdateData {
  score: number;
  level: number;
  lines: number;
  combo: number;
}

/** Data payload for LINE_CLEAR event */
export interface LineClearData {
  count: number;
  rows: number[];
  colors: string[][];
}

/** Callback types for legacy compatibility */
export type ScoreUpdateCallback = (score: number, level: number, lines: number, combo: number) => void;
export type GameOverCallback = (score: number, level: number, lines: number) => void;
