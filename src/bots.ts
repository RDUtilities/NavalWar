import { listLegalCommands } from "./engine.js";
import type { GameCommand, GameState, PlayCard, PlayerId, RandomSource, ShipInstance } from "./types.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function randomIndex(maxExclusive: number): number {
  return maxExclusive <= 1 ? 0 : Math.floor(Math.random() * maxExclusive);
}

/** Preserve the hosted game's first-afloat victim order after a Destroyer roll. */
export function automaticDestroyerSelection(state: GameState, actorId: PlayerId): GameCommand | null {
  const pending = state.pendingDestroyerAttack;
  if (!pending || pending.ownerId !== actorId) return null;
  const target = state.players.find(player => player.id === pending.targetPlayerId);
  if (!target) return null;
  return {
    type: "select_destroyer_squadron_targets", actorId, destroyerId: pending.destroyerId,
    targetShipIds: target.ships.filter(ship => !ship.sunk).slice(0, pending.shipsToSink).map(ship => ship.card.id)
  };
}

function hasCardInHand(state: GameState, actorId: PlayerId, cardId: string | undefined): boolean {
  if (!cardId) {
    return false;
  }
  const actor = state.players.find((entry) => entry.id === actorId);
  return Boolean(actor?.hand.some((card) => card.id === cardId));
}

function hasOpeningMinefieldTarget(state: GameState, actorId: PlayerId): boolean {
  return state.players.some((targetPlayer) => {
    if (targetPlayer.id === actorId || targetPlayer.eliminated) {
      return false;
    }
    return !targetPlayer.fleetEffects.some((effect) => effect.kind === "minefield");
  });
}

function chooseDiscardCard(state: GameState, actorId: PlayerId): PlayCard | undefined {
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return undefined;
  }

  const openingTurnPending = state.openingTurnPendingPlayerIds.includes(actorId);
  return (
    actor.hand.find((card) => card.kind === "additional_damage") ||
    (openingTurnPending && !hasOpeningMinefieldTarget(state, actorId)
      ? actor.hand.find((card) => card.kind === "minefield")
      : undefined) ||
    actor.hand.find(
      (card) =>
        card.kind !== "minefield" &&
        card.kind !== "submarine" &&
        card.kind !== "torpedo_boat" &&
        card.kind !== "additional_ship"
    ) ||
    actor.hand[0]
  );
}

function chooseCardByKind(state: GameState, actorId: PlayerId, kind: PlayCard["kind"]): PlayCard | undefined {
  return state.players.find((entry) => entry.id === actorId)?.hand.find((card) => card.kind === kind);
}

function choosePlayableSalvo(state: GameState, actorId: PlayerId): PlayCard | undefined {
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return undefined;
  }

  return actor.hand.find(
    (card) =>
      card.kind === "salvo" &&
      actor.ships.some((ship) => !ship.sunk && ship.card.gunCaliber === card.gunCaliber)
  );
}

function isFleetProtectedBySmoke(player: GameState["players"][number]): boolean {
  return player.fleetEffects.some((effect) => effect.kind === "smoke");
}

function hasScreeningShips(player: GameState["players"][number]): boolean {
  return player.ships.some((ship) => !ship.sunk && !ship.card.isCarrier);
}

function isTargetableShip(player: GameState["players"][number], ship: ShipInstance): boolean {
  return !ship.sunk && (!ship.card.isCarrier || !hasScreeningShips(player));
}

function chooseDefaultShipTarget(
  state: GameState,
  actorId: PlayerId,
  options: { allowSmoke?: boolean; allowScreenedCarrier?: boolean } = {}
) {
  for (const player of state.players) {
    if (player.id === actorId || player.eliminated || (!options.allowSmoke && isFleetProtectedBySmoke(player))) {
      continue;
    }
    const targetShip = player.ships.find((ship) => !ship.sunk && (options.allowScreenedCarrier || isTargetableShip(player, ship)));
    if (targetShip) {
      return { targetPlayerId: player.id, targetShipId: targetShip.card.id };
    }
  }
  return null;
}

function chooseDefaultCarrierStrikes(state: GameState, actorId: PlayerId) {
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return [];
  }

  const strikes = [];
  const carriers = actor.ships.filter((ship) => !ship.sunk && ship.card.isCarrier);
  for (const carrier of carriers) {
    const target = chooseDefaultShipTarget(state, actorId, { allowScreenedCarrier: true });
    if (!target) {
      continue;
    }
    strikes.push({
      carrierShipId: carrier.card.id,
      targetPlayerId: target.targetPlayerId,
      targetShipId: target.targetShipId
    });
  }
  return strikes;
}

export function normalizeCommandCardContext(state: GameState, command: GameCommand): GameCommand {
  const commandWithCard = command as GameCommand & { cardId?: string };
  if (commandWithCard.cardId && hasCardInHand(state, command.actorId, commandWithCard.cardId)) {
    return command;
  }

  switch (command.type) {
    case "discard_play_card": {
      const card = chooseDiscardCard(state, command.actorId);
      assert(card, `No card is available for ${command.actorId} to discard.`);
      return { ...command, cardId: card.id };
    }
    case "play_additional_ship": {
      const card = chooseCardByKind(state, command.actorId, "additional_ship");
      assert(card, `No Additional Ship card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_minefield": {
      const card = chooseCardByKind(state, command.actorId, "minefield");
      assert(card, `No Minefield card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_additional_damage": {
      const card = chooseCardByKind(state, command.actorId, "additional_damage");
      assert(card, `No Additional Damage card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_submarine": {
      const card = chooseCardByKind(state, command.actorId, "submarine");
      assert(card, `No Submarine card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_torpedo_boat": {
      const card = chooseCardByKind(state, command.actorId, "torpedo_boat");
      assert(card, `No Torpedo Boat card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_smoke": {
      const card = chooseCardByKind(state, command.actorId, "smoke");
      assert(card, `No Smoke card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_destroyer_squadron": {
      const card = chooseCardByKind(state, command.actorId, "destroyer_squadron");
      assert(card, `No Destroyer Squadron card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_minesweeper": {
      const card = chooseCardByKind(state, command.actorId, "minesweeper");
      assert(card, `No Minesweeper card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_repair": {
      const card = chooseCardByKind(state, command.actorId, "repair");
      assert(card, `No Repair card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "play_salvo": {
      const card = choosePlayableSalvo(state, command.actorId);
      assert(card, `No playable Salvo card is available in ${command.actorId}'s hand.`);
      return { ...command, cardId: card.id };
    }
    case "use_carrier_strike": {
      if (Array.isArray(command.strikes) && command.strikes.length > 0) {
        return command;
      }
      const strikes = chooseDefaultCarrierStrikes(state, command.actorId);
      assert(strikes.length > 0, `No carrier strike targets are available for ${command.actorId}.`);
      return { ...command, strikes };
    }
    default:
      return command;
  }
}

export function chooseBotCommand(state: GameState, actorId: PlayerId, rng: RandomSource, selectIndex: (length: number) => number = randomIndex): GameCommand | null {
  const legal = listLegalCommands(state, actorId);
  if (legal.length === 0) {
    return null;
  }
  const actor = state.players.find((entry) => entry.id === actorId);
  if (!actor) {
    return null;
  }
  const livingShips = actor.ships.filter((ship) => !ship.sunk);
  const enemyPlayers = state.players.filter((entry) => entry.id !== actorId && !entry.eliminated);

  const inPriority = (name: string) => legal.includes(name);

  if (inPriority("select_destroyer_squadron_targets")) {
    const pending = state.pendingDestroyerAttack;
    if (!pending || pending.ownerId !== actorId) {
      return null;
    }
    const targetPlayer = state.players.find((entry) => entry.id === pending.targetPlayerId);
    if (!targetPlayer) {
      return null;
    }
    const targetShipIds = targetPlayer.ships.filter((ship) => !ship.sunk).slice(0, pending.shipsToSink).map((ship) => ship.card.id);
    return { type: "select_destroyer_squadron_targets", actorId, destroyerId: pending.destroyerId, targetShipIds };
  }

  if (inPriority("resolve_destroyer_squadron_roll")) {
    const squadron = state.destroyerSquadrons.find((entry) => entry.ownerId === actorId && entry.deployedTurn < state.turnNumber);
    const target = enemyPlayers.find((player) => !isFleetProtectedBySmoke(player) && player.ships.some((ship) => !ship.sunk));
    if (squadron && target) {
      return { type: "resolve_destroyer_squadron_roll", actorId, destroyerId: squadron.id, targetPlayerId: target.id };
    }
  }

  if (inPriority("discard_destroyer_squadron")) {
    const squadron = state.destroyerSquadrons.find((entry) => entry.ownerId === actorId && entry.deployedTurn < state.turnNumber);
    if (squadron) {
      return { type: "discard_destroyer_squadron", actorId, destroyerId: squadron.id };
    }
  }

  if (inPriority("draw_card")) {
    return { type: "draw_card", actorId };
  }

  const shipTargets = enemyPlayers.flatMap((enemy) =>
    enemy.ships
      .filter((ship) => isTargetableShip(enemy, ship))
      .map((ship) => ({ targetPlayerId: enemy.id, targetShipId: ship.card.id, ship }))
  );
  const unprotectedShipTargets = shipTargets.filter(({ targetPlayerId }) => {
    const player = state.players.find((entry) => entry.id === targetPlayerId);
    return player ? !isFleetProtectedBySmoke(player) : false;
  });

  if (inPriority("use_carrier_strike")) {
    const carriers = livingShips.filter((ship) => ship.card.isCarrier);
    const strikes = carriers
      .map((carrier) => {
        const target = unprotectedShipTargets[selectIndex(unprotectedShipTargets.length)];
        if (!target) return null;
        return { carrierShipId: carrier.card.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId };
      })
      .filter((entry): entry is { carrierShipId: string; targetPlayerId: string; targetShipId: string } => Boolean(entry));
    if (strikes.length > 0) {
      return { type: "use_carrier_strike", actorId, strikes };
    }
  }

  const handByKind = (kind: PlayCard["kind"]) => actor.hand.filter((card) => card.kind === kind);

  if (inPriority("play_additional_ship")) {
    const card = handByKind("additional_ship")[0];
    if (card) return { type: "play_additional_ship", actorId, cardId: card.id };
  }
  if (inPriority("play_minefield")) {
    const card = handByKind("minefield")[0];
    const openingTurnPending = state.openingTurnPendingPlayerIds.includes(actorId);
    const target = openingTurnPending
      ? enemyPlayers.find((player) => !player.fleetEffects.some((effect) => effect.kind === "minefield")) ?? null
      : enemyPlayers[0] ?? null;
    if (card && target) return { type: "play_minefield", actorId, cardId: card.id, targetPlayerId: target.id };
  }
  if (inPriority("play_submarine")) {
    const card = handByKind("submarine")[0];
    const target = shipTargets[0];
    if (card && target) return { type: "play_submarine", actorId, cardId: card.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId };
  }
  if (inPriority("play_torpedo_boat")) {
    const card = handByKind("torpedo_boat")[0];
    const target = unprotectedShipTargets[0];
    if (card && target) return { type: "play_torpedo_boat", actorId, cardId: card.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId };
  }
  if (inPriority("play_additional_damage")) {
    const card = handByKind("additional_damage")[0];
    const target = shipTargets.find(({ ship }) =>
      ship.attachments.some((attachment) => attachment.source.type === "salvo" || attachment.source.type === "additional_damage")
    );
    if (card && target) return { type: "play_additional_damage", actorId, cardId: card.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId };
  }
  if (inPriority("play_minesweeper")) {
    const card = handByKind("minesweeper")[0];
    const target = state.players.find((player) => player.fleetEffects.some((effect) => effect.kind === "minefield"));
    if (card && target) return { type: "play_minesweeper", actorId, cardId: card.id, targetPlayerId: target.id };
  }
  if (inPriority("play_repair")) {
    const card = handByKind("repair")[0];
    const ownTarget = livingShips.find((ship) =>
      ship.damage.some((damage) => damage.type === "salvo" || damage.type === "additional_damage")
    );
    if (card && ownTarget) return { type: "play_repair", actorId, cardId: card.id, targetShipId: ownTarget.card.id };
  }
  if (inPriority("play_smoke")) {
    const card = handByKind("smoke")[0];
    if (card) return { type: "play_smoke", actorId, cardId: card.id };
  }
  if (inPriority("play_destroyer_squadron")) {
    const card = handByKind("destroyer_squadron")[0];
    if (card) return { type: "play_destroyer_squadron", actorId, cardId: card.id };
  }
  if (inPriority("play_salvo")) {
    const salvos = actor.hand.filter((card): card is Extract<PlayCard, { kind: "salvo" }> => card.kind === "salvo");
    const salvo = salvos.find((card) =>
      livingShips.some((ship) => ship.card.gunCaliber === card.gunCaliber)
    );
    const target = unprotectedShipTargets[0];
    if (salvo && target) return { type: "play_salvo", actorId, cardId: salvo.id, targetPlayerId: target.targetPlayerId, targetShipId: target.targetShipId };
  }
  if (inPriority("attack_destroyer_squadron")) {
    const salvos = actor.hand.filter((card): card is Extract<PlayCard, { kind: "salvo" }> => card.kind === "salvo");
    const salvo = salvos.find((card) =>
      livingShips.some((ship) => ship.card.gunCaliber === card.gunCaliber)
    );
    const squadron = state.destroyerSquadrons.find((entry) => entry.ownerId !== actorId);
    if (salvo && squadron) return { type: "attack_destroyer_squadron", actorId, cardId: salvo.id, targetDestroyerId: squadron.id };
  }
  if (inPriority("discard_play_card")) {
    const card =
      actor.hand.find((entry) => entry.kind === "additional_damage") ||
      actor.hand.find((entry) => entry.kind !== "minefield" && entry.kind !== "submarine" && entry.kind !== "torpedo_boat" && entry.kind !== "additional_ship") ||
      actor.hand[0];
    if (card) return { type: "discard_play_card", actorId, cardId: card.id };
  }
  if (inPriority("end_turn")) {
    return { type: "end_turn", actorId };
  }

  return null;
}
