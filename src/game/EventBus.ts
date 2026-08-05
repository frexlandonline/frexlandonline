// ═══════════════════════════════════════════════════════════════
//  BlockDrop — EventBus
//  Typed event system for decoupled communication between
//  game modules and external integrations (e.g., blockchain)
// ═══════════════════════════════════════════════════════════════

import { GameEvent } from './types';

type EventCallback = (...args: any[]) => void;

/**
 * A lightweight, typed event bus for the game engine.
 * 
 * External systems (blockchain, analytics, UI) can subscribe
 * to game events without coupling to engine internals.
 * 
 * @example
 * ```ts
 * const bus = new EventBus();
 * bus.on(GameEvent.GAME_OVER, (data) => {
 *   console.log('Game over! Score:', data.score);
 *   // Submit score to blockchain
 * });
 * ```
 */
export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to a game event.
   * @param event - The event to listen for
   * @param callback - Function to call when event fires
   * @returns Unsubscribe function
   */
  on(event: GameEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function for convenience
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to a game event for a single invocation.
   * @param event - The event to listen for
   * @param callback - Function to call when event fires (once)
   */
  once(event: GameEvent, callback: EventCallback): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from a game event.
   * @param event - The event to stop listening to
   * @param callback - The specific callback to remove
   */
  off(event: GameEvent, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit a game event with optional data.
   * @param event - The event to emit
   * @param args - Data payload for the event
   */
  emit(event: GameEvent, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const callback of set) {
        try {
          callback(...args);
        } catch (err) {
          console.error(`[EventBus] Error in ${event} handler:`, err);
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events.
   */
  clear(event?: GameEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Check if there are any listeners for a given event.
   */
  hasListeners(event: GameEvent): boolean {
    return (this.listeners.get(event)?.size ?? 0) > 0;
  }
}
