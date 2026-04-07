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

export interface WorldState {
  boats: BoatState[];
  traps: TrapState[];
  gators: GatorState[];
  roundTimer: number;
  roundActive: boolean;
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
}

export interface WsMessage {
  type: MessageType;
  payload: unknown;
}
