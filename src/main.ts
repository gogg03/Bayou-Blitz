import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { BoatRenderer } from './rendering/BoatRenderer';
import { InputController } from './input/InputController';
import { generateMap } from './game/MapGenerator';
import { createLocalBoat, updateLocalBoat } from './game/LocalPhysics';

if (import.meta.env.DEV) {
  console.log('WS_URL:', import.meta.env.VITE_WS_URL);
  console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);
const boatRenderer = new BoatRenderer(sceneManager.scene);
const inputController = new InputController();

let currentMap = generateMap();
mapRenderer.renderMap(currentMap);

const localBoat = createLocalBoat(0, 0);

boatRenderer.createBoat('local', 0xcc4422);
boatRenderer.updateBoat('local', 0, 0, 0);
sceneManager.setFollowTarget(0, 0);

const devWindow = window as unknown as Record<string, unknown>;

devWindow.nextMap = () => {
  currentMap = generateMap();
  mapRenderer.renderMap(currentMap);
  localBoat.x = 0;
  localBoat.z = 0;
  localBoat.vx = 0;
  localBoat.vz = 0;
};

let lastTime = performance.now();

function animate(): void {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const input = inputController.getInput('local');
  updateLocalBoat(localBoat, input, dt, currentMap);

  boatRenderer.updateBoat('local', localBoat.x, localBoat.z, localBoat.rotation);
  sceneManager.setFollowTarget(localBoat.x, localBoat.z);
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
