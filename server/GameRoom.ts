import { WebSocket } from 'ws';
import type { BoatState, TrapState, GatorState, WorldState, InputEvent, Vec2, NetProjectile } from '../shared/types';
import { MessageType } from '../shared/types';
import { TICK_INTERVAL_MS, TileType, TILE_SIZE, ROUND_DURATION } from '../shared/constants';
import { generateMap } from '../shared/MapGenerator';
import {
  updateBoatPhysics, resolveBoatCollisions,
  checkTrapCollection, updateTrapTimers, checkGatorContact,
  tryFireNet, updateNetProjectiles,
} from './Physics';
import { randomWaterPosition } from './PhysicsHelpers';
import type { Room } from './RoomManager';

const TRAP_COUNT = 15;
const GATOR_COUNT = 3;

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

  constructor(room: Room) {
    this.room = room;
    this.tiles = generateMap();
    this.spawnTraps();
    this.spawnGators();
    this.start();
  }

  private spawnTraps(): void {
    for (let i = 0; i < TRAP_COUNT; i++) {
      this.traps.push({
        id: `trap-${i}`,
        position: randomWaterPosition(this.tiles),
        isActive: true,
        respawnTimer: 0,
      });
    }
  }

  private spawnGators(): void {
    for (let i = 0; i < GATOR_COUNT; i++) {
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
    this.roundTimer = ROUND_DURATION;
    this.roundActive = true;
    this.netProjectiles.length = 0;

    const boatArray = Array.from(this.boats.values());
    for (let i = 0; i < boatArray.length; i++) {
      const boat = boatArray[i];
      const pos = randomWaterPosition(this.tiles);
      boat.position = pos;
      boat.velocity = { x: 0, y: 0 };
      boat.rotation = (Math.PI * 2 * i) / Math.max(boatArray.length, 1);
      boat.score = 0;
      boat.isStunned = false;
      boat.stunTimer = 0;
      boat.netCooldown = 0;
    }

    for (const trap of this.traps) {
      trap.position = randomWaterPosition(this.tiles);
      trap.isActive = true;
      trap.respawnTimer = 0;
    }

    this.broadcast(MessageType.ROUND_START);
  }

  removeBoat(playerId: string): void {
    this.boats.delete(playerId);
    this.inputs.delete(playerId);
  }

  bufferInput(playerId: string, input: InputEvent): void {
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

    if (this.roundActive) {
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        this.roundTimer = 0;
        this.roundActive = false;
      }
    }

    const boatArray = Array.from(this.boats.values());

    for (const boat of boatArray) {
      const input = this.inputs.get(boat.id) ?? {
        playerId: boat.id, throttle: 0, steer: 0, fireNet: false,
      };
      updateBoatPhysics(boat, input, dt, this.tiles);
      if (input.fireNet) {
        tryFireNet(boat, this.netProjectiles, this.netIdCounter);
      }
    }

    resolveBoatCollisions(boatArray);
    updateNetProjectiles(this.netProjectiles, boatArray, dt);
    checkTrapCollection(boatArray, this.traps);
    updateTrapTimers(this.traps, dt, this.tiles);
    this.updateGatorPatrols(dt);
    checkGatorContact(boatArray, this.gators);

    this.broadcast(MessageType.STATE);
  }

  private updateGatorPatrols(dt: number): void {
    const speed = 30;
    for (const gator of this.gators) {
      if (gator.patrolPath.length === 0) continue;
      const target = gator.patrolPath[gator.patrolPathIndex];
      const dx = target.x - gator.position.x;
      const dy = target.y - gator.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        gator.patrolPathIndex = (gator.patrolPathIndex + 1) % gator.patrolPath.length;
      } else {
        gator.position.x += (dx / dist) * speed * dt;
        gator.position.y += (dy / dist) * speed * dt;
      }
    }
  }

  private broadcast(type: MessageType): void {
    const worldState: WorldState = {
      boats: Array.from(this.boats.values()), traps: this.traps,
      gators: this.gators, netProjectiles: this.netProjectiles,
      roundTimer: this.roundTimer, roundActive: this.roundActive,
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
