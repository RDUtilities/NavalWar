import { applyCommand, listLegalCommands } from "./engine.js";
import { createInitialGameState, createNextRoundState } from "./sample-data.js";
import type { GameCommand, GameMode, GameState, PlayCard, PlayerId, RandomSource, ShipCard } from "./types.js";

declare const process: {
  argv: string[];
  exitCode?: number;
};

interface SimulationOptions {
  games: number;
  players: 2 | 3 | 4;
  mode: GameMode;
  campaignTargetScore: number;
  seed: number;
  maxStepsPerGame: number;
  maxRoundsPerGame: number;
}

interface SimulationResult {
  completed: boolean;
  reason: "ok" | "stuck_no_legal" | "command_generation_failed" | "exception" | "step_limit";
  finalState: GameState;
  errorMessage?: string;
  steps: number;
  turnNumber: number;
  roundsPlayed: number;
  commandUsage: Record<string, number>;
}

function describeStuckState(state: GameState): string {
  const actor = state.players.find((entry) => entry.id === state.currentPlayerId);
  if (!actor) {
    return `currentPlayer=${state.currentPlayerId} missing`;
  }
  const handKinds = actor.hand.map((card) => card.kind).join(",") || "none";
  const legal = listLegalCommands(state, actor.id).join(",") || "none";
  const openingPending = state.openingTurnPendingPlayerIds.includes(actor.id);
  const mandatoryKinds = actor.hand
    .filter(
      (card) =>
        card.kind === "minefield" ||
        card.kind === "submarine" ||
        card.kind === "torpedo_boat" ||
        card.kind === "additional_damage" ||
        card.kind === "additional_ship"
    )
    .map((card) => card.kind);
  const mandatorySummary = mandatoryKinds.join(",") || "none";
  return [
    `player=${actor.id}`,
    `eliminated=${actor.eliminated}`,
    `phase=${state.phase}`,
    `hasDrawn=${state.hasDrawnThisTurn}`,
    `hasUsedCarrier=${state.hasUsedCarrierStrikeThisTurn}`,
    `hasAction=${state.hasPerformedActionThisTurn}`,
    `openingPending=${openingPending}`,
    `mandatory=${mandatorySummary}`,
    `pendingDestroyer=${state.pendingDestroyerAttack ? "yes" : "no"}`,
    `hand=${handKinds}`,
    `legal=${legal}`
  ].join(" | ");
}

interface Summary {
  options: SimulationOptions;
  totalGames: number;
  completedGames: number;
  failedGames: number;
  failureReasons: Record<string, number>;
  roundEndReasons: Record<string, number>;
  winnerCounts: Record<string, number>;
  averageSteps: number;
  averageTurns: number;
  averageRounds: number;
  maxSteps: number;
  maxTurns: number;
  maxRounds: number;
  commandUsage: Record<string, number>;
}

class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  private next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state;
  }

  private nextInt(maxExclusive: number) {
    if (maxExclusive <= 0) {
      return 0;
    }
    return this.next() % maxExclusive;
  }

  drawPlayCard(deck: PlayCard[]) {
    const [card, ...rest] = deck;
    if (!card) {
      throw new Error("Play deck is empty.");
    }
    return { card, deck: rest };
  }

  drawShipCard(deck: ShipCard[]) {
    const [card, ...rest] = deck;
    if (!card) {
      throw new Error("Ship deck is empty.");
    }
    return { card, deck: rest };
  }

  shufflePlayDeck(deck: PlayCard[]) {
    const copy = [...deck];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = this.nextInt(index + 1);
      const temp = copy[index];
      copy[index] = copy[swapIndex]!;
      copy[swapIndex] = temp!;
    }
    return copy;
  }

  shuffleShipDeck(deck: ShipCard[]) {
    const copy = [...deck];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = this.nextInt(index + 1);
      const temp = copy[index];
      copy[index] = copy[swapIndex]!;
      copy[swapIndex] = temp!;
    }
    return copy;
  }

  rollDie() {
    return this.nextInt(6) + 1;
  }
}

function parseOptions(argv: string[]): SimulationOptions {
  const defaults: SimulationOptions = {
    games: 100,
    players: 4,
    mode: "skirmish",
    campaignTargetScore: 100,
    seed: 20260508,
    maxStepsPerGame: 5000,
    maxRoundsPerGame: 30
  };

  const parsed: Record<string, string> = {};
  for (const token of argv) {
    if (!token.startsWith("--")) {
      continue;
    }
    const [rawKey, rawValue] = token.slice(2).split("=");
    if (!rawKey) {
      continue;
    }
    parsed[rawKey] = rawValue ?? "true";
  }

  const games = Number(parsed.games ?? defaults.games);
  const players = Number(parsed.players ?? defaults.players) as 2 | 3 | 4;
  const mode = parsed.mode === "campaign" ? "campaign" : "skirmish";
  const campaignTargetScore = Number(parsed["campaign-target"] ?? defaults.campaignTargetScore);
  const seed = Number(parsed.seed ?? defaults.seed);
  const maxStepsPerGame = Number(parsed["max-steps"] ?? defaults.maxStepsPerGame);
  const maxRoundsPerGame = Number(parsed["max-rounds"] ?? defaults.maxRoundsPerGame);

  if (!Number.isFinite(games) || games <= 0) {
    throw new Error("`--games` must be a positive integer.");
  }
  if (players !== 2 && players !== 3 && players !== 4) {
    throw new Error("`--players` must be 2, 3, or 4.");
  }
  if (!Number.isFinite(seed)) {
    throw new Error("`--seed` must be numeric.");
  }
  if (!Number.isFinite(maxStepsPerGame) || maxStepsPerGame <= 0) {
    throw new Error("`--max-steps` must be a positive integer.");
  }
  if (!Number.isFinite(campaignTargetScore) || campaignTargetScore <= 0) {
    throw new Error("`--campaign-target` must be a positive integer.");
  }
  if (!Number.isFinite(maxRoundsPerGame) || maxRoundsPerGame <= 0) {
    throw new Error("`--max-rounds` must be a positive integer.");
  }

  return {
    games: Math.floor(games),
    players,
    mode,
    campaignTargetScore: Math.floor(campaignTargetScore),
    seed: Math.floor(seed),
    maxStepsPerGame: Math.floor(maxStepsPerGame),
    maxRoundsPerGame: Math.floor(maxRoundsPerGame)
  };
}

function livingShips(state: GameState, playerId: PlayerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  return (player?.ships ?? []).filter((ship) => !ship.sunk);
}

function hasSmoke(state: GameState, playerId: PlayerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  return Boolean(player?.fleetEffects.some((effect) => effect.kind === "smoke"));
}

function hasCarrierScreens(state: GameState, playerId: PlayerId) {
  const ships = livingShips(state, playerId);
  return ships.some((ship) => !ship.card.isCarrier);
}

function enemyPlayers(state: GameState, actorId: PlayerId) {
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return [];
  }
  return state.players.filter((entry) => !entry.eliminated && entry.id !== actorId && (!actor.teamId || actor.teamId !== entry.teamId));
}

function canTargetShip(state: GameState, targetPlayerId: PlayerId, shipId: string) {
  const targetPlayer = state.players.find((entry) => entry.id === targetPlayerId);
  const ship = targetPlayer?.ships.find((entry) => entry.card.id === shipId);
  if (!targetPlayer || !ship || ship.sunk) {
    return false;
  }
  if (ship.card.isCarrier && hasCarrierScreens(state, targetPlayerId)) {
    return false;
  }
  return true;
}

function legalShipTargets(state: GameState, actorId: PlayerId, allowSmoke = false) {
  const targets: Array<{ targetPlayerId: PlayerId; targetShipId: string }> = [];
  for (const enemy of enemyPlayers(state, actorId)) {
    if (!allowSmoke && hasSmoke(state, enemy.id)) {
      continue;
    }
    for (const ship of livingShips(state, enemy.id)) {
      if (canTargetShip(state, enemy.id, ship.card.id)) {
        targets.push({ targetPlayerId: enemy.id, targetShipId: ship.card.id });
      }
    }
  }
  return targets;
}

function hasAdditionalDamageTarget(state: GameState, actorId: PlayerId): boolean {
  for (const enemy of enemyPlayers(state, actorId)) {
    for (const ship of livingShips(state, enemy.id)) {
      if (!canTargetShip(state, enemy.id, ship.card.id)) {
        continue;
      }
      const hasStack = ship.attachments.some(
        (attachment) => attachment.source.type === "salvo" || attachment.source.type === "additional_damage"
      );
      if (hasStack) {
        return true;
      }
    }
  }
  return false;
}

function commandsForType(state: GameState, actorId: PlayerId, commandType: string, rng: RandomSource): GameCommand[] {
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return [];
  }

  switch (commandType) {
    case "draw_card":
      return [{ type: "draw_card", actorId }];

    case "end_turn":
      return [{ type: "end_turn", actorId }];

    case "discard_play_card":
      if (
        state.openingTurnPendingPlayerIds.includes(actorId) &&
        actor.hand.some((card) => card.kind === "additional_damage") &&
        !hasAdditionalDamageTarget(state, actorId)
      ) {
        return actor.hand
          .filter((card) => card.kind === "additional_damage")
          .map((card) => ({ type: "discard_play_card", actorId, cardId: card.id }));
      }
      return actor.hand.map((card) => ({ type: "discard_play_card", actorId, cardId: card.id }));

    case "play_salvo": {
      const commands: GameCommand[] = [];
      for (const card of actor.hand) {
        if (card.kind !== "salvo") {
          continue;
        }
        const hasMatchingShip = livingShips(state, actorId).some((ship) => ship.card.gunCaliber === card.gunCaliber);
        if (!hasMatchingShip) {
          continue;
        }
        const targets = legalShipTargets(state, actorId, false);
        if (targets.length === 0) {
          continue;
        }
        const target = targets[randomIndex(targets.length, rng)]!;
        commands.push({ type: "play_salvo", actorId, cardId: card.id, ...target });
      }
      return commands;
    }

    case "play_additional_damage": {
      const commands: GameCommand[] = [];
      for (const card of actor.hand) {
        if (card.kind !== "additional_damage") {
          continue;
        }
        for (const enemy of enemyPlayers(state, actorId)) {
          for (const ship of livingShips(state, enemy.id)) {
            if (!canTargetShip(state, enemy.id, ship.card.id)) {
              continue;
            }
            commands.push({
              type: "play_additional_damage",
              actorId,
              cardId: card.id,
              targetPlayerId: enemy.id,
              targetShipId: ship.card.id
            });
          }
        }
      }
      return commands;
    }

    case "play_smoke":
      return actor.hand
        .filter((card) => card.kind === "smoke")
        .map((card) => ({ type: "play_smoke", actorId, cardId: card.id }));

    case "play_minefield": {
      const commands: GameCommand[] = [];
      const openingTurnPending = state.openingTurnPendingPlayerIds.includes(actorId);
      for (const card of actor.hand) {
        if (card.kind !== "minefield") {
          continue;
        }
        for (const enemy of enemyPlayers(state, actorId)) {
          if (openingTurnPending) {
            const enemyAlreadyMined = enemy.fleetEffects.some((effect) => effect.kind === "minefield");
            if (enemyAlreadyMined) {
              continue;
            }
          }
          commands.push({ type: "play_minefield", actorId, cardId: card.id, targetPlayerId: enemy.id });
        }
      }
      return commands;
    }

    case "play_additional_ship":
      return actor.hand
        .filter((card) => card.kind === "additional_ship")
        .map((card) => ({ type: "play_additional_ship", actorId, cardId: card.id }));

    case "play_minesweeper": {
      const commands: GameCommand[] = [];
      for (const card of actor.hand) {
        if (card.kind !== "minesweeper") {
          continue;
        }
        for (const player of state.players) {
          const hasMinefield = player.fleetEffects.some((effect) => effect.kind === "minefield");
          if (hasMinefield) {
            commands.push({ type: "play_minesweeper", actorId, cardId: card.id, targetPlayerId: player.id });
          }
        }
      }
      return commands;
    }

    case "play_repair": {
      const commands: GameCommand[] = [];
      for (const card of actor.hand) {
        if (card.kind !== "repair") {
          continue;
        }
        for (const ship of livingShips(state, actorId)) {
          const repairable = ship.damage.some((damage) => damage.type === "salvo" || damage.type === "additional_damage");
          if (repairable) {
            commands.push({ type: "play_repair", actorId, cardId: card.id, targetShipId: ship.card.id });
          }
        }
      }
      return commands;
    }

    case "play_submarine":
    case "play_torpedo_boat": {
      const commands: GameCommand[] = [];
      const kind = commandType === "play_submarine" ? "submarine" : "torpedo_boat";
      for (const card of actor.hand) {
        if (card.kind !== kind) {
          continue;
        }
        const targets = legalShipTargets(state, actorId, true);
        if (targets.length === 0) {
          continue;
        }
        const target = targets[randomIndex(targets.length, rng)]!;
        commands.push({ type: commandType, actorId, cardId: card.id, ...target });
      }
      return commands;
    }

    case "play_destroyer_squadron":
      return actor.hand
        .filter((card) => card.kind === "destroyer_squadron")
        .map((card) => ({ type: "play_destroyer_squadron", actorId, cardId: card.id }));

    case "attack_destroyer_squadron": {
      const commands: GameCommand[] = [];
      const enemySquadrons = state.destroyerSquadrons.filter((entry) => entry.ownerId !== actorId);
      for (const card of actor.hand) {
        if (card.kind !== "salvo") {
          continue;
        }
        const hasMatchingShip = livingShips(state, actorId).some((ship) => ship.card.gunCaliber === card.gunCaliber);
        if (!hasMatchingShip) {
          continue;
        }
        for (const squadron of enemySquadrons) {
          commands.push({ type: "attack_destroyer_squadron", actorId, cardId: card.id, targetDestroyerId: squadron.id });
        }
      }
      return commands;
    }

    case "resolve_destroyer_squadron_roll": {
      const commands: GameCommand[] = [];
      const own = state.destroyerSquadrons.filter((entry) => entry.ownerId === actorId && entry.deployedTurn < state.turnNumber);
      for (const squadron of own) {
        for (const enemy of enemyPlayers(state, actorId)) {
          commands.push({ type: "resolve_destroyer_squadron_roll", actorId, destroyerId: squadron.id, targetPlayerId: enemy.id });
        }
      }
      return commands;
    }

    case "select_destroyer_squadron_targets": {
      const pending = state.pendingDestroyerAttack;
      if (!pending || pending.ownerId !== actorId) {
        return [];
      }
      const targetPlayer = state.players.find((entry) => entry.id === pending.targetPlayerId);
      if (!targetPlayer) {
        return [];
      }
      const targets = livingShips(state, targetPlayer.id).slice(0, pending.shipsToSink).map((ship) => ship.card.id);
      return [{ type: "select_destroyer_squadron_targets", actorId, destroyerId: pending.destroyerId, targetShipIds: targets }];
    }

    case "use_carrier_strike": {
      const carriers = livingShips(state, actorId).filter((ship) => ship.card.isCarrier);
      if (carriers.length === 0) {
        return [];
      }
      const strikes: Array<{ carrierShipId: string; targetPlayerId: string; targetShipId: string }> = [];
      for (const carrier of carriers) {
        const targets = legalShipTargets(state, actorId, false);
        if (targets.length === 0) {
          continue;
        }
        const target = targets[randomIndex(targets.length, rng)]!;
        strikes.push({ carrierShipId: carrier.card.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId });
      }
      if (strikes.length === 0) {
        return [];
      }
      return [{ type: "use_carrier_strike", actorId, strikes }];
    }

    default:
      return [];
  }
}

function preferredOrder(legal: string[]): string[] {
  const priority = [
    "select_destroyer_squadron_targets",
    "resolve_destroyer_squadron_roll",
    "draw_card",
    "use_carrier_strike",
    "play_additional_ship",
    "play_minefield",
    "play_submarine",
    "play_torpedo_boat",
    "play_additional_damage",
    "play_minesweeper",
    "play_repair",
    "play_smoke",
    "play_destroyer_squadron",
    "play_salvo",
    "attack_destroyer_squadron",
    "discard_play_card",
    "end_turn"
  ];
  return priority.filter((entry) => legal.includes(entry));
}

function randomIndex(count: number, rng: RandomSource): number {
  if (count <= 1) {
    return 0;
  }
  // Generate unbiased indices using base-6 rejection sampling from rollDie().
  let range = 1;
  while (range < count) {
    range *= 6;
  }
  while (true) {
    let value = 0;
    let divisor = range;
    while (divisor > 1) {
      value = value * 6 + (rng.rollDie() - 1);
      divisor /= 6;
    }
    const accepted = Math.floor(range / count) * count;
    if (value < accepted) {
      return value % count;
    }
  }
}

function runOneGame(options: SimulationOptions, seedOffset: number): SimulationResult {
  const rng = new SeededRandom(options.seed + seedOffset);
  const playerNames = Array.from({ length: options.players }, (_, index) => `Sim Admiral ${index + 1}`);
  let state = createInitialGameState(playerNames, rng, {
    matchMode: options.mode,
    campaignTargetScore: options.campaignTargetScore
  });

  const commandUsage: Record<string, number> = {};

  for (let step = 1; step <= options.maxStepsPerGame; step += 1) {
    if (state.phase === "round_complete") {
      if (
        options.mode === "campaign" &&
        state.matchWinnerIds.length === 0 &&
        state.roundNumber < options.maxRoundsPerGame
      ) {
        state = createNextRoundState(state, rng);
        continue;
      }
      return {
        completed: true,
        reason: "ok",
        finalState: state,
        steps: step - 1,
        turnNumber: state.turnNumber,
        roundsPlayed: state.roundNumber,
        commandUsage
      };
    }

    const actorId = state.currentPlayerId;
    const legal = listLegalCommands(state, actorId);
    if (legal.length === 0) {
      return {
        completed: false,
        reason: "stuck_no_legal",
        errorMessage: describeStuckState(state),
        finalState: state,
        steps: step,
        turnNumber: state.turnNumber,
        roundsPlayed: state.roundNumber,
        commandUsage
      };
    }

    let applied = false;
    let generationAttempted = false;
    let lastError: string | undefined;
    const attemptedCommandTypes: string[] = [];
    for (const commandType of preferredOrder(legal)) {
      const candidates = [...commandsForType(state, actorId, commandType, rng)];
      generationAttempted = true;
       attemptedCommandTypes.push(`${commandType}:${candidates.length}`);
      while (candidates.length > 0) {
        const index = randomIndex(candidates.length, rng);
        const [candidate] = candidates.splice(index, 1);
        if (!candidate) {
          continue;
        }
        try {
          state = applyCommand(state, candidate, rng);
          commandUsage[candidate.type] = (commandUsage[candidate.type] ?? 0) + 1;
          applied = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
        }
      }
      if (applied) {
        break;
      }
    }

    if (!applied) {
      const baseResult: SimulationResult = {
        completed: false,
        reason: generationAttempted ? "command_generation_failed" : "exception",
        finalState: state,
        steps: step,
        turnNumber: state.turnNumber,
        roundsPlayed: state.roundNumber,
        commandUsage
      };
      const debugContext = `legal=${legal.join(",") || "none"} attempted=${attemptedCommandTypes.join(",") || "none"} state=${describeStuckState(state)}`;
      baseResult.errorMessage = lastError ? `${lastError} | ${debugContext}` : debugContext;
      return baseResult;
    }
  }

  return {
    completed: false,
    reason: "step_limit",
    finalState: state,
    steps: options.maxStepsPerGame,
    turnNumber: state.turnNumber,
    roundsPlayed: state.roundNumber,
    commandUsage
  };
}

function summarize(results: SimulationResult[], options: SimulationOptions): Summary {
  const summary: Summary = {
    options,
    totalGames: results.length,
    completedGames: 0,
    failedGames: 0,
    failureReasons: {},
    roundEndReasons: {},
    winnerCounts: {},
    averageSteps: 0,
    averageTurns: 0,
    averageRounds: 0,
    maxSteps: 0,
    maxTurns: 0,
    maxRounds: 0,
    commandUsage: {}
  };

  let stepsTotal = 0;
  let turnsTotal = 0;
  let roundsTotal = 0;

  for (const result of results) {
    stepsTotal += result.steps;
    turnsTotal += result.turnNumber;
    roundsTotal += result.roundsPlayed;
    summary.maxSteps = Math.max(summary.maxSteps, result.steps);
    summary.maxTurns = Math.max(summary.maxTurns, result.turnNumber);
    summary.maxRounds = Math.max(summary.maxRounds, result.roundsPlayed);

    for (const [command, count] of Object.entries(result.commandUsage)) {
      summary.commandUsage[command] = (summary.commandUsage[command] ?? 0) + count;
    }

    if (result.completed) {
      summary.completedGames += 1;
      const roundReason = result.finalState.roundEndReason ?? "unknown";
      summary.roundEndReasons[roundReason] = (summary.roundEndReasons[roundReason] ?? 0) + 1;
      const winnerIds =
        options.mode === "campaign" && result.finalState.matchWinnerIds.length > 0
          ? result.finalState.matchWinnerIds
          : result.finalState.winnerIds;
      for (const winnerId of winnerIds) {
        summary.winnerCounts[winnerId] = (summary.winnerCounts[winnerId] ?? 0) + 1;
      }
    } else {
      summary.failedGames += 1;
      summary.failureReasons[result.reason] = (summary.failureReasons[result.reason] ?? 0) + 1;
    }
  }

  summary.averageSteps = Number((stepsTotal / Math.max(results.length, 1)).toFixed(2));
  summary.averageTurns = Number((turnsTotal / Math.max(results.length, 1)).toFixed(2));
  summary.averageRounds = Number((roundsTotal / Math.max(results.length, 1)).toFixed(2));
  return summary;
}

function printSummary(summary: Summary, sampleFailures: SimulationResult[]) {
  console.log("Naval War Engine Simulation");
  console.log("===========================");
  console.log(
    `games=${summary.options.games} players=${summary.options.players} mode=${summary.options.mode} campaignTarget=${summary.options.campaignTargetScore} seed=${summary.options.seed} maxSteps=${summary.options.maxStepsPerGame} maxRounds=${summary.options.maxRoundsPerGame}`
  );
  console.log("");
  console.log(
    `completed=${summary.completedGames}/${summary.totalGames} failed=${summary.failedGames} avgSteps=${summary.averageSteps} avgTurns=${summary.averageTurns} avgRounds=${summary.averageRounds} maxSteps=${summary.maxSteps} maxTurns=${summary.maxTurns} maxRounds=${summary.maxRounds}`
  );
  console.log("");

  if (Object.keys(summary.roundEndReasons).length > 0) {
    console.log("Round end reasons:");
    for (const [reason, count] of Object.entries(summary.roundEndReasons)) {
      console.log(`  - ${reason}: ${count}`);
    }
    console.log("");
  }

  if (Object.keys(summary.winnerCounts).length > 0) {
    console.log("Winner counts:");
    for (const [winner, count] of Object.entries(summary.winnerCounts)) {
      console.log(`  - ${winner}: ${count}`);
    }
    console.log("");
  }

  if (Object.keys(summary.failureReasons).length > 0) {
    console.log("Failure reasons:");
    for (const [reason, count] of Object.entries(summary.failureReasons)) {
      console.log(`  - ${reason}: ${count}`);
    }
    console.log("");
  }

  const sortedCommands = Object.entries(summary.commandUsage).sort((a, b) => b[1] - a[1]);
  if (sortedCommands.length > 0) {
    console.log("Command usage:");
    for (const [command, count] of sortedCommands) {
      console.log(`  - ${command}: ${count}`);
    }
    console.log("");
  }

  if (sampleFailures.length > 0) {
    console.log("Sample failures:");
    for (const [index, failure] of sampleFailures.entries()) {
      const label = `${index + 1}. reason=${failure.reason} step=${failure.steps} turn=${failure.turnNumber}`;
      if (failure.errorMessage) {
        console.log(`  - ${label} error="${failure.errorMessage}"`);
      } else {
        console.log(`  - ${label}`);
      }
    }
    console.log("");
  }
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const results: SimulationResult[] = [];
  for (let gameIndex = 0; gameIndex < options.games; gameIndex += 1) {
    results.push(runOneGame(options, gameIndex * 7919));
  }
  const summary = summarize(results, options);
  const failures = results.filter((result) => !result.completed).slice(0, 5);
  printSummary(summary, failures);
  if (summary.failedGames > 0) {
    process.exitCode = 1;
  }
}

main();
