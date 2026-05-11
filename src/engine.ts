import type {
  AttackDestroyerSquadronCommand,
  AdditionalDamageCard,
  CardId,
  DamageSource,
  FleetAttachment,
  FleetEffect,
  GameCommand,
  GameState,
  PendingDestroyerSquadron,
  PlayCard,
  PlayDestroyerSquadronCommand,
  PlayerId,
  PlayerState,
  RandomSource,
  ResolveDestroyerSquadronRollCommand,
  SelectDestroyerSquadronTargetsCommand,
  ShipInstance,
  ShipId
} from "./types.js";

function cloneState(state: GameState): GameState {
  const next: GameState = {
    ...state,
    roundNumber: state.roundNumber,
    hasDrawnThisTurn: state.hasDrawnThisTurn,
    hasUsedCarrierStrikeThisTurn: state.hasUsedCarrierStrikeThisTurn,
    hasPerformedActionThisTurn: state.hasPerformedActionThisTurn,
    players: state.players.map((player) => ({
      ...player,
      ships: player.ships.map((ship) => ({
        ...ship,
        damage: [...ship.damage],
        attachments: ship.attachments.map((attachment) => ({
          ...attachment,
          card: attachment.card,
          source: { ...attachment.source }
        }))
      })),
      hand: [...player.hand],
      victoryPile: [...player.victoryPile],
      fleetEffects: player.fleetEffects.map((effect) => ({ ...effect, card: effect.card }))
    })),
    playDeck: [...state.playDeck],
    discardPile: [...state.discardPile],
    shipDeck: [...state.shipDeck],
    destroyerSquadrons: state.destroyerSquadrons.map((squadron) => ({ ...squadron, card: squadron.card })),
    pendingDestroyerAttack: state.pendingDestroyerAttack ? { ...state.pendingDestroyerAttack } : null,
    openingTurnPendingPlayerIds: [...state.openingTurnPendingPlayerIds],
    events: [...state.events],
    winnerIds: [...state.winnerIds],
    matchWinnerIds: [...state.matchWinnerIds],
    roundEndReason: state.roundEndReason,
    campaign: state.campaign
      ? {
          targetScore: state.campaign.targetScore,
          totalScores: { ...state.campaign.totalScores },
          scoreHistory: state.campaign.scoreHistory.map((entry) => ({
            roundNumber: entry.roundNumber,
            scores: { ...entry.scores }
          })),
          tieBreakerRound: state.campaign.tieBreakerRound
        }
      : null
  };

  return next;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find((entry) => entry.id === playerId);
  assert(player, `Player ${playerId} was not found.`);
  return player;
}

function getShip(player: PlayerState, shipId: ShipId): ShipInstance {
  const ship = player.ships.find((entry) => entry.card.id === shipId);
  assert(ship, `Ship ${shipId} was not found for player ${player.id}.`);
  return ship;
}

function removeCardFromHand(player: PlayerState, cardId: CardId): PlayCard {
  const index = player.hand.findIndex((card) => card.id === cardId);
  assert(index >= 0, `Card ${cardId} is not in ${player.id}'s hand.`);
  const [card] = player.hand.splice(index, 1);
  assert(card, `Card ${cardId} could not be removed from ${player.id}'s hand.`);
  return card;
}

function livingShips(player: PlayerState): ShipInstance[] {
  return player.ships.filter((ship) => !ship.sunk);
}

function scoreVictoryPile(player: PlayerState): number {
  return player.victoryPile.reduce((sum, ship) => sum + ship.hitNumber, 0);
}

function isImmediateSpecial(card: PlayCard): boolean {
  return (
    card.kind === "minefield" ||
    card.kind === "submarine" ||
    card.kind === "torpedo_boat" ||
    card.kind === "additional_damage" ||
    card.kind === "additional_ship"
  );
}

function hasMandatorySpecialInHand(player: PlayerState): boolean {
  return player.hand.some(isImmediateSpecial);
}

function isOpeningTurnForPlayer(state: GameState, playerId: PlayerId): boolean {
  return state.openingTurnPendingPlayerIds.includes(playerId);
}

function completeOpeningTurnForPlayer(state: GameState, playerId: PlayerId) {
  state.openingTurnPendingPlayerIds = state.openingTurnPendingPlayerIds.filter((id) => id !== playerId);
}

function hasScreensUp(player: PlayerState): boolean {
  return livingShips(player).some((ship) => !ship.card.isCarrier);
}

function fleetEffect(player: PlayerState, kind: FleetEffect["kind"]) {
  return player.fleetEffects.find((effect) => effect.kind === kind);
}

function fleetEffectsByKind(player: PlayerState, kind: FleetEffect["kind"]): FleetEffect[] {
  return player.fleetEffects.filter((effect) => effect.kind === kind);
}

function isProtectedBySmoke(player: PlayerState): boolean {
  return fleetEffect(player, "smoke") !== undefined;
}

function addEvent(state: GameState, actorId: PlayerId, type: string, detail: string) {
  state.events.push({ actorId, type, detail });
}

function ensureTurn(state: GameState, actorId: PlayerId) {
  assert(state.phase === "normal", "Only the normal phase is currently implemented.");
  assert(state.currentPlayerId === actorId, `It is not ${actorId}'s turn.`);
}

function ensureEnemy(attacker: PlayerState, defender: PlayerState) {
  const sameTeam = attacker.teamId && defender.teamId && attacker.teamId === defender.teamId;
  assert(!sameTeam, "Fleet members cannot target one another.");
  assert(attacker.id !== defender.id, "A player cannot target themselves.");
}

function discard(state: GameState, ...cards: PlayCard[]) {
  state.discardPile.push(...cards);
}

function totalDamage(ship: ShipInstance): number {
  return ship.damage.reduce((sum, entry) => sum + entry.hits, 0);
}

function sinkShip(
  state: GameState,
  attackerId: PlayerId,
  targetPlayer: PlayerState,
  targetShip: ShipInstance
) {
  targetShip.sunk = true;
  targetPlayer.ships = targetPlayer.ships.filter((ship) => ship.card.id !== targetShip.card.id);

  const attacker = getPlayer(state, attackerId);
  attacker.victoryPile.push(targetShip.card);

  if (targetShip.attachments.length > 0) {
    discard(state, ...targetShip.attachments.map((attachment) => attachment.card));
  }

  addEvent(
    state,
    attackerId,
    "ship_sunk",
    `${attacker.name} sank ${targetPlayer.name}'s ${targetShip.card.name}.`
  );

  if (livingShips(targetPlayer).length === 0) {
    targetPlayer.eliminated = true;
    for (const squadron of state.destroyerSquadrons.filter((entry) => entry.ownerId === targetPlayer.id)) {
      discard(state, squadron.card);
      addEvent(
        state,
        attackerId,
        "destroyer_squadron_discarded",
        `${targetPlayer.name}'s destroyer squadron was discarded because they have no ships remaining.`
      );
    }
    state.destroyerSquadrons = state.destroyerSquadrons.filter((entry) => entry.ownerId !== targetPlayer.id);
    if (state.pendingDestroyerAttack?.ownerId === targetPlayer.id) {
      state.pendingDestroyerAttack = null;
    }
    addEvent(state, attackerId, "player_eliminated", `${targetPlayer.name} has been eliminated.`);
  }
}

function getDestroyerSquadron(state: GameState, destroyerId: CardId): PendingDestroyerSquadron {
  const squadron = state.destroyerSquadrons.find((entry) => entry.id === destroyerId);
  assert(squadron, `Destroyer squadron ${destroyerId} was not found.`);
  return squadron;
}

function discardDestroyerSquadron(state: GameState, destroyerId: CardId) {
  const squadron = getDestroyerSquadron(state, destroyerId);
  state.destroyerSquadrons = state.destroyerSquadrons.filter((entry) => entry.id !== destroyerId);
  discard(state, squadron.card);
  if (state.pendingDestroyerAttack?.destroyerId === destroyerId) {
    state.pendingDestroyerAttack = null;
  }
}

function sinkShipImmediately(
  state: GameState,
  attackerId: PlayerId,
  targetPlayer: PlayerState,
  targetShip: ShipInstance
) {
  sinkShip(state, attackerId, targetPlayer, targetShip);
}

function applyDamage(
  state: GameState,
  attackerId: PlayerId,
  targetPlayer: PlayerState,
  targetShip: ShipInstance,
  attachment: FleetAttachment
) {
  targetShip.attachments.push(attachment);
  targetShip.damage.push(attachment.source);

  if (totalDamage(targetShip) < targetShip.card.hitNumber) {
    return;
  }

  sinkShip(state, attackerId, targetPlayer, targetShip);
}

function finalizeCampaignScores(state: GameState) {
  if (!state.campaign) {
    return;
  }

  const scores = Object.fromEntries(state.players.map((player) => [player.id, scoreVictoryPile(player)]));
  state.campaign.scoreHistory.push({ roundNumber: state.roundNumber, scores });
  for (const player of state.players) {
    state.campaign.totalScores[player.id] = (state.campaign.totalScores[player.id] ?? 0) + (scores[player.id] ?? 0);
  }

  const target = state.campaign.targetScore;
  const highestScore = Math.max(...Object.values(state.campaign.totalScores));
  const leaders = Object.entries(state.campaign.totalScores)
    .filter(([, total]) => total === highestScore)
    .map(([playerId]) => playerId);

  if (highestScore < target) {
    return;
  }

  if (leaders.length === 1) {
    state.matchWinnerIds = leaders;
    const winnerId = leaders[0];
    assert(winnerId, "Campaign winner could not be determined.");
    addEvent(state, winnerId, "campaign_won", `Campaign victory reached ${highestScore} point(s).`);
    return;
  }

  state.campaign.tieBreakerRound = true;
  addEvent(
    state,
    leaders[0] ?? state.currentPlayerId,
    "campaign_tiebreaker_required",
    `Campaign is tied at ${highestScore} point(s). A tie-breaker round is required.`
  );
}

function maybeCompleteRound(state: GameState) {
  if (state.phase === "round_complete") {
    return;
  }

  const activePlayers = state.players.filter((player) => !player.eliminated);
  if (activePlayers.length <= 1) {
    state.phase = "round_complete";
    state.winnerIds = activePlayers.map((player) => player.id);
    state.roundEndReason = "elimination";
    if (state.options.matchMode === "skirmish") {
      state.matchWinnerIds = [...state.winnerIds];
    }
    finalizeCampaignScores(state);
    return;
  }

  if (state.playDeck.length === 0) {
    state.phase = "round_complete";
    state.roundEndReason = "play_deck_empty";
    if (state.options.matchMode === "campaign") {
      const highestScore = Math.max(...state.players.map((player) => scoreVictoryPile(player)));
      state.winnerIds = state.players
        .filter((player) => scoreVictoryPile(player) === highestScore)
        .map((player) => player.id);
      finalizeCampaignScores(state);
    } else {
      const mostShipsAfloat = Math.max(...state.players.map((player) => livingShips(player).length));
      state.winnerIds = state.players
        .filter((player) => livingShips(player).length === mostShipsAfloat)
        .map((player) => player.id);
      state.matchWinnerIds = [...state.winnerIds];
    }
  }
}

function nextPlayerId(state: GameState): PlayerId {
  const liveOrder = state.players.filter((player) => !player.eliminated).map((player) => player.id);
  const currentIndex = liveOrder.indexOf(state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % liveOrder.length;
  const next = liveOrder[nextIndex];
  assert(next, "Could not determine the next player.");
  return next;
}

function drawReplacementAfterOpeningSpecial(state: GameState, actor: PlayerState, rng: RandomSource) {
  if (state.playDeck.length === 0) {
    return;
  }
  const result = rng.drawPlayCard(state.playDeck);
  state.playDeck = result.deck;
  actor.hand.push(result.card);
  addEvent(state, actor.id, "opening_special_replaced", `${actor.name} drew a replacement card after resolving a special card.`);
}

function maybeCompleteOpeningSpecialPhase(state: GameState, actor: PlayerState) {
  if (!isOpeningTurnForPlayer(state, actor.id)) {
    return;
  }
  if (hasMandatorySpecialInHand(actor)) {
    return;
  }
  completeOpeningTurnForPlayer(state, actor.id);
  addEvent(state, actor.id, "opening_specials_complete", `${actor.name} has completed opening special-card resolution.`);
}

function isMandatorySpecialResolutionCommand(type: GameCommand["type"]): boolean {
  return (
    type === "play_minefield" ||
    type === "play_submarine" ||
    type === "play_torpedo_boat" ||
    type === "play_additional_damage" ||
    type === "play_additional_ship"
  );
}

function addFleetEffect(player: PlayerState, effect: FleetEffect) {
  if (effect.kind !== "minefield") {
    player.fleetEffects = player.fleetEffects.filter((entry) => entry.kind !== effect.kind);
  }
  player.fleetEffects.push(effect);
}

function removeFleetEffects(player: PlayerState, ...kinds: FleetEffect["kind"][]) {
  player.fleetEffects = player.fleetEffects.filter((effect) => !kinds.includes(effect.kind));
}

function removeFleetEffect(player: PlayerState, kind: FleetEffect["kind"]): FleetEffect | undefined {
  const effect = player.fleetEffects.find((entry) => entry.kind === kind);
  if (!effect) {
    return undefined;
  }
  player.fleetEffects = player.fleetEffects.filter((entry) => entry !== effect);
  return effect;
}

function removeAllFleetEffects(player: PlayerState, kind: FleetEffect["kind"]): FleetEffect[] {
  const effects = player.fleetEffects.filter((entry) => entry.kind === kind);
  if (effects.length === 0) {
    return [];
  }
  player.fleetEffects = player.fleetEffects.filter((entry) => entry.kind !== kind);
  return effects;
}

function clearSmokeAtTurnStart(state: GameState, actor: PlayerState) {
  const smoke = removeFleetEffect(actor, "smoke");
  if (!smoke) {
    return;
  }

  discard(state, smoke.card);
  addEvent(state, actor.id, "smoke_expired", `${actor.name}'s smoke screen expired and was discarded.`);
}

function repairShip(state: GameState, actor: PlayerState, targetShip: ShipInstance, repairCard: PlayCard) {
  const repairableIndex = [...targetShip.attachments]
    .map((attachment, index) => ({ attachment, index }))
    .reverse()
    .find(({ attachment }) => attachment.source.type === "salvo" || attachment.source.type === "additional_damage");

  assert(repairableIndex, `${targetShip.card.name} has no attached salvo damage to repair.`);

  const clearedAttachment = targetShip.attachments.splice(repairableIndex.index, 1)[0];
  assert(clearedAttachment, `${targetShip.card.name} could not remove the selected damage card.`);
  const { card: clearedCard, source } = clearedAttachment;
  const damageIndex = targetShip.damage.findIndex(
    (damage) => damage.cardId === source.cardId && damage.type === source.type && damage.ownerId === source.ownerId
  );
  if (damageIndex >= 0) {
    targetShip.damage.splice(damageIndex, 1);
  }

  discard(state, repairCard, clearedCard);
  addEvent(
    state,
    actor.id,
    "ship_repaired",
    `${actor.name} repaired ${targetShip.card.name} by removing one attached damage card.`
  );
}

function layMinefieldOnFleet(
  state: GameState,
  actor: PlayerState,
  targetPlayer: PlayerState,
  card: PlayCard & { kind: "minefield"; hits: 1 | 2 }
) {
  addFleetEffect(targetPlayer, {
    kind: "minefield",
    ownerId: actor.id,
    card,
    hits: card.hits
  });

  for (const ship of [...livingShips(targetPlayer)]) {
    applyDamage(state, actor.id, targetPlayer, ship, {
      card,
      source: {
        type: "minefield",
        cardId: card.id,
        ownerId: actor.id,
        hits: card.hits
      }
    });
  }
}

function enforceCarrierTargeting(targetPlayer: PlayerState, targetShip: ShipInstance) {
  if (targetShip.card.isCarrier) {
    assert(!hasScreensUp(targetPlayer), "Carriers cannot be targeted while screening ships remain.");
  }
}

function hasAdditionalDamageTargetForActor(state: GameState, actor: PlayerState): boolean {
  return state.players.some((targetPlayer) => {
    const sameTeam = actor.teamId && targetPlayer.teamId && actor.teamId === targetPlayer.teamId;
    if (targetPlayer.id === actor.id || sameTeam || targetPlayer.eliminated) {
      return false;
    }
    return livingShips(targetPlayer).some((ship) => {
      if (ship.card.isCarrier && hasScreensUp(targetPlayer)) {
        return false;
      }
      return ship.attachments.some(
        (attachment) => attachment.source.type === "salvo" || attachment.source.type === "additional_damage"
      );
    });
  });
}

function hasEnemyShipTargetForActor(state: GameState, actor: PlayerState, allowSmoke: boolean): boolean {
  return state.players.some((targetPlayer) => {
    const sameTeam = actor.teamId && targetPlayer.teamId && actor.teamId === targetPlayer.teamId;
    if (targetPlayer.id === actor.id || sameTeam || targetPlayer.eliminated) {
      return false;
    }
    if (!allowSmoke && isProtectedBySmoke(targetPlayer)) {
      return false;
    }
    return livingShips(targetPlayer).some((ship) => {
      if (ship.card.isCarrier && hasScreensUp(targetPlayer)) {
        return false;
      }
      return true;
    });
  });
}

function hasOpeningMinefieldTargetForActor(state: GameState, actor: PlayerState): boolean {
  return state.players.some((targetPlayer) => {
    const sameTeam = actor.teamId && targetPlayer.teamId && actor.teamId === targetPlayer.teamId;
    if (targetPlayer.id === actor.id || sameTeam || targetPlayer.eliminated) {
      return false;
    }
    return fleetEffectsByKind(targetPlayer, "minefield").length === 0;
  });
}

function hasPlayableMandatorySpecial(state: GameState, actor: PlayerState): boolean {
  const openingTurnPending = isOpeningTurnForPlayer(state, actor.id);

  if (actor.hand.some((card) => card.kind === "minefield")) {
    if (!openingTurnPending || hasOpeningMinefieldTargetForActor(state, actor)) {
      return true;
    }
  }
  if (actor.hand.some((card) => card.kind === "additional_ship")) return true;
  if (
    actor.hand.some((card) => card.kind === "additional_damage") &&
    !openingTurnPending &&
    hasAdditionalDamageTargetForActor(state, actor)
  ) {
    return true;
  }
  if (actor.hand.some((card) => card.kind === "submarine") && hasEnemyShipTargetForActor(state, actor, true)) return true;
  if (actor.hand.some((card) => card.kind === "torpedo_boat") && hasEnemyShipTargetForActor(state, actor, false)) return true;
  return false;
}

function resolveImmediateDrawCard(state: GameState, actor: PlayerState, drawn: PlayCard, rng: RandomSource) {
  if (drawn.kind === "additional_ship") {
    addEvent(state, actor.id, "additional_ship_drawn", `${actor.name} drew Additional Ship and must resolve it immediately.`);
    resolveAdditionalShip(state, actor, drawn, rng);
    state.hasPerformedActionThisTurn = true;
    return;
  }

  if (!isImmediateSpecial(drawn)) {
    actor.hand.push(drawn);
    addEvent(state, actor.id, "card_drawn", `${actor.name} drew ${drawn.kind}.`);
    return;
  }

  actor.hand.push(drawn);
  addEvent(state, actor.id, "special_card_drawn", `${actor.name} drew ${drawn.kind} and must play it immediately.`);
}

function resolveAdditionalShip(
  state: GameState,
  actor: PlayerState,
  card: PlayCard & { kind: "additional_ship" },
  rng: RandomSource
) {
  discard(state, card);
  assert(state.shipDeck.length > 0, "The ship deck is empty.");
  const result = rng.drawShipCard(state.shipDeck);
  state.shipDeck = result.deck;

  const newShip: ShipInstance = {
    card: result.card,
    damage: [],
    attachments: [],
    sunk: false
  };
  actor.ships.push(newShip);

  const minefields = fleetEffectsByKind(actor, "minefield");
  for (const minefield of minefields) {
    if (minefield.hits === undefined || newShip.sunk) {
      continue;
    }
    applyDamage(state, minefield.ownerId, actor, newShip, {
      card: minefield.card,
      source: {
        type: "minefield",
        cardId: minefield.card.id,
        ownerId: minefield.ownerId,
        hits: minefield.hits
      }
    });
  }

  addEvent(state, actor.id, "ship_added", `${actor.name} added ${newShip.card.name} from the ship deck.`);
}

export function listLegalCommands(state: GameState, actorId: PlayerId): string[] {
  const player = getPlayer(state, actorId);
  if (state.currentPlayerId !== actorId || state.phase !== "normal") {
    return [];
  }

  const legal: string[] = [];
  const openingTurnPending = isOpeningTurnForPlayer(state, actorId);
  const mandatorySpecialInHand = hasMandatorySpecialInHand(player);
  if (player.eliminated) {
    return ["end_turn"];
  }
  if (openingTurnPending && !mandatorySpecialInHand) {
    return ["end_turn"];
  }
  const allowTurnEnd = !state.hasDrawnThisTurn || state.hasPerformedActionThisTurn;
  const canTakePlayAction = !state.hasPerformedActionThisTurn || openingTurnPending;

  if (mandatorySpecialInHand) {
    if (
      canTakePlayAction &&
      player.hand.some((card) => card.kind === "minefield") &&
      (!openingTurnPending || hasOpeningMinefieldTargetForActor(state, player))
    ) {
      legal.push("play_minefield");
    }
    if (canTakePlayAction && player.hand.some((card) => card.kind === "submarine") && hasEnemyShipTargetForActor(state, player, true)) legal.push("play_submarine");
    if (canTakePlayAction && player.hand.some((card) => card.kind === "torpedo_boat") && hasEnemyShipTargetForActor(state, player, false)) legal.push("play_torpedo_boat");
    if (
      canTakePlayAction &&
      player.hand.some((card) => card.kind === "additional_damage") &&
      !openingTurnPending &&
      hasAdditionalDamageTargetForActor(state, player)
    ) {
      legal.push("play_additional_damage");
    }
    if (
      canTakePlayAction &&
      (
        player.hand.some((card) => card.kind === "additional_damage") ||
        (openingTurnPending && player.hand.some((card) => card.kind === "minefield") && !hasOpeningMinefieldTargetForActor(state, player))
      )
    ) {
      legal.push("discard_play_card");
    }
    if (canTakePlayAction && player.hand.some((card) => card.kind === "additional_ship")) legal.push("play_additional_ship");

    if (legal.length === 0) {
      legal.push("end_turn");
    }
    return legal;
  }

  if (!openingTurnPending && !mandatorySpecialInHand && !state.hasDrawnThisTurn && !state.hasUsedCarrierStrikeThisTurn) {
    legal.push("draw_card");
  }

  const mustResolveSpecialsOnly = openingTurnPending || mandatorySpecialInHand;

  if (canTakePlayAction && (!mustResolveSpecialsOnly || player.hand.some((card) => card.kind === "salvo"))) {
    if (player.hand.some((card) => card.kind === "salvo")) legal.push("play_salvo");
  }
  if (canTakePlayAction && player.hand.some((card) => card.kind === "additional_damage") && hasAdditionalDamageTargetForActor(state, player)) legal.push("play_additional_damage");
  if (canTakePlayAction && (!mustResolveSpecialsOnly || player.hand.some((card) => card.kind === "smoke"))) {
    if (player.hand.some((card) => card.kind === "smoke")) legal.push("play_smoke");
  }
  if (canTakePlayAction && player.hand.some((card) => card.kind === "minefield")) legal.push("play_minefield");
  if (canTakePlayAction && player.hand.some((card) => card.kind === "additional_ship")) legal.push("play_additional_ship");
  if (
    canTakePlayAction &&
    !mustResolveSpecialsOnly &&
    player.hand.some((card) => card.kind === "minesweeper") &&
    state.players.some((entry) => fleetEffect(entry, "minefield"))
  ) {
    legal.push("play_minesweeper");
  }
  if (
    canTakePlayAction &&
    !mustResolveSpecialsOnly &&
    player.hand.some((card) => card.kind === "repair") &&
    livingShips(player).some((ship) =>
      ship.damage.some((damage) => damage.type === "salvo" || damage.type === "additional_damage")
    )
  ) {
    legal.push("play_repair");
  }
  if (canTakePlayAction && player.hand.some((card) => card.kind === "submarine") && hasEnemyShipTargetForActor(state, player, true)) {
    legal.push("play_submarine");
  }
  if (canTakePlayAction && player.hand.some((card) => card.kind === "torpedo_boat") && hasEnemyShipTargetForActor(state, player, false)) {
    legal.push("play_torpedo_boat");
  }
  if (canTakePlayAction && !mustResolveSpecialsOnly && player.hand.some((card) => card.kind === "destroyer_squadron")) {
    legal.push("play_destroyer_squadron");
  }
  if (
    canTakePlayAction &&
    !mustResolveSpecialsOnly &&
    player.hand.some((card) => card.kind === "salvo") &&
    state.destroyerSquadrons.some((entry) => entry.ownerId !== actorId)
  ) {
    legal.push("attack_destroyer_squadron");
  }
  if (
    canTakePlayAction &&
    !mustResolveSpecialsOnly &&
    state.destroyerSquadrons.some(
      (entry) =>
        entry.ownerId === actorId &&
        entry.deployedTurn < state.turnNumber &&
        livingShips(player).length > 0 &&
        !state.pendingDestroyerAttack
    )
  ) {
    legal.push("resolve_destroyer_squadron_roll");
  }
  if (canTakePlayAction && !mustResolveSpecialsOnly && state.pendingDestroyerAttack?.ownerId === actorId) {
    legal.push("select_destroyer_squadron_targets");
  }
  if (
    !openingTurnPending &&
    !mandatorySpecialInHand &&
    !state.hasDrawnThisTurn &&
    !state.hasUsedCarrierStrikeThisTurn &&
    livingShips(player).some((ship) => ship.card.isCarrier)
  ) {
    legal.push("use_carrier_strike");
  }
  if (state.hasDrawnThisTurn && !state.hasPerformedActionThisTurn && !mustResolveSpecialsOnly && player.hand.length > 0) {
    legal.push("discard_play_card");
  }
  if (allowTurnEnd && !openingTurnPending && !mandatorySpecialInHand) {
    legal.push("end_turn");
  } else if (allowTurnEnd && openingTurnPending && !mandatorySpecialInHand) {
    legal.push("end_turn");
  }

  if (legal.length === 0) {
    legal.push("end_turn");
  }
  return legal;
}

export function applyCommand(state: GameState, command: GameCommand, rng: RandomSource): GameState {
  const next = cloneState(state);
  ensureTurn(next, command.actorId);

  const actor = getPlayer(next, command.actorId);
  const openingTurnPending = isOpeningTurnForPlayer(next, actor.id);
  const mandatorySpecialInHand = hasMandatorySpecialInHand(actor);

  if (openingTurnPending && !mandatorySpecialInHand) {
    assert(command.type === "end_turn", `${actor.name} must end their opening turn after resolving special cards.`);
  }

  if (mandatorySpecialInHand) {
    const canOnlyEndTurnSafely =
      command.type === "end_turn" && (next.hasPerformedActionThisTurn || !hasPlayableMandatorySpecial(next, actor));
    const canDiscardMandatorySpecial =
      command.type === "discard_play_card" &&
      (
        actor.hand.some((card) => card.kind === "additional_damage") ||
        (isOpeningTurnForPlayer(next, actor.id) && actor.hand.some((card) => card.kind === "minefield") && !hasOpeningMinefieldTargetForActor(next, actor))
      );
    assert(
      isMandatorySpecialResolutionCommand(command.type) || canOnlyEndTurnSafely || canDiscardMandatorySpecial,
      `${actor.name} must resolve their mandatory special cards before taking any other action.`
    );
  }

  switch (command.type) {
    case "draw_card": {
      assert(!isOpeningTurnForPlayer(next, actor.id), `${actor.name} must resolve opening special cards before drawing.`);
      assert(!hasMandatorySpecialInHand(actor), `${actor.name} must play mandatory special cards before drawing.`);
      assert(!next.hasDrawnThisTurn, `${actor.name} has already performed their draw for this turn.`);
      assert(!next.hasUsedCarrierStrikeThisTurn, `${actor.name} cannot draw after choosing carrier air strikes this turn.`);
      assert(next.playDeck.length > 0, "Play deck is empty.");
      const result = rng.drawPlayCard(next.playDeck);
      next.playDeck = result.deck;
      next.hasDrawnThisTurn = true;
      resolveImmediateDrawCard(next, actor, result.card, rng);
      return next;
    }

    case "play_salvo": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "salvo", `Card ${card.id} is not a salvo.`);
      assert(
        livingShips(actor).some((ship) => ship.card.gunCaliber === card.gunCaliber),
        `${actor.name} does not have a ship that can fire ${card.gunCaliber}.`
      );

      const targetPlayer = getPlayer(next, command.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      assert(!isProtectedBySmoke(targetPlayer), `${targetPlayer.name} is protected by smoke.`);
      const targetShip = getShip(targetPlayer, command.targetShipId);
      enforceCarrierTargeting(targetPlayer, targetShip);

      applyDamage(next, actor.id, targetPlayer, targetShip, {
        card,
        source: {
          type: "salvo",
          cardId: card.id,
          ownerId: actor.id,
          hits: card.hits
        }
      });

      addEvent(
        next,
        actor.id,
        "salvo_fired",
        `${actor.name} attached ${card.gunCaliber} for ${card.hits} hit(s) to ${targetPlayer.name}'s ${targetShip.card.name}.`
      );
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "play_additional_damage": {
      assert(!isOpeningTurnForPlayer(next, actor.id), `${actor.name} must discard Additional Damage during opening special resolution.`);
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "additional_damage", `Card ${card.id} is not Additional Damage.`);

      const targetPlayer = getPlayer(next, command.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      const targetShip = getShip(targetPlayer, command.targetShipId);
      enforceCarrierTargeting(targetPlayer, targetShip);
      assert(
        targetShip.attachments.some(
          (attachment) => attachment.source.type === "salvo" || attachment.source.type === "additional_damage"
        ),
        `${targetShip.card.name} has no attached salvo stack for Additional Damage.`
      );

      applyDamage(next, actor.id, targetPlayer, targetShip, {
        card,
        source: {
          type: "additional_damage",
          cardId: card.id,
          ownerId: actor.id,
          hits: card.hits
        }
      });

      addEvent(
        next,
        actor.id,
        "additional_damage_played",
        `${actor.name} attached Additional Damage (${card.hits}) to ${targetPlayer.name}'s ${targetShip.card.name}.`
      );
      next.hasPerformedActionThisTurn = true;
      if (isOpeningTurnForPlayer(next, actor.id)) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
        maybeCompleteOpeningSpecialPhase(next, actor);
      }
      maybeCompleteRound(next);
      return next;
    }

    case "play_smoke": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "smoke", `Card ${card.id} is not smoke.`);
      addFleetEffect(actor, { kind: "smoke", ownerId: actor.id, card });
      addEvent(next, actor.id, "smoke_deployed", `${actor.name} deployed smoke in front of their fleet.`);
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "play_minefield": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "minefield", `Card ${card.id} is not a minefield.`);
      const targetPlayer = getPlayer(next, command.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      if (isOpeningTurnForPlayer(next, actor.id)) {
        assert(
          fleetEffectsByKind(targetPlayer, "minefield").length === 0,
          `Only one minefield may be placed on a fleet during the opening turn.`
        );
      }
      layMinefieldOnFleet(next, actor, targetPlayer, card);
      addEvent(
        next,
        actor.id,
        "minefield_deployed",
        `${actor.name} laid a ${card.hits}-hit minefield in front of ${targetPlayer.name}'s fleet.`
      );
      next.hasPerformedActionThisTurn = true;
      if (isOpeningTurnForPlayer(next, actor.id)) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
        maybeCompleteOpeningSpecialPhase(next, actor);
      }
      maybeCompleteRound(next);
      return next;
    }

    case "play_additional_ship": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "additional_ship", `Card ${card.id} is not an Additional Ship card.`);
      resolveAdditionalShip(next, actor, card, rng);
      next.hasPerformedActionThisTurn = true;
      if (isOpeningTurnForPlayer(next, actor.id)) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
      }
      maybeCompleteOpeningSpecialPhase(next, actor);
      maybeCompleteRound(next);
      return next;
    }

    case "play_minesweeper": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "minesweeper", `Card ${card.id} is not a Minesweeper card.`);

      const targetPlayer = getPlayer(next, command.targetPlayerId);
      const minefields = removeAllFleetEffects(targetPlayer, "minefield");
      assert(minefields.length > 0, `${targetPlayer.name} does not currently have a minefield in front of their fleet.`);

      discard(next, card, ...minefields.map((minefield) => minefield.card));
      addEvent(
        next,
        actor.id,
        "minefield_cleared",
        `${actor.name} used Minesweeper to clear ${minefields.length} minefield(s) in front of ${targetPlayer.name}'s fleet.`
      );
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "play_repair": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "repair", `Card ${card.id} is not a Repair card.`);

      const targetShip = getShip(actor, command.targetShipId);
      repairShip(next, actor, targetShip, card);
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "play_submarine": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "submarine", `Card ${card.id} is not a Submarine card.`);

      const targetPlayer = getPlayer(next, command.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      const targetShip = getShip(targetPlayer, command.targetShipId);
      enforceCarrierTargeting(targetPlayer, targetShip);

      const roll = rng.rollDie();
      addEvent(
        next,
        actor.id,
        "submarine_roll",
        `${actor.name} rolled ${roll} with Submarine against ${targetPlayer.name}'s ${targetShip.card.name}.`
      );

      if (roll >= 5) {
        sinkShipImmediately(next, actor.id, targetPlayer, targetShip);
      } else {
        addEvent(
          next,
          actor.id,
          "submarine_missed",
          `${actor.name}'s submarine attack missed ${targetPlayer.name}'s ${targetShip.card.name}.`
        );
      }

      discard(next, card);
      next.hasPerformedActionThisTurn = true;
      if (isOpeningTurnForPlayer(next, actor.id)) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
        maybeCompleteOpeningSpecialPhase(next, actor);
      }
      maybeCompleteRound(next);
      return next;
    }

    case "play_torpedo_boat": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "torpedo_boat", `Card ${card.id} is not a Torpedo Boat card.`);

      const targetPlayer = getPlayer(next, command.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      const targetShip = getShip(targetPlayer, command.targetShipId);
      enforceCarrierTargeting(targetPlayer, targetShip);

      const roll = rng.rollDie();
      addEvent(
        next,
        actor.id,
        "torpedo_boat_roll",
        `${actor.name} rolled ${roll} with Torpedo Boat against ${targetPlayer.name}'s ${targetShip.card.name}.`
      );

      if (roll === 6) {
        sinkShipImmediately(next, actor.id, targetPlayer, targetShip);
      } else {
        addEvent(
          next,
          actor.id,
          "torpedo_boat_missed",
          `${actor.name}'s torpedo boat attack missed ${targetPlayer.name}'s ${targetShip.card.name}.`
        );
      }

      discard(next, card);
      next.hasPerformedActionThisTurn = true;
      if (isOpeningTurnForPlayer(next, actor.id)) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
        maybeCompleteOpeningSpecialPhase(next, actor);
      }
      maybeCompleteRound(next);
      return next;
    }

    case "play_destroyer_squadron": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "destroyer_squadron", `Card ${card.id} is not a Destroyer Squadron card.`);
      next.destroyerSquadrons.push({
        id: card.id,
        ownerId: actor.id,
        card,
        deployedTurn: next.turnNumber,
        hitsTaken: 0
      });
      addEvent(next, actor.id, "destroyer_squadron_deployed", `${actor.name} deployed a destroyer squadron.`);
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "attack_destroyer_squadron": {
      const card = removeCardFromHand(actor, command.cardId);
      assert(card.kind === "salvo", `Card ${card.id} is not a salvo.`);
      assert(
        livingShips(actor).some((ship) => ship.card.gunCaliber === card.gunCaliber),
        `${actor.name} does not have a ship that can fire ${card.gunCaliber}.`
      );

      const squadron = getDestroyerSquadron(next, command.targetDestroyerId);
      assert(squadron.ownerId !== actor.id, "You cannot fire on your own destroyer squadron.");

      squadron.hitsTaken += card.hits;
      discard(next, card);
      addEvent(
        next,
        actor.id,
        "destroyer_squadron_hit",
        `${actor.name} fired ${card.gunCaliber} for ${card.hits} hit(s) at a destroyer squadron.`
      );

      if (squadron.hitsTaken >= squadron.card.hits) {
        discardDestroyerSquadron(next, squadron.id);
        addEvent(next, actor.id, "destroyer_squadron_sunk", "The destroyer squadron was sunk and discarded.");
      }

      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "resolve_destroyer_squadron_roll": {
      const typedCommand = command as ResolveDestroyerSquadronRollCommand;
      const squadron = getDestroyerSquadron(next, typedCommand.destroyerId);
      assert(squadron.ownerId === actor.id, "Only the owner may resolve their destroyer squadron.");
      assert(squadron.deployedTurn < next.turnNumber, "Destroyer squadron cannot attack until the owner's next turn.");
      assert(livingShips(actor).length > 0, "Destroyer squadron cannot attack if its owner has no ships remaining.");

      const targetPlayer = getPlayer(next, typedCommand.targetPlayerId);
      ensureEnemy(actor, targetPlayer);
      assert(!isProtectedBySmoke(targetPlayer), `${targetPlayer.name} is protected by smoke.`);
      const shipsToSink = Math.min(rng.rollDie(), livingShips(targetPlayer).length);
      next.pendingDestroyerAttack = {
        destroyerId: squadron.id,
        ownerId: actor.id,
        targetPlayerId: targetPlayer.id,
        shipsToSink
      };
      addEvent(
        next,
        actor.id,
        "destroyer_squadron_roll",
        `${actor.name}'s destroyer squadron rolled ${shipsToSink} ship sink(s) against ${targetPlayer.name}.`
      );
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "select_destroyer_squadron_targets": {
      const typedCommand = command as SelectDestroyerSquadronTargetsCommand;
      const pending = next.pendingDestroyerAttack;
      assert(pending, "There is no destroyer squadron attack awaiting target selection.");
      assert(pending.ownerId === actor.id, "Only the owner may select destroyer squadron targets.");
      assert(pending.destroyerId === typedCommand.destroyerId, "Target selection does not match the pending destroyer squadron.");

      const targetPlayer = getPlayer(next, pending.targetPlayerId);
      const uniqueIds = new Set(typedCommand.targetShipIds);
      assert(uniqueIds.size === typedCommand.targetShipIds.length, "Destroyer squadron targets must be unique ships.");
      assert(
        typedCommand.targetShipIds.length === pending.shipsToSink,
        `Destroyer squadron must select exactly ${pending.shipsToSink} ship(s).`
      );

      for (const shipId of typedCommand.targetShipIds) {
        const ship = getShip(targetPlayer, shipId);
        sinkShipImmediately(next, actor.id, targetPlayer, ship);
      }

      discardDestroyerSquadron(next, pending.destroyerId);
      addEvent(
        next,
        actor.id,
        "destroyer_squadron_attack_resolved",
        `${actor.name}'s destroyer squadron attack has been resolved.`
      );
      next.pendingDestroyerAttack = null;
      maybeCompleteRound(next);
      return next;
    }

    case "use_carrier_strike": {
      assert(!isOpeningTurnForPlayer(next, actor.id), `${actor.name} must resolve opening special cards before using carrier strikes.`);
      assert(!hasMandatorySpecialInHand(actor), `${actor.name} must resolve mandatory special cards before using carrier strikes.`);
      assert(!next.hasDrawnThisTurn, `${actor.name} cannot perform carrier strikes after drawing this turn.`);
      assert(!next.hasUsedCarrierStrikeThisTurn, `${actor.name} has already used carrier strikes this turn.`);
      assert(command.strikes.length > 0, "At least one carrier strike must be declared.");

      const usedCarriers = new Set<string>();
      for (const strike of command.strikes) {
        assert(!usedCarriers.has(strike.carrierShipId), `Carrier ${strike.carrierShipId} has already been assigned a strike this turn.`);
        usedCarriers.add(strike.carrierShipId);

        const carrier = getShip(actor, strike.carrierShipId);
        assert(carrier.card.isCarrier, "Only carriers can perform air strikes.");

        const targetPlayer = getPlayer(next, strike.targetPlayerId);
        ensureEnemy(actor, targetPlayer);
        assert(!isProtectedBySmoke(targetPlayer), `${targetPlayer.name} is protected by smoke.`);
        const targetShip = getShip(targetPlayer, strike.targetShipId);
        enforceCarrierTargeting(targetPlayer, targetShip);

        const roll = rng.rollDie();
        addEvent(
          next,
          actor.id,
          "carrier_roll",
          `${actor.name}'s ${carrier.card.name} rolled ${roll} against ${targetShip.card.name}.`
        );

        if (roll === 1) {
          const syntheticCard: AdditionalDamageCard = {
            id: `carrier-strike-${carrier.card.id}-${targetShip.card.id}`,
            kind: "additional_damage",
            hits: 2
          };
          applyDamage(next, actor.id, targetPlayer, targetShip, {
            card: syntheticCard,
            source: {
              type: "carrier_strike",
              cardId: syntheticCard.id,
              ownerId: actor.id,
              hits: targetShip.card.hitNumber
            }
          });
        } else {
          addEvent(next, actor.id, "air_strike_missed", `${actor.name}'s ${carrier.card.name} air strike missed.`);
        }
      }
      next.hasUsedCarrierStrikeThisTurn = true;
      next.hasPerformedActionThisTurn = true;
      maybeCompleteRound(next);
      return next;
    }

    case "discard_play_card": {
      const canDiscardMandatorySpecial =
        hasMandatorySpecialInHand(actor) &&
        (
          actor.hand.some((handCard) => handCard.kind === "additional_damage") ||
          (isOpeningTurnForPlayer(next, actor.id) && actor.hand.some((handCard) => handCard.kind === "minefield") && !hasOpeningMinefieldTargetForActor(next, actor))
        );

      if (!canDiscardMandatorySpecial) {
        assert(next.hasDrawnThisTurn, `${actor.name} cannot discard as a play action before drawing.`);
        assert(!next.hasPerformedActionThisTurn, `${actor.name} has already taken their turn action.`);
      }
      const card = removeCardFromHand(actor, command.cardId);
      if (canDiscardMandatorySpecial) {
        assert(
          card.kind === "additional_damage" ||
            (isOpeningTurnForPlayer(next, actor.id) && card.kind === "minefield" && !hasOpeningMinefieldTargetForActor(next, actor)),
          `${actor.name} must resolve mandatory special cards instead of discarding.`
        );
      } else if (hasMandatorySpecialInHand(actor)) {
        assert(false, `${actor.name} must resolve mandatory special cards instead of discarding.`);
      }
      discard(next, card);
      if (canDiscardMandatorySpecial) {
        drawReplacementAfterOpeningSpecial(next, actor, rng);
        if (isOpeningTurnForPlayer(next, actor.id)) {
          maybeCompleteOpeningSpecialPhase(next, actor);
        } else {
          next.hasPerformedActionThisTurn = true;
        }
        addEvent(
          next,
          actor.id,
          card.kind === "minefield" ? "opening_minefield_discarded_unplayable" : "opening_additional_damage_discarded",
          card.kind === "minefield"
            ? `${actor.name} discarded an unplayable opening-turn Minefield and drew a replacement card.`
            : `${actor.name} discarded Additional Damage during opening resolution and drew a replacement card.`
        );
      } else {
        next.hasPerformedActionThisTurn = true;
        addEvent(next, actor.id, "play_card_discarded", `${actor.name} discarded ${card.kind} as their action for the turn.`);
      }
      maybeCompleteRound(next);
      return next;
    }

    case "end_turn": {
      if (isOpeningTurnForPlayer(next, actor.id)) {
        assert(!hasMandatorySpecialInHand(actor), `${actor.name} must resolve all opening special cards before ending their turn.`);
        completeOpeningTurnForPlayer(next, actor.id);
      }
      const canEndTurnWithUnplayableMandatory =
        hasMandatorySpecialInHand(actor) &&
        next.hasDrawnThisTurn &&
        !next.hasPerformedActionThisTurn &&
        !hasPlayableMandatorySpecial(next, actor);
      assert(
        !next.hasDrawnThisTurn || next.hasPerformedActionThisTurn || canEndTurnWithUnplayableMandatory,
        `${actor.name} must take an action after drawing before ending their turn.`
      );
      next.currentPlayerId = nextPlayerId(next);
      clearSmokeAtTurnStart(next, getPlayer(next, next.currentPlayerId));
      next.turnNumber += 1;
      next.hasDrawnThisTurn = false;
      next.hasUsedCarrierStrikeThisTurn = false;
      next.hasPerformedActionThisTurn = false;
      addEvent(next, actor.id, "turn_ended", `${actor.name} ended their turn.`);
      maybeCompleteRound(next);
      return next;
    }
  }
}
