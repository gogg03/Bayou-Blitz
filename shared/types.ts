export interface Vec2 {
  x: number;
  y: number;
}

export interface BoatState {
  id: string;
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  score: number;
  isStunned: boolean;
  stunTimer: number;
  netCooldown: number;
  name: string;
}

export interface TrapState {
  id: string;
  position: Vec2;
  isActive: boolean;
  respawnTimer: number;
}

export interface GatorState {
  id: string;
  position: Vec2;
  patrolPathIndex: number;
  patrolPath: Vec2[];
}

export interface NetProjectile {
  id: string;
  ownerId: string;
  position: Vec2;
  velocity: Vec2;
  distanceTraveled: number;
}

export interface WorldState {
  boats: BoatState[];
  traps: TrapState[];
  gators: GatorState[];
  netProjectiles: NetProjectile[];
  roundTimer: number;
  roundActive: boolean;
  isHotRound: boolean;
  weather: string;
}

export interface InputEvent {
  playerId: string;
  throttle: number;
  steer: number;
  fireNet: boolean;
}

export enum MessageType {
  JOIN = 'JOIN',
  INPUT = 'INPUT',
  STATE = 'STATE',
  ROUND_START = 'ROUND_START',
  ROUND_END = 'ROUND_END',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  ASSIGN_ID = 'ASSIGN_ID',
  NAME_TAKEN = 'NAME_TAKEN',
}

export interface WsMessage {
  type: MessageType;
  payload: unknown;
}
