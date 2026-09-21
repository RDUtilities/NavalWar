# Naval War Mac release readiness

Reviewed 2026-09-21. Current deliverable: Apple Silicon development app and verified ZIP for local testing. The overall standalone Mac/hosted cross-play goal remains active.

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Standalone offline play | Packaged app completed native GUI Skirmish under network denial; shared rules, bot, save/replay and resource checks pass | Verified locally |
| Existing rules | Node/JavaScriptCore parity; 20 targeted rules cases; shared bot regression. Offline and hosted Destroyer attacks now share automatic victim order; prior manual-selection saves retain exact replay | Shared engine and parity checks passed |
| Mac presentation | SwiftUI/SpriteKit table, pinned home fleet, bundled Retina card inspection and audio; actual UI screenshots | First playable presentation verified |
| Online client and server | Native transport, lobby/ready/start, Keychain resume, Campaign continuation and controlled lost-response recovery passed locally | Verified locally |
| Browser transport interoperability | Complete mixed Socket.IO/HTTP game, both socket broadcasts, native snapshot agreement, token/host checks and hidden-card filtering | Verified at protocol level |
| Actual browser/Mac UI cross-play | Native host/guest UI checked against protocol peers; browser automation timed out. Chrome choice pending | Not verified |
| Hosted cross-play | Render health reachable but lacks nativeProtocolVersion; native-client server changes remain local | Not deployed or verified |
| Development package | ZIP extracted; signature and executable verified; SHA-256 in build/package-verification.json | Ready for local testing |
| Public distribution | Local ad hoc signature only; no notarization | Separate release work if public distribution is desired |

## Deployment scope and remaining gates

The server update includes the native protocol endpoint/version, authenticated host controls, private lobby responses, shared bots, Campaign continuation, filtered draw logs and corrected socket identity mapping. The browser update includes authenticated host requests, Campaign round controls and service-worker cache v12.

Before deploying, complete actual browser/Mac UI cross-play and review the final source changes. A main-branch deployment is configured in render.yaml with autoDeploy enabled. The current server keeps matches in memory, so restarting for deployment ends active matches; reconnect credentials cannot recover a lost in-memory match.

After deployment, verify health advertises nativeProtocolVersion 1, host/join from the actual Mac and browser interfaces, matching turns/visible state with bots, reconnect after closing/reopening the Mac app, and Campaign round continuation. A successful build or health response alone does not prove those flows.

The local app and ZIP are not a claim of Intel compatibility or public distribution readiness. Public signing/notarization is optional for the user's local prototype and is not being used as a substitute for completing hosted PvP.
