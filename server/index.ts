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
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const roomManager = new RoomManager();
const gameRooms = new Map<string, GameRoom>();

const wsToPlayer = new Map<WebSocket, PlayerConnection>();

wss.on('connection', (ws: WebSocket) => {
  console.log(`[WS] New connection`);

  ws.on('message', (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());

      if (message.type === MessageType.JOIN) {
        const payload = message.payload as { name?: string; mode?: string };
        const player = roomManager.addPlayer(ws, payload.name ?? '');
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
