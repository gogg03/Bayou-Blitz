import { MessageType } from '../../shared/types';
import type { WsMessage, WorldState, InputEvent } from '../../shared/types';
import type { TileType } from '../../shared/constants';

export type StateCallback = (worldState: WorldState, tiles: TileType[][] | null) => void;
export type AssignCallback = (playerId: string, roomId: string) => void;
export type RoundCallback = (worldState: WorldState, tiles: TileType[][]) => void;
export type NameTakenCallback = (name: string) => void;
export type ChatCallback = (name: string, text: string, isServer: boolean) => void;
export type PlayerEventCallback = (playerId: string, name: string, playerCount: number) => void;

export class NetworkClient {
  private ws: WebSocket | null = null;
  private onState: StateCallback | null = null;
  private onAssign: AssignCallback | null = null;
  private onRoundStart: RoundCallback | null = null;
  private onRoundEndCb: ((scores: { id: string; name: string; score: number }[]) => void) | null = null;
  private onNameTakenCb: NameTakenCallback | null = null;
  private onChatCb: ChatCallback | null = null;
  private onPlayerJoinedCb: PlayerEventCallback | null = null;
  private onPlayerLeftCb: PlayerEventCallback | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(name: string, mode = 'normal'): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[Net] Connected');
      this.send({ type: MessageType.JOIN, payload: { name, mode } });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        this.handleMessage(msg);
      } catch {
        console.error('[Net] Invalid message');
      }
    };

    this.ws.onclose = () => {
      console.log('[Net] Disconnected');
    };

    this.ws.onerror = (err) => {
      console.error('[Net] Error:', err);
    };
  }

  private handleMessage(msg: WsMessage): void {
    switch (msg.type) {
      case MessageType.ASSIGN_ID: {
        const payload = msg.payload as { playerId: string; roomId: string };
        this.onAssign?.(payload.playerId, payload.roomId);
        break;
      }
      case MessageType.STATE: {
        const payload = msg.payload as { worldState: WorldState; tiles?: TileType[][] };
        this.onState?.(payload.worldState, payload.tiles ?? null);
        break;
      }
      case MessageType.ROUND_START: {
        const payload = msg.payload as { worldState: WorldState; tiles: TileType[][] };
        this.onState?.(payload.worldState, payload.tiles);
        this.onRoundStart?.(payload.worldState, payload.tiles);
        break;
      }
      case MessageType.ROUND_END: {
        const payload = msg.payload as { scores: { id: string; name: string; score: number }[] };
        this.onRoundEndCb?.(payload.scores);
        break;
      }
      case MessageType.NAME_TAKEN: {
        const payload = msg.payload as { name: string };
        this.onNameTakenCb?.(payload.name);
        this.ws?.close();
        break;
      }
      case MessageType.CHAT: {
        const payload = msg.payload as { name: string; text: string; isServer: boolean };
        this.onChatCb?.(payload.name, payload.text, payload.isServer);
        break;
      }
      case MessageType.PLAYER_JOINED: {
        const payload = msg.payload as { playerId: string; name: string; playerCount: number };
        this.onPlayerJoinedCb?.(payload.playerId, payload.name, payload.playerCount);
        break;
      }
      case MessageType.PLAYER_LEFT: {
        const payload = msg.payload as { playerId: string; name: string; playerCount: number };
        this.onPlayerLeftCb?.(payload.playerId, payload.name, payload.playerCount);
        break;
      }
    }
  }

  sendInput(input: InputEvent): void {
    this.send({ type: MessageType.INPUT, payload: input });
  }

  onWorldState(callback: StateCallback): void {
    this.onState = callback;
  }

  onAssigned(callback: AssignCallback): void {
    this.onAssign = callback;
  }

  onRoundStarted(callback: RoundCallback): void {
    this.onRoundStart = callback;
  }

  onRoundEnded(callback: (scores: { id: string; name: string; score: number }[]) => void): void {
    this.onRoundEndCb = callback;
  }

  onNameTaken(callback: NameTakenCallback): void {
    this.onNameTakenCb = callback;
  }

  onChat(callback: ChatCallback): void {
    this.onChatCb = callback;
  }

  onPlayerJoined(callback: PlayerEventCallback): void {
    this.onPlayerJoinedCb = callback;
  }

  onPlayerLeft(callback: PlayerEventCallback): void {
    this.onPlayerLeftCb = callback;
  }

  sendChat(text: string): void {
    this.send({ type: MessageType.CHAT, payload: { text } });
  }

  private send(msg: WsMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    this.ws?.close();
  }
}
