# Naval War for Mac

Created: 2026-09-21
Status: milestones 1 and 2 implemented and verified; milestone 3 native online UI and HTTP transport implemented and checked locally; actual browser UI cross-play and hosted verification remain next.

## Goal and recommended direction

Deliver a standalone Mac game that preserves Naval War's accepted rules, supports fully offline bot matches, keeps online PvP compatible with browser players, and improves the table, controls, animation, and sound presentation.

Recommended stack: Swift + SwiftUI for the Mac application, SpriteKit for the animated table, and the existing TypeScript rules compiled to bundled JavaScript and executed through JavaScriptCore for offline games. Keep the existing Node server on Render authoritative for online games.

Assumption: Mac is the first target and the visual direction remains an illustrated 2D war table. Revisit the renderer before implementation if a fully 3D board or Windows release becomes an immediate requirement.

## What is already reusable

Current source inspection confirms:

- `src/engine.ts`: `applyCommand` and `listLegalCommands`; rules are separate from the browser UI.
- `src/types.ts`, `src/cards.ts`, `src/sample-data.ts`: commands, state, the card decks, setup and campaign round helpers.
- `src/session.ts`: filtered player views, seat identity, lobby lifecycle and bot decision logic. Bot decisions now live in the shared `src/bots.ts` module.
- `server.mjs`: HTTP API plus Socket.IO 4 transport. This is further along than the older introductory sections of README/Agents.md suggest.
- `prototype/app.js`: working reference UI and separate local gameplay logic; use it to compare behavior, not as another rules engine to port into Swift.
- `assets/cards/play/Modern/`, `assets/cards/ships/Modern/`: original card artwork and manifests.
- `assets/optimized/`: about 42 MiB on disk; existing web images are useful references, but native texture formats and sizes must be verified.
- `assets/War-Table.png`, splash/logo files, and `assets/sound/`: starting material for the Mac presentation.

The native app sources now live in `macos/Sources/`; `npm run build:mac` produces `macos/build/Naval War.app`. Verification is recorded in `macos/VERIFICATION.md`. Local source inspection does not prove that the deployed server runs the same revision.

## Technology choice

| Option | Fit for this project | Main tradeoff |
| --- | --- | --- |
| SwiftUI + SpriteKit + shared JS rules | Recommended for a Mac-first 2D card game | Requires a small Swift/JavaScript bridge and native view models |
| Unity / C# | Consider for a 3D tabletop or near-term multi-platform product | Adds editor/runtime workflow and a separate rules integration or port |
| Direct Metal | Reserve for a demonstrated rendering limitation | Requires building much more rendering infrastructure ourselves |
| Bundled web UI in a Mac shell | Fastest packaging milestone | Most of the UI remains the current browser implementation |

SpriteKit already uses Metal. Native packaging alone does not improve artwork or interaction; the gains come from deliberate layout, asset, animation and input work. A polished browser version is also possible, so keep the web client available for cross-play.

## One interface, two places to run the rules

```text
SwiftUI menus, lobby, settings + SpriteKit game table
                         |
                   GameSession API
                    /           \
       OfflineSession           OnlineSession
       JavaScriptCore           HTTPS API, then Socket.IO
       bundled shared rules     existing Render server
       local bot decisions      server rules and bots
       local saved games        filtered player views
```

The presentation submits commands and renders state/events. It never independently decides damage, legal moves, random results, or victory.

Offline:

- Bundle rules and all required artwork, sound and rules-reference content in the app. No Node installation, web server, login or network access should be needed by the player.
- Compile/bundle the shared TypeScript modules into a JavaScriptCore-compatible script with an explicit JSON bridge. Do not assume NodeNext module output can be evaluated directly by JavaScriptCore.
- Extract the existing server bot policy into a shared module, preserving its behavior initially. Use bounded bot steps off the UI thread so effects can play between actions.
- Save complete state, deck order, random-generator state, rules version and save schema atomically under Application Support. Validate saves before loading.
- Keep JavaScriptCore access serialized and turn JS exceptions into visible recoverable errors.

Online:

- Keep match authority, shuffles, dice and bot moves on Render. The Mac sends intents and receives only the permitted player view.
- Start with the existing HTTP create/join/ready/start/view/command endpoints and polling to prove Mac/browser compatibility. Add a compatible Swift Socket.IO client for realtime updates afterward.
- Socket.IO is not plain WebSocket; `URLSessionWebSocketTask` cannot directly replace its protocol.
- Preserve identity securely, fetch fresh state after reconnect, and prevent duplicate actions during retry. Add protocol/rules version checks before supporting independently updated clients.
- A lost connection pauses online interaction. Do not silently turn a shared match into an offline match or upload locally decided outcomes.
- The current service stores lobbies in memory. Recovery after a server restart requires server persistence, not just a Mac save file.
- Before wider distribution, review the existing token-optional identity paths and host-only actions; native UI restrictions do not secure server endpoints.

## Implementation milestones and exit criteria

1. **Shared-engine proof — verified 2026-09-21.** Add `src/mac-bridge.ts`, extract reusable bot decisions to `src/bots.ts`, and add a reproducible bundle step. Evaluate it in JavaScriptCore. Run identical scripted commands/random draws in Node and JavaScriptCore; compare state, events and rejected actions. Cover opening specials, Destroyer turn gates, Repair, smoke exceptions, carrier screening, deck exhaustion and campaign scoring. Exit: the same rules actually run in both runtimes.
2. **First playable Mac build — verified 2026-09-21.** Add a `macos/` target with native menus, bundled cards, an initial table and one human versus one bot. Support draw/play/discard, targeting, turn feedback and a completed Skirmish. Exit: with networking disabled, launch a packaged `.app`, finish a match, save, quit and reopen the exact saved position.
3. **Cross-play proof.** Add the online adapter and existing lobby workflow. Test one Mac player versus one browser player against a local server, then a disposable hosted match; add bots and 3/4-player rotated layouts. Exit: matching turn/state views, correct hidden hands, legal actions, and reconnect without duplicate moves. Verify the deployed protocol rather than assuming it matches this checkout.
4. **Full game and visual polish.** Complete Campaign progression, all supported seat counts, named saves, settings, readable card zoom, keyboard controls and accessibility. Add layered shadows, dealing and salvo animations, smoke, explosions and sound timing. Keep state updates independent of animation completion. Exit: gameplay regression checks pass and the actual packaged UI is inspected at multiple window sizes and display scales.
5. **Distribution.** Choose minimum macOS and CPU support, measure launch/memory/texture use, implement save migrations, and test updates. Sign/notarize the release for direct distribution, or separately assess Mac App Store requirements. Exit: a fresh Mac can install and play offline, and online compatibility/recovery is verified against the hosted service.

First milestone should prove the rules bridge and a single attractive, playable offline table before a broad visual redesign. Do not rewrite the full rules in Swift merely to make the app native.

## Asset and presentation plan

- Preserve original assets. Generate native runtime textures from an explicit manifest keyed by game card identifiers.
- Audit actual pixel dimensions and card text readability before promising sharper graphics. A larger texture cannot recover detail absent from its source.
- Bundle only runtime art, sounds and rules content; exclude source sheets, duplicate exports and build caches.
- Use table-size textures plus a detail tier for zoom. Test decoded GPU memory; compressed file size alone is insufficient.
- Keep controls/text in SwiftUI where practical and expose accessible equivalents for interactions rendered in SpriteKit.
- Start with the existing war-table identity: readable fleets, a clear active turn, generous card inspection and restrained effects. Settings should include sound, card scale and reduced motion.

## Implementation evidence (2026-09-21)

- Extracted the existing server bot decisions and command normalization into `src/bots.ts`, reused by the server and new offline session.
- Added `src/offline-session.ts` and `src/mac-bridge.ts`: seeded local games, one-step bots, human commands, hidden-hand views, Campaign continuation, versioned replay saves and atomic session replacement on restore.
- Added a dependency-bounded TypeScript bundle generator and a Swift JavaScriptCore parity harness. No browser or Node server is needed by the generated bundle.
- Node/bundle parity covered 12 complete matches spanning 24 rounds and 5,066 actions, including exact save/replay state and RNG checks. Apple JavaScriptCore matched 628 transcript requests and 20 targeted rules cases.
- Campaign testing exposed a pre-existing mismatch between legal commands and turn execution: a smoke-blocked mandatory Torpedo Boat offered end-turn but execution rejected it. Corrected the conflicting guard, including subsequent turns where the card remains blocked. Ordinary turns and discardable mandatory cards still require their action.
- Six local multiplayer-service matches completed with the extracted bots, covering 296 human commands plus automatic bot actions. This is not hosted or browser cross-play evidence.

## Local prerequisites and evidence

- Xcode reports a pending license agreement, but the separately installed Command Line Tools compile and run the native app successfully. Build/test scripts select that toolchain locally when needed; no system setting or license agreement was changed.
- The native app was built and visually played to a completed Skirmish under network denial, including exact quit/reopen recovery. Packaged-resource verification covered four rounds, 14 save reloads and 86 decoded artwork entries. See `macos/VERIFICATION.md`. Hosted cross-play is still unverified. The native HTTP adapter is implemented and tested locally and wired to the native lobby/game UI.
- Baseline `node --check prototype/app.js` and `npm run check` passed. A read-only hosted health request timed out after 35 seconds; this does not establish whether the service is down.
- Online match persistence and campaign transport need explicit verification during implementation; round helpers existing in the engine do not prove the full hosted flow.

## Official references

- [Apple SpriteKit](https://developer.apple.com/documentation/spritekit): 2D scene rendering, animation and Metal-backed graphics.
- [Apple SpriteView](https://developer.apple.com/documentation/spritekit/spriteview): displaying a SpriteKit scene in SwiftUI.
- [Apple JavaScriptCore / JSContext](https://developer.apple.com/documentation/javascriptcore/jscontext): evaluating JavaScript from Swift.
- [Socket.IO introduction](https://socket.io/docs/v4/): transport semantics and Swift client listing.
- [Unity 2D documentation](https://docs.unity3d.com/6000.0/Documentation/Manual/Unity2D.html): alternative engine workflow.
- [Apple Metal overview](https://developer.apple.com/metal/): low-level graphics API scope.

## Milestone 3 transport progress — 2026-09-21

`OnlineSession.swift` now handles compatible-server checks, create/join, ready/start, filtered snapshots, commands and reconnect. It uses HTTPS except for loopback development, keeps credentials off redirect requests, and requires a refresh after an uncertain mutation instead of replaying it.

Local verification completed a browser-protocol HTTP match (192 commands) and a native three-player match with one server bot (150 human actions, four fresh-client reconnects). Security checks covered private lobby-state redaction, hidden hands, token-required views/commands and host-only start/fill. The existing browser client was adjusted to send its token for host operations. These are local protocol tests, not GUI or hosted cross-play proof.

Native online lobby controls, Keychain credential storage, disconnected/reconnect UI and host-only Campaign next-round transport are implemented. Local UI checks covered host/ready/start, a legal attack, and exact visible state after quit/reopen using the saved Keychain identity. Campaign transport verification completed 153 human actions with four reconnects and rejected guest/early next-round attempts. Next: actual Mac/browser cross-play and hosted verification. No deployment was performed.

### Follow-up: Campaign browser controls and four-player layout

Implemented the browser host next-round control against the authenticated server route, with duplicate-click protection and stale-result cleanup. Native four-player guest Join/Ready/reconnect/End Turn was verified against a browser-protocol HTTP host plus two bots; public views agreed at turn 7. The native home fleet and hand now remain visible while opponents scroll. Actual browser UI cross-play remains unverified because browser automation timed out. Render remains unchanged.

### Follow-up: recovery race verified

Native transport rejects delayed snapshots from before the latest mutation, so an uncertain action cannot be accidentally unlocked by old polling data. A controlled local proxy test proved exactly one committed Ready and one post-recovery Start. Hosted health is reachable but omits nativeProtocolVersion, confirming the compatibility update remains undeployed. Full browser UI cross-play remains unresolved after another browser-control timeout.

### Follow-up: detailed artwork and development archive

Native inspection now uses the existing 1536×1024 zoom tier, loaded on demand; the table retains the 768×512 tier. All 170 bundled artwork entries decoded under network denial, with every detail image checked for double resolution. The 49.6 MB Apple Silicon development ZIP was extracted and its signature/executable verified. Public signing/notarization and hosted cross-play remain unfinished.

### Follow-up: browser transport updates and hidden draw logs

A mixed Socket.IO/HTTP regression exposed stale socket player IDs after match start. Server broadcasts now resolve the current player through the session token. The repaired path completed 133 mixed commands with both socket views matching native snapshots. A shared view filter removes hidden card kinds from opponent draw logs. Actual browser GUI cross-play still needs verification; switching to Chrome was requested and is pending.

### Follow-up: Destroyer gameplay parity

New offline attacks now share the hosted automatic victim selection helper. Prior-build saves with manual selections preserve exact replay, verified against captured golden views before selection, after selection and on the following turn. The user has an active native game; leave it running and use isolated test artifacts for further UI checks. Browser UI cross-play and hosted deployment remain pending.
