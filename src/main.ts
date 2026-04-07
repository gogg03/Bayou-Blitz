import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { generateMap } from './game/MapGenerator';

if (import.meta.env.DEV) {
  console.log('WS_URL:', import.meta.env.VITE_WS_URL);
  console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);

let currentMap = generateMap();
mapRenderer.renderMap(currentMap);
console.log('Map 1 generated');

let mapCount = 1;

(window as unknown as Record<string, unknown>).nextMap = () => {
  mapCount++;
  currentMap = generateMap();
  mapRenderer.renderMap(currentMap);
  console.log(`Map ${mapCount} generated`);
};

function animate(): void {
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
