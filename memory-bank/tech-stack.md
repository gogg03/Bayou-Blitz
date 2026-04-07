# BAYOU BLITZ — Tech Stack
**Version:** 0.1  
**Author:** GOGG03  

---

## Guiding Principle

Simplest stack that delivers real-time physics-driven multiplayer in a browser with zero install and zero login. Every choice prioritizes low latency, fast iteration in Cursor Agent, and clean deployment to the Hostinger VPS.

---

## Stack Overview

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Type safety across shared game state structs, Cursor Agent performs better with typed codebases |
| Renderer | Three.js | Jam standard, orthographic top-down camera, excellent browser perf |
| Build Tool | Vite | Instant dev server, fast HMR, clean static build output |
| Multiplayer Transport | WebSockets (ws library) | Low latency, simple broadcast model, standard for arena games |
| Backend Runtime | Node.js + Express | Handles WebSocket upgrades and HTTP leaderboard API on same server |
| Database | SQLite via better-sqlite3 | Zero config, file-based, right-sized for leaderboard use |
| Process Manager | PM2 | Keeps Node server alive, auto-restarts on crash |
| Reverse Proxy | Nginx | Serves static frontend, proxies WebSocket and API traffic, handles SSL |
| SSL | Let's Encrypt via Certbot | Free, auto-renewing HTTPS on the subdomain |
| Version Control | Git + GitHub | Cursor Agent commits, VPS pulls from repo on deploy |

---

## Frontend

- **Language:** TypeScript compiled via Vite
- **Renderer:** Three.js with orthographic top-down camera
- **Physics:** Custom lightweight physics — momentum, drag, collision response. No physics library to keep bundle small and behavior controllable.
- **Networking:** Native browser WebSocket API — connects to the Node server on the VPS
- **Input:** Keyboard event listeners (WASD / arrows, Space, E)
- **Build output:** `/dist` — static HTML, JS, assets. Zero heavy downloads.

## Backend

- **Runtime:** Node.js LTS
- **Framework:** Express
- **WebSocket library:** `ws` — handles all real-time game state sync
- **HTTP endpoints (leaderboard only):**
  - `POST /api/scores` — submit round result
  - `GET /api/scores` — retrieve global top 10
- **Database:** SQLite file managed via `better-sqlite3`
- **Room management:** In-memory — rooms are objects on the server, not persisted
- **Game loop:** Authoritative server tick at 20Hz — server owns positions, clients send inputs

---

## Networking Model

The server is authoritative. Clients send input commands (throttle, steer, fire net). The server processes physics, resolves collisions, and broadcasts game state to all clients in the room every tick.

```
Client → sends input events → Server
Server → runs physics tick → broadcasts world state → all Clients
```

This prevents cheating and keeps all clients in sync. At 20Hz the latency is acceptable for a casual arena game.

---

## Shared Types

A `/shared` directory contains TypeScript types used by both the frontend and the server — boat state, trap state, player info, room state, input events. This ensures both sides speak the same schema.

---

## Subdomain & DNS

- Game served at `bayoublitz.gogg.live` (or similar)
- DNS A record points to Hostinger VPS IP (root@72.60.67.208)
- Nginx handles SSL termination, static file serving, and WebSocket proxy upgrade headers

---

## File Structure (High Level)

```
bayou-blitz/
├── memory-bank/
│   ├── game-design-document.md
│   ├── tech-stack.md
│   ├── implementation-plan.md
│   ├── architecture.md
│   └── progress.md
├── shared/
│   └── types.ts
├── src/
│   ├── main.ts
│   ├── game/
│   ├── rendering/
│   ├── network/
│   ├── input/
│   ├── ui/
│   └── constants/
├── server/
│   ├── index.ts
│   ├── GameRoom.ts
│   ├── Physics.ts
│   └── db.ts
├── public/
├── dist/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Dev Environment

- **IDE:** Cursor Pro, Agent mode
- **Local dev:** `vite dev` for frontend, `tsx watch server/index.ts` for backend
- **Local WebSocket:** Server runs on `ws://localhost:3001`, Vite proxies it during dev
- **TypeScript:** Strict mode enabled

---

## Deployment Flow (Summary)

1. Cursor Agent builds the project locally (`vite build`)
2. Changes pushed to GitHub
3. VPS pulls latest via SSH
4. `/dist` copied to Nginx web root
5. Node server restarted via PM2
6. Game live at subdomain

Full step-by-step in the implementation plan.

---

## VPS Notes

- Server: Hostinger VPS, root@72.60.67.208
- Currently running n8n — to be stopped and removed before Nginx setup
- Node backend runs on port 3001 internally, not exposed publicly
- Nginx proxies both `/api/*` (HTTP) and `/ws` (WebSocket upgrade) to port 3001
