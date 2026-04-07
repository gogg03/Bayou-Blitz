import type { BoatState } from '../../shared/types';
import { TICK_INTERVAL_MS } from '../../shared/constants';

interface BoatSnapshot {
  x: number;
  y: number;
  rotation: number;
}

export class Interpolator {
  private previous: Map<string, BoatSnapshot> = new Map();
  private current: Map<string, BoatSnapshot> = new Map();
  private lastUpdateTime = 0;

  update(boats: BoatState[]): void {
    for (const [id, snap] of this.current) {
      this.previous.set(id, { ...snap });
    }

    for (const boat of boats) {
      this.current.set(boat.id, {
        x: boat.position.x,
        y: boat.position.y,
        rotation: boat.rotation,
      });

      if (!this.previous.has(boat.id)) {
        this.previous.set(boat.id, {
          x: boat.position.x,
          y: boat.position.y,
          rotation: boat.rotation,
        });
      }
    }

    const staleIds: string[] = [];
    for (const id of this.current.keys()) {
      if (!boats.find(b => b.id === id)) staleIds.push(id);
    }
    for (const id of staleIds) {
      this.current.delete(id);
      this.previous.delete(id);
    }

    this.lastUpdateTime = performance.now();
  }

  getInterpolated(boatId: string): BoatSnapshot | null {
    const prev = this.previous.get(boatId);
    const curr = this.current.get(boatId);
    if (!prev || !curr) return curr ?? null;

    const elapsed = performance.now() - this.lastUpdateTime;
    const t = Math.min(elapsed / TICK_INTERVAL_MS, 1);

    return {
      x: prev.x + (curr.x - prev.x) * t,
      y: prev.y + (curr.y - prev.y) * t,
      rotation: lerpAngle(prev.rotation, curr.rotation, t),
    };
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
