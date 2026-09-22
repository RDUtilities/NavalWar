import { automaticDestroyerSelection, chooseBotCommand, normalizeCommandCardContext } from "./bots.js";
import { actionOptions, type ActionOption } from "./action-options.js";
import { visibleEvents } from "./visibility.js";
import { applyCommand, listLegalCommands } from "./engine.js";
import { assignServerSeats, buildClientSeatLayout } from "./multiplayer.js";
import { createInitialGameState, createNextRoundState } from "./sample-data.js";
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
  actions: ActionOption[];
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
    discardPileTopCard: PlayCard | null;
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
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
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

  startNextRound(lobbyId: string): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.state && lobby.matchMode === "campaign", "This is not a Campaign match.");
    assert(lobby.state.phase === "round_complete" && lobby.state.matchWinnerIds.length === 0, "The next round is not available.");
    lobby.state = createNextRoundState(lobby.state, this.rng);
    lobby.status = "in_progress";
    this.runBotTurnsUntilHumanOrEnd(lobby);
    if (lobby.state.phase === "round_complete") lobby.status = "finished";
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
      actions: lobby.state ? actionOptions(lobby.state, resolvedViewerId) : [],
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
            discardPileTopCard: lobby.state.discardPile[lobby.state.discardPile.length - 1] ?? null,
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
            events: visibleEvents(lobby.state, resolvedViewerId),
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
    throw new Error("A valid session token is required to view this match.");
  }

  private resolveActorId(lobby: MultiplayerLobby, actorId: PlayerId, sessionToken?: string | null): PlayerId {
    if (sessionToken) {
      const byToken = lobby.players.find((player) => player.sessionToken === String(sessionToken).trim());
      assert(byToken, "Session token is not seated in this lobby.");
      return byToken.playerId;
    }
    throw new Error("A valid session token is required to act in this match.");
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
    if (!state) return;
    const selection = automaticDestroyerSelection(state, actorId);
    if (selection) lobby.state = applyCommand(state, selection, this.rng);
  }

  private requireMutableLobby(lobbyId: string): MultiplayerLobby {
    const lobby = this.lobbies.get(lobbyId);
    assert(lobby, `Lobby ${lobbyId} was not found.`);
    return lobby;
  }
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
