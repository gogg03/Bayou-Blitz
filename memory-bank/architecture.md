# BAYOU BLITZ — Architecture
**Version:** 0.1  
**Author:** GOGG03  
**Updated by:** Cursor Agent after each major milestone  

---

## Overview

Bayou Blitz is an authoritative-server multiplayer game. The server owns all game state and physics. Clients send inputs and render what the server tells them. The frontend (Vite + TypeScript + Three.js) is served as static files. The backend (Node.js + Express + ws) handles WebSocket connections, game rooms, physics ticks, and the leaderboard API — all as a single persistent process under PM2.

---

## System Boundaries

```
Browser (Client)
│
├── Three.js Renderer         ← draws map, boats, traps, gators, effects
├── Input Handler             ← captures keyboard input, sends to server via WebSocket
├── Network Client            ← WebSocket connection, receives world state, sends input
├── Interpolation Layer       ← smooths server state snapshots between ticks
└── UI Layer (DOM)            ← HUD, timer, live leaderboard, round summary, lobby

VPS (root@72.60.67.208)
│
├── Nginx
│   ├── Serves /dist → bayoublitz.[domain] (HTTPS)
│   ├── Proxies /api/* → localhost:3001 (HTTP)
│   └── Proxies /ws → localhost:3001 (WebSocket upgrade)
│
├── Node.js Server (PM2)
│   ├── Express HTTP
│   │   ├── POST /api/scores
│   │   └── GET /api/scores
│   ├── WebSocket Server (ws)
│   │   ├── Connection handler
│   │   ├── Room assignment
│   │   └── Input message handler
│   ├── Room Manager          ← creates, tracks, destroys game rooms
│   ├── Game Room             ← per-room game loop at 20Hz
│   └── Physics Engine        ← boat movement, collision, trap collection
│
└── SQLite Database
    └── scores.db
```

---

## Frontend Module Map

### `src/main.ts`
Entry point. Initializes renderer, connects WebSocket, mounts input handler, renders lobby screen on load.

### `src/network/`

| File | Responsibility |
|---|---|
| `NetworkClient.ts` | Owns the WebSocket connection. Sends input events, receives world state snapshots, emits local events when messages arrive |
| `MessageTypes.ts` | Enum of all WebSocket message types (input, state, join, round_start, round_end, etc.) |

### `src/game/`

| File | Responsibility |
|---|---|
| `GameState.ts` | Client-side mirror of last received server world state — boats, traps, gators, timer, scores |
| `Interpolator.ts` | Smooths boat positions between server ticks to prevent jitter on screen |
| `InputController.ts` | Reads keyboard state each frame, batches into an input event, sends via NetworkClient |

### `src/rendering/`

| File | Responsibility |
|---|---|
| `SceneManager.ts` | Three.js scene, orthographic camera, renderer, resize handler |
| `MapRenderer.ts` | Converts tile map data from server into Three.js meshes |
| `BoatRenderer.ts` | Renders each boat mesh, updates position and rotation from interpolated state |
| `TrapRenderer.ts` | Renders crawfish trap markers, handles appear/disappear on collection/respawn |
| `GatorRenderer.ts` | Renders gator entities and their patrol zone overlays |
| `EffectsRenderer.ts` | Splash particles on knockback, net projectile visual, gator zone murk effect |

### `src/ui/`

| File | Responsibility |
|---|---|
| `LobbyScreen.ts` | Name entry, room URL display, waiting for players state |
| `HUD.ts` | Round timer, player score, net cooldown indicator, player count |
| `LiveLeaderboard.ts` | Live in-round score ranking, updates from world state |
| `RoundSummary.ts` | End-of-round results screen, global top 10, play again countdown |

### `src/constants/`

| File | Responsibility |
|---|---|
| `GameConfig.ts` | Tile size, map dimensions, physics constants, trap counts, round duration |
| `BoatConfig.ts` | Speed, handling, hull, fan power base values |
| `AudioConfig.ts` | Audio file references, volume defaults |

---

## Backend Module Map

### `server/index.ts`
Entry point. Creates Express app, attaches WebSocket server to the same HTTP server, starts listening on port 3001.

### `server/RoomManager.ts`
Creates and destroys `GameRoom` instances. Assigns connecting players to rooms. Handles room URL generation and lookup.

### `server/GameRoom.ts`
One instance per active room. Owns the 20Hz game loop (`setInterval`). Holds all player connections for that room. Calls `Physics.ts` each tick, then broadcasts world state snapshot to all connected clients. Handles round start, round end, and round reset.

### `server/Physics.ts`
Stateless physics functions. Takes current world state and input events, returns next world state. Handles boat movement with momentum and drag, boat-to-boat collision response, trap proximity collection, gator zone contact detection, and out-of-bounds respawn triggering.

### `server/db.ts`
SQLite connection, schema init, and query helpers for score insert and top-10 select.

### `server/routes/scores.ts`
Express route handlers for `POST /api/scores` and `GET /api/scores`.

---

## Shared Types (`/shared/types.ts`)

Used by both frontend and server. Defines:

- `BoatState` — id, position, velocity, rotation, score, isStunned, netCooldown
- `TrapState` — id, position, isActive, respawnTimer
- `GatorState` — id, position, patrolPath index
- `WorldState` — all boats, all traps, all gators, roundTimer, roundActive
- `InputEvent` — playerId, throttle, steer, fireNet
- `WsMessage` — type + payload wrapper for all WebSocket messages

---

## Data Flow — Game Tick

```
Client keyboard state
        │
        ▼
InputController.ts — builds InputEvent
        │
        ▼
NetworkClient.ts — sends over WebSocket
        │
        ▼
Server GameRoom.ts — buffers input for this player
        │
        ▼ (every 50ms / 20Hz)
Physics.ts — processes all inputs, advances world state
        │
        ▼
GameRoom.ts — serializes WorldState snapshot
        │
        ▼
Broadcast to all clients in room
        │
        ▼
NetworkClient.ts — receives snapshot
        │
        ▼
GameState.ts — updates local mirror
        │
        ▼
Interpolator.ts — smooths between last two snapshots
        │
        ▼
Three.js Renderer — draws current frame
```

---

## Data Flow — Round End

```
Server GameRoom.ts — timer hits zero
        │
        ▼
Broadcast ROUND_END message with final scores
        │
        ▼
Client RoundSummary.ts — displays results screen
        │
        ▼
Client LeaderboardClient.ts — POST /api/scores (winner's score)
        │
        ▼
Client LeaderboardClient.ts — GET /api/scores
        │
        ▼
RoundSummary.ts — renders global top 10
        │
        ▼ (10 second display)
Server GameRoom.ts — broadcasts ROUND_START for next round
```

---

## Room Lifecycle

```
Player connects → RoomManager assigns to open room (or creates new)
                → Player receives room URL to share
                → Room waits for 2+ players
                → Round starts automatically
                → Round runs 3 minutes
                → Round ends → results → 10s delay → new round
                → Player disconnects → removed from room
                → Last player disconnects → room destroyed
```

---

## State Management

The server is the single source of truth. The client never modifies world state directly — it only sends inputs and renders what the server sends back. The client's `GameState.ts` is a read-only mirror updated on each incoming snapshot.

---

## VPS Layout

```
/var/www/bayoublitz/          ← Nginx web root (Vite /dist output)
/opt/bayoublitz-server/       ← Node server source
/opt/bayoublitz-server/scores.db  ← SQLite file
```

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_WS_URL` | `.env` | WebSocket server URL for the client |
| `VITE_API_BASE_URL` | `.env` | Base URL for leaderboard API calls |
| `PORT` | VPS shell / PM2 config | Node server port (default 3001) |

---

## Key Constraints

- Server is authoritative — no client-side physics for gameplay decisions
- No persistent room state — rooms exist in memory only, reset on server restart
- No authentication — name entry only
- WebSocket and HTTP share the same Node process on port 3001
- n8n must be fully stopped and removed from VPS before Nginx setup begins

---

---

## File Registry (Agent-Maintained)

### `src/main.ts`
**Location:** src/main.ts  
**Responsibility:** Entry point. Initializes Three.js WebGLRenderer, orthographic camera, and scene. Handles window resize. Runs the render loop.  
**Dependencies:** three  
**Last updated:** Step 1

### `src/vite-env.d.ts`
**Location:** src/vite-env.d.ts  
**Responsibility:** Vite client type declarations.  
**Dependencies:** vite/client  
**Last updated:** Step 1

---

*This document should be updated by Cursor Agent after each major phase is completed.*
