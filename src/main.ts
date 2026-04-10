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
import { TICK_INTERVAL_MS } from './constants/GameConfig';
import { HUD } from './ui/HUD';
import { LobbyScreen } from './ui/LobbyScreen';
import { RoundSummary } from './ui/RoundSummary';
import { AudioManager } from './audio/AudioManager';
import { ParticleSystem } from './rendering/ParticleSystem';
import { TreeRenderer } from './rendering/TreeRenderer';
import { WeatherSystem } from './rendering/WeatherSystem';
import { WakeRenderer } from './rendering/WakeRenderer';
import { ChatBox } from './ui/ChatBox';

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
const weather = new WeatherSystem(sceneManager.scene, sceneManager.renderer);
const wakeRenderer = new WakeRenderer(sceneManager.scene);
const chatBox = new ChatBox();
const audio = new AudioManager();
const network = new NetworkClient(WS_URL);

const knownBoats = new Set<string>();
let prevStunned = false;
let lastSentThrottle = 0;
let lastSentSteer = 0;
let lastSentFireNet = false;
let lastInputSendTime = 0;

window.addEventListener('keydown', (e) => {
  if (ChatBox.focused) return;
  if (e.key === 'v' || e.key === 'V') sceneManager.toggleView();
});

hud.muteBtn.addEventListener('click', () => {
  audio.init();
  const muted = audio.toggleMute();
  hud.muteBtn.textContent = muted ? 'Unmute' : 'Mute';
});

lobby.onJoinGame((name, mode) => {
  network.connect(name, mode);
});

network.onNameTaken((name) => {
  lobby.show();
  ChatBox.enabled = false;
  lobby.updateStatus(`Name "${name}" is already in use — pick another!`);
});

network.onAssigned((playerId, roomId) => {
  gameState.setPlayer(playerId, roomId);
  lobby.updateStatus(`Joined room ${roomId}`);
  lobby.hide();
  ChatBox.enabled = true;
});

network.onRoundStarted((worldState) => {
  lobby.hide();
  roundSummary.hide();
  mapRenderer.clear();
  treeRenderer.clear();
  wakeRenderer.clear();
  hud.announceWeather(worldState.weather);
});

network.onRoundEnded((scores) => {
  roundSummary.show(scores, gameState.localPlayerId ?? '');
});

chatBox.onSend((text) => {
  network.sendChat(text);
});

network.onChat((playerId, name, text, isServer) => {
  chatBox.addMessage(name, text, isServer);
  if (!isServer && playerId) {
    boatRenderer.showBubble(playerId, text);
  }
});

network.onPlayerJoined((_id, name, count) => {
  chatBox.addMessage('', `${name} joined (${count} players)`, true);
});

network.onPlayerLeft((_id, name, count) => {
  chatBox.addMessage('', `${name} left (${count} remaining)`, true);
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
      boatRenderer.createBoat(boat.id, isLocal ? 0xb0b0b0 : 0x8899aa, boat.name, isLocal);
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
    const now = performance.now();
    const changed = input.throttle !== lastSentThrottle
      || input.steer !== lastSentSteer
      || (input.fireNet && !lastSentFireNet);
    if (changed || now - lastInputSendTime >= TICK_INTERVAL_MS) {
      network.sendInput(input);
      lastSentThrottle = input.throttle;
      lastSentSteer = input.steer;
      lastSentFireNet = input.fireNet;
      lastInputSendTime = now;
    }
  }

  for (const id of knownBoats) {
    const interp = interpolator.getInterpolated(id);
    if (interp) {
      boatRenderer.updateBoat(id, interp.x, interp.y, interp.rotation);
      if (id === gameState.localPlayerId) {
        sceneManager.setFollowTarget(interp.x, interp.y);
        sceneManager.setFollowRotation(interp.rotation);
      }
      const boat = gameState.worldState?.boats.find(b => b.id === id);
      if (boat) {
        const spd = Math.sqrt(boat.velocity.x ** 2 + boat.velocity.y ** 2);
        wakeRenderer.spawnWake(id, interp.x, interp.y, interp.rotation, spd);
      }
    }
  }

  if (gameState.worldState) {
    trapRenderer.updateTraps(gameState.worldState.traps, performance.now() / 1000);
    gatorRenderer.updateGators(gameState.worldState.gators, gameState.tiles ?? undefined);
    netRenderer.updateNets(gameState.worldState.netProjectiles);
    hud.updateTimer(gameState.worldState.roundTimer);
    hud.setHotRound(gameState.worldState.isHotRound);
    hud.setWeather(gameState.worldState.weather);
    weather.setWeather(gameState.worldState.weather);
    const darkWeather = ['night', 'storm', 'dusk'].includes(gameState.worldState.weather);
    boatRenderer.setHeadlights(darkWeather);
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

  if (gameState.localPlayerId) {
    const interp = interpolator.getInterpolated(gameState.localPlayerId);
    if (interp) weather.setFollowTarget(interp.x, interp.y);
  }
  boatRenderer.spinFans(1 / 60);
  wakeRenderer.update(1 / 60);
  weather.update(1 / 60);
  particles.update(1 / 60);
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
