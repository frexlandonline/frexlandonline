// ═══════════════════════════════════════════════════════════════
//  BlockDrop — TetrisEngine
//  Main orchestrator: ties together Board, PieceManager,
//  ScoreManager, Renderer, InputHandler, and EventBus
// ═══════════════════════════════════════════════════════════════

import { GameEvent, GameState, ActivePiece, ScoreUpdateCallback, GameOverCallback } from './types';
import { DEFAULT_CONFIG, getDropInterval, CELL_SIZE } from './constants';
import { EventBus } from './EventBus';
import { Board } from './Board';
import { PieceManager } from './PieceManager';
import { ScoreManager } from './ScoreManager';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';

/**
 * TetrisEngine — The main game controller.
 * 
 * Orchestrates all game subsystems and exposes a clean public API.
 * External systems can hook into the EventBus for integration
 * (e.g., submitting scores to blockchain on GAME_OVER).
 * 
 * @example
 * ```ts
 * const engine = new TetrisEngine(canvas, nextCanvas);
 * 
 * // Legacy callbacks (backward compatible with existing UI)
 * engine.onScoreUpdate = (score, level, lines, combo) => { ... };
 * engine.onGameOver = (score, level, lines) => { ... };
 * 
 * // Modern event system (for blockchain integration)
 * engine.eventBus.on(GameEvent.GAME_OVER, (data) => {
 *   await submitToBlockchain(data.score);
 * });
 * 
 * engine.start();
 * ```
 */
export class TetrisEngine {
  // ─── Public Event System ─────────────────────────────────
  public readonly eventBus: EventBus;

  // ─── Legacy Callbacks (backward compat with home.js) ─────
  public onScoreUpdate: ScoreUpdateCallback | null = null;
  public onGameOver: GameOverCallback | null = null;

  // ─── Subsystems ──────────────────────────────────────────
  private board: Board;
  private pieceManager: PieceManager;
  private scoreManager: ScoreManager;
  private renderer: Renderer;
  private inputHandler: InputHandler;

  // ─── Game State ──────────────────────────────────────────
  private activePiece: ActivePiece | null = null;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private isRunning: boolean = false;
  private dropTimer: number = 0;
  private lastTime: number = 0;
  private animFrame: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement | null = null
  ) {
    const config = { ...DEFAULT_CONFIG };

    this.eventBus = new EventBus();
    this.board = new Board(config);
    this.pieceManager = new PieceManager(config);
    this.scoreManager = new ScoreManager(config);
    this.renderer = new Renderer(canvas, nextCanvas, holdCanvas, config);
    this.inputHandler = new InputHandler();
  }

  // ─── Public API ──────────────────────────────────────────

  /** Check if the engine is currently running */
  get running(): boolean {
    return this.isRunning;
  }

  /** Check if the game is paused */
  get paused(): boolean {
    return this.isPaused;
  }

  /** Check if the game is over */
  get gameOver(): boolean {
    return this.isGameOver;
  }

  /** Get the canvas size */
  getCanvasSize(): { width: number; height: number } {
    return this.renderer.getCanvasSize();
  }

  /**
   * Start a new game.
   * Resets all state and begins the game loop.
   */
  start(): void {
    // Reset all subsystems
    this.board.reset();
    this.pieceManager.reset();
    this.scoreManager.reset();

    // Reset local state
    this.isGameOver = false;
    this.isPaused = false;
    this.isRunning = true;
    this.dropTimer = 0;
    this.lastTime = performance.now();

    // Spawn first piece
    this.activePiece = this.pieceManager.spawnPiece();

    // Bind input
    this.inputHandler.bind({
      moveLeft:    () => this.moveLeft(),
      moveRight:   () => this.moveRight(),
      moveDown:    () => this.moveDown(),
      hardDrop:    () => this.hardDrop(),
      rotate:      () => this.rotate(),
      hold:        () => this.hold(),
      togglePause: () => this.togglePause(),
    });

    // Emit start event
    this.eventBus.emit(GameEvent.GAME_START);
    this.emitScoreUpdate();

    // Start game loop
    this.loop();
  }

  /**
   * Stop the game and unbind all controls.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.inputHandler.unbind();
  }

  /**
   * Toggle pause state.
   * @returns Current pause state after toggle
   */
  togglePause(): boolean {
    if (this.isGameOver) return false;
    this.isPaused = !this.isPaused;
    this.eventBus.emit(
      this.isPaused ? GameEvent.GAME_PAUSE : GameEvent.GAME_RESUME
    );
    return this.isPaused;
  }

  // ─── Movement Controls ───────────────────────────────────
  moveLeft(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver) return;
    if (this.board.isValidPosition(this.activePiece.shape, this.activePiece.x - 1, this.activePiece.y)) {
      this.activePiece.x--;
      this.eventBus.emit(GameEvent.PIECE_MOVE, { direction: 'left' });
    }
  }

  moveRight(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver) return;
    if (this.board.isValidPosition(this.activePiece.shape, this.activePiece.x + 1, this.activePiece.y)) {
      this.activePiece.x++;
      this.eventBus.emit(GameEvent.PIECE_MOVE, { direction: 'right' });
    }
  }

  moveDown(): boolean {
    if (!this.activePiece || this.isPaused || this.isGameOver) return false;
    if (this.board.isValidPosition(this.activePiece.shape, this.activePiece.x, this.activePiece.y + 1)) {
      this.activePiece.y++;
      this.scoreManager.addSoftDrop();
      this.emitScoreUpdate();
      return true;
    }
    this.lockAndSpawn();
    return false;
  }

  hardDrop(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver) return;
    let drop = 0;
    while (this.board.isValidPosition(this.activePiece.shape, this.activePiece.x, this.activePiece.y + 1)) {
      this.activePiece.y++;
      drop++;
    }
    this.scoreManager.addHardDrop(drop);
    this.eventBus.emit(GameEvent.HARD_DROP, { cells: drop });
    this.lockAndSpawn();
  }

  rotate(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver) return;
    const result = this.pieceManager.tryRotate(this.activePiece, this.board);
    if (result) {
      this.activePiece.shape = result.shape;
      this.activePiece.rotationIndex = result.rotationIndex;
      this.activePiece.x += result.xOffset;
      this.activePiece.y += result.yOffset;
      this.eventBus.emit(GameEvent.PIECE_ROTATE);
    }
  }

  hold(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver) return;
    const newPiece = this.pieceManager.tryHold(this.activePiece);
    if (newPiece) {
      this.activePiece = newPiece;
      // Check if new piece can be placed
      if (this.board.isTopBlocked(this.activePiece.shape, this.activePiece.x, this.activePiece.y)) {
        this.triggerGameOver();
      }
      this.eventBus.emit(GameEvent.PIECE_HOLD);
    }
  }

  // ─── Internal Logic ──────────────────────────────────────
  private lockAndSpawn(): void {
    if (!this.activePiece) return;

    // Lock piece to board
    this.board.lockPiece(this.activePiece);
    this.eventBus.emit(GameEvent.PIECE_LOCK, { type: this.activePiece.type });

    // Clear lines
    const clearResult = this.board.clearLines();
    if (clearResult.count > 0) {
      const leveledUp = this.scoreManager.addLineClears(clearResult.count);
      this.renderer.emitLineClearParticles(clearResult.rows, clearResult.colors);
      this.eventBus.emit(GameEvent.LINE_CLEAR, clearResult);
      if (leveledUp) {
        this.eventBus.emit(GameEvent.LEVEL_UP, { level: this.scoreManager.level });
      }
    } else {
      this.scoreManager.addLineClears(0); // Reset combo
    }

    this.emitScoreUpdate();

    // Spawn next piece
    this.activePiece = this.pieceManager.spawnPiece();
    this.eventBus.emit(GameEvent.PIECE_SPAWN, { type: this.activePiece.type });

    // Check game over
    if (this.board.isTopBlocked(this.activePiece.shape, this.activePiece.x, this.activePiece.y)) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.isRunning = false;
    this.inputHandler.unbind();

    const data = {
      score: this.scoreManager.score,
      level: this.scoreManager.level,
      lines: this.scoreManager.lines,
    };

    // Emit typed event (for blockchain/analytics hooks)
    this.eventBus.emit(GameEvent.GAME_OVER, data);

    // Legacy callback (for existing UI in home.js)
    if (this.onGameOver) {
      this.onGameOver(data.score, data.level, data.lines);
    }
  }

  private emitScoreUpdate(): void {
    const stats = this.scoreManager.getStats();

    // Emit typed event
    this.eventBus.emit(GameEvent.SCORE_UPDATE, stats);

    // Legacy callback
    if (this.onScoreUpdate) {
      this.onScoreUpdate(stats.score, stats.level, stats.lines, stats.combo);
    }
  }

  // ─── Game Loop ───────────────────────────────────────────
  private loop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Gravity: automatic piece drop
    if (!this.isPaused && !this.isGameOver) {
      this.dropTimer += dt;
      const interval = getDropInterval(this.scoreManager.level);
      if (this.dropTimer >= interval) {
        this.dropTimer = 0;
        // Auto-drop without scoring
        if (this.activePiece && this.board.isValidPosition(
          this.activePiece.shape, this.activePiece.x, this.activePiece.y + 1
        )) {
          this.activePiece.y++;
        } else {
          this.lockAndSpawn();
        }
      }
    }

    // Render
    this.renderer.render(this.buildState());

    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  /** Build a snapshot of the current game state for the renderer */
  private buildState(): GameState {
    const ghostY = this.activePiece
      ? this.board.getGhostY(this.activePiece.shape, this.activePiece.x, this.activePiece.y)
      : null;

    return {
      grid: this.board.getGrid(),
      activePiece: this.activePiece,
      ghostY,
      nextPiece: this.pieceManager.nextPiece,
      holdPiece: this.pieceManager.holdPiece,
      canHold: this.pieceManager.canHold,
      score: this.scoreManager.score,
      level: this.scoreManager.level,
      lines: this.scoreManager.lines,
      combo: this.scoreManager.combo,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
    };
  }
}

export default TetrisEngine;
