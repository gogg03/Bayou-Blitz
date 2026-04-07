import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { TileType } from './constants/GameConfig';

if (import.meta.env.DEV) {
  console.log('WS_URL:', import.meta.env.VITE_WS_URL);
  console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);

function createTestMap(): TileType[][] {
  const W = TileType.WATER;
  const L = TileType.LAND;
  const D = TileType.DOCK;
  const R = TileType.REED_WALL;
  const G = TileType.GATOR_ZONE;

  const map: TileType[][] = [];
  for (let row = 0; row < 20; row++) {
    const line: TileType[] = [];
    for (let col = 0; col < 20; col++) {
      if (row === 0 || row === 19 || col === 0 || col === 19) {
        line.push(R);
      } else if (row >= 8 && row <= 11 && col >= 8 && col <= 11) {
        line.push(D);
      } else if (row >= 4 && row <= 6 && col >= 14 && col <= 17) {
        line.push(G);
      } else if (row >= 14 && row <= 16 && col >= 2 && col <= 5) {
        line.push(G);
      } else if (
        (row === 3 && col >= 3 && col <= 7) ||
        (row === 16 && col >= 12 && col <= 16)
      ) {
        line.push(L);
      } else {
        line.push(W);
      }
    }
    map.push(line);
  }
  return map;
}

mapRenderer.renderMap(createTestMap());

function animate(): void {
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
