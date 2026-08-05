// ═══════════════════════════════════════════════════════════════
//  BlockDrop — Renderer
//  Canvas 2D rendering: grid, blocks, ghost piece, particles,
//  next & hold piece previews
// ═══════════════════════════════════════════════════════════════

import { GameState, Cell, GameConfig } from './types';
// @ts-ignore — particles.js is a legacy JS module
import { ParticleSystem } from './particles.js';

/**
 * Handles all visual rendering of the game state onto HTML5 Canvas.
 * Reads from a GameState snapshot — never mutates game logic.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D | null = null;
  readonly particles: ParticleSystem;

  private cellSize: number;
  private nextCellSize: number;
  private cols: number;
  private rows: number;

  constructor(
    private canvas: HTMLCanvasElement,
    private nextCanvas: HTMLCanvasElement,
    holdCanvas: HTMLCanvasElement | null,
    config: GameConfig
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.nextCtx = nextCanvas.getContext('2d')!;
    if (holdCanvas) {
      this.holdCtx = holdCanvas.getContext('2d')!;
    }

    this.cellSize = config.cellSize;
    this.nextCellSize = config.nextCellSize;
    this.cols = config.cols;
    this.rows = config.rows;

    // Set canvas dimensions
    canvas.width = config.cols * config.cellSize;
    canvas.height = config.rows * config.cellSize;
    nextCanvas.width = 4 * config.nextCellSize;
    nextCanvas.height = 4 * config.nextCellSize;
    if (holdCanvas) {
      holdCanvas.width = 4 * config.nextCellSize;
      holdCanvas.height = 4 * config.nextCellSize;
    }

    this.particles = new ParticleSystem(canvas);
  }

  /** Get the main canvas dimensions */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.cols * this.cellSize,
      height: this.rows * this.cellSize,
    };
  }

  // ─── Main Render ─────────────────────────────────────────
  /**
   * Render a complete frame from the current game state.
   */
  render(state: GameState): void {
    this.drawBoard(state);
    this.drawNextPiece(state);
    this.drawHoldPiece(state);
    this.particles.update();
  }

  // ─── Board Drawing ───────────────────────────────────────
  private drawBoard(state: GameState): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cell = this.cellSize;

    // Clear with dark background
    ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, h);
      ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(w, y * cell);
      ctx.stroke();
    }

    // Locked blocks on the grid
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell_data = state.grid[y][x];
        if (cell_data) {
          this.drawBlock(ctx, x * cell, y * cell, cell, cell_data.color, cell_data.shadow, 1.0);
        }
      }
    }

    // Ghost piece (translucent landing preview)
    if (state.activePiece && state.ghostY !== null && !state.isGameOver) {
      for (const [sx, sy] of state.activePiece.shape) {
        const px = (state.activePiece.x + sx) * cell;
        const py = (state.ghostY + sy) * cell;
        this.drawBlock(ctx, px, py, cell, state.activePiece.color, state.activePiece.shadow, 0.07);
      }
    }

    // Active piece
    if (state.activePiece && !state.isGameOver) {
      for (const [sx, sy] of state.activePiece.shape) {
        const px = (state.activePiece.x + sx) * cell;
        const py = (state.activePiece.y + sy) * cell;
        this.drawBlock(ctx, px, py, cell, state.activePiece.color, state.activePiece.shadow, 1.0);
      }
    }

    // Particles on top
    this.particles.draw();

    // Pause Overlay
    if (state.isPaused) {
      ctx.save();
      
      // 1. Capa translúcida sobre todo el canvas
      ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
      ctx.fillRect(0, 0, w, h);

      // 2. Borde del rectángulo que distingue la pausa (Cyberpunk gold pulsing border)
      const time = performance.now() / 1000;
      const pulse = 0.5 + Math.sin(time * 4) * 0.3; // Oscila entre 0.2 y 0.8
      
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + pulse * 0.4})`; // Oro/amarillo pulsante
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10 + pulse * 10;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      // 3. Palabra "PAUSA" en el centro
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15 + pulse * 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Orbitron", "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSA', w / 2, h / 2);
      
      // 4. Mensaje secundario interactivo
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(160, 160, 184, 0.8)';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText('Presiona P para continuar', w / 2, h / 2 + 40);
      
      ctx.restore();
    }
  }

  // ─── Next Piece Preview ──────────────────────────────────
  private drawNextPiece(state: GameState): void {
    const ctx = this.nextCtx;
    const w = this.nextCanvas.width;
    const h = this.nextCanvas.height;
    const cell = this.nextCellSize;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(5, 5, 15, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (!state.nextPiece) return;

    const shape = state.nextPiece.rotations[0];
    const maxX = Math.max(...shape.map(p => p[0])) + 1;
    const maxY = Math.max(...shape.map(p => p[1])) + 1;
    const offX = (w - maxX * cell) / 2;
    const offY = (h - maxY * cell) / 2;

    for (const [sx, sy] of shape) {
      this.drawBlock(ctx, offX + sx * cell, offY + sy * cell, cell, state.nextPiece.color, state.nextPiece.shadow, 1.0);
    }
  }

  // ─── Hold Piece Preview ──────────────────────────────────
  private drawHoldPiece(state: GameState): void {
    if (!this.holdCtx) return;

    const ctx = this.holdCtx;
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const cell = this.nextCellSize;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(5, 5, 15, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (!state.holdPiece) return;

    const shape = state.holdPiece.rotations[0];
    const maxX = Math.max(...shape.map(p => p[0])) + 1;
    const maxY = Math.max(...shape.map(p => p[1])) + 1;
    const offX = (w - maxX * cell) / 2;
    const offY = (h - maxY * cell) / 2;

    const alpha = state.canHold ? 1.0 : 0.35;

    for (const [sx, sy] of shape) {
      this.drawBlock(ctx, offX + sx * cell, offY + sy * cell, cell, state.holdPiece.color, state.holdPiece.shadow, alpha);
    }
  }

  // ─── Block Drawing ───────────────────────────────────────
  /**
   * Draw a single block with neon glow effect.
   */
  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number,
    color: string,
    shadow: string,
    alpha: number
  ): void {
    const pad = 1;
    const s = size - pad * 2;

    ctx.save();
    ctx.shadowColor = shadow || color;
    ctx.shadowBlur = 10;

    // Main block
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85 * alpha;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, s, s, 3);
    ctx.fill();

    // Highlight (top edge shine)
    ctx.globalAlpha = 0.3 * alpha;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + pad + 2, y + pad + 2, s - 4, s / 3);

    // Inner border
    ctx.globalAlpha = 0.5 * alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + pad + 1, y + pad + 1, s - 2, s - 2, 2);
    ctx.stroke();

    ctx.restore();
  }

  // ─── Particle Effects ────────────────────────────────────
  /**
   * Emit particles for a line clear effect.
   */
  emitLineClearParticles(rows: number[], colors: string[][]): void {
    const cell = this.cellSize;
    rows.forEach((row, idx) => {
      const yPx = row * cell + cell / 2;
      const rowColors = colors[idx];
      for (let x = 0; x < this.cols; x++) {
        const color = rowColors[x] || '#00f5ff';
        this.particles.emit(x * cell + cell / 2, yPx, color, 5);
      }
    });
  }
}
