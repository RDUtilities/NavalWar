import { applyCommand, listLegalCommands, completeSoloRoundIfEliminated } from "./engine.js";
import { automaticDestroyerSelection, chooseBotCommand } from "./bots.js";
import { actionOptions } from "./action-options.js";
import { visibleEvents } from "./visibility.js";
import { createInitialGameState, createNextRoundState } from "./sample-data.js";
import type { GameCommand, GameMode, GameState, PlayCard, RandomSource, ShipCard } from "./types.js";

export const OFFLINE_SAVE_VERSION = 1;
export const OFFLINE_RULES_VERSION = "naval-war-2026-09-21";

export interface OfflineSetup {
  playerNames: string[];
  humanPlayerId: string;
  seed: number;
  mode: GameMode;
  campaignTargetScore: number;
}

type HistoryEntry = { type: "command"; command: GameCommand } | { type: "next_round" };
export interface OfflineSave {
  version: number;
  rulesVersion: string;
  setup: OfflineSetup;
  history: HistoryEntry[];
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Reproducible randomness for local matches and cross-runtime parity checks. */
export class OfflineRandom implements RandomSource {
  constructor(public state: number) {}

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  private shuffle<T>(deck: T[]): T[] {
    const result = [...deck];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const item = result[i]!;
      result[i] = result[j]!;
      result[j] = item;
    }
    return result;
  }

  drawPlayCard(deck: PlayCard[]) {
    const [card, ...rest] = deck;
    assert(card, "Play deck is empty.");
    return { card, deck: rest };
  }

  drawShipCard(deck: ShipCard[]) {
    const [card, ...rest] = deck;
    assert(card, "Ship deck is empty.");
    return { card, deck: rest };
  }

  shufflePlayDeck(deck: PlayCard[]) { return this.shuffle(deck); }
  shuffleShipDeck(deck: ShipCard[]) { return this.shuffle(deck); }
  rollDie() { return 1 + Math.floor(this.next() * 6); }
}

function validateSetup(setup: OfflineSetup): void {
  assert(setup && Array.isArray(setup.playerNames), "Player names are required.");
  assert(setup.playerNames.length >= 2 && setup.playerNames.length <= 4, "Choose two to four total players.");
  assert(setup.playerNames.every(name => typeof name === "string" && name.trim().length > 0 && name.length <= 80), "Enter valid player names.");
  assert(setup.playerNames.some((_, i) => setup.humanPlayerId === `p${i + 1}`), "Choose a valid human seat.");
  assert(Number.isInteger(setup.seed) && setup.seed >= 0 && setup.seed <= 0xffffffff, "Invalid random seed.");
  assert(setup.mode === "skirmish" || setup.mode === "campaign", "Invalid game mode.");
  assert(Number.isInteger(setup.campaignTargetScore) && setup.campaignTargetScore >= 25 && setup.campaignTargetScore <= 10000, "Invalid campaign target.");
}

export class OfflineSession {
  private state: GameState;
  private readonly rng: OfflineRandom;
  private readonly setup: OfflineSetup;
  private history: HistoryEntry[] = [];

  constructor(setup: OfflineSetup) {
    validateSetup(setup);
    this.setup = copy(setup);
    this.rng = new OfflineRandom(setup.seed);
    this.state = createInitialGameState(setup.playerNames, this.rng, {
      matchMode: setup.mode, campaignTargetScore: setup.campaignTargetScore
    });
  }

  view() {
    const human = this.setup.humanPlayerId;
    return {
      rulesVersion: OFFLINE_RULES_VERSION,
      humanPlayerId: human,
      isBotTurn: this.state.phase === "normal" && this.state.currentPlayerId !== human,
      legalCommands: listLegalCommands(this.state, human),
      actions: actionOptions(this.state, human),
      // Offline saves contain full state; the presentation receives hidden enemy hands.
      gameState: {
        ...copy(this.state),
        playDeck: undefined,
        shipDeck: undefined,
        playDeckCount: this.state.playDeck.length,
        shipDeckCount: this.state.shipDeck.length,
        events: visibleEvents(this.state, human),
        players: this.state.players.map(player => ({
          ...copy(player),
          handCount: player.hand.length,
          hand: player.id === human ? copy(player.hand) : []
        }))
      }
    };
  }

  private apply(command: GameCommand): void {
    assert(command && typeof command.type === "string", "A game command is required.");
    assert(listLegalCommands(this.state, command.actorId).includes(command.type), "That action is not available.");
    const previousRandomState = this.rng.state;
    try {
      // Protect state and randomness even when a malformed request fails partway through.
      const next = applyCommand(copy(this.state), copy(command), this.rng);
      this.state = next;
      this.history.push({ type: "command", command: copy(command) });
    } catch (error) {
      this.rng.state = previousRandomState;
      throw error;
    }
  }

  command(command: GameCommand) {
    assert(command?.actorId === this.setup.humanPlayerId, "Only the local human seat accepts player commands.");
    this.applyWithAutomaticSelection(command);
    return this.view();
  }

  botStep() {
    assert(this.state.phase === "normal", "The round has ended.");
    assert(this.state.currentPlayerId !== this.setup.humanPlayerId, "It is your turn.");
    // Bot target selection has a separate deterministic stream; it must not change dice/deck randomness.
    const selection = new OfflineRandom((this.setup.seed + this.history.length) >>> 0);
    const command = chooseBotCommand(this.state, this.state.currentPlayerId, this.rng,
      length => Math.floor(selection.next() * length));
    assert(command, "The bot could not find an action.");
    this.applyWithAutomaticSelection(command);
    return this.view();
  }

  private applyWithAutomaticSelection(command: GameCommand) {
    const previousState = this.state;
    const previousRandom = this.rng.state;
    const previousHistoryLength = this.history.length;
    try {
      this.apply(command);
      const selection = automaticDestroyerSelection(this.state, command.actorId);
      if (selection) this.apply(selection);
      this.state = completeSoloRoundIfEliminated(this.state, this.setup.humanPlayerId);
    } catch (error) {
      this.state = previousState;
      this.rng.state = previousRandom;
      this.history.length = previousHistoryLength;
      throw error;
    }
  }

  nextRound() {
    assert(this.state.options.matchMode === "campaign" && this.state.phase === "round_complete" && this.state.matchWinnerIds.length === 0,
      "A new campaign round is not available.");
    this.state = createNextRoundState(this.state, this.rng);
    this.history.push({ type: "next_round" });
    return this.view();
  }

  save(): OfflineSave {
    // Replay restores deck order and RNG state together, without trusting arbitrary serialized game state.
    return copy({ version: OFFLINE_SAVE_VERSION, rulesVersion: OFFLINE_RULES_VERSION, setup: this.setup, history: this.history });
  }

  static restore(save: OfflineSave): OfflineSession {
    assert(save?.version === OFFLINE_SAVE_VERSION, "Unsupported save format.");
    assert(save.rulesVersion === OFFLINE_RULES_VERSION, "This save requires a different rules version.");
    assert(Array.isArray(save.history) && save.history.length <= 100000, "Invalid save history.");
    const session = new OfflineSession(save.setup);
    for (const entry of save.history) {
      assert(entry && typeof entry === "object", "Invalid save entry.");
      if (entry.type === "next_round") {
        session.state = completeSoloRoundIfEliminated(session.state, session.setup.humanPlayerId);
        session.nextRound();
      }
      // Replay individual recorded commands, including older manual selections,
      // rather than generating automatic commands a second time.
      else if (entry.type === "command") session.apply(entry.command);
      else throw new Error("Unknown save entry.");
    }
    session.state = completeSoloRoundIfEliminated(session.state, session.setup.humanPlayerId);
    return session;
  }
}
