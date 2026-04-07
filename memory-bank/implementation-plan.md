# BAYOU BLITZ — Implementation Plan
**Version:** 0.1  
**Author:** GOGG03  
**Workflow:** Cursor Pro — Agent Mode  

---

## How to Use This Document

Each step is a discrete unit of work for Cursor Agent. Steps are ordered so each one builds on a stable, tested foundation. Do not begin a step until the previous step's test passes. After each step, commit to Git and open a new Agent session.

Start every session with:
> "Read all documents in `/memory-bank`, check `progress.md` for completed steps, then proceed with the next step. Do not begin the following step until I confirm the test passes."

---

## Phase 1 — Project Scaffold & Shared Types

### Step 1 — Initialize the Project
Set up a Vite + TypeScript project. Install Three.js and the `ws` WebSocket library. Confirm the dev server runs and shows a blank black canvas with no console errors.

**Test:** `npm run dev` loads at `localhost:5173`. Black canvas visible. Zero console errors.

---

### Step 2 — TypeScript Strict Mode
Enable strict mode in `tsconfig.json`. Confirm the project compiles cleanly.

**Test:** `npm run build` completes with zero type errors.

---

### Step 3 — Shared Types
Create `/shared/types.ts` with all shared interfaces: `BoatState`, `TrapState`, `GatorState`, `WorldState`, `InputEvent`, and `WsMessage`. No logic — types only.

**Test:** Both `src/main.ts` and `server/index.ts` can import from `/shared/types.ts` without errors.

---

### Step 4 — Environment Variables
Create `.env` with placeholders for `VITE_WS_URL` and `VITE_API_BASE_URL`. Add `.env` to `.gitignore`. Confirm variables are accessible in the client at runtime.

**Test:** Console log of both placeholder values appears in browser during dev. Neither appears in the compiled output.

---

### Step 5 — Memory Bank
Create `/memory-bank` folder with all planning documents. Create empty `progress.md` and `architecture.md`. Confirm the folder is excluded from Vite build output.

**Test:** `/memory-bank` does not appear in `/dist` after `npm run build`.

---

## Phase 2 — Three.js Scene & Map Rendering

### Step 6 — Orthographic Scene Setup
Initialize a Three.js scene with an orthographic top-down camera. Add ambient and directional lighting. Render a flat green rectangle representing the swamp floor.

**Test:** Browser shows a flat green rectangle on black background. No perspective distortion. No console errors.

---

### Step 7 — Tile Map Renderer
Build `MapRenderer.ts` that accepts a 2D tile array and renders colored meshes per tile type — water, land, dock, reed wall, gator zone. Define tile types as an enum in `constants/`.

**Test:** Pass a hardcoded 20x20 tile grid with mixed types. All tile types render in correct positions with distinct colors.

---

### Step 8 — Procedural Map Generator
Build `DungeonGenerator.ts` (or `MapGenerator.ts`) that produces a valid swamp tile map: water channels, land masses, dock platforms, reed walls, and 2–4 gator zone areas. Map must have at least 2 open water highways and 2 tight corridors.

**Test:** Generate 5 maps in sequence. Each renders correctly. No isolated water areas. At least 2 open routes visible on each.

---

### Step 9 — Camera Follow
Implement camera follow — the orthographic camera tracks the local player's boat position smoothly. Test with a manually positioned target point.

**Test:** Move the target point via browser console. Camera follows with smooth interpolation, no jitter, no snapping.

---

## Phase 3 — Boat Entity & Input

### Step 10 — Boat Mesh
Render a boat mesh for the local player on the tile map. Use a simple colored rectangle with a directional indicator (a triangle or line showing facing direction).

**Test:** Boat appears on the map at spawn position. Facing direction indicator is visible and distinct.

---

### Step 11 — Input Handler
Build `InputController.ts` that reads WASD / arrow key state each frame and produces an `InputEvent` object (throttle: -1/0/1, steer: -1/0/1, fireNet: boolean). Log the event to console.

**Test:** Press WASD keys. Console logs correct `InputEvent` values for each key combination. No missed inputs, no duplicate fires.

---

### Step 12 — Local Physics Preview (Client-Side Only)
Implement momentum-based airboat movement client-side temporarily for visual testing. Boat moves with drift physics — velocity accumulates, drag slows it, turning is responsive at speed. This is replaced by server-authoritative physics in Phase 5 but needed to validate feel now.

**Test:** Drive the boat around the map. Movement feels like an airboat — slides on turns, doesn't stop instantly. Boat cannot drive through reed walls or land tiles.

---

## Phase 4 — Backend Server Foundation

### Step 13 — Express + WebSocket Server
Create `server/index.ts`. Start an Express HTTP server on port 3001. Attach a `ws` WebSocket server to it. Log a message when a client connects and disconnects.

**Test:** Run the server with `tsx server/index.ts`. Connect to `ws://localhost:3001` from the browser. Server logs connection and disconnection correctly.

---

### Step 14 — Room Manager
Build `RoomManager.ts`. When a client connects, assign it to an existing room with space or create a new room. Generate a shareable room ID. Send the client its room ID and player ID on join.

**Test:** Open two browser tabs. Both receive unique player IDs and the same room ID. Server logs show both in the same room.

---

### Step 15 — SQLite Leaderboard
Build `server/db.ts` and `server/routes/scores.ts`. Create the `scores` table on startup. Implement `POST /api/scores` and `GET /api/scores` (top 10 by score desc).

**Test:** Use a REST client to POST a test score and GET the leaderboard. Correct data returned. No errors. Data persists across server restarts.

---

## Phase 5 — Authoritative Server Physics

### Step 16 — Server Physics Engine
Build `server/Physics.ts` with stateless functions: boat movement with momentum and drag, boat-to-boat collision response with momentum transfer, trap proximity collection, gator zone contact detection, and out-of-bounds respawn trigger.

**Test:** Call physics functions directly with mock state objects. Verify correct velocity changes, collision responses, and trap collection results via unit log output.

---

### Step 17 — Game Room Loop
Build `server/GameRoom.ts`. Run a 20Hz game loop with `setInterval`. Each tick: process buffered input events from all players, call Physics.ts to advance world state, serialize `WorldState`, broadcast to all clients in the room.

**Test:** Connect two clients. Move one boat. Both clients receive the same world state update within 100ms. Boat position matches on both screens.

---

### Step 18 — Remove Client-Side Physics
Delete the temporary client-side physics from Step 12. Replace with server-state rendering — client applies received `WorldState` directly to boat positions. Confirm movement still feels responsive.

**Test:** Drive a boat. Movement is controlled by server state. Both connected clients see the same boat positions simultaneously.

---

### Step 19 — Interpolation
Build `Interpolator.ts` on the client. Smooth boat positions between received server snapshots to eliminate jitter. Boats should appear to move fluidly even at 20Hz server ticks.

**Test:** Drive all boats at various speeds. No visible jitter or snapping between ticks. Movement appears fluid.

---

## Phase 6 — Game Entities

### Step 20 — Crawfish Traps
Spawn traps on the map at round start based on map size tier. Render each trap as a glowing marker. Server handles collection detection (proximity) and respawn timer (10 seconds at new random location). Client renders from world state.

**Test:** Drive over a trap. It disappears immediately on both clients. Score increments. Trap reappears at a new location after 10 seconds.

---

### Step 21 — Gator Entities
Spawn 2–4 gators per map. Each patrols a loop within its zone. Server moves gators each tick. Client renders from world state. Boat contact triggers knockback and 1 second stun.

**Test:** Drive into a gator. Boat receives knockback and stun. Both clients see the knockback. Gator continues its patrol.

---

### Step 22 — Net Gun
Implement net gun on server. On `fireNet` input: spawn a net projectile from boat bow, travel short range, on hit apply 2-second throttle stun to target. 5-second cooldown per boat. Client renders net projectile as a brief visual.

**Test:** Fire net at another boat. Target boat loses throttle for 2 seconds — visible on both clients. Cooldown prevents immediate re-fire.

---

## Phase 7 — Round System

### Step 23 — Round Timer
Server `GameRoom.ts` manages a 3-minute countdown. Broadcasts timer updates to clients each tick. Client HUD displays live countdown.

**Test:** Start a round. Timer counts down from 3:00 on both clients simultaneously. Timer reaches 0:00 and stops.

---

### Step 24 — Round Start & Spawn
On round start, server places all boats at valid spawn points spread around the map. Broadcasts `ROUND_START` message with initial world state and map data.

**Test:** Connect two clients. Round starts automatically. Both boats spawn at distinct locations. Map renders correctly from broadcast data.

---

### Step 25 — Round End
When timer hits zero, server broadcasts `ROUND_END` with final scores. Client shows round summary screen. After 10 seconds, server broadcasts `ROUND_START` for the next round.

**Test:** Let a round expire. Results screen appears on both clients with correct scores. After 10 seconds, a new round begins automatically.

---

## Phase 8 — UI

### Step 26 — Lobby Screen
Build the lobby screen: name entry input, room URL display, player count, waiting state. Shown before the first round starts. Auto-dismissed on `ROUND_START`.

**Test:** Load the game. Lobby screen appears. Enter name. Share URL with second tab — both show 2 players. Round starts, lobby dismisses.

---

### Step 27 — HUD
Build the in-round HUD: round timer, local player score, live leaderboard (all players ranked by score), net gun cooldown indicator, player count.

**Test:** Play a round with two clients. Both HUDs show correct timer, scores, and leaderboard updates in real time.

---

### Step 28 — Round Summary Screen
Build the round summary screen: ranked player list with scores, global top 10 leaderboard fetched from backend, play again countdown (10 seconds).

**Test:** Complete a round. Summary screen shows correct final rankings. Global leaderboard loads within 2 seconds. Countdown to next round displays correctly.

---

## Phase 9 — Audio & Polish

### Step 29 — Audio
Add a zydeco-influenced ambient loop. Add airboat engine SFX (pitch scales with speed). Add splash SFX on knockback. Add gator growl on gator contact. All audio muted by default with a toggle in HUD.

**Test:** Play with audio enabled. Ambient loop plays. Engine pitch changes with speed. Splash and growl SFX fire on correct events. Mute toggle works.

---

### Step 30 — Visual Polish
Add neon glow to trap markers. Add murky bubbling effect to gator zones. Add splash particle on knockback. Add Spanish moss decorative elements. Confirm 60fps on a full lobby.

**Test:** Play with a full map of entities. FPS stays above 60. All effects render without console errors.

---

### Step 31 — Boat Name Labels
Render each player's name above their boat, always facing the camera. Names are readable at normal zoom level.

**Test:** Connect 3 clients with different names. All three name labels appear above the correct boats and update position correctly as boats move.

---

## Phase 10 — Deployment

### Step 32 — Stop and Remove n8n from VPS
SSH into root@72.60.67.208. Stop and disable the n8n process (PM2 or systemd). Remove n8n's Nginx config. Confirm no processes are occupying port 3001 or 80/443.

**Test:** `pm2 list` shows no n8n process. `lsof -i :3001` shows no process. Nginx config directory has no n8n entries.

---

### Step 33 — Nginx Setup for Static Frontend
Install Nginx if not present. Create a server block for the game subdomain pointing to the Vite `/dist` output directory at `/var/www/bayoublitz/`. Confirm HTTP access to the subdomain.

**Test:** Deploy `/dist` to `/var/www/bayoublitz/`. Navigate to the subdomain in a browser. Game loads over HTTP. No 404 or 502 errors.

---

### Step 34 — SSL with Let's Encrypt
Install Certbot. Run it for the subdomain. Confirm HTTPS and automatic HTTP-to-HTTPS redirect.

**Test:** Navigate to `http://[subdomain]` — redirects to `https://[subdomain]`. Padlock shows in browser. Game loads correctly over HTTPS.

---

### Step 35 — WebSocket Proxy in Nginx
Add Nginx proxy rules for `/ws` (WebSocket upgrade headers) and `/api/*` (HTTP proxy) pointing to `localhost:3001`.

**Test:** Game running at HTTPS subdomain connects WebSocket successfully. No mixed content errors. Leaderboard API calls succeed.

---

### Step 36 — Node Backend via PM2
Install PM2 on the VPS. Copy server source to `/opt/bayoublitz-server/`. Start the Express + WebSocket server under PM2. Configure PM2 startup on reboot.

**Test:** Reboot the VPS. SSH back in. `pm2 list` shows server as online. Open the game — multiplayer connects. Submit a leaderboard score from the live URL — it persists.

---

### Step 37 — GitHub-Based Deploy Workflow
Configure the VPS to pull from GitHub on deploy. Document the deploy command sequence: pull, install, build, copy dist, restart PM2. Confirm a code change pushed to GitHub is live within 2 minutes.

**Test:** Make a visible UI change, push to GitHub, run deploy sequence via SSH. Change appears at the live subdomain within 2 minutes.

---

### Step 38 — Vibe Jam Widget
Add the Vibe Jam 2026 widget script tag to `index.html`. Confirm the badge appears on the live game.

**Test:** Visit the live subdomain. Vibe Jam 2026 badge appears in the bottom right corner.

---

## Phase 11 — Final Polish & Testing

### Step 39 — Stress Test Lobby
Simulate 6+ concurrent connections in the same room. Confirm world state sync holds under load. Confirm no memory leak in the server over a 10-minute session.

**Test:** 6 browser tabs in the same room for 10 minutes. All clients stay in sync. PM2 shows stable memory usage. No crashes.

---

### Step 40 — Full Playtest & Bug Pass
Play 5 complete rounds end to end with at least 2 players. Document all bugs. Fix all game-breaking issues. Fix as many minor issues as time allows.

**Test:** 5 rounds complete without a game-breaking crash or desync. All phases — lobby, round, summary, next round — function correctly across all 5 rounds.

---

*Implementation agent spec defined in a separate document.*
