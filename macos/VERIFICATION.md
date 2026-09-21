# Milestones 1 and 2 verification — 2026-09-21

## Milestone 1: shared engine — passed

- Built the browser-independent TypeScript bundle and evaluated it in Apple JavaScriptCore.
- Node/bundle sweep: 12 complete matches, 24 rounds, 5,066 commands, including Campaign continuation and save replay preserving future RNG state.
- Apple JavaScriptCore matched the 628-request Skirmish/Campaign transcript exactly.
- Twenty targeted Node/JavaScriptCore cases passed: opening special resolution, smoke protection and exceptions, screened carrier attacks, one-attachment Repair, ready Destroyer draw blocking, pending Destroyer target selection, blocked Destroyer discard, Skirmish captured-ship/point tie-breaks and Campaign scoring/ties.
- Six multiplayer-service matches completed after sharing the bot policy: 296 simulated human commands plus automatic bot actions. These were local service tests, not hosted cross-play.
- Confirmed fixes: direct commands can no longer bypass ready/pending Destroyer gates; Skirmish deck-exhaustion scoring now matches the accepted captured-ships/then-captured-points rule. Earlier blocked-mandatory-card turn regression remains covered.

## Milestone 2: playable offline Mac app — passed

- Built a 19 MiB Apple Silicon `.app` with native SwiftUI controls, SpriteKit background, 86 bundled artwork entries and sound resources.
- Local signature passed `codesign --verify --deep --strict`.
- Native host using the actual packaged resources completed 628 requests, four rounds and 14 fresh-host save/reload checks. All 86 artwork entries decoded. Malformed-save rejection preserved the active game.
- Native host tests ran under `sandbox-exec` with `(deny network*)`.
- Launched the actual packaged GUI with the same network-denial policy and an isolated save directory.
- Played a human-versus-bot Skirmish through the real native controls to completion at turn 57. Admiral North won by elimination; final captures were 8 ships / 43 points versus 3 ships / 18 points.
- Exercised opening Additional Ship, additional-damage discard/replacement, normal draws/discards, Smoke, Salvo and Submarine targeting, Minefield, Destroyer deployment/activation/two-ship target selection, sinking feedback and the result screen.
- Quit at turn 12, launched a fresh app process, resumed through the menu, and confirmed the saved bytes were identical and the same turn, ships, damage and hand were shown.
- Opened the native ship-inspection sheet and verified its name, artwork and remaining hit points.

## Persisted evidence

Generated evidence is local and ignored by Git:

- `build/native-verification.json`: native packaged-resource test report.
- `build/ui-verification.json`: native UI action trace and final accessibility state. Includes a few unsuccessful attempts by the test controller to click the correctly disabled Confirm Targets button before selecting ships; the target-selection flow then completed normally.
- `build/native-table.png`: the live table at turn 12.
- `build/native-round-complete.png`: completed offline match.
- `build/ui-resume-before.json`: the save used for the quit/reopen comparison.
- `build/ui-verification-save/offline-autosave.json`: completed disposable UI test game.

## Remaining scope

The online transport and native online UI are implemented and checked locally. The Render deployment was not changed. Named saves, richer animation, broad display/accessibility checks, Intel verification and public distribution signing/notarization remain future work. Current source is being collected on review branch `codex/native-mac-game`; historical entries below describe the state at each verification.

## Milestone 3 foundation — local transport verified

- `OnlineSession.swift` compiled successfully using the installed Command Line Tools.
- A native host and guest completed a three-player game with a server bot: 150 human commands, four fresh-client credential reconnects, matching state and hidden-hand checks.
- A separate game completed using browser-compatible HTTP calls: 192 commands. This exercised the existing request/response contract, not the browser GUI.
- Public create/join/start/command/lobby responses omitted full match state, session tokens and reconnect client identifiers. Tokenless game views/commands and guest start/fill-bot requests were rejected.
- Existing six-match shared-bot regression passed after the authentication changes (296 human commands). Type checking and browser/server/service-worker syntax checks passed.
- Evidence: `build/online-transport-verification.json`; rerun with `npm run test:mac-online`.
- Native UI integration, Keychain credential storage, reconnect UI and Campaign round progression are now implemented. Actual Mac/browser UI cross-play and hosted deployment/verification remain. Render remains unchanged.

## Native online UI and Campaign follow-up

- App build and native online tests passed. A native Campaign round completed with 153 human actions and four reconnects; host advanced the next round, while guest and premature advances were rejected. Browser-compatible HTTP Skirmish completed 203 commands.
- Actual app UI on an isolated local server: host lobby, ready gate, start with a server bot, Submarine target selection and server-resolved attack all passed.
- Quit/relaunch restored the Keychain session and showed identical turn, hand, fleet and event text. Evidence: `build/online-ui-before-resume.txt`, `build/online-ui-after-resume.txt`, `build/online-native-table.png`.
- UI tests used a separate Keychain account and save directory; they did not touch the user's offline save. This was native versus server bot, not native versus an actual browser window.
- Suspending the disposable server produced the visible disconnected state and disabled hand interaction; resuming it and pressing Reconnect restored the unchanged match. Captured in `build/online-ui-disconnected.txt` and `build/online-ui-reconnected.txt`. The final build additionally disables draw/end/attack controls while disconnected.

## Four-player guest and browser Campaign controller

- Native guest joined a four-player Campaign through its actual Join/Ready UI. The host used browser-compatible HTTP calls; two seats were filled by server bots. This does not establish actual browser UI cross-play.
- Guest resumed through Keychain after an app rebuild, then sent End Turn through the app. Both native and host protocol views showed turn 7, host active, matching public fleet damage and hidden opponent hands.
- Changed native layout to keep the home fleet outside the opponent scroll area. Visually inspected the rebuilt app: home fleet, battle zone and hand remain on screen. Screenshots: `build/online-four-player.png` (before), `build/online-four-player-pinned.png` (after). State evidence: `build/online-four-player-guest.txt`, `build/online-four-player-host-view.json`.
- Browser controller regression executes actual source functions and verifies host/guest actions, authenticated round request, duplicate-click guard, server refresh, tied winners, result-banner cleanup and unchanged solo progression. Run `npm run test:browser-campaign`; also included in `test:mac-online`.
- Latest local transport run passed: native Campaign 142 actions/four reconnects; browser-compatible HTTP Skirmish 124 actions. App build, JavaScript syntax and TypeScript checks passed.
- Actual browser automation timed out on page operations, including after trying a fresh tab. No successful browser GUI interaction or hosted test is claimed.

## Delayed refresh / lost action-response regression

- `OnlineSession` now associates snapshots with the local mutation revision and rejects cancelled snapshots before clearing the uncertain-action guard.
- `OnlineFailureTests.swift` and `scripts/online_failure_proxy.mjs` run against the real disposable game server. They hold a pre-action snapshot, let Ready commit while dropping its response, then deliver the old snapshot. The transport must reject that snapshot, reject another action before a fresh refresh, recover the accepted Ready state, and successfully Start afterward.
- Proxy counters require exactly one Ready request and one Start request, detecting automatic replay and premature requests. The failure suite is included in `npm run test:mac-online`; evidence is in `build/online-transport-verification.json` under `failureRecovery`.
- Read-only hosted health check succeeded and returned `{ "ok": true, "multiplayer": true }`, without `nativeProtocolVersion`. This confirms the hosted service still needs the native-client server update. No deployment was performed. Browser automation was retried, but page operations still timed out after initial load.

## Retina artwork and development ZIP

- Full `npm run test:mac-native` passed after adding detailed artwork: 12 matches / 24 rounds / 5,066 actions; 20 targeted rule cases; 628 JavaScriptCore transcript requests; six shared-bot matches; four packaged-resource rounds and 14 exact restores with networking denied.
- Decoded all 170 artwork entries and verified each card has a corresponding detail image with at least twice the table image dimensions.
- Launched the rebuilt app under network denial, resumed the disposable completed Skirmish, and inspected Scharnhorst: detailed art and remaining HP displayed correctly. Screenshot: `build/retina-card-inspection.png`.
- `scripts/package_mac_app.mjs` created `build/Naval War-development.zip` (49.6 MB, arm64), extracted it into a temporary directory, verified the extracted signature, and compared the executable hash. `build/package-verification.json` records archive SHA-256 and verification results. This archive is locally signed and not notarized.

## Mixed transport and event privacy

- New `scripts/test_socket_interop.mjs` uses the same Socket.IO client bundle served to browsers, running in Node without a browser UI. It creates/joins/readies/starts a lobby through sockets, rejects guest start, alternates socket and HTTP gameplay with a server bot, and checks live broadcasts on both sockets against the native snapshot endpoint.
- The first run exposed missing match broadcasts: startMatch changes lobby player IDs to engine seat IDs, leaving socket references stale. `attachedLobbySockets` now resolves each socket by its stable authenticated session token before broadcasts and updates its player ID. It sends to every authenticated connection, including multiple connections for one seat.
- Post-fix run completed 133 commands; both sockets received each update and native guest snapshots matched. Hidden hands and ordinary drawn-card kinds were absent from opponent views. Native transport completed 142 actions/four reconnects; HTTP match completed 113 commands; dropped-response regression passed.
- `src/visibility.ts` filters ordinary draw event descriptions in both offline and online player views. The authoritative event history and own/public event details remain unchanged. Full native suite passed; extra Node assertions checked opponent draw messages across all 5,066 replay actions. Development ZIP was regenerated and verified.
- This is protocol integration evidence, not a successful actual browser GUI cross-play test. A question about using Chrome is pending after repeated in-app browser timeouts.

## Destroyer interaction parity and legacy replay

- Extracted the existing hosted first-afloat target order into `automaticDestroyerSelection` in `src/bots.ts`; both online and offline session adapters now use it. New native offline human/bot roll actions resolve victims immediately, without adding a manual selection step.
- Offline saves record both the roll and automatic selection as individual accepted commands. Restore replays recorded commands directly, without adding a second selection. The combined live action rolls back state, random state and history if either part fails.
- Full native suite passed: 12 matches, 24 rounds, 5,025 action requests; 622 JavaScriptCore transcript requests; 20 targeted rules; six server matches; four packaged rounds, 14 exact restores, 170 decoded artwork entries with networking denied.
- `macos/Tests/Fixtures/legacy-destroyer-save.json` is a disposable native playtest save captured from the previous build. Golden hashes cover exact visible state before manual selection, after the recorded chosen victims, and after the following End Turn. `scripts/test_mac_legacy_save.mjs` passed and is included in the full native runner.
- Online checks after the shared helper change passed: mixed socket/HTTP 77 commands; native Campaign 55 actions/one reconnect; HTTP match 232 commands; dropped-response recovery passed.
- An actual user game was found running in the app. No UI clicks, quit, relaunch or save changes were performed on that match. New automatic behavior is verified through the packaged native engine and transport checks; no new GUI playtest is claimed for this change.

## 2026-09-21 — Native card targeting and combat presentation

- Fleet-wide commands now highlight the fleet with an explicit Play Minefield button and accept clicks on any afloat ship in the legal target fleet. Salvos remain ship-specific.
- Native Ship decoding includes authoritative attachments. Damage cards appear over the ship and in its inspection sheet; repair/sinking follows the next authoritative attachment list.
- Cards default to 210 points (previously 146/150), adjustable 180–260; discard scales too. The table scrolls vertically and fleet/hand rows horizontally; the hand stays visible.
- Confirmed damage changes trigger card arrival, fireball/sparks, shake and sinking tilt/fade. Effects work with sound off, respect Reduce Motion, and do not replay on unchanged snapshots or initial load.
- `node scripts/test_mac_presentation.mjs`: passed actual engine fixtures for mine targeting, own-fleet rejection, ship-specific salvos, attachment decoding, hit/sinking effects and duplicate/initial-load suppression. Fixtures generated from `test:mac-engine` transcript; `npm run test:mac-presentation` runs both.
- Native UI: isolated Preview bundle and disposable saves. Clicked Minefield then an enemy ship; confirmed fleet damage and end-turn. Selected Salvo and clicked Nelson; captured explosion plus persistent attachment (`build/salvo-presentation.png`). Separate lethal-salvo fixture showed tilted ship and SHIP SUNK effect (`build/sinking-presentation.png`). Size slider verified at 210 and 260.
- `node --check prototype/app.js`, `npm run check`, `npm run build`: passed. Packaged Preview under network denial: 622 requests, 4 rounds, 14 exact save restores, 170 artwork entries passed.
- Built separately with `node scripts/build_mac_app.mjs --preview`; existing running app and its autosave were not modified. Preview test process closed after verification. Preview ZIP is a separate development package; hosted cross-play remains pending.

## 2026-09-21 — Sound parity and Destroyer targeting follow-up

- Corrected `salvo_hit` (never emitted) to the actual `salvo_fired` event and routed all 16 sounds used by the browser. Small/big salvo selection covers 11/12.6 versus larger guns and attacks against squadrons. Attack, dice, sink and victory cues in the same state update are retained, with brief spacing; mute cancels pending cues. Initial state loads do not replay historical sounds.
- Found Dice.wav and WinnerSound.wav contain QuickTime media. Native build now converts all bundled sound copies with ffmpeg to PCM16 WAV; source assets are untouched. All 16 matched decoded PCM samples, decoded to nonempty audio, and returned successful native playback/isPlaying checks.
- Ready Destroyer actions override stale hand selection. Fleet targeting chooses the first legal ready squadron when more than one offers the same fleet. Added Aim Destroyers control and clear deployment/next-turn/smoke instructions.
- Presentation regressions passed using actual engine deployment/ready positions, plus a multiple-squadron routing case, every sound event/caliber route, and combined salvo/sink/victory cues. Native preview build, syntax, TypeScript check/build passed.
- Isolated native QA app: selected a hand card while Destroyers ready; fleet targeting remained visible. Clicked Attack Bot North with Destroyers, rolled two sinks, captured ships and advanced to End turn. The original audio exposed a Dice load error during this check, leading to conversion and the successful native audio checks above.
- Final normalized-audio UI retest used a temporary local save directory: Destroyer fleet attack rolled two sinks, reached End turn, and displayed no audio error. QA process closed. Preview ZIP extraction/signature/executable verification passed (49.9 MB).

## 2026-09-21 — Visible dice and result timing

- Added shared native dice resolution and a roll/result overlay for air strikes, submarines, torpedo boats and Destroyers. The prior board remains visible until the roll and result hold finish; effects and impact audio follow. Last Roll persists the face, rule, target and outcome; six recent rolls retained. Batched rolls display in order; bots wait for presentation; mute does not hide dice; Reduce Motion disables spinning.
- Authoritative roll events now include optional `dieRoll` metadata using the same single RNG call. Destroyer raw face is preserved before capping victims to afloat ships. Existing detail strings/commands/rules are unchanged. Older-host Destroyer events show sink count and explicitly unavailable raw face. Legacy fixture comparison excludes only new roll metadata and continues to verify identical state/actions.
- All 24 attack/face engine cases passed, including raw 6 with two afloat ships. Native tests verify hit/miss thresholds, old-board/rolling/result/impact sequence, multiple rolls, unchanged poll suppression and no historical replay on initial load.
- Node/bundle parity: 12 matches, 24 rounds, 5,025 actions. Native JavaScriptCore parity: 622 requests. Legacy replay, presentation regressions, browser/server/native online transport/reconnect/lost-response checks and required syntax/type/build checks passed.
- Isolated native UI with disposable saves: Ark Royal rolled 1 against Yamato; Last Roll displayed die face 1, winning threshold and HIT / Ship sunk; the table then showed sinking impact. Screenshot: `build/dice-airstrike-result.png`. User's running game and save were not used.
- Native miss check: Ark Royal rolled 6 against Kongo; Last Roll showed face 6 and MISS / Ship unharmed, with Kongo still afloat. Screenshot: `build/dice-airstrike-miss.png`. Isolated QA process closed; preview ZIP extraction/signature/executable checks passed.


## Full-table layout preview — 2026-09-21

- Built the all-opponents-visible native layout. A four-player UI check displayed 5, 7 and 6 enemy ships simultaneously plus the player's 5 ships and hand.
- Actual isolated GUI drags: Minefield to empty enemy fleet space passed; Minefield over an enemy ship passed; Minefield onto own fleet rejected without consuming the card. Click-to-play also applied the same minefield correctly.
- Native regressions cover legal fleet/ship/Destroyer distinctions, stale/foreign source rejection, ownership and busy-state gates. Waiting Destroyer targeting uses the engine's `targetDestroyerId`; ready activation uses `destroyerId` plus target fleet.
- Hand and own fleet remain pinned. Oversized enemy fleets share vertical scrolling; oversized hands scroll horizontally. Orders & Log retains full commands, dice history and results.
- These checks do not constitute a new hosted multiplayer playtest or public-release notarization.
