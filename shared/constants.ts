export const TILE_SIZE = 32;

export const MAP_SMALL = { cols: 40, rows: 40 };
export const MAP_MEDIUM = { cols: 60, rows: 60 };
export const MAP_LARGE = { cols: 80, rows: 80 };

export const ROUND_DURATION = 180;
export const RESPAWN_DELAY = 3;
export const TRAP_RESPAWN_DELAY = 10;
export const NET_COOLDOWN = 3;
export const NET_STUN_DURATION = 2;
export const GATOR_STUN_DURATION = 1;
export const NET_RANGE = 250;
export const NET_SPEED = 180;
export const NET_HIT_RADIUS = 25;
export const TRAP_COLLECT_RADIUS = 32;
export const GATOR_CONTACT_RADIUS = 35;
export const GATOR_KNOCKBACK_FORCE = 150;

export const SERVER_TICK_RATE = 20;
export const TICK_INTERVAL_MS = 1000 / SERVER_TICK_RATE;

export const RESULTS_DISPLAY_TIME = 10;

export const BOAT_ACCELERATION = 300;
export const BOAT_REVERSE_ACCELERATION = 150;
export const BOAT_DRAG = 0.97;
export const BOAT_TURN_SPEED = 3.0;
export const BOAT_MAX_SPEED = 200;
export const BOAT_DRIFT_FACTOR = 0.92;
export const BOAT_COLLISION_RADIUS = 16;
export const BOAT_COLLISION_BOUNCE = 0.8;

export enum TileType {
  WATER = 0,
  LAND = 1,
  DOCK = 2,
  REED_WALL = 3,
  GATOR_ZONE = 4,
}

export const TILE_COLORS: Record<TileType, number> = {
  [TileType.WATER]: 0x1a5276,
  [TileType.LAND]: 0x2d5a27,
  [TileType.DOCK]: 0x8b6914,
  [TileType.REED_WALL]: 0x556b2f,
  [TileType.GATOR_ZONE]: 0x0d3320,
};
