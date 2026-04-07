export const TILE_SIZE = 32;

export const MAP_SMALL = { cols: 40, rows: 40 };
export const MAP_MEDIUM = { cols: 60, rows: 60 };
export const MAP_LARGE = { cols: 80, rows: 80 };

export const ROUND_DURATION = 180;
export const RESPAWN_DELAY = 3;
export const TRAP_RESPAWN_DELAY = 10;
export const NET_COOLDOWN = 5;
export const NET_STUN_DURATION = 2;
export const GATOR_STUN_DURATION = 1;

export const SERVER_TICK_RATE = 20;
export const TICK_INTERVAL_MS = 1000 / SERVER_TICK_RATE;

export const RESULTS_DISPLAY_TIME = 10;

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
