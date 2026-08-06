import * as Matter from 'matter-js';

/**
 * LinearGravity
 * Wraps and manages the existing Matter.js built-in gravity system.
 * This guarantees perfect compatibility with all existing labs, ramps, collisions,
 * and Newton's Second Law systems while allowing toggle and runtime vector changes.
 */
export class LinearGravity {
  private readonly engine: Matter.Engine;
  private isEnabled: boolean = true;
  private gravityX: number = 0;
  private gravityY: number = 1;

  constructor(engine: Matter.Engine) {
    this.engine = engine;
    // Capture the initial gravity from engine, if set
    this.gravityX = this.engine.gravity.x;
    this.gravityY = this.engine.gravity.y;
  }

  /**
   * Enable built-in linear gravity.
   */
  enable(): void {
    this.isEnabled = true;
    this.applyToEngine();
  }

  /**
   * Disable built-in linear gravity (sets scale to 0 so the gravity vector direction is preserved).
   */
  disable(): void {
    this.isEnabled = false;
    this.engine.gravity.scale = 0;
  }

  /**
   * Configure gravity vector components.
   */
  setGravity(x: number, y: number): void {
    this.gravityX = x;
    this.gravityY = y;
    if (this.isEnabled) {
      this.applyToEngine();
    }
  }

  /**
   * Check and synchronize gravity settings with Matter.js engine.
   */
  update(): void {
    if (this.isEnabled) {
      this.applyToEngine();
    } else {
      this.engine.gravity.scale = 0;
    }
  }

  /**
   * Helper to retrieve current vector.
   */
  getGravity(): { x: number; y: number } {
    return { x: this.gravityX, y: this.gravityY };
  }

  /**
   * Check if linear gravity is active.
   */
  isCurrentlyEnabled(): boolean {
    return this.isEnabled;
  }

  private applyToEngine(): void {
    this.engine.gravity.x = this.gravityX;
    this.engine.gravity.y = this.gravityY;
    this.engine.gravity.scale = 0.001; // standard Matter.js gravity scale
  }
}
