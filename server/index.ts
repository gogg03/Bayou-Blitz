import type { WorldState, WsMessage } from '../shared/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`Bayou Blitz server will start on port ${PORT}`);
