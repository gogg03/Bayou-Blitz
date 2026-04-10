import type { InputEvent } from '../../shared/types';
import { ChatBox } from '../ui/ChatBox';

export class InputController {
  private keys: Set<string> = new Set();
  private netFired = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (ChatBox.focused) return;
    this.keys.add(e.key.toLowerCase());

    if (e.key === ' ') {
      this.netFired = true;
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  getInput(playerId: string): InputEvent {
    let throttle = 0;
    let steer = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) throttle = 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) throttle = -1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) steer = -1;
    if (this.keys.has('d') || this.keys.has('arrowright')) steer = 1;

    const fireNet = this.netFired;
    this.netFired = false;

    return { playerId, throttle, steer, fireNet };
  }
}
