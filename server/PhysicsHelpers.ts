import type { BoatState, Vec2, NetProjectile, GatorState } from '../shared/types';
import {
  TILE_SIZE, TileType, BOAT_MAX_SPEED, BOAT_DRIFT_FACTOR,
  NET_RANGE, NET_STUN_DURATION, NET_HIT_RADIUS,
} from '../shared/constants';

export function forwardDir(rotation: number): Vec2 {
  return { x: -Math.sin(rotation), y: -Math.cos(rotation) };
}

export function applyDrift(boat: BoatState, fwd: Vec2): void {
  const speed = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2);
  if (speed <= 0) return;
  const mx = boat.velocity.x / speed;
  const my = boat.velocity.y / speed;
  const dot = mx * fwd.x + my * fwd.y;
  const latX = boat.velocity.x - fwd.x * speed * dot;
  const latY = boat.velocity.y - fwd.y * speed * dot;
  boat.velocity.x = fwd.x * speed * dot + latX * BOAT_DRIFT_FACTOR;
  boat.velocity.y = fwd.y * speed * dot + latY * BOAT_DRIFT_FACTOR;
}

export function clampSpeed(boat: BoatState): void {
  const speed = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2);
  if (speed > BOAT_MAX_SPEED) {
    const scale = BOAT_MAX_SPEED / speed;
    boat.velocity.x *= scale;
    boat.velocity.y *= scale;
  }
}

export function isSolidTile(worldX: number, worldZ: number, tiles: TileType[][]): boolean {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const offsetX = (cols * TILE_SIZE) / 2;
  const offsetZ = (rows * TILE_SIZE) / 2;
  const col = Math.floor((worldX + offsetX) / TILE_SIZE);
  const row = Math.floor((worldZ + offsetZ) / TILE_SIZE);
  if (row < 0 || row >= rows || col < 0 || col >= cols) return true;
  const tile = tiles[row][col];
  return tile === TileType.LAND || tile === TileType.REED_WALL;
}

export function randomWaterPosition(tiles: TileType[][]): Vec2 {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const offsetX = (cols * TILE_SIZE) / 2;
  const offsetZ = (rows * TILE_SIZE) / 2;
  for (let attempt = 0; attempt < 100; attempt++) {
    const col = Math.floor(Math.random() * (cols - 2)) + 1;
    const row = Math.floor(Math.random() * (rows - 2)) + 1;
    if (tiles[row][col] === TileType.WATER || tiles[row][col] === TileType.DOCK) {
      return {
        x: col * TILE_SIZE - offsetX + TILE_SIZE / 2,
        y: row * TILE_SIZE - offsetZ + TILE_SIZE / 2,
      };
    }
  }
  return { x: 0, y: 0 };
}

export function updateNetProjectiles(
  nets: NetProjectile[],
  boats: BoatState[],
  gators: GatorState[],
  dt: number
): void {
  const hitRadiusSq = NET_HIT_RADIUS * NET_HIT_RADIUS;

  for (let i = nets.length - 1; i >= 0; i--) {
    const net = nets[i];
    const step = Math.sqrt(net.velocity.x ** 2 + net.velocity.y ** 2) * dt;
    net.position.x += net.velocity.x * dt;
    net.position.y += net.velocity.y * dt;
    net.distanceTraveled += step;

    if (net.distanceTraveled >= NET_RANGE) {
      nets.splice(i, 1);
      continue;
    }

    let hit = false;

    for (const boat of boats) {
      if (boat.id === net.ownerId) continue;
      const dx = boat.position.x - net.position.x;
      const dy = boat.position.y - net.position.y;
      if (dx * dx + dy * dy < hitRadiusSq) {
        boat.isStunned = true;
        boat.stunTimer = NET_STUN_DURATION;
        hit = true;
        break;
      }
    }

    if (!hit) {
      for (const gator of gators) {
        const dx = gator.position.x - net.position.x;
        const dy = gator.position.y - net.position.y;
        if (dx * dx + dy * dy < hitRadiusSq) {
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          gator.position.x += (dx / dist) * 80;
          gator.position.y += (dy / dist) * 80;
          hit = true;
          break;
        }
      }
    }

    if (hit) nets.splice(i, 1);
  }
}

const GATOR_PATROL_SPEED = 30;

export function updateGatorPatrolPositions(gators: GatorState[], dt: number): void {
  for (const gator of gators) {
    if (gator.patrolPath.length === 0) continue;
    const target = gator.patrolPath[gator.patrolPathIndex];
    const dx = target.x - gator.position.x;
    const dy = target.y - gator.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      gator.patrolPathIndex = (gator.patrolPathIndex + 1) % gator.patrolPath.length;
    } else {
      gator.position.x += (dx / dist) * GATOR_PATROL_SPEED * dt;
      gator.position.y += (dy / dist) * GATOR_PATROL_SPEED * dt;
    }
  }
}
