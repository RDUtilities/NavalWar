# Naval War for Mac

Milestones 1 and 2 are implemented and verified as of 2026-09-21. This is the first playable native offline build. Milestone 3 includes native online menus, lobby controls, Keychain reconnect storage and a locally tested HTTP transport. Hosted cross-play remains pending.

## Play

Open `macos/build/Naval War.app`. Choose Skirmish or Campaign, enter your name, and choose one to three bot opponents. Click a hand card, then a highlighted ship or a command in the left panel. Right-click a card to inspect it. Ready Destroyers and carrier strikes have dedicated command choices.

The app bundles its rules, cards and audio and requires no server, Node installation, login or network to play. Native build target: Apple Silicon / macOS 14 or later on this machine. The build script also selects Intel when building on an Intel Mac; that configuration has not been tested.

Games autosave after every accepted action to `~/Library/Application Support/Naval War/offline-autosave.json`. Resume from the menu after quitting. Starting a new game replaces this one autosave after a confirmation. Multiple named saves remain later work.

This is a locally signed development app, not a notarized public release.

## Build and verify

```sh
npm run build:mac
npm run test:mac-native
npm run test:mac-online
npm run package:mac
```

The scripts use the selected Apple Swift toolchain when available, or the separately installed Command Line Tools when Xcode's agreement is pending. No global developer-directory change or license acceptance is performed.

`test:mac-native` runs:

1. TypeScript/build checks and the 12-match Node/bundle comparison.
2. Targeted rule cases for opening specials, smoke, carrier screening, Repair, Destroyer gates and scoring.
3. The same match transcript and targeted cases in Apple JavaScriptCore.
4. Six multiplayer-service bot regression matches.
5. A native application build, asset packaging, and local signature verification.
6. A native host test using the packaged resources with network access denied, complete rounds, save/reload checks, invalid-save handling and decoding every bundled artwork entry.

Native test evidence is written to `build/native-verification.json`. The manual native playtest evidence is described in `VERIFICATION.md`. Generated bundles, fixtures, screenshots and `.app` builds are intentionally ignored by Git.

## Source map

- `Sources/NavalWarApp.swift`: SwiftUI menu, table, hand, legal target controls and result screen.
- `Sources/TableScene.swift`: SpriteKit table background.
- `Sources/GameModel.swift`: native session flow, bot pacing, audio and selection.
- `Sources/OfflineEngine.swift`: serialized JavaScriptCore host and atomic autosave.
- `Sources/OnlineLobbyView.swift`, `Sources/OnlineIdentityStore.swift`: native lobby controls and Keychain-backed reconnect credentials.
- `Sources/OnlineSession.swift`: server-authoritative HTTP lobby/match transport, compatibility check, token authentication, reconnect and no automatic action retries.
- `Sources/Models.swift`, `Sources/Artwork.swift`: native models and bundled card mapping.
- `../src/offline-session.ts`, `../src/mac-bridge.ts`: shared rules bridge, deterministic RNG and versioned replay saves.
- `../src/action-options.ts`: legal UI targets validated by the authoritative rules without consuming match randomness.
- `../src/bots.ts`: shared server/offline bot policy.

## Bridge contract

Evaluate `Resources/naval-engine.js`, then call `NavalWar.dispatch(requestJSON)`. Responses contain `ok: true` with `view` or `save`, or `ok: false` with an error. The native host serializes access off the main thread.

- `new`: `setup` includes 2–4 `playerNames`, `humanPlayerId`, unsigned 32-bit `seed`, `mode` and `campaignTargetScore`.
- `view`: visible state, legal human command names and validated action choices.
- `command`: exact shared `GameCommand`; actor must be the human seat.
- `bot_step`: one existing bot-policy action.
- `next_round`: Campaign continuation when no match winner exists.
- `save`: versioned setup and accepted command/round history.
- `restore`: replay into a new session, replacing the current session only on success.

Views hide enemy hands and deck contents. Local save replay restores full state and future randomness; it is not an authoritative online recovery payload. Changes to the save/rules contract require migration or an explicit incompatibility message.

`NAVAL_WAR_TEST_SAVE_DIR` isolates native UI tests from the user's autosave. The automated native host tests also use their own temporary directories. The test-only rules bundle under `build/` exposes fixture entry points and is never packaged into the app.

## Next

Verify a Mac player and browser player through both actual UIs, then in the same hosted match. Native host/join/ready/start and reconnect controls are implemented. The new transport requires `nativeProtocolVersion: 1`; the existing Render deployment has not been updated. Later work includes richer effects, named saves, broader accessibility/display checks and distribution signing/notarization. See `../MAC_APP_PLAN.md` for the full goal.

## Local online transport checks

`npm run test:mac-online` starts a disposable local Node server, checks private-state redaction and host/token requirements, completes a match through the browser-compatible HTTP endpoints, then completes a native three-player match with a server bot and fresh-client reconnects. The server process is stopped afterward. Evidence is written to `build/online-transport-verification.json`. This does not test the actual browser UI or contact Render.

Public lobby responses omit game state, tokens and reconnect client identifiers. Game views/commands require a session token. Host start/fill-bot controls enforce host identity; browser REST calls have been updated to send their existing token. Sessions use cryptographically random UUIDs (Node 20+). The browser service-worker cache is v12 for the associated client update.

Online UI tests use `NAVAL_WAR_TEST_SERVER` and `NAVAL_WAR_TEST_KEYCHAIN_ACCOUNT` in addition to the isolated save directory. Online actions never write the offline autosave. The host can advance a completed Campaign round; guests cannot.

Online Campaign hosts can also advance rounds from the browser result banner. `npm run test:browser-campaign` covers this controller flow; the full browser GUI still needs cross-play verification. The native table keeps your own fleet and hand pinned while opponents scroll.

The online test runner also deliberately loses a committed action response and delays an older snapshot. It verifies that recovery requires fresh state and sends neither automatic retries nor premature follow-up actions.

## Development package

`npm run package:mac` rebuilds and creates `build/Naval War-development.zip`, then extracts it into a temporary directory and verifies its signature and executable. `build/package-verification.json` records architecture, size and SHA-256. The current archive is Apple Silicon, 49.6 MB, targets macOS 14+, and has only a local development signature. It is not a notarized public release.

Card inspection uses bundled 1536×1024 artwork, separate from the 768×512 table tier. Both are available offline; the image cache loads large images only when requested. Native resource verification checks every card has a detailed counterpart with twice the table resolution.

Online verification includes a mixed Socket.IO/HTTP match using the browser client bundle, checking live broadcasts against native snapshots. Both offline and online views hide the card kind in opponents' ordinary draw logs. See `RELEASE_READINESS.md` for the remaining deployment gates.

Destroyer Squadron attacks use the same automatic first-afloat victim order offline and online after you choose a target fleet. Older development saves that paused for manual victim selection remain loadable and retain their recorded selections. The native verification runner includes a prior-build golden-save compatibility check.

### Native presentation preview

`node scripts/build_mac_app.mjs --preview` builds `macos/build/Naval War Preview.app` with a separate bundle identity, leaving the regular app bundle intact. `node scripts/package_mac_app.mjs --preview` packages that preview separately. For testing, launch it with the isolated save and Keychain environment variables described above. For normal play, quit the regular game before opening the preview: without test variables both use the normal Naval War save location.

The full-table layout shows every opponent side by side, with your fleet and hand pinned below. Drag fleet-wide cards anywhere inside a legal fleet box, including over its ships, or select a card and click the highlighted target. Salvos target individual ships or deployed Destroyer cards. Native ship labels show remaining HP and gun caliber. Large fleets share vertical scrolling; large hands scroll horizontally. Sunk ships collapse into an inspection menu after the sinking animation. Orders & Log opens the optional command and history panel. Attached damage cards appear on ships; right-click and inspect a ship to read its full attachment list. The hand stays visible while the table scrolls. Combat effects follow confirmed damage/sinking and honor the Mac Reduce Motion preference.

`npm run test:mac-presentation` verifies native targeting and combat presentation against actual engine positions; it is also included in `test:mac-native`.

Native builds require `ffmpeg` on PATH. The build converts sound assets to standard 16-bit PCM WAV for macOS; originals remain unchanged (some `.wav` source files actually contain QuickTime audio). `node scripts/test_mac_audio_assets.mjs 'macos/build/Naval War Preview.app/Contents/Resources'` compares decoded samples for all 16 web sounds and verifies native decoding/playback. The regular native test suite runs the same check against its regular app build.

Ready Destroyers take priority over hand-card selection. Click **Attack [opponent] with Destroyers** on the highlighted fleet, or any highlighted afloat ship. Click your ready Destroyer card to aim it, or drag it onto an enemy fleet. Enemy Destroyers remain visible with their remaining HP and can be targeted by Salvos while waiting. Newly deployed squadrons wait until the next turn; if every fleet is smoke-blocked, use the offered discard action.

Dice attacks now reveal an animated die, the actual face, the applicable rule, and HIT/MISS or sink count before the board updates. This applies to human/bot and online updates; multiple rolls are presented in order. Last Roll retains the latest result and recent rolls in the command panel. Reduce Motion suppresses die spinning. Destroyers show the raw face separately from the capped sink count; older hosts without raw metadata show the resolved sink count without inventing a die face. `npm run test:mac-dice` covers every face, outcomes and presentation order.
