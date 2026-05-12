import { applyCommand, listLegalCommands } from "./engine.js";
import { assignServerSeats, buildClientSeatLayout } from "./multiplayer.js";
import { createInitialGameState } from "./sample-data.js";
import type {
  GameCommand,
  GameMode,
  GameOptions,
  GameState,
  PlayCard,
  PlayerId,
  RandomSource,
  SeatId,
  SeatReservation,
  ServerSeatRecord,
  ShipInstance
} from "./types.js";

export type MatchStatus = "lobby" | "in_progress" | "finished";

export interface LobbyCreateOptions {
  hostName: string;
  playerCount: 1 | 2 | 3 | 4;
  matchMode?: GameMode;
  campaignTargetScore?: number;
  preferredSeatId?: SeatId | null;
  clientId?: string | null;
}

export interface LobbyJoinOptions {
  playerName: string;
  role?: "human" | "bot";
  preferredSeatId?: SeatId | null;
  isLocalPlayer?: boolean;
  clientId?: string | null;
}

export interface MultiplayerPlayerRecord {
  playerId: PlayerId;
  clientId: string | null;
  sessionToken: string;
  playerName: string;
  isReady: boolean;
  role: "human" | "bot";
  preferredSeatId: SeatId | null;
  isHost: boolean;
  isLocalPlayer: boolean;
}

export interface MultiplayerLobby {
  lobbyId: string;
  joinCode: string;
  status: MatchStatus;
  playerCount: 1 | 2 | 3 | 4;
  matchMode: GameMode;
  campaignTargetScore: number;
  hostPlayerId: PlayerId;
  players: MultiplayerPlayerRecord[];
  seats: ServerSeatRecord[];
  state: GameState | null;
}

export interface VisiblePlayerState {
  id: PlayerId;
  name: string;
  seatId: SeatId | null;
  role: "human" | "bot" | "empty";
  ships: ShipInstance[];
  victoryPile: GameState["players"][number]["victoryPile"];
  fleetEffects: GameState["players"][number]["fleetEffects"];
  handCount: number;
  hand: PlayCard[] | null;
  eliminated: boolean;
  isCurrentPlayer: boolean;
}

export interface MultiplayerPlayerView {
  lobbyId: string;
  joinCode: string;
  status: MatchStatus;
  viewerPlayerId: PlayerId;
  viewerSeatId: SeatId | null;
  seatLayout: ReturnType<typeof buildClientSeatLayout>;
  legalCommands: string[];
  gameState: {
    phase: GameState["phase"];
    hasDrawnThisTurn: boolean;
    hasUsedCarrierStrikeThisTurn: boolean;
    hasPerformedActionThisTurn: boolean;
    roundNumber: number;
    turnNumber: number;
    currentPlayerId: PlayerId;
    playDeckCount: number;
    discardPileCount: number;
    shipDeckCount: number;
    destroyerSquadrons: GameState["destroyerSquadrons"];
    pendingDestroyerAttack: GameState["pendingDestroyerAttack"];
    openingTurnPendingPlayerIds: PlayerId[];
    winnerIds: PlayerId[];
    matchWinnerIds: PlayerId[];
    roundEndReason: GameState["roundEndReason"];
    campaign: GameState["campaign"];
    options: GameOptions;
    events: GameState["events"];
    players: VisiblePlayerState[];
  } | null;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

class DefaultRandomSource implements RandomSource {
  drawPlayCard(deck: PlayCard[]) {
    const [card, ...rest] = deck;
    assert(card, "Play deck is empty.");
    return { card, deck: rest };
  }

  drawShipCard(deck: GameState["shipDeck"]) {
    const [card, ...rest] = deck;
    assert(card, "Ship deck is empty.");
    return { card, deck: rest };
  }

  shufflePlayDeck(deck: PlayCard[]) {
    return shuffle(deck);
  }

  shuffleShipDeck(deck: GameState["shipDeck"]) {
    return shuffle(deck);
  }

  rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }
}

function randomIndex(maxExclusive: number) {
  if (maxExclusive <= 1) {
    return 0;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const target = copy[swapIndex];
    assert(current !== undefined && target !== undefined, "Shuffle indices must stay within bounds.");
    copy[index] = target;
    copy[swapIndex] = current;
  }
  return copy;
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function sanitizeName(name: string, fallback: string) {
  const cleaned = String(name).trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function toSeatReservations(players: MultiplayerPlayerRecord[]): SeatReservation[] {
  return players.map((player) => ({
    playerId: player.playerId,
    playerName: player.playerName,
    role: player.role,
    preferredSeatId: player.preferredSeatId,
    isHost: player.isHost,
    isLocalPlayer: player.isLocalPlayer
  }));
}

function seatRecordsForViewer(lobby: MultiplayerLobby, viewerPlayerId: PlayerId): ServerSeatRecord[] {
  return lobby.seats.map((seat) => {
    if (!seat.assignment) {
      return seat;
    }

    return {
      ...seat,
      assignment: {
        ...seat.assignment,
        isLocalPlayer: seat.assignment.playerId === viewerPlayerId
      }
    };
  });
}

function seatIdForPlayer(lobby: MultiplayerLobby, playerId: PlayerId): SeatId | null {
  const seat = lobby.seats.find((entry) => entry.assignment?.playerId === playerId);
  return seat?.seatId ?? null;
}

function buildVisiblePlayers(lobby: MultiplayerLobby, viewerPlayerId: PlayerId): VisiblePlayerState[] {
  const state = lobby.state;
  assert(state, "Match has not started yet.");

  return state.players.map((player) => {
    const seatId = seatIdForPlayer(lobby, player.id);
    const seatRole = lobby.seats.find((entry) => entry.assignment?.playerId === player.id)?.role ?? "empty";

    return {
      id: player.id,
      name: player.name,
      seatId,
      role: seatRole,
      ships: player.ships.map((ship) => ({
        ...ship,
        damage: ship.damage.map((damage) => ({ ...damage })),
        attachments: ship.attachments.map((attachment) => ({
          ...attachment,
          source: { ...attachment.source }
        }))
      })),
      victoryPile: [...player.victoryPile],
      fleetEffects: player.fleetEffects.map((effect) => ({ ...effect })),
      handCount: player.hand.length,
      hand: player.id === viewerPlayerId ? [...player.hand] : null,
      eliminated: player.eliminated,
      isCurrentPlayer: state.currentPlayerId === player.id
    };
  });
}

export class InMemoryMultiplayerService {
  private readonly lobbies = new Map<string, MultiplayerLobby>();

  private readonly rng: RandomSource;

  constructor(rng: RandomSource = new DefaultRandomSource()) {
    this.rng = rng;
  }

  createLobby(options: LobbyCreateOptions): MultiplayerLobby {
    const hostPlayerId = createId("player");
    const hostRecord: MultiplayerPlayerRecord = {
      playerId: hostPlayerId,
      clientId: options.clientId ? String(options.clientId).trim() : null,
      sessionToken: createId("session"),
      playerName: sanitizeName(options.hostName, "Host Admiral"),
      role: "human",
      isReady: false,
      preferredSeatId: options.preferredSeatId ?? 0,
      isHost: true,
      isLocalPlayer: true
    };

    const lobby: MultiplayerLobby = {
      lobbyId: createId("lobby"),
      joinCode: createJoinCode(),
      status: "lobby",
      playerCount: options.playerCount,
      matchMode: options.matchMode ?? "skirmish",
      campaignTargetScore: options.campaignTargetScore ?? 100,
      hostPlayerId,
      players: [hostRecord],
      seats: assignServerSeats([toSeatReservations([hostRecord])[0]!], options.playerCount),
      state: null
    };

    this.lobbies.set(lobby.lobbyId, lobby);
    return cloneLobby(lobby);
  }

  getLobby(lobbyId: string): MultiplayerLobby {
    const lobby = this.lobbies.get(lobbyId);
    assert(lobby, `Lobby ${lobbyId} was not found.`);
    return cloneLobby(lobby);
  }

  getLobbyByJoinCode(joinCode: string): MultiplayerLobby {
    const normalized = String(joinCode || "").trim().toUpperCase();
    const lobby = [...this.lobbies.values()].find((entry) => entry.joinCode.toUpperCase() === normalized);
    assert(lobby, `Lobby with join code ${normalized} was not found.`);
    return cloneLobby(lobby);
  }

  joinLobby(lobbyId: string, options: LobbyJoinOptions): MultiplayerLobby {
    return this.joinLobbyWithIdentity(lobbyId, options).lobby;
  }

  joinLobbyWithIdentity(
    lobbyId: string,
    options: LobbyJoinOptions
  ): { lobby: MultiplayerLobby; viewerPlayerId: PlayerId; sessionToken: string } {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Cannot join a lobby that has already started.");
    assert(lobby.players.length < lobby.playerCount, "Lobby is already full.");
    const normalizedClientId = options.clientId ? String(options.clientId).trim() : "";
    if (normalizedClientId) {
      const existing = lobby.players.find((player) => player.clientId === normalizedClientId);
      if (existing) {
        if (options.playerName) {
          existing.playerName = sanitizeName(options.playerName, existing.playerName);
        }
        lobby.seats = assignServerSeats(toSeatReservations(lobby.players), lobby.playerCount);
        return {
          lobby: cloneLobby(lobby),
          viewerPlayerId: existing.playerId,
          sessionToken: existing.sessionToken
        };
      }
    }

    const player: MultiplayerPlayerRecord = {
      playerId: createId("player"),
      clientId: normalizedClientId || null,
      sessionToken: createId("session"),
      playerName: sanitizeName(options.playerName, "Admiral"),
      role: options.role ?? "human",
      isReady: options.role === "bot",
      preferredSeatId: options.preferredSeatId ?? null,
      isHost: false,
      isLocalPlayer: options.isLocalPlayer ?? false
    };

    lobby.players.push(player);
    lobby.seats = assignServerSeats(toSeatReservations(lobby.players), lobby.playerCount);
    return {
      lobby: cloneLobby(lobby),
      viewerPlayerId: player.playerId,
      sessionToken: player.sessionToken
    };
  }

  setReady(lobbyId: string, sessionToken: string, ready: boolean): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Ready state can only be changed before the match starts.");
    const normalizedToken = String(sessionToken || "").trim();
    assert(normalizedToken.length > 0, "A sessionToken is required.");
    const player = lobby.players.find((entry) => entry.sessionToken === normalizedToken);
    assert(player, "Session token is not seated in this lobby.");
    if (player.role === "human") {
      player.isReady = Boolean(ready);
    }
    return cloneLobby(lobby);
  }

  joinLobbyByJoinCode(joinCode: string, options: LobbyJoinOptions): MultiplayerLobby {
    const lobby = this.getLobbyByJoinCode(joinCode);
    return this.joinLobby(lobby.lobbyId, options);
  }

  joinLobbyByJoinCodeWithIdentity(
    joinCode: string,
    options: LobbyJoinOptions
  ): { lobby: MultiplayerLobby; viewerPlayerId: PlayerId; sessionToken: string } {
    const lobby = this.getLobbyByJoinCode(joinCode);
    return this.joinLobbyWithIdentity(lobby.lobbyId, options);
  }

  reconnectLobbyByJoinCode(joinCode: string, clientId: string) {
    const normalizedClientId = String(clientId || "").trim();
    assert(normalizedClientId.length > 0, "A clientId is required to reconnect.");
    const lobby = this.getLobbyByJoinCode(joinCode);
    const player = lobby.players.find((entry) => entry.clientId === normalizedClientId);
    assert(player, `Client ${normalizedClientId} is not seated in lobby ${lobby.lobbyId}.`);
    return {
      lobbyId: lobby.lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status,
      playerCount: lobby.playerCount,
      viewerPlayerId: player.playerId,
      sessionToken: player.sessionToken,
      isHost: player.isHost
    };
  }

  resumeSession(lobbyId: string, sessionToken: string) {
    const lobby = this.requireMutableLobby(lobbyId);
    const normalizedSessionToken = String(sessionToken || "").trim();
    assert(normalizedSessionToken.length > 0, "A sessionToken is required to resume.");
    const player = lobby.players.find((entry) => entry.sessionToken === normalizedSessionToken);
    assert(player, "Session token is not seated in this lobby.");
    return {
      lobbyId: lobby.lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status,
      playerCount: lobby.playerCount,
      viewerPlayerId: player.playerId,
      sessionToken: player.sessionToken,
      isHost: player.isHost
    };
  }

  fillOpenSeatsWithBots(lobbyId: string, botNamePrefix = "Bot Admiral"): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Bots can only be added before the match starts.");

    while (lobby.players.length < lobby.playerCount) {
      const botIndex = lobby.players.filter((player) => player.role === "bot").length + 1;
      lobby.players.push({
        playerId: createId("player"),
        clientId: null,
        sessionToken: createId("session"),
        playerName: `${botNamePrefix} ${botIndex}`,
        role: "bot",
        isReady: true,
        preferredSeatId: null,
        isHost: false,
        isLocalPlayer: false
      });
    }

    lobby.seats = assignServerSeats(toSeatReservations(lobby.players), lobby.playerCount);
    return cloneLobby(lobby);
  }

  startMatch(lobbyId: string): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Match has already started.");
    assert(lobby.players.length > 0, "Cannot start a match with no players.");
    const humans = lobby.players.filter((player) => player.role === "human");
    assert(humans.length > 0, "At least one human player is required.");
    assert(humans.every((player) => player.isReady), "All human players must be ready before starting.");

    if (lobby.players.length < lobby.playerCount) {
      this.fillOpenSeatsWithBots(lobbyId);
    }

    const occupiedSeats = lobby.seats.filter((seat) => seat.assignment).sort((a, b) => a.seatId - b.seatId);
    const orderedNames = occupiedSeats.map((seat) => seat.assignment?.playerName).filter(Boolean) as string[];
    const state = createInitialGameState(orderedNames, this.rng, {
      matchMode: lobby.matchMode,
      campaignTargetScore: lobby.campaignTargetScore
    });

    lobby.seats = occupiedSeatsToStatePlayers(lobby.seats, state);
    lobby.players = synchronizeLobbyPlayersToState(lobby.players, occupiedSeats, lobby.seats);
    lobby.hostPlayerId = lobby.players.find((player) => player.isHost)?.playerId ?? lobby.hostPlayerId;
    lobby.state = state;
    this.runBotTurnsUntilHumanOrEnd(lobby);
    lobby.status = state.matchWinnerIds.length > 0 ? "finished" : "in_progress";
    return cloneLobby(lobby);
  }

  submitCommand(lobbyId: string, command: GameCommand, sessionToken?: string | null): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status !== "lobby", "Match has not started yet.");
    assert(lobby.state, "Match state is missing.");
    const actorId = this.resolveActorId(lobby, command.actorId, sessionToken);
    const normalizedCommand = normalizeCommandCardContext(lobby.state, { ...command, actorId });

    lobby.state = applyCommand(lobby.state, normalizedCommand, this.rng);
    this.autoResolvePendingDestroyerSelection(lobby, actorId);
    this.runBotTurnsUntilHumanOrEnd(lobby);
    if (lobby.state.phase === "round_complete" || lobby.state.matchWinnerIds.length > 0) {
      lobby.status = "finished";
    }
    return cloneLobby(lobby);
  }

  getPlayerView(lobbyId: string, viewerPlayerId: PlayerId | null, sessionToken?: string | null): MultiplayerPlayerView {
    const lobby = this.requireMutableLobby(lobbyId);
    const resolvedViewerId = this.resolveViewerId(lobby, viewerPlayerId, sessionToken);

    const viewerSeatId = seatIdForPlayer(lobby, resolvedViewerId);
    const seatLayout = buildClientSeatLayout(seatRecordsForViewer(lobby, resolvedViewerId), viewerSeatId);

    return {
      lobbyId: lobby.lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status,
      viewerPlayerId: resolvedViewerId,
      viewerSeatId,
      seatLayout,
      legalCommands: lobby.state ? listLegalCommands(lobby.state, resolvedViewerId) : [],
      gameState: lobby.state
        ? {
            phase: lobby.state.phase,
            hasDrawnThisTurn: lobby.state.hasDrawnThisTurn,
            hasUsedCarrierStrikeThisTurn: lobby.state.hasUsedCarrierStrikeThisTurn,
            hasPerformedActionThisTurn: lobby.state.hasPerformedActionThisTurn,
            roundNumber: lobby.state.roundNumber,
            turnNumber: lobby.state.turnNumber,
            currentPlayerId: lobby.state.currentPlayerId,
            playDeckCount: lobby.state.playDeck.length,
            discardPileCount: lobby.state.discardPile.length,
            shipDeckCount: lobby.state.shipDeck.length,
            destroyerSquadrons: lobby.state.destroyerSquadrons.map((squadron) => ({ ...squadron })),
            pendingDestroyerAttack: lobby.state.pendingDestroyerAttack
              ? { ...lobby.state.pendingDestroyerAttack }
              : null,
            openingTurnPendingPlayerIds: [...lobby.state.openingTurnPendingPlayerIds],
            winnerIds: [...lobby.state.winnerIds],
            matchWinnerIds: [...lobby.state.matchWinnerIds],
            roundEndReason: lobby.state.roundEndReason,
            campaign: lobby.state.campaign
              ? {
                  targetScore: lobby.state.campaign.targetScore,
                  totalScores: { ...lobby.state.campaign.totalScores },
                  scoreHistory: lobby.state.campaign.scoreHistory.map((entry) => ({
                    roundNumber: entry.roundNumber,
                    scores: { ...entry.scores }
                  })),
                  tieBreakerRound: lobby.state.campaign.tieBreakerRound
                }
              : null,
            options: { ...lobby.state.options },
            events: [...lobby.state.events],
            players: buildVisiblePlayers(lobby, resolvedViewerId)
          }
        : null
    };
  }

  private resolveViewerId(lobby: MultiplayerLobby, viewerPlayerId: PlayerId | null, sessionToken?: string | null): PlayerId {
    if (sessionToken) {
      const byToken = lobby.players.find((player) => player.sessionToken === String(sessionToken).trim());
      assert(byToken, "Session token is not seated in this lobby.");
      return byToken.playerId;
    }
    assert(
      Boolean(viewerPlayerId) && lobby.players.some((player) => player.playerId === viewerPlayerId),
      `Player ${viewerPlayerId} is not seated in this lobby.`
    );
    return viewerPlayerId as PlayerId;
  }

  private resolveActorId(lobby: MultiplayerLobby, actorId: PlayerId, sessionToken?: string | null): PlayerId {
    if (sessionToken) {
      const byToken = lobby.players.find((player) => player.sessionToken === String(sessionToken).trim());
      assert(byToken, "Session token is not seated in this lobby.");
      return byToken.playerId;
    }
    assert(lobby.players.some((player) => player.playerId === actorId), `Player ${actorId} is not seated in this lobby.`);
    return actorId;
  }

  private runBotTurnsUntilHumanOrEnd(lobby: MultiplayerLobby) {
    if (!lobby.state) {
      return;
    }
    let safety = 0;
    while (safety < 250) {
      safety += 1;
      const state = lobby.state;
      if (!state || state.phase === "round_complete" || state.matchWinnerIds.length > 0) {
        return;
      }
      const actor = state.players.find((entry) => entry.id === state.currentPlayerId);
      if (!actor) {
        return;
      }
      const actorRecord = lobby.players.find((entry) => entry.playerId === actor.id);
      const isBot = actorRecord?.role === "bot";
      if (!isBot) {
        return;
      }
      const command = chooseBotCommand(state, actor.id, this.rng);
      if (!command) {
        return;
      }
      lobby.state = applyCommand(state, command, this.rng);
      this.autoResolvePendingDestroyerSelection(lobby, actor.id);
    }
  }

  private autoResolvePendingDestroyerSelection(lobby: MultiplayerLobby, actorId: PlayerId) {
    const state = lobby.state;
    const pending = state?.pendingDestroyerAttack;
    if (!state || !pending || pending.ownerId !== actorId) {
      return;
    }
    const targetPlayer = state.players.find((entry) => entry.id === pending.targetPlayerId);
    if (!targetPlayer) {
      return;
    }
    const targetShipIds = targetPlayer.ships.filter((ship) => !ship.sunk).slice(0, pending.shipsToSink).map((ship) => ship.card.id);
    lobby.state = applyCommand(
      state,
      {
        type: "select_destroyer_squadron_targets",
        actorId,
        destroyerId: pending.destroyerId,
        targetShipIds
      },
      this.rng
    );
  }

  private requireMutableLobby(lobbyId: string): MultiplayerLobby {
    const lobby = this.lobbies.get(lobbyId);
    assert(lobby, `Lobby ${lobbyId} was not found.`);
    return lobby;
  }
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

function normalizeCommandCardContext(state: GameState, command: GameCommand): GameCommand {
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

function chooseBotCommand(state: GameState, actorId: PlayerId, rng: RandomSource): GameCommand | null {
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
        const target = unprotectedShipTargets[randomIndex(unprotectedShipTargets.length)];
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

function occupiedSeatsToStatePlayers(seats: ServerSeatRecord[], state: GameState): ServerSeatRecord[] {
  const occupiedSeats = seats.filter((seat) => seat.assignment).sort((a, b) => a.seatId - b.seatId);
  const playerByIndex = state.players;

  return seats.map((seat) => {
    if (!seat.assignment) {
      return { ...seat, assignment: null };
    }

    const seatIndex = occupiedSeats.findIndex((entry) => entry.seatId === seat.seatId);
    const statePlayer = playerByIndex[seatIndex];
    assert(statePlayer, `No game-state player exists for seat ${seat.seatId}.`);

    return {
      ...seat,
      assignment: {
        ...seat.assignment,
        playerId: statePlayer.id,
        playerName: statePlayer.name
      }
    };
  });
}

function cloneLobby(lobby: MultiplayerLobby): MultiplayerLobby {
  return {
    ...lobby,
    players: lobby.players.map((player) => ({ ...player })),
    seats: lobby.seats.map((seat) => ({
      ...seat,
      assignment: seat.assignment ? { ...seat.assignment } : null
    })),
    state: lobby.state
      ? {
          ...lobby.state,
          players: lobby.state.players.map((player) => ({
            ...player,
            ships: player.ships.map((ship) => ({
              ...ship,
              damage: [...ship.damage],
              attachments: ship.attachments.map((attachment) => ({
                ...attachment,
                source: { ...attachment.source }
              }))
            })),
            hand: [...player.hand],
            victoryPile: [...player.victoryPile],
            fleetEffects: player.fleetEffects.map((effect) => ({ ...effect }))
          })),
          playDeck: [...lobby.state.playDeck],
          discardPile: [...lobby.state.discardPile],
          shipDeck: [...lobby.state.shipDeck],
          destroyerSquadrons: lobby.state.destroyerSquadrons.map((squadron) => ({ ...squadron })),
          pendingDestroyerAttack: lobby.state.pendingDestroyerAttack
            ? { ...lobby.state.pendingDestroyerAttack }
            : null,
          openingTurnPendingPlayerIds: [...lobby.state.openingTurnPendingPlayerIds],
          events: [...lobby.state.events],
          winnerIds: [...lobby.state.winnerIds],
          matchWinnerIds: [...lobby.state.matchWinnerIds],
          campaign: lobby.state.campaign
            ? {
                targetScore: lobby.state.campaign.targetScore,
                totalScores: { ...lobby.state.campaign.totalScores },
                scoreHistory: lobby.state.campaign.scoreHistory.map((entry) => ({
                  roundNumber: entry.roundNumber,
                  scores: { ...entry.scores }
                })),
                tieBreakerRound: lobby.state.campaign.tieBreakerRound
              }
            : null,
          options: { ...lobby.state.options }
        }
      : null
  };
}

function synchronizeLobbyPlayersToState(
  players: MultiplayerPlayerRecord[],
  previousSeats: ServerSeatRecord[],
  updatedSeats: ServerSeatRecord[]
): MultiplayerPlayerRecord[] {
  const previousBySeat = new Map<SeatId, PlayerId>();
  previousSeats.forEach((seat) => {
    if (seat.assignment?.playerId != null) {
      previousBySeat.set(seat.seatId, seat.assignment.playerId);
    }
  });
  return players.map((player) => {
    const oldSeat = [...previousBySeat.entries()].find(([, oldPlayerId]) => oldPlayerId === player.playerId);
    const updatedSeat = oldSeat
      ? updatedSeats.find((seat) => seat.seatId === oldSeat[0])
      : updatedSeats.find((seat) => seat.assignment?.playerName === player.playerName);

    if (!updatedSeat?.assignment) {
      return { ...player };
    }

    return {
      ...player,
      playerId: updatedSeat.assignment.playerId,
      playerName: updatedSeat.assignment.playerName
    };
  });
}
