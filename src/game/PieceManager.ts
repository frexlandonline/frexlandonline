// ═══════════════════════════════════════════════════════════════
//  BlockDrop — PieceManager
//  Piece spawning (7-bag randomizer), rotation with wall kicks,
//  and hold piece logic
// ═══════════════════════════════════════════════════════════════

import { PieceType, PieceDefinition, ActivePiece, Shape, GameConfig } from './types';
import { PIECES, WALL_KICKS, I_WALL_KICKS } from './constants';
import { Board } from './Board';

/**
 * Manages piece spawning, rotation, and the hold system.
 * Uses a 7-bag randomizer for fair piece distribution.
 */
export class PieceManager {
  private bag: PieceDefinition[] = [];
  private _nextPiece: PieceDefinition | null = null;
  private _holdPiece: PieceDefinition | null = null;
  private _canHold: boolean = true;
  private cols: number;

  constructor(config: GameConfig) {
    this.cols = config.cols;
  }

  // ─── Accessors ───────────────────────────────────────────
  get nextPiece(): PieceDefinition | null {
    return this._nextPiece;
  }

  get holdPiece(): PieceDefinition | null {
    return this._holdPiece;
  }

  get canHold(): boolean {
    return this._canHold;
  }

  // ─── Initialization ──────────────────────────────────────
  reset(): void {
    this.bag = [];
    this._nextPiece = null;
    this._holdPiece = null;
    this._canHold = true;
    // Fill bag and prepare next piece
    this._nextPiece = this.drawFromBag();
  }

  // ─── 7-Bag Randomizer ────────────────────────────────────
  /**
   * The 7-bag system ensures each of the 7 piece types appears
   * exactly once per bag before reshuffling, providing fair distribution.
   */
  private refillBag(): void {
    // Copy all 7 pieces
    const newBag = [...PIECES];
    // Fisher-Yates shuffle
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }
    this.bag = newBag;
  }

  private drawFromBag(): PieceDefinition {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }

  // ─── Spawning ────────────────────────────────────────────
  /**
   * Spawn a new active piece at the top center of the board.
   * Returns the ActivePiece, or null if the next piece is not ready.
   */
  spawnPiece(): ActivePiece {
    const definition = this._nextPiece!;
    this._nextPiece = this.drawFromBag();
    this._canHold = true;

    const shape = definition.rotations[0];
    const pieceWidth = Math.max(...shape.map(p => p[0])) + 1;

    return {
      type: definition.name,
      color: definition.color,
      shadow: definition.shadow,
      rotationIndex: 0,
      shape: shape.map(p => [...p]),
      x: Math.floor((this.cols - pieceWidth) / 2),
      y: 0,
    };
  }

  // ─── Rotation ────────────────────────────────────────────
  /**
   * Attempt to rotate the active piece clockwise with wall kicks.
   * Returns the new shape and x offset if rotation succeeds, null otherwise.
   */
  tryRotate(
    piece: ActivePiece,
    board: Board
  ): { shape: Shape; rotationIndex: number; xOffset: number; yOffset: number } | null {
    // Find the piece definition
    const definition = PIECES.find(p => p.name === piece.type);
    if (!definition) return null;

    // Calculate new rotation index
    const newRotIndex = (piece.rotationIndex + 1) % 4;
    const newShape = definition.rotations[newRotIndex].map(p => [...p]);

    // Select appropriate wall kick table
    const kicks = piece.type === PieceType.I ? I_WALL_KICKS : WALL_KICKS;

    // Try each wall kick offset
    for (const [dx, dy] of kicks) {
      if (board.isValidPosition(newShape, piece.x + dx, piece.y + dy)) {
        return {
          shape: newShape,
          rotationIndex: newRotIndex,
          xOffset: dx,
          yOffset: dy,
        };
      }
    }

    return null; // Rotation failed
  }

  // ─── Hold ────────────────────────────────────────────────
  /**
   * Attempt to hold the current piece and swap with held piece.
   * Returns the new active piece to spawn, or null if hold not allowed.
   */
  tryHold(currentPiece: ActivePiece): ActivePiece | null {
    if (!this._canHold) return null;

    // Find the definition for the current piece
    const currentDef = PIECES.find(p => p.name === currentPiece.type);
    if (!currentDef) return null;

    this._canHold = false;

    if (this._holdPiece) {
      // Swap with held piece
      const heldDef = this._holdPiece;
      this._holdPiece = currentDef;

      const shape = heldDef.rotations[0];
      const pieceWidth = Math.max(...shape.map(p => p[0])) + 1;

      return {
        type: heldDef.name,
        color: heldDef.color,
        shadow: heldDef.shadow,
        rotationIndex: 0,
        shape: shape.map(p => [...p]),
        x: Math.floor((this.cols - pieceWidth) / 2),
        y: 0,
      };
    } else {
      // No held piece yet — hold current and spawn next
      this._holdPiece = currentDef;
      return this.spawnPiece();
    }
  }
}
