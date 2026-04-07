# BAYOU BLITZ — Game Design Document
**Version:** 0.1  
**Author:** GOGG03  
**Jam:** Vibe Jam 2026  

---

## Vision Statement

Bayou Blitz is a fast, chaotic multiplayer airboat arena game set in the Louisiana bayou. Players race around procedurally generated swamp maps, collecting crawfish traps for points while ramming, netting, and knocking each other into the water. Gator hazards patrol the shallows. The round ends when the clock hits zero — most traps wins. No login, no download, instant join via URL.

---

## Player Fantasy

You are a bayou local in a beat-up airboat, outwitting and outmuscling every other boat on the water. The swamp is yours. The crawfish are yours. Nobody else is getting them.

---

## Genre & References

- **Genre:** Top-down multiplayer arena, physics-driven
- **Tone:** Loud, chaotic, Southern — fun and immediately readable
- **References:** Bumper cars (collision feel), Twisted Metal (arena aggression), Ridiculous Fishing (Louisiana absurdity), levelsio's fly.pieter.com (physics-driven browser multiplayer)

---

## Core Loop

1. Player enters a name and joins or creates a room via URL
2. Round starts — 3 minute timer begins
3. Players collect crawfish traps scattered across the map for points
4. Players can ram, net, or knock opponents to steal their traps or slow them down
5. Gator hazard zones patrol parts of the map — entering one damages your boat
6. When the timer hits zero, the leaderboard displays — most traps wins
7. New round starts automatically on the same map — or host can trigger a new map

---

## Match Structure

- **Round length:** 3 minutes
- **Players per room:** No hard cap — open lobby
- **Win condition:** Most crawfish traps collected when timer expires
- **Respawn:** Boats knocked into the water respawn at the map edge after 3 seconds — no elimination
- **Rooms:** Shareable URL — anyone with the link joins the same room instantly

---

## Player / Boat

### Stats
- **Speed** — base movement velocity
- **Handling** — turn radius responsiveness
- **Hull** — damage absorbed before knockback occurs
- **Fan Power** — ram force applied on collision

All boats start identical in v1. Differentiation is positional and skill-based only.

### Controls
- **WASD / Arrow Keys** — throttle and steer
- **Space** — fire net (slows target boat briefly)
- **Left click / E** — collect nearby crawfish trap

### Movement Model
- Airboat physics — momentum-based, slides on turns, does not stop instantly
- Facing direction and velocity are decoupled — the boat drifts
- Ramming into another boat transfers momentum — heavier impact at higher speed

---

## Crawfish Traps

- Scattered across the map at round start — fixed count based on map size
- Traps respawn at a new random location 10 seconds after being collected
- Each trap is worth 1 point
- Traps glow visibly on the water surface
- Collection is immediate on proximity — no button required

---

## Combat & Hazards

### Ramming
- Direct collision between boats transfers momentum
- A high-speed ram knocks the target off course and may push them into hazard zones
- No health system — boats cannot be destroyed by ramming alone

### Net Gun
- Short-range projectile fired from the bow
- On hit: target boat loses throttle for 2 seconds
- Cooldown: 5 seconds
- Requires getting close — limited range

### Gator Zones
- 2 to 4 patrol zones per map, marked by visible murky water
- Gators move slowly in a patrol loop within their zone
- Boat contact: brief knockback, 1 second stun
- Gator zones are map control tools — forcing opponents into them is a valid strategy

### Knockback into Water
- Certain map edges and obstacles are open water — falling in triggers respawn
- Respawn at nearest safe map edge after 3 seconds
- No score penalty for falling in — lost time only

---

## Map Design

### Procedural Generation Rules
- Top-down swamp map — water channels, land masses, dock platforms, reed clusters
- Driveable surface: open water channels and dock platforms
- Impassable: dense reed walls, cypress trees, shoreline
- Trap spawn zones across open water areas
- Gator patrol zones in mid-map choke points
- Every map has at least 2 open water highways and 2 tight corridor routes

### Map Size Scaling
- Small: 2–4 players
- Medium: 5–8 players
- Large: 9+ players

### Visual Landmarks
- Fishing shack dock — central spawn area
- Cypress groves — impassable obstacle clusters
- Murky gator water — visually distinct (darker, bubbling)
- Spanish moss — decorative, no collision

---

## Aesthetic

- **Camera:** Top-down orthographic, Three.js
- **Palette:** Deep bayou greens, muddy browns, warm amber dock lights, neon trap markers
- **Time of day:** Dusk — golden hour light, long shadows
- **Font:** Hand-painted style, Southern signage feel
- **Audio:** Zydeco-influenced loop — accordion, washboard rhythm, upbeat but gritty. Airboat engine SFX. Splash SFX. Gator growl on contact.
- **Feel:** Immediately readable — any player knows what to do within 10 seconds

---

## UI Layout (Conceptual)

```
┌─────────────────────────────────────────────┐
│  BAYOU BLITZ        ⏱ 2:34    👤 6 players  │
├─────────────────────────────────────────────┤
│                                             │
│              [ MAP VIEW ]                   │
│                                             │
├─────────────────────────────────────────────┤
│  🦐 You: 7pts    Leaderboard:               │
│  NET [ready]     1. T-Boy      12pts        │
│                  2. You         7pts        │
│                  3. Boudreaux   5pts        │
└─────────────────────────────────────────────┘
```

---

## Lobby & Room System

- Player visits game URL, enters a name, clicks Play
- Assigned to an existing open room or a new one is created
- Room URL is shareable — clicking it joins the same room
- Rounds start automatically when 2+ players are present
- No login, no account — name only

---

## Leaderboard

- End-of-round leaderboard shows all players, scores, and rank
- Global all-time leaderboard tracks highest single-round trap count
- Stored on VPS backend via Express + SQLite
- No authentication — name, score, timestamp only

---

## Win / Loss

- No elimination — all boats play the full 3 minutes
- Round winner is highest score when timer expires
- Ties broken by earliest trap collected timestamp
- After results screen (10 seconds), next round begins automatically

---

## Out of Scope for v1

- Boat customization or skins
- Weapon types beyond the net gun
- Team modes
- Persistent player stats across sessions
- Mobile touch controls
- Map voting or selection

---

## Open Questions

- Should gator zones deal cumulative damage over time or single-hit knockback only?
- Should the net gun be aim-directed or auto-target nearest boat?
- Does the map regenerate between rounds or persist per room session?
- Should trap count scale dynamically with player count or be fixed per map size tier?

---

*Tech stack, architecture, and implementation plan defined in separate documents.*
