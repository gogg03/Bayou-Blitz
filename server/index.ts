import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { MessageType } from '../shared/types';
import type { WsMessage } from '../shared/types';
import { RoomManager } from './RoomManager';
import type { PlayerConnection } from './RoomManager';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const roomManager = new RoomManager();

const wsToPlayer = new Map<WebSocket, PlayerConnection>();

wss.on('connection', (ws: WebSocket) => {
  console.log(`[WS] New connection`);

  ws.on('message', (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());

      if (message.type === MessageType.JOIN) {
        const payload = message.payload as { name?: string };
        const player = roomManager.addPlayer(ws, payload.name ?? '');
        wsToPlayer.set(ws, player);
        return;
      }

      const player = wsToPlayer.get(ws);
      if (!player) return;

      console.log(`[WS] ${player.name}: ${message.type}`);
    } catch {
      console.error('[WS] Invalid message format');
    }
  });

  ws.on('close', () => {
    const player = wsToPlayer.get(ws);
    if (player) {
      roomManager.removePlayer(player.id);
      wsToPlayer.delete(ws);
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
