import { SceneManager } from './rendering/SceneManager';
import { MapRenderer } from './rendering/MapRenderer';
import { BoatRenderer } from './rendering/BoatRenderer';
import { TrapRenderer } from './rendering/TrapRenderer';
import { GatorRenderer } from './rendering/GatorRenderer';
import { NetRenderer } from './rendering/NetRenderer';
import { InputController } from './input/InputController';
import { NetworkClient } from './network/NetworkClient';
import { GameState } from './game/GameState';
import { Interpolator } from './game/Interpolator';
import { HUD } from './ui/HUD';
import { LobbyScreen } from './ui/LobbyScreen';
import { RoundSummary } from './ui/RoundSummary';
import { AudioManager } from './audio/AudioManager';
import { ParticleSystem } from './rendering/ParticleSystem';
import { TreeRenderer } from './rendering/TreeRenderer';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);
const mapRenderer = new MapRenderer(sceneManager.scene);
const boatRenderer = new BoatRenderer(sceneManager.scene);
const trapRenderer = new TrapRenderer(sceneManager.scene);
const gatorRenderer = new GatorRenderer(sceneManager.scene);
const netRenderer = new NetRenderer(sceneManager.scene);
const inputController = new InputController();
const gameState = new GameState();
const interpolator = new Interpolator();
const hud = new HUD();
const lobby = new LobbyScreen();
const roundSummary = new RoundSummary();
const particles = new ParticleSystem(sceneManager.scene);
const treeRenderer = new TreeRenderer(sceneManager.scene);
const audio = new AudioManager();
const network = new NetworkClient(WS_URL);

const knownBoats = new Set<string>();
let prevStunned = false;

hud.muteBtn.addEventListener('click', () => {
  audio.init();
  const muted = audio.toggleMute();
  hud.muteBtn.textContent = muted ? 'Unmute' : 'Mute';
});

lobby.onJoinGame((name) => {
  network.connect(name);
});

network.onAssigned((playerId, roomId) => {
  gameState.setPlayer(playerId, roomId);
  lobby.updateStatus(`Joined room ${roomId}`);
  lobby.hide();
});

network.onRoundStarted(() => {
  lobby.hide();
  roundSummary.hide();
  mapRenderer.clear();
  treeRenderer.clear();
});

network.onRoundEnded((scores) => {
  roundSummary.show(scores, gameState.localPlayerId ?? '');
});

network.onWorldState((worldState, tiles) => {
  gameState.updateFromServer(worldState, tiles);
  interpolator.update(worldState.boats);

  if (gameState.tiles && !mapRenderer.hasRendered()) {
    mapRenderer.renderMap(gameState.tiles);
    treeRenderer.placeAlongEdges(gameState.tiles);
  }

  const activeIds = new Set<string>();
  for (const boat of worldState.boats) {
    activeIds.add(boat.id);
    if (!knownBoats.has(boat.id)) {
      const isLocal = boat.id === gameState.localPlayerId;
      boatRenderer.createBoat(boat.id, isLocal ? 0xcc4422 : 0x2266aa, boat.name);
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
        sceneManager.setFollowRotation(interp.rotation);
      }
    }
  }

  if (gameState.worldState) {
    trapRenderer.updateTraps(gameState.worldState.traps, performance.now() / 1000);
    gatorRenderer.updateGators(gameState.worldState.gators, gameState.tiles ?? undefined);
    netRenderer.updateNets(gameState.worldState.netProjectiles);
    hud.updateTimer(gameState.worldState.roundTimer);
    hud.updateLeaderboard(gameState.worldState.boats, gameState.localPlayerId ?? '');

    const localBoat = gameState.worldState.boats.find(b => b.id === gameState.localPlayerId);
    if (localBoat) {
      hud.updateScore(localBoat.score);
      hud.updateCooldown(localBoat.netCooldown);
      const speed = Math.sqrt(localBoat.velocity.x ** 2 + localBoat.velocity.y ** 2);
      audio.updateEngine(speed);
      if (localBoat.isStunned && !prevStunned) {
        audio.playSplash();
        particles.spawnSplash(localBoat.position.x, localBoat.position.y);
      }
      prevStunned = localBoat.isStunned;
    }
  }

  particles.update(1 / 60);
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
