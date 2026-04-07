import { WebSocket } from 'ws';
import { MessageType } from '../shared/types';
import type { WsMessage } from '../shared/types';

export interface PlayerConnection {
  id: string;
  ws: WebSocket;
  name: string;
  roomId: string;
}

export interface Room {
  id: string;
  players: Map<string, PlayerConnection>;
}

const MAX_PLAYERS_PER_ROOM = 12;

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  addPlayer(ws: WebSocket, name: string): PlayerConnection {
    const playerId = this.generateId();
    const room = this.findOrCreateRoom();

    const player: PlayerConnection = {
      id: playerId,
      ws,
      name: name || `Player-${playerId.slice(0, 4)}`,
      roomId: room.id,
    };

    room.players.set(playerId, player);
    this.playerToRoom.set(playerId, room.id);

    this.sendToPlayer(player, {
      type: MessageType.ASSIGN_ID,
      payload: { playerId, roomId: room.id },
    });

    this.broadcastToRoom(room.id, {
      type: MessageType.PLAYER_JOINED,
      payload: {
        playerId,
        name: player.name,
        playerCount: room.players.size,
      },
    });

    console.log(
      `[Room ${room.id}] Player ${player.name} (${playerId}) joined ` +
        `(${room.players.size} players)`
    );

    return player;
  }

  removePlayer(playerId: string): void {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[Room ${roomId}] Destroyed (empty)`);
    } else {
      this.broadcastToRoom(roomId, {
        type: MessageType.PLAYER_LEFT,
        payload: {
          playerId,
          playerCount: room.players.size,
        },
      });
    }

    console.log(
      `[Room ${roomId}] Player ${player?.name ?? playerId} left ` +
        `(${room.players.size} remaining)`
    );
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomForPlayer(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  private findOrCreateRoom(): Room {
    for (const room of this.rooms.values()) {
      if (room.players.size < MAX_PLAYERS_PER_ROOM) {
        return room;
      }
    }
    return this.createRoom();
  }

  private createRoom(): Room {
    const id = this.generateId();
    const room: Room = { id, players: new Map() };
    this.rooms.set(id, room);
    console.log(`[Room ${id}] Created`);
    return room;
  }

  private sendToPlayer(player: PlayerConnection, message: WsMessage): void {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }

  broadcastToRoom(roomId: string, message: WsMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify(message);
    for (const player of room.players.values()) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
