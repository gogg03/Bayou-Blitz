import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { MessageType } from '../shared/types';
import type { WsMessage, InputEvent } from '../shared/types';
import { RoomManager } from './RoomManager';
import type { PlayerConnection } from './RoomManager';
import { GameRoom } from './GameRoom';
import scoresRouter from './routes/scores';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', scoresRouter);

const httpServer = createServer(app);
const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws',
  perMessageDeflate: {
    zlibDeflateOptions: { level: 1 },
    threshold: 256,
  },
});
const roomManager = new RoomManager();
const gameRooms = new Map<string, GameRoom>();

const wsToPlayer = new Map<WebSocket, PlayerConnection>();
const chatCooldowns = new Map<string, number>();
const CHAT_COOLDOWN_MS = 1000;
const CHAT_MAX_LEN = 120;

wss.on('connection', (ws: WebSocket) => {
  console.log(`[WS] New connection`);

  ws.on('message', (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());

      if (message.type === MessageType.JOIN) {
        const payload = message.payload as { name?: string; mode?: string };
        const name = (payload.name ?? '').trim() || 'Player';

        if (roomManager.isNameTakenInTargetRoom(name)) {
          ws.send(JSON.stringify({
            type: MessageType.NAME_TAKEN,
            payload: { name },
          }));
          return;
        }

        const player = roomManager.addPlayer(ws, name);
        wsToPlayer.set(ws, player);

        if (!gameRooms.has(player.roomId)) {
          const room = roomManager.getRoom(player.roomId)!;
          const isBlitz = payload.mode === 'blitz';
          gameRooms.set(player.roomId, new GameRoom(room, isBlitz));
        }
        gameRooms.get(player.roomId)!.addBoat(player.id, player.name);
        return;
      }

      const player = wsToPlayer.get(ws);
      if (!player) return;

      if (message.type === MessageType.INPUT) {
        const input = message.payload as InputEvent;
        input.playerId = player.id;
        gameRooms.get(player.roomId)?.bufferInput(player.id, input);
      }

      if (message.type === MessageType.CHAT) {
        const payload = message.payload as { text?: string };
        const text = (payload.text ?? '').trim().slice(0, CHAT_MAX_LEN);
        if (!text) return;
        const now = Date.now();
        const last = chatCooldowns.get(player.id) ?? 0;
        if (now - last < CHAT_COOLDOWN_MS) return;
        chatCooldowns.set(player.id, now);
        roomManager.broadcastToRoom(player.roomId, {
          type: MessageType.CHAT,
          payload: { name: player.name, text, isServer: false },
        });
      }
    } catch {
      console.error('[WS] Invalid message format');
    }
  });

  ws.on('close', () => {
    const player = wsToPlayer.get(ws);
    if (player) {
      gameRooms.get(player.roomId)?.removeBoat(player.id);
      roomManager.removePlayer(player.id);
      wsToPlayer.delete(ws);
      chatCooldowns.delete(player.id);

      const room = roomManager.getRoom(player.roomId);
      if (!room) {
        const gameRoom = gameRooms.get(player.roomId);
        gameRoom?.stop();
        gameRooms.delete(player.roomId);
      }
    }
    console.log('[WS] Client disconnected');
  });

  ws.on('error', (err: Error) => {
    console.error('[WS] Error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Bayou Blitz server running on port ${PORT}`);
});
