import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { BoatRenderer } from './rendering/BoatRenderer';
import { InputController } from './input/InputController';
import { NetworkClient } from './network/NetworkClient';
import { GameState } from './game/GameState';
import { Interpolator } from './game/Interpolator';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);
const boatRenderer = new BoatRenderer(sceneManager.scene);
const inputController = new InputController();
const gameState = new GameState();
const interpolator = new Interpolator();
const network = new NetworkClient(WS_URL);

const knownBoats = new Set<string>();

network.onAssigned((playerId, roomId) => {
  gameState.setPlayer(playerId, roomId);
  console.log(`Assigned: player=${playerId}, room=${roomId}`);
});

network.onWorldState((worldState, tiles) => {
  gameState.updateFromServer(worldState, tiles);
  interpolator.update(worldState.boats);

  if (gameState.tiles && !mapRenderer.hasRendered()) {
    mapRenderer.renderMap(gameState.tiles);
  }

  const activeIds = new Set<string>();
  for (const boat of worldState.boats) {
    activeIds.add(boat.id);
    if (!knownBoats.has(boat.id)) {
      const isLocal = boat.id === gameState.localPlayerId;
      boatRenderer.createBoat(boat.id, isLocal ? 0xcc4422 : 0x2266aa);
      knownBoats.add(boat.id);
    }
  }

  for (const id of knownBoats) {
    if (!activeIds.has(id)) {
      boatRenderer.removeBoat(id);
      knownBoats.delete(id);
    }
  }
});

network.connect('Player');

function animate(): void {
  if (gameState.localPlayerId) {
    const input = inputController.getInput(gameState.localPlayerId);
    network.sendInput(input);
  }

  for (const id of knownBoats) {
    const interp = interpolator.getInterpolated(id);
    if (interp) {
      boatRenderer.updateBoat(id, interp.x, interp.y, interp.rotation);
      if (id === gameState.localPlayerId) {
        sceneManager.setFollowTarget(interp.x, interp.y);
      }
    }
  }

  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
