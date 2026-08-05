// ═══════════════════════════════════════════════════════════════
//  BlockDrop — ScoreManager
//  Scoring logic, combo tracking, and level progression
// ═══════════════════════════════════════════════════════════════

import { GameConfig, ScoreUpdateData } from './types';
import { LINE_SCORES, SOFT_DROP_POINTS, HARD_DROP_POINTS } from './constants';

/**
 * Handles all scoring calculations, combo multipliers,
 * and level progression.
 */
export class ScoreManager {
  private _score: number = 0;
  private _level: number = 1;
  private _lines: number = 0;
  private _combo: number = 0;
  private linesPerLevel: number;

  constructor(config: GameConfig) {
    this.linesPerLevel = config.linesPerLevel;
    this._level = config.startLevel;
  }

  // ─── Accessors ───────────────────────────────────────────
  get score(): number { return this._score; }
  get level(): number { return this._level; }
  get lines(): number { return this._lines; }
  get combo(): number { return this._combo; }

  /** Get a snapshot of current stats */
  getStats(): ScoreUpdateData {
    return {
      score: this._score,
      level: this._level,
      lines: this._lines,
      combo: this._combo,
    };
  }

  // ─── Reset ───────────────────────────────────────────────
  reset(startLevel: number = 1): void {
    this._score = 0;
    this._level = startLevel;
    this._lines = 0;
    this._combo = 0;
  }

  // ─── Scoring Events ─────────────────────────────────────
  /**
   * Award points for soft-dropping (pressing down).
   * +1 point per cell dropped.
   */
  addSoftDrop(): void {
    this._score += SOFT_DROP_POINTS;
  }

  /**
   * Award points for hard-dropping.
   * +2 points per cell dropped.
   */
  addHardDrop(cellsDropped: number): void {
    this._score += cellsDropped * HARD_DROP_POINTS;
  }

  /**
   * Process line clears and update score, combo, level.
   * Returns true if a level-up occurred.
   */
  addLineClears(count: number): boolean {
    if (count === 0) {
      this._combo = 0;
      return false;
    }

    this._combo++;
    const comboMultiplier = Math.min(this._combo, 5);
    const basePoints = LINE_SCORES[Math.min(count, 4)] ?? LINE_SCORES[4];
    this._score += basePoints * this._level * comboMultiplier;
    this._lines += count;

    // Check for level up
    const newLevel = Math.floor(this._lines / this.linesPerLevel) + 1;
    const leveledUp = newLevel > this._level;
    this._level = newLevel;

    return leveledUp;
  }
}
