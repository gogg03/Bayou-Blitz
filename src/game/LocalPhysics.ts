import type { InputEvent, Vec2 } from '../../shared/types';
import { TileType, TILE_SIZE } from '../constants/GameConfig';
import {
  BOAT_ACCELERATION,
  BOAT_REVERSE_ACCELERATION,
  BOAT_DRAG,
  BOAT_TURN_SPEED,
  BOAT_MAX_SPEED,
  BOAT_DRIFT_FACTOR,
} from '../constants/BoatConfig';

export interface LocalBoatState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  rotation: number;
}

export function createLocalBoat(x: number, z: number): LocalBoatState {
  return { x, z, vx: 0, vz: 0, rotation: 0 };
}

export function updateLocalBoat(
  boat: LocalBoatState,
  input: InputEvent,
  dt: number,
  tiles: TileType[][]
): void {
  const speed = Math.sqrt(boat.vx * boat.vx + boat.vz * boat.vz);

  const turnFactor = Math.min(speed / 50, 1);
  boat.rotation += input.steer * BOAT_TURN_SPEED * turnFactor * dt;

  const forwardX = -Math.sin(boat.rotation);
  const forwardZ = -Math.cos(boat.rotation);

  if (input.throttle > 0) {
    boat.vx += forwardX * BOAT_ACCELERATION * dt;
    boat.vz += forwardZ * BOAT_ACCELERATION * dt;
  } else if (input.throttle < 0) {
    boat.vx -= forwardX * BOAT_REVERSE_ACCELERATION * dt;
    boat.vz -= forwardZ * BOAT_REVERSE_ACCELERATION * dt;
  }

  const currentSpeed = Math.sqrt(boat.vx * boat.vx + boat.vz * boat.vz);
  if (currentSpeed > 0) {
    const moveX = boat.vx / currentSpeed;
    const moveZ = boat.vz / currentSpeed;

    const dot = moveX * forwardX + moveZ * forwardZ;
    const lateralX = boat.vx - forwardX * currentSpeed * dot;
    const lateralZ = boat.vz - forwardZ * currentSpeed * dot;

    boat.vx = forwardX * currentSpeed * dot + lateralX * BOAT_DRIFT_FACTOR;
    boat.vz = forwardZ * currentSpeed * dot + lateralZ * BOAT_DRIFT_FACTOR;
  }

  boat.vx *= BOAT_DRAG;
  boat.vz *= BOAT_DRAG;

  const clampedSpeed = Math.sqrt(boat.vx * boat.vx + boat.vz * boat.vz);
  if (clampedSpeed > BOAT_MAX_SPEED) {
    const scale = BOAT_MAX_SPEED / clampedSpeed;
    boat.vx *= scale;
    boat.vz *= scale;
  }

  const nextX = boat.x + boat.vx * dt;
  const nextZ = boat.z + boat.vz * dt;

  if (!isSolidTile(nextX, boat.z, tiles)) {
    boat.x = nextX;
  } else {
    boat.vx *= -0.3;
  }

  if (!isSolidTile(boat.x, nextZ, tiles)) {
    boat.z = nextZ;
  } else {
    boat.vz *= -0.3;
  }
}

function isSolidTile(worldX: number, worldZ: number, tiles: TileType[][]): boolean {
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
