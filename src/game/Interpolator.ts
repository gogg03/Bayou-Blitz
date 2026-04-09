import type { BoatState } from '../../shared/types';
import { TICK_INTERVAL_MS } from '../../shared/constants';

const MAX_EXTRAPOLATION = 1.5;

interface BoatSnapshot {
  x: number;
  y: number;
  rotation: number;
}

export class Interpolator {
  private previous: Map<string, BoatSnapshot> = new Map();
  private current: Map<string, BoatSnapshot> = new Map();
  private lastUpdateTime = 0;
  private avgTickInterval = TICK_INTERVAL_MS;

  update(boats: BoatState[]): void {
    const now = performance.now();
    if (this.lastUpdateTime > 0) {
      const delta = now - this.lastUpdateTime;
      this.avgTickInterval = this.avgTickInterval * 0.8 + delta * 0.2;
    }

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

    this.lastUpdateTime = now;
  }

  getInterpolated(boatId: string): BoatSnapshot | null {
    const prev = this.previous.get(boatId);
    const curr = this.current.get(boatId);
    if (!prev || !curr) return curr ?? null;

    const elapsed = performance.now() - this.lastUpdateTime;
    const t = Math.min(elapsed / this.avgTickInterval, MAX_EXTRAPOLATION);

    return {
      x: prev.x + (curr.x - prev.x) * t,
      y: prev.y + (curr.y - prev.y) * t,
      rotation: lerpAngle(prev.rotation, curr.rotation, Math.min(t, 1)),
    };
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
