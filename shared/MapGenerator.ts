import { TileType, MAP_SMALL } from './constants';

export interface MapConfig {
  cols: number;
  rows: number;
  gatorZones: number;
}

export function generateMap(
  config: MapConfig = { ...MAP_SMALL, gatorZones: 3 }
): TileType[][] {
  const { cols, rows, gatorZones } = config;
  const map: TileType[][] = [];

  for (let r = 0; r < rows; r++) {
    map.push(new Array(cols).fill(TileType.LAND));
  }

  carveWaterHighways(map, rows, cols);
  carveTightCorridors(map, rows, cols);
  fillWaterPockets(map, rows, cols);
  placeDocks(map, rows, cols);
  placeReedWalls(map, rows, cols);
  placeGatorZones(map, rows, cols, gatorZones);
  addBorderReeds(map, rows, cols);

  return map;
}

function carveWaterHighways(map: TileType[][], rows: number, cols: number): void {
  carveChannel(map, 0, Math.floor(rows * 0.35) + randomInt(-2, 2), cols - 1, Math.floor(rows * 0.35) + randomInt(-2, 2), 3, rows, cols);
  carveChannel(map, 0, Math.floor(rows * 0.7) + randomInt(-2, 2), cols - 1, Math.floor(rows * 0.7) + randomInt(-2, 2), 3, rows, cols);
  carveChannel(map, Math.floor(cols * 0.35) + randomInt(-2, 2), 0, Math.floor(cols * 0.35) + randomInt(-2, 2), rows - 1, 3, rows, cols);
  carveChannel(map, Math.floor(cols * 0.65) + randomInt(-2, 2), 0, Math.floor(cols * 0.65) + randomInt(-2, 2), rows - 1, 3, rows, cols);
}

function carveTightCorridors(map: TileType[][], rows: number, cols: number): void {
  carveChannel(map, 2, Math.floor(rows * 0.5) + randomInt(-3, 3), cols - 3, Math.floor(rows * 0.5) + randomInt(-3, 3), 1, rows, cols);
  carveChannel(map, Math.floor(cols * 0.5) + randomInt(-3, 3), 2, Math.floor(cols * 0.5) + randomInt(-3, 3), rows - 3, 1, rows, cols);
}

function carveChannel(
  map: TileType[][], x0: number, y0: number, x1: number, y1: number,
  width: number, rows: number, cols: number
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const half = Math.floor(width / 2);
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = Math.round(x0 + (x1 - x0) * t) + randomInt(-1, 1);
    const cy = Math.round(y0 + (y1 - y0) * t) + randomInt(-1, 1);
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 1 && nx < cols - 1 && ny >= 1 && ny < rows - 1) {
          if (map[ny][nx] === TileType.LAND) map[ny][nx] = TileType.WATER;
        }
      }
    }
  }
}

function fillWaterPockets(map: TileType[][], rows: number, cols: number): void {
  const pockets = 6 + randomInt(0, 4);
  for (let i = 0; i < pockets; i++) {
    const cx = randomInt(4, cols - 5);
    const cy = randomInt(4, rows - 5);
    const radius = randomInt(2, 4);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 1 && nx < cols - 1 && ny >= 1 && ny < rows - 1) {
            map[ny][nx] = TileType.WATER;
          }
        }
      }
    }
  }
}

function placeDocks(map: TileType[][], rows: number, cols: number): void {
  const dockCount = 3 + randomInt(0, 3);
  for (let i = 0; i < dockCount; i++) {
    const cx = randomInt(5, cols - 6);
    const cy = randomInt(5, rows - 6);
    const w = randomInt(2, 4);
    const h = randomInt(2, 4);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < cols - 1 && ny < rows - 1) map[ny][nx] = TileType.DOCK;
      }
    }
  }
}

function placeReedWalls(map: TileType[][], rows: number, cols: number): void {
  const clusters = 5 + randomInt(0, 4);
  for (let i = 0; i < clusters; i++) {
    const cx = randomInt(3, cols - 4);
    const cy = randomInt(3, rows - 4);
    const count = randomInt(3, 7);
    for (let j = 0; j < count; j++) {
      const nx = cx + randomInt(-2, 2);
      const ny = cy + randomInt(-2, 2);
      if (nx >= 1 && nx < cols - 1 && ny >= 1 && ny < rows - 1 && map[ny][nx] === TileType.LAND) {
        map[ny][nx] = TileType.REED_WALL;
      }
    }
  }
}

function placeGatorZones(map: TileType[][], rows: number, cols: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const cx = randomInt(6, cols - 7);
    const cy = randomInt(6, rows - 7);
    const radius = randomInt(2, 3);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= radius + 1) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 1 && nx < cols - 1 && ny >= 1 && ny < rows - 1 &&
              (map[ny][nx] === TileType.WATER || map[ny][nx] === TileType.LAND)) {
            map[ny][nx] = TileType.GATOR_ZONE;
          }
        }
      }
    }
  }
}

function addBorderReeds(map: TileType[][], rows: number, cols: number): void {
  for (let r = 0; r < rows; r++) {
    map[r][0] = TileType.REED_WALL;
    map[r][cols - 1] = TileType.REED_WALL;
  }
  for (let c = 0; c < cols; c++) {
    map[0][c] = TileType.REED_WALL;
    map[rows - 1][c] = TileType.REED_WALL;
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
