import { WebSocket } from 'ws';
import type { BoatState, TrapState, GatorState, WorldState, InputEvent, Vec2 } from '../shared/types';
import { MessageType } from '../shared/types';
import { TICK_INTERVAL_MS, TileType, TILE_SIZE } from '../shared/constants';
import { generateMap } from '../shared/MapGenerator';
import {
  updateBoatPhysics, resolveBoatCollisions,
  checkTrapCollection, updateTrapTimers, checkGatorContact,
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
  private inputs: Map<string, InputEvent> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private room: Room;

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
    const boatArray = Array.from(this.boats.values());

    for (const boat of boatArray) {
      const input = this.inputs.get(boat.id) ?? {
        playerId: boat.id, throttle: 0, steer: 0, fireNet: false,
      };
      updateBoatPhysics(boat, input, dt, this.tiles);
    }

    resolveBoatCollisions(boatArray);
    checkTrapCollection(boatArray, this.traps);
    updateTrapTimers(this.traps, dt, this.tiles);
    this.updateGatorPatrols(dt);
    checkGatorContact(boatArray, this.gators);

    this.broadcastWorldState();
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

  private broadcastWorldState(): void {
    const worldState: WorldState = {
      boats: Array.from(this.boats.values()),
      traps: this.traps,
      gators: this.gators,
      roundTimer: 0,
      roundActive: true,
    };

    const message = JSON.stringify({
      type: MessageType.STATE,
      payload: { worldState, tiles: this.tiles },
    });

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
