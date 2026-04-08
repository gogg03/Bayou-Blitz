import { WebSocket } from 'ws';
import { MessageType, type BoatState, type TrapState, type GatorState, type WorldState, type InputEvent, type Vec2, type NetProjectile } from '../shared/types';
import { TICK_INTERVAL_MS, TileType, TILE_SIZE, ROUND_DURATION, HOT_ROUND_DURATION, HOT_TRAP_COUNT, HOT_GATOR_COUNT, HOT_TRAP_RESPAWN, RESULTS_DISPLAY_TIME, WEATHER_TYPES } from '../shared/constants';
import { generateMap } from '../shared/MapGenerator';
import { updateBoatPhysics, resolveBoatCollisions, checkTrapCollection, updateTrapTimers, checkGatorContact, tryFireNet, updateNetProjectiles } from './Physics';
import { randomWaterPosition, updateGatorPatrolPositions } from './PhysicsHelpers';
import type { Room } from './RoomManager';

const NORM_TRAPS = 15;
const NORM_GATORS = 3;

export class GameRoom {
  private tiles: TileType[][];
  private boats: Map<string, BoatState> = new Map();
  private traps: TrapState[] = [];
  private gators: GatorState[] = [];
  private netProjectiles: NetProjectile[] = [];
  private netIdCounter = { value: 0 };
  private inputs: Map<string, InputEvent> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private room: Room;
  private roundTimer: number = ROUND_DURATION;
  private roundActive: boolean = true;
  private resultsTimer: number = 0;
  private isHotRound: boolean;
  private weather: string;

  constructor(room: Room, blitz = false) {
    this.room = room;
    this.isHotRound = blitz;
    this.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    this.tiles = generateMap();
    this.roundTimer = blitz ? HOT_ROUND_DURATION : ROUND_DURATION;
    this.spawnTraps(blitz ? HOT_TRAP_COUNT : NORM_TRAPS);
    this.spawnGators(blitz ? HOT_GATOR_COUNT : NORM_GATORS);
    this.start();
  }

  private spawnTraps(count: number): void {
    this.traps.length = 0;
    for (let i = 0; i < count; i++) {
      this.traps.push({
        id: `trap-${i}`,
        position: randomWaterPosition(this.tiles),
        isActive: true,
        respawnTimer: 0,
      });
    }
  }

  private spawnGators(count: number): void {
    this.gators.length = 0;
    for (let i = 0; i < count; i++) {
      const center = randomWaterPosition(this.tiles);
      const path: Vec2[] = [];
      for (let p = 0; p < 4; p++) {
        path.push({
          x: center.x + (Math.random() - 0.5) * TILE_SIZE * 4,
          y: center.y + (Math.random() - 0.5) * TILE_SIZE * 4,
        });
      }
      this.gators.push({
        id: `gator-${i}`,
        position: { ...center },
        patrolPathIndex: 0,
        patrolPath: path,
      });
    }
  }

  addBoat(playerId: string, name: string): void {
    const pos = randomWaterPosition(this.tiles);
    const boat: BoatState = {
      id: playerId,
      position: pos,
      velocity: { x: 0, y: 0 },
      rotation: 0,
      score: 0,
      isStunned: false,
      stunTimer: 0,
      netCooldown: 0,
      name,
    };
    this.boats.set(playerId, boat);
  }

  startRound(): void {
    this.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    this.roundTimer = this.isHotRound ? HOT_ROUND_DURATION : ROUND_DURATION;
    this.roundActive = true;
    this.netProjectiles.length = 0;

    this.spawnTraps(this.isHotRound ? HOT_TRAP_COUNT : NORM_TRAPS);
    this.spawnGators(this.isHotRound ? HOT_GATOR_COUNT : NORM_GATORS);

    const boatArray = Array.from(this.boats.values());
    for (let i = 0; i < boatArray.length; i++) {
      const boat = boatArray[i];
      boat.position = randomWaterPosition(this.tiles);
      boat.velocity = { x: 0, y: 0 };
      boat.rotation = (Math.PI * 2 * i) / Math.max(boatArray.length, 1);
      boat.score = 0;
      boat.isStunned = false;
      boat.stunTimer = 0;
      boat.netCooldown = 0;
    }
    this.broadcast(MessageType.ROUND_START);
  }

  removeBoat(playerId: string): void {
    this.boats.delete(playerId);
    this.inputs.delete(playerId);
  }

  bufferInput(playerId: string, input: InputEvent): void {
    const prev = this.inputs.get(playerId);
    if (prev?.fireNet) input.fireNet = true;
    this.inputs.set(playerId, input);
  }

  private start(): void {
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const dt = TICK_INTERVAL_MS / 1000;

    if (!this.roundActive) {
      this.resultsTimer -= dt;
      if (this.resultsTimer <= 0) {
        this.startRound();
      }
      this.broadcast(MessageType.STATE);
      return;
    }

    this.roundTimer -= dt;
    if (this.roundTimer <= 0) {
      this.roundTimer = 0;
      this.roundActive = false;
      this.resultsTimer = RESULTS_DISPLAY_TIME;
      this.broadcastRoundEnd();
      return;
    }

    const boatArray = Array.from(this.boats.values());
    for (const boat of boatArray) {
      const input = this.inputs.get(boat.id) ?? {
        playerId: boat.id, throttle: 0, steer: 0, fireNet: false,
      };
      updateBoatPhysics(boat, input, dt, this.tiles);
      if (input.fireNet) {
        tryFireNet(boat, this.netProjectiles, this.netIdCounter);
        input.fireNet = false;
      }
    }

    resolveBoatCollisions(boatArray);
    updateNetProjectiles(this.netProjectiles, boatArray, this.gators, dt, this.tiles);
    checkTrapCollection(boatArray, this.traps, this.isHotRound ? HOT_TRAP_RESPAWN : undefined);
    updateTrapTimers(this.traps, dt, this.tiles);
    updateGatorPatrolPositions(this.gators, dt);
    checkGatorContact(boatArray, this.gators);
    this.broadcast(MessageType.STATE);
  }

  private broadcastRoundEnd(): void {
    const scores = Array.from(this.boats.values()).map(b => ({
      id: b.id, name: b.name, score: b.score,
    })).sort((a, b) => b.score - a.score);
    const message = JSON.stringify({ type: MessageType.ROUND_END, payload: { scores } });
    for (const player of this.room.players.values()) {
      if (player.ws.readyState === WebSocket.OPEN) player.ws.send(message);
    }
  }

  private broadcast(type: MessageType): void {
    const worldState: WorldState = {
      boats: Array.from(this.boats.values()), traps: this.traps,
      gators: this.gators, netProjectiles: this.netProjectiles,
      roundTimer: this.roundTimer, roundActive: this.roundActive,
      isHotRound: this.isHotRound, weather: this.weather,
    };
    const message = JSON.stringify({ type, payload: { worldState, tiles: this.tiles } });
    for (const player of this.room.players.values()) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message);
      }
    }
  }

  getTiles(): TileType[][] {
    return this.tiles;
  }
}
