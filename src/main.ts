import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { BoatRenderer } from './rendering/BoatRenderer';
import { generateMap } from './game/MapGenerator';

if (import.meta.env.DEV) {
  console.log('WS_URL:', import.meta.env.VITE_WS_URL);
  console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);
const boatRenderer = new BoatRenderer(sceneManager.scene);

let currentMap = generateMap();
mapRenderer.renderMap(currentMap);

boatRenderer.createBoat('local', 0xcc4422);
boatRenderer.updateBoat('local', 0, 0, 0);
sceneManager.setFollowTarget(0, 0);

const devWindow = window as unknown as Record<string, unknown>;

devWindow.nextMap = () => {
  currentMap = generateMap();
  mapRenderer.renderMap(currentMap);
};

devWindow.moveCamera = (x: number, z: number) => {
  sceneManager.setFollowTarget(x, z);
};

devWindow.moveBoat = (x: number, z: number, rot: number = 0) => {
  boatRenderer.updateBoat('local', x, z, rot);
  sceneManager.setFollowTarget(x, z);
};

function animate(): void {
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
