// ═══════════════════════════════════════════════════════════════
//  BlockDrop — InputHandler
//  Keyboard and mobile touch input management with DAS/ARR
// ═══════════════════════════════════════════════════════════════

/**
 * Input action callbacks that the engine provides.
 */
export interface InputActions {
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  hardDrop: () => void;
  rotate: () => void;
  hold: () => void;
  togglePause: () => void;
}

/**
 * Handles keyboard and mobile touch controls.
 * Supports DAS (Delayed Auto Shift) for smooth lateral movement.
 */
export class InputHandler {
  private actions: InputActions | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private mobileCleanup: (() => void)[] = [];

  // DAS (Delayed Auto Shift) state
  private dasTimer: number | null = null;
  private dasKey: string | null = null;
  private dasDelay: number = 170;  // ms before auto-repeat starts
  private arrRate: number = 50;    // ms between auto-repeat moves
  private dasInterval: number | null = null;

  /**
   * Bind input handlers to the given action callbacks.
   * Call this when the game starts.
   */
  bind(actions: InputActions): void {
    this.actions = actions;

    // ─── Keyboard ────────────────────────────────────────
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (!this.actions) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.actions.moveLeft();
          this.startDAS('ArrowLeft', this.actions.moveLeft);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.actions.moveRight();
          this.startDAS('ArrowRight', this.actions.moveRight);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.actions.moveDown();
          this.startDAS('ArrowDown', this.actions.moveDown);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.actions.rotate();
          break;
        case ' ':
          e.preventDefault();
          this.actions.hardDrop();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          this.actions.hold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          this.actions.togglePause();
          break;
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      if (e.key === this.dasKey) {
        this.stopDAS();
      }
    };

    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    // ─── Mobile Buttons ──────────────────────────────────
    this.bindMobileButton('mb-left', this.actions.moveLeft);
    this.bindMobileButton('mb-right', this.actions.moveRight);
    this.bindMobileButton('mb-down', this.actions.moveDown);
    this.bindMobileButton('mb-rotate', this.actions.rotate);
    this.bindMobileButton('mb-drop', this.actions.hardDrop);
    this.bindMobileButton('mb-hold', this.actions.hold);
    this.bindMobileButton('mb-pause', this.actions.togglePause);
  }

  /**
   * Remove all input handlers.
   * Call this when the game stops or the view unmounts.
   */
  unbind(): void {
    this.stopDAS();

    if (this.boundKeyDown) {
      document.removeEventListener('keydown', this.boundKeyDown);
      this.boundKeyDown = null;
    }
    if (this.boundKeyUp) {
      document.removeEventListener('keyup', this.boundKeyUp);
      this.boundKeyUp = null;
    }

    // Cleanup mobile listeners
    for (const cleanup of this.mobileCleanup) {
      cleanup();
    }
    this.mobileCleanup = [];
    this.actions = null;
  }

  // ─── DAS (Delayed Auto Shift) ────────────────────────────
  private startDAS(key: string, action: () => void): void {
    if (this.dasKey === key) return; // Already active for this key
    this.stopDAS();
    this.dasKey = key;

    this.dasTimer = window.setTimeout(() => {
      this.dasInterval = window.setInterval(() => {
        action();
      }, this.arrRate);
    }, this.dasDelay);
  }

  private stopDAS(): void {
    this.dasKey = null;
    if (this.dasTimer !== null) {
      clearTimeout(this.dasTimer);
      this.dasTimer = null;
    }
    if (this.dasInterval !== null) {
      clearInterval(this.dasInterval);
      this.dasInterval = null;
    }
  }

  // ─── Mobile Button Binding ───────────────────────────────
  private bindMobileButton(id: string, action: () => void): void {
    const btn = document.getElementById(id);
    if (!btn) return;

    const handler = (e: Event) => {
      e.preventDefault();
      action();
    };

    btn.addEventListener('click', handler);
    this.mobileCleanup.push(() => {
      btn.removeEventListener('click', handler);
    });
  }
}
