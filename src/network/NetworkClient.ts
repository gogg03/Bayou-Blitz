import { MessageType } from '../../shared/types';
import type { WsMessage, WorldState, InputEvent } from '../../shared/types';
import type { TileType } from '../../shared/constants';

export type StateCallback = (worldState: WorldState, tiles: TileType[][]) => void;
export type AssignCallback = (playerId: string, roomId: string) => void;

export class NetworkClient {
  private ws: WebSocket | null = null;
  private onState: StateCallback | null = null;
  private onAssign: AssignCallback | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(name: string): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[Net] Connected');
      this.send({ type: MessageType.JOIN, payload: { name } });
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
        const payload = msg.payload as { worldState: WorldState; tiles: TileType[][] };
        this.onState?.(payload.worldState, payload.tiles);
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

  private send(msg: WsMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    this.ws?.close();
  }
}
