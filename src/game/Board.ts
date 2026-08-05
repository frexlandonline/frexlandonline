// ═══════════════════════════════════════════════════════════════
//  BlockDrop — Board
//  Pure logic for the 10×20 grid: collision detection,
//  piece locking, and line clearing
// ═══════════════════════════════════════════════════════════════

import { Cell, Shape, ActivePiece, LineClearData, GameConfig } from './types';

/**
 * Manages the game board (grid) state.
 * Contains only pure game logic — no rendering.
 */
export class Board {
  readonly cols: number;
  readonly rows: number;
  private grid: (Cell | null)[][];

  constructor(config: GameConfig) {
    this.cols = config.cols;
    this.rows = config.rows;
    this.grid = this.createEmptyGrid();
  }

  /** Create a fresh empty grid */
  private createEmptyGrid(): (Cell | null)[][] {
    return Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );
  }

  /** Reset the board to empty */
  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  /** Get a readonly snapshot of the grid */
  getGrid(): (Cell | null)[][] {
    return this.grid;
  }

  /**
   * Check if a piece shape is valid at the given board position.
   * Used for collision detection during movement and rotation.
   */
  isValidPosition(shape: Shape, px: number, py: number): boolean {
    for (const [sx, sy] of shape) {
      const x = px + sx;
      const y = py + sy;
      // Out of horizontal bounds
      if (x < 0 || x >= this.cols) return false;
      // Below the floor
      if (y >= this.rows) return false;
      // Occupied cell (only check visible rows, y >= 0)
      if (y >= 0 && this.grid[y][x] !== null) return false;
    }
    return true;
  }

  /**
   * Lock an active piece into the grid.
   * Called when a piece can no longer move down.
   */
  lockPiece(piece: ActivePiece): void {
    for (const [sx, sy] of piece.shape) {
      const x = piece.x + sx;
      const y = piece.y + sy;
      if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        this.grid[y][x] = {
          color: piece.color,
          shadow: piece.shadow,
        };
      }
    }
  }

  /**
   * Scan the board for completed lines, remove them, and
   * return data about what was cleared (for scoring & effects).
   */
  clearLines(): LineClearData {
    const clearedRows: number[] = [];
    const clearedColors: string[][] = [];

    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) {
        clearedRows.push(y);
        clearedColors.push(this.grid[y].map(c => c!.color));
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.cols).fill(null));
        y++; // Re-check this row index since rows shifted down
      }
    }

    return {
      count: clearedRows.length,
      rows: clearedRows,
      colors: clearedColors,
    };
  }

  /**
   * Calculate the ghost Y position (where the piece would land).
   * Used to show a translucent preview of the landing position.
   */
  getGhostY(shape: Shape, px: number, py: number): number {
    let ghostY = py;
    while (this.isValidPosition(shape, px, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  /**
   * Check if the top rows are occupied (used to detect game over
   * condition when a new piece can't be placed).
   */
  isTopBlocked(shape: Shape, px: number, py: number): boolean {
    return !this.isValidPosition(shape, px, py);
  }
}
