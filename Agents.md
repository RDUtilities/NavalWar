# Naval War Game Agent Guide

Last updated: 2026-05-11

This file is the working handoff map for agents contributing to the Naval War Game project. Keep it practical: update it when scope changes, when a workstream moves from planned to active, or when a future agent needs a reliable place to resume.

## Project Goal

Build an online-playable Naval War style card game with:

- a server-authoritative rules engine
- 1-4 player games with any mix of humans and bots
- Skirmish and Campaign modes
- lobby and seat assignment for online multiplayer
- a polished browser/PWA client
- optimized web-friendly card, table, sound, and rules assets

## Current Source Of Truth

- Engine and shared types: `src/`
- Multiplayer lobby/session scaffold: `src/session.ts`
- Seat layout and rotation helpers: `src/multiplayer.ts`
- Card/deck definitions: `src/cards.ts` and Modern asset manifests
- Current playable prototype: `prototype/index.html`, `prototype/app.js`, `prototype/styles.css`
- HTML rules page: `prototype/rules.html`
- Play card assets: `assets/cards/play/Modern/`
- Ship card assets: `assets/cards/ships/Modern/`
- Sound assets: `assets/sound/`

## Current Progress

- The prototype is playable locally against bots.
- The play deck is defined as the Classic Set: 108 cards.
- The ship deck is defined as the Classic Set: 54 unique ships.
- Skirmish and Campaign mode prototypes exist.
- Local browser save/load exists as a single localStorage save slot.
- Multiplayer seat/layout helpers exist for 2, 3, and 4 player layouts.
- An in-memory multiplayer service exists, but no WebSocket transport is wired yet.
- The Rules PDF is being converted into `prototype/rules.html`.
- Extracted rules artwork exists under `prototype/rules-art/pages/`.
- Runtime image optimization and PWA caching are still pending.

## Important Rules Decisions

- Players get 5 random shuffled ship cards at round start.
- Ships do not have to match player country.
- Aircraft carriers sit behind the fleet and cannot be targeted by salvos until all non-carrier ships in that fleet are sunk.
- A player may either draw from the Play Deck or use carrier air strikes at the start of their turn.
- If a player draws normally, they must take exactly one play-phase action: play a legal card, resolve a mandatory special card, or discard a card.
- Mandatory special cards are Minefield, Submarine, Torpedo Boat, Additional Damage, and Additional Ship.
- Additional Ship is now played from hand onto the battle zone or discard pile, then draws one ship from the finite Ship Deck.
- Additional Damage can only target enemy ships that already have attached salvos.
- Smoke blocks all attacks except Submarine and Additional Damage.
- Minefields cannot be played on the owner's own fleet.
- Minefields damage every ship in the target fleet and remain until removed by Minesweeper.
- Repair removes exactly one attached salvo from one damaged ship.
- Destroyer Squadron sits in the battle zone with 4 hit points, can be attacked before activation, and scores no victory points if destroyed.
- Salvos and Additional Damage attach to ships and move to the discard pile when the ship sinks or the damage is repaired.
- The round ends when only one player has ships afloat or when the Play Deck runs out.
- In Skirmish, if the Play Deck runs out, the winner is determined by ships in Victory Pile, then captured hit points.
- In Campaign, round score is hit points in each player's Victory Pile; first to target score wins.

## Workstreams

### Engine Rules

Scope:
- keep authoritative rules in TypeScript under `src/`
- mirror prototype behavior only when it matches the accepted rules
- add tests around rules as the engine stabilizes

Key files:
- `src/engine.ts`
- `src/types.ts`
- `src/cards.ts`
- `src/sample-data.ts`

Known next steps:
- add automated tests for mandatory special-card flow
- add tests for carrier screening and smoke exceptions
- add tests for campaign scoring and tie-breaker behavior
- keep prototype-only animation state out of the engine

### Prototype UI

Scope:
- maintain the current local playable browser prototype
- preserve the war-table visual style and current asset paths
- keep interactions ergonomic for desktop and future mobile/PWA play

Key files:
- `prototype/index.html`
- `prototype/app.js`
- `prototype/styles.css`

Known next steps:
- continue gameplay bug fixes from playtests
- refine table layout for 2, 3, and 4 player games
- keep target board behavior aligned with the main board
- avoid changing unrelated engine scaffolding while making prototype-only fixes

### Multiplayer

Scope:
- build server-authoritative online play
- clients send player intents; server validates and broadcasts filtered state
- each client sees their own fleet/hand at the bottom via rotated seat layout

Key files:
- `src/session.ts`
- `src/multiplayer.ts`
- future `server/` entrypoint

Known next steps:
- add WebSocket server transport
- add create/join/start lobby events
- add filtered per-player state broadcasts
- add reconnect-safe player identity handling
- add bot turns on the server side
- later add persistence for online saves and reconnects

### PWA And Deployment

Scope:
- make the game deployable to Render and installable as a PWA
- keep asset paths relative and web-host friendly

Key files:
- future server entrypoint
- future manifest and service worker
- `package.json`
- `prototype/`

Known next steps:
- add Render-ready Node server
- serve the browser client from the server
- wire WebSocket transport
- add `manifest.webmanifest`
- add service worker caching for shell, rules, sounds, and optimized assets

### Assets

Scope:
- keep original/source assets available
- create optimized runtime assets for web play
- avoid slow card flashes during online play

Key files:
- `assets/cards/play/Modern/manifest.json`
- `assets/cards/play/Modern/deck-definition.json`
- `assets/cards/ships/Modern/manifest.json`
- `assets/sound/`

Known next steps:
- create an optimized web asset pipeline
- generate WebP runtime card images
- decide medium and zoom image sizes
- preload selected card set before entering a match
- cache assets with the PWA service worker

### Rules HTML

Scope:
- replace heavy PDF viewing with a polished HTML rules reference
- use extracted artwork where helpful
- keep rules text aligned with the implemented engine decisions

Key files:
- `prototype/rules.html`
- `prototype/rules-art/pages/`
- `scripts/render_pdf_pages.swift`

Known next steps:
- review `rules.html` page by page with the user
- crop additional PDF artwork callouts as needed
- remove or replace broken references if source art changes
- eventually remove the large PDF from runtime delivery if HTML fully replaces it

## Verification Commands

Run these before handing off code changes:

```bash
node --check prototype/app.js
npm run check
npm run build
```

Use `npm run build` when TypeScript source changes. For HTML/CSS-only changes, at least open the relevant HTML file and visually inspect it.

## Git And Collaboration Notes

- The GitHub repo is `https://github.com/RDUtilities/NavalWar`.
- The main local workspace is `/Volumes/MacMiniStorage/CodexProjects/Naval War Game`.
- Do not revert unrelated local changes.
- Keep future branches prefixed with `codex/` unless the user asks otherwise.
- Commit only intentional, related changes.
- Mention any uncommitted work you leave behind.

## Handoff Checklist

When an agent finishes a workstream slice, update this file if any of these changed:

- accepted gameplay rule behavior
- source-of-truth files
- active workstream status
- deployment assumptions
- asset pipeline decisions
- verification commands
- known next steps

Include the user-visible result in the final response, not just the internal implementation detail.

## Changelog

Use this as the shared branch/workflow sync log. Add newest entries at the top.

Entry format:
- `YYYY-MM-DD HH:MM TZ` — short title
- Scope: files/components touched
- Result: user-visible behavior change
- Verification: commands run and result

### 2026-05-11

- `2026-05-11 22:32 America/Chicago` — Server-driven active sides for rotated multiplayer layouts
- Scope: `prototype/app.js`
- Result: Joined clients now adopt the host lobby's server player count and active seat sides instead of relying on their local setup dropdown. This fixes rotated 3-player views where a guest could hide the host on the right side and show an empty default Admiral Tanaka seat, which also blocked valid discard/Destroyer targeting flows.
- Verification: `node --check prototype/app.js` (pass), `npm run check` (pass), `npm run build` (pass)

- `2026-05-11 21:22 America/Chicago` — Sunk ship persistence and ready Destroyer UX
- Scope: `src/engine.ts`, `prototype/app.js`
- Result: Sunk ships are no longer removed from the authoritative fleet list, allowing clients to keep showing the ship-card back with SUNK status while still awarding the ship to the attacker's Victory Pile. Ready Destroyer Squadrons now appear as virtual activation cards in the local player's hand, can be played onto legal enemy fleets, and respect smoke targeting. Air Strike targeting now rejects screened carriers before sending a server command, and turn banners are shown after server event banners/sounds so they are less likely to be overwritten.
- Verification: `node --check prototype/app.js` (pass), `npm run check` (pass), `npm run build` (pass), `npm run simulate:quick` (pass; 20/20 completed)

- `2026-05-11 20:42 America/Chicago` — Live multiplayer UI polish for sync, sunk ships, and dice feedback
- Scope: `prototype/app.js`, `prototype/styles.css`
- Result: Server views now skip redundant re-renders to reduce browser flicker during hosted multiplayer. Server-mapped sunk ships remain visible with the ship-card back and SUNK badge on the main board and target board. Server dice events now show the dice-resolution banner for air strikes, submarines, torpedo boats, and destroyer rolls. Added a brief Next Turn banner when server turn ownership advances.
- Verification: `node --check prototype/app.js` (pass)

- `2026-05-11 20:xx America/Chicago` — Online Air Strike targeting and server-event audio
- Scope: `prototype/index.html`, `prototype/app.js`
- Result: Live human test on lobby `Q89RRA` showed server-linked Air Strike could create virtual carrier cards but target selection was overwritten by server draw-phase refreshes. Server views now preserve local air-strike target-selection mode while `use_carrier_strike` is legal, carrier strike targets honor smoke and carrier screening, and synced server combat-log events now trigger sounds for salvos, sinking, dice rolls, mines, smoke, destroyers, repairs, draws, and air strikes. Added a top-bar Sound toggle to unlock/test browser audio.
- Verification: live lobby inspection confirmed Rob had `draw_card` + `use_carrier_strike`; `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass)

- `2026-05-11 18:xx America/Chicago` — Opening special discard/drop UI fix
- Scope: `prototype/app.js`
- Result: Live human test on lobby `6MLZDG` showed the server allowed Miles to discard opening Additional Damage and play Additional Ship, but the browser blocked those drop targets. Discard pile targeting now allows server-legal opening Additional Damage/Minefield discards, and dropping Additional Ship on the discard pile resolves `play_additional_ship` instead of sending an invalid discard command.
- Verification: live lobby inspection confirmed server legal commands were `discard_play_card` and `play_additional_ship`; `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass)

- `2026-05-11 13:xx America/Chicago` — Live Render multiplayer follow-up fixes
- Scope: `src/engine.ts`, `src/session.ts`, `server.mjs`
- Result: Fixed live-test findings from 2-human + 1-bot Render matches: `play_salvo` no longer appears unless the player has a matching afloat gun caliber, per-view seat layouts now mark the viewer as `isLocalPlayer`, and API rule rejections now return HTTP 400 `Request rejected` instead of looking like server crashes.
- Verification: live Render API tests reached 75 + 75 command steps locally and 70 command steps in a subagent with no sync mismatch; `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass), local API smoke confirmed guest bottom seat is local and nonmatching salvos only expose discard (pass)

- `2026-05-11 12:xx America/Chicago` — Server turn-order and bot targeting stabilization
- Scope: `src/engine.ts`, `src/session.ts`
- Result: Server legal commands now enforce the normal turn sequence: draw or carrier strike first, then exactly one play/discard action before end turn. Normal play actions can no longer appear before draw, draw cannot happen after a play action, and end turn cannot appear before the required action. Ready Destroyer Squadrons now block draw/airstrike/hand plays and must resolve on the owner's next turn. Bot targeting now respects smoke protection and carrier screening so bot continuation cannot crash a valid human command.
- Verification: `npm run check` (pass), `npm run build` (pass), local API stress with 2 humans + 1 bot across 5 matches / 620 human-command steps (pass; no turn-sequence invariant failures; Destroyer Squadron resolved when ready in 4 matches)

- `2026-05-11 11:xx America/Chicago` — Multiplayer browser sync hardening
- Scope: `server.mjs`, `prototype/app.js`
- Result: REST lobby/game actions now emit lobby and match updates to connected sockets; clients keep polling as a safety net even when realtime is available; disconnected realtime no longer marks the server session unusable; page refresh can resume an in-progress match directly from saved session data.
- Verification: `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass), local REST sync smoke confirmed both human views advanced after one end-turn command (pass)

- `2026-05-11 10:xx America/Chicago` — Multiplayer opening-turn API gate fix
- Scope: `src/engine.ts`, `src/session.ts`
- Result: Opening special-card cleanup now requires the first-round manual `end_turn` before normal draw/play commands unlock. API player views now expose `openingTurnPendingPlayerIds` for client/debug visibility.
- Verification: `npm run check` (pass), `npm run build` (pass), `node --check server.mjs` (pass), local API smoke with 2 humans + 1 bot cleared opening specials and advanced to turn 6 (pass)

- `2026-05-11 09:xx America/Chicago` — Desktop select-target interaction option
- Scope: `prototype/index.html`, `prototype/app.js`
- Result: Added a `Drag Cards` top-bar toggle. Desktop defaults to click/select targeting like mobile, with selected cards highlighted and legal targets glowing; enabling the toggle restores drag-based card play/reordering.
- Verification: `node --check prototype/app.js` (pass), `npm run check` (pass), `npm run build` (pass), local browser pass via `http://localhost:3000/prototype/index.html` (pass)

### 2026-05-09

- `2026-05-09 13:xx America/Chicago` — Solo/Multiplayer setup split + lobby ready-check start gate
- Scope: `prototype/index.html`, `prototype/styles.css`, `prototype/app.js`, `src/session.ts`, `server.mjs`
- Result: Added explicit setup mode switch (`Solo` vs `Multiplayer`). Solo starts directly without lobby flow. Multiplayer now includes host/join/ready workflow with per-player ready indicators and host start gating until all human players are ready. Added server `ready` endpoint and pre-start readiness enforcement.
- Verification: `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass)

- `2026-05-09 11:xx America/Chicago` — Multiplayer reconnect identity + touch-play improvements
- Scope: `src/session.ts`, `server.mjs`, `prototype/app.js`, `prototype/styles.css`
- Result: Added persistent per-client identity (`clientId`) and by-code reconnect flow so joined humans can reattach to active lobbies/matches; client now stores/restores server session and uses reconnect during `Enter Match` fallback. Added touch-device tap-to-select/tap-to-target card play fallback and selected-card visual state to improve mobile playability where drag is difficult.
- Verification: `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass), session sanity check confirmed viewer-rotated layout keeps local player at bottom.

### 2026-05-08

- `2026-05-08 12:xx America/Chicago` — Host/Join lobby UI flow (no console)
- Scope: `prototype/index.html`, `prototype/app.js`, `server.mjs`, `src/session.ts`
- Result: Added menu-level `Host Lobby`, `Join Lobby`, `Start Match`, join-code input/copy, plus server join-by-code endpoints and client wiring so two humans can join same lobby before host fills remaining seats with bots and starts.
- Verification: `node --check prototype/app.js` (pass), `node --check server.mjs` (pass), `npm run check` (pass), `npm run build` (pass)

- `2026-05-08 11:xx America/Chicago` — Prototype start flow linked to server lobby API
- Scope: `prototype/app.js`
- Result: `Start Game` now attempts server session bootstrap (`/api/health`, create lobby, fill bots, start match, fetch host view) and records link status; local gameplay remains active fallback if API is unavailable.
- Verification: `node --check prototype/app.js` (pass), `npm run check` (pass)

- `2026-05-08 10:xx America/Chicago` — Server-backed multiplayer API baseline
- Scope: `server.mjs`, `README.md`
- Result: Replaced static-only server with API + static host server exposing create/join/fill/start/view/command routes backed by `InMemoryMultiplayerService` from `dist/session.js`.
- Verification: `npm run build` (pass), `node --check server.mjs` (pass), local API smoke flow create/join/fill/start/view (pass)

- `2026-05-08 09:xx America/Chicago` — Render deployment bootstrap (static host path)
- Scope: `package.json`, `server.mjs`, `render.yaml`
- Result: Added Node static server (`npm start`) that serves the prototype and redirects `/` to `/prototype/index.html`; added Render blueprint config for build/start/health check.
- Verification: `npm run check` (pass), local start command available (`npm start`)

- `2026-05-08 08:xx America/Chicago` — UI pass for Skirmish/Campaign clarity
- Scope: `prototype/index.html`, `prototype/styles.css`, `prototype/app.js`
- Result: Added `Round` status pill, mode-aware scoring hint near `Score Card`, richer winner banner mode text, and mobile `More` utility menu for Save/Quit/Menu while keeping desktop direct buttons.
- Verification: `node --check prototype/app.js` (pass), `npm run check` (pass)

- `2026-05-08 07:xx America/Chicago` — Engine stability and simulation hardening
- Scope: `src/engine.ts`, `src/simulation.ts`, `src/sample-data.ts`, `package.json`
- Result: Resolved stuck turn flows, improved action fallback handling, added campaign simulation sweeps and fairer randomization policy; 200-game sweeps completed with no stuck failures.
- Verification: `npm run check` (pass), `npm run simulate:quick` / campaign sweeps (pass)
