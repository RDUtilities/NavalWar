# Naval War Game Engine

This repository now contains the first scaffold for an authoritative game engine aimed at online multiplayer, bots, and future UI clients.

## What is in this first pass

- Pure TypeScript engine core in `src/`
- Shared game-state types for players, ships, cards, and commands
- Reducer-style `applyCommand(...)` entry point
- Deterministic RNG helper for tests and bot simulations
- Small starter card and ship pools for local prototyping

## Why this shape

The rules in the PDF are best handled by a server-authoritative rules engine:

- clients submit intents
- the engine validates them
- randomness is resolved server-side
- resulting state/events are broadcast to human players and bots

That keeps multiplayer honest and makes bot matches use the exact same rules as humans.

## Currently implemented

- shared 54-ship deck with no duplicates
- full 108-card play deck composition
- game setup that shuffles both decks, then deals 5 ships and 5 play cards per player
- skirmish and campaign match modes in engine state
- turn ownership
- draw card with mandatory post-draw action tracking
- discard-a-card as a legal play-phase action after drawing
- attached salvo attacks
- attached additional-damage cards
- smoke protection that blocks all attacks except submarine and additional-damage until the owner's next draw phase
- stackable minefields tied to a specific fleet for the whole game
- minesweeper clearing minefields into the discard pile
- repair removing one attached damage card instead of clearing the whole ship
- submarine attacks with d6 rolls that sink on 5 or 6
- torpedo boat attacks with d6 rolls that sink on 6
- destroyer squadrons deployed to the center, hit by salvos, and resolved on the owner's next turn
- immediate additional-ship discard and resolution from the shared ship deck
- carrier air strikes with die rolls in place of the normal draw sequence
- carrier screening
- opening-turn mandatory special-card resolution flow
- first-turn limit of one minefield per target fleet
- victory pile collection when ships sink
- sunk-ship attachments moving to the discard pile
- round completion on elimination or play-deck exhaustion
- campaign round scoring based on sunk-ship hit values and cumulative target score tracking

## Not implemented yet

- fleet rearrangement phase and carrier back-row validation
- team salvo exchange rules
- loading deck data directly from manifests instead of code
- full automated tests around opening-turn special resolution and campaign tie-break behavior

## Suggested next steps

1. Add round-to-round progression helpers to drive campaign play all the way through tie-breakers.
2. Add validation for fleet arrangement and carrier placement.
3. Add unit tests around opening-turn special resolution, discard-as-action, and play-deck exhaustion.
4. Split state mutation from event generation for replay support.
5. Put this engine behind a WebSocket match server.

## UI prototype

- A first-pass front-end shell now lives in `prototype/`.
- Open `prototype/index.html` in a browser to view:
  - a splash screen
  - a main menu
  - a four-player war-table layout
- The prototype uses the real artwork from:
  - `assets/MainSplashCard.png`
  - `assets/navalWarLogo-Transparent.png`
  - `assets/War-Table.png`
  - `assets/cards/play/Modern`
  - `assets/cards/ships/Modern`
- The current prototype is static on purpose: it is a visual reference for screen layout and interaction zones before the authoritative engine is wired into a real client.

## Asset correction workflow

- Play-card crops that already look right can live in `assets/cards/play/Good cards`.
- The current non-good play cards are listed in `assets/cards/play/bad-cards.txt`.
- To fix a bad play card, add an entry for its filename in `assets/cards/play/crop-overrides.json`.
- Each override uses absolute pixel coordinates from the original WebP sheet: `sourceSheet`, `x`, `y`, `width`, `height`.
- To create semantic filenames, add entries to `assets/cards/play/card-name-overrides.json`.
- Named play-card exports are written to `assets/cards/play/named/` while keeping the grid-based source files intact.
- Re-run `swift -module-cache-path .swift-module-cache scripts/slice_card_sheets.swift` to regenerate the exports with only those overrides applied.

## Active play-card art

- The active play-card art set is now `assets/cards/play/Modern`.
- Use `assets/cards/play/Modern/manifest.json` as the source of truth for the current play-card files and their gameplay identities.
- Use `assets/cards/play/Modern/deck-definition.json` to describe how many copies of each template belong in the full 108-card play deck.
- Use `assets/cards/play/Modern/template-coverage.json` to track which required template types already exist in the Modern folder and which still need art.
- The older sheet-sliced outputs are still available for reference, but the Modern set should be treated as the preferred artwork going forward.

## Modern ship-card art

- The current completed Modern ship art lives in `assets/cards/ships/Modern`.
- Use `assets/cards/ships/Modern/manifest.json` as the source of truth for ship cards that already have modern artwork.
- Use `assets/cards/ships/ship-art-checklist.md` for a readable production checklist.
- Use `assets/cards/ships/ship-art-coverage.json` for the structured 54-ship coverage summary.

## Example shape

```ts
import { applyCommand, createSampleState, DeterministicRandom } from "./src/index.js";

const rng = new DeterministicRandom();
let state = createSampleState();

state = applyCommand(
  state,
  {
    type: "play_salvo",
    actorId: "p1",
    cardId: "salvo-16-4-a",
    targetPlayerId: "p2",
    targetShipId: "ship-bismarck"
  },
  rng
);
```

## Tooling note

`package.json` includes a TypeScript build setup, but you still need to run `npm install` before `npm run check` or `npm run build` will work in this workspace.
