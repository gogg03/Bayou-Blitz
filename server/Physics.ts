import type { BoatState, TrapState, GatorState, InputEvent } from '../shared/types';
import {
  TileType,
  BOAT_ACCELERATION, BOAT_REVERSE_ACCELERATION, BOAT_DRAG, BOAT_TURN_SPEED,
  BOAT_COLLISION_RADIUS, BOAT_COLLISION_BOUNCE,
  TRAP_COLLECT_RADIUS, TRAP_RESPAWN_DELAY,
  GATOR_CONTACT_RADIUS, GATOR_KNOCKBACK_FORCE, GATOR_STUN_DURATION,
  NET_STUN_DURATION,
} from '../shared/constants';
import { forwardDir, applyDrift, clampSpeed, isSolidTile, randomWaterPosition } from './PhysicsHelpers';

export function updateBoatPhysics(
  boat: BoatState,
  input: InputEvent,
  dt: number,
  tiles: TileType[][]
): void {
  if (boat.isStunned) {
    boat.stunTimer -= dt;
    if (boat.stunTimer <= 0) {
      boat.isStunned = false;
      boat.stunTimer = 0;
    }
  }

  if (boat.netCooldown > 0) {
    boat.netCooldown -= dt;
    if (boat.netCooldown < 0) boat.netCooldown = 0;
  }

  const speed = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2);
  const turnFactor = Math.min(speed / 50, 1);

  if (!boat.isStunned) {
    boat.rotation -= input.steer * BOAT_TURN_SPEED * turnFactor * dt;
  }

  const fwd = forwardDir(boat.rotation);

  if (!boat.isStunned) {
    if (input.throttle > 0) {
      boat.velocity.x += fwd.x * BOAT_ACCELERATION * dt;
      boat.velocity.y += fwd.y * BOAT_ACCELERATION * dt;
    } else if (input.throttle < 0) {
      boat.velocity.x -= fwd.x * BOAT_REVERSE_ACCELERATION * dt;
      boat.velocity.y -= fwd.y * BOAT_REVERSE_ACCELERATION * dt;
    }
  }

  applyDrift(boat, fwd);
  boat.velocity.x *= BOAT_DRAG;
  boat.velocity.y *= BOAT_DRAG;
  clampSpeed(boat);

  const nextX = boat.position.x + boat.velocity.x * dt;
  const nextY = boat.position.y + boat.velocity.y * dt;

  if (!isSolidTile(nextX, boat.position.y, tiles)) {
    boat.position.x = nextX;
  } else {
    boat.velocity.x *= -0.3;
  }

  if (!isSolidTile(boat.position.x, nextY, tiles)) {
    boat.position.y = nextY;
  } else {
    boat.velocity.y *= -0.3;
  }
}

export function resolveBoatCollisions(boats: BoatState[]): void {
  for (let i = 0; i < boats.length; i++) {
    for (let j = i + 1; j < boats.length; j++) {
      const a = boats[i];
      const b = boats[j];
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = BOAT_COLLISION_RADIUS * 2;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.position.x -= nx * overlap * 0.5;
        a.position.y -= ny * overlap * 0.5;
        b.position.x += nx * overlap * 0.5;
        b.position.y += ny * overlap * 0.5;

        const relVx = a.velocity.x - b.velocity.x;
        const relVy = a.velocity.y - b.velocity.y;
        const relDot = relVx * nx + relVy * ny;

        if (relDot > 0) {
          const impulse = relDot * BOAT_COLLISION_BOUNCE;
          a.velocity.x -= impulse * nx;
          a.velocity.y -= impulse * ny;
          b.velocity.x += impulse * nx;
          b.velocity.y += impulse * ny;
        }
      }
    }
  }
}

export function checkTrapCollection(boats: BoatState[], traps: TrapState[]): void {
  for (const boat of boats) {
    for (const trap of traps) {
      if (!trap.isActive) continue;
      const dx = boat.position.x - trap.position.x;
      const dy = boat.position.y - trap.position.y;
      if (dx * dx + dy * dy < TRAP_COLLECT_RADIUS * TRAP_COLLECT_RADIUS) {
        trap.isActive = false;
        trap.respawnTimer = TRAP_RESPAWN_DELAY;
        boat.score++;
      }
    }
  }
}

export function updateTrapTimers(traps: TrapState[], dt: number, tiles: TileType[][]): void {
  for (const trap of traps) {
    if (trap.isActive) continue;
    trap.respawnTimer -= dt;
    if (trap.respawnTimer <= 0) {
      trap.isActive = true;
      trap.position = randomWaterPosition(tiles);
    }
  }
}

export function checkGatorContact(boats: BoatState[], gators: GatorState[]): void {
  for (const boat of boats) {
    if (boat.isStunned) continue;
    for (const gator of gators) {
      const dx = boat.position.x - gator.position.x;
      const dy = boat.position.y - gator.position.y;
      if (dx * dx + dy * dy < GATOR_CONTACT_RADIUS * GATOR_CONTACT_RADIUS) {
        boat.isStunned = true;
        boat.stunTimer = GATOR_STUN_DURATION;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        boat.velocity.x += (dx / dist) * GATOR_KNOCKBACK_FORCE;
        boat.velocity.y += (dy / dist) * GATOR_KNOCKBACK_FORCE;
      }
    }
  }
}

export function applyNetStun(target: BoatState): void {
  target.isStunned = true;
  target.stunTimer = NET_STUN_DURATION;
}

export { randomWaterPosition } from './PhysicsHelpers';
