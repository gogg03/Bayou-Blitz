import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { WsMessage } from '../shared/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

let connectionCount = 0;

wss.on('connection', (ws: WebSocket) => {
  connectionCount++;
  console.log(`[WS] Client connected (total: ${connectionCount})`);

  ws.on('message', (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());
      console.log(`[WS] Received: ${message.type}`);
    } catch {
      console.error('[WS] Invalid message format');
    }
  });

  ws.on('close', () => {
    connectionCount--;
    console.log(`[WS] Client disconnected (total: ${connectionCount})`);
  });

  ws.on('error', (err: Error) => {
    console.error('[WS] Error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Bayou Blitz server running on port ${PORT}`);
});
