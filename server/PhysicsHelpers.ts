import type { BoatState, Vec2 } from '../shared/types';
import { TILE_SIZE, TileType, BOAT_MAX_SPEED, BOAT_DRIFT_FACTOR } from '../shared/constants';

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
