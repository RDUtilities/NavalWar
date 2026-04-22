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
}

export interface LobbyJoinOptions {
  playerName: string;
  role?: "human" | "bot";
  preferredSeatId?: SeatId | null;
  isLocalPlayer?: boolean;
}

export interface MultiplayerPlayerRecord {
  playerId: PlayerId;
  playerName: string;
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
    roundNumber: number;
    turnNumber: number;
    currentPlayerId: PlayerId;
    playDeckCount: number;
    discardPileCount: number;
    shipDeckCount: number;
    destroyerSquadrons: GameState["destroyerSquadrons"];
    pendingDestroyerAttack: GameState["pendingDestroyerAttack"];
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
      playerName: sanitizeName(options.hostName, "Host Admiral"),
      role: "human",
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

  joinLobby(lobbyId: string, options: LobbyJoinOptions): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Cannot join a lobby that has already started.");
    assert(lobby.players.length < lobby.playerCount, "Lobby is already full.");

    const player: MultiplayerPlayerRecord = {
      playerId: createId("player"),
      playerName: sanitizeName(options.playerName, "Admiral"),
      role: options.role ?? "human",
      preferredSeatId: options.preferredSeatId ?? null,
      isHost: false,
      isLocalPlayer: options.isLocalPlayer ?? false
    };

    lobby.players.push(player);
    lobby.seats = assignServerSeats(toSeatReservations(lobby.players), lobby.playerCount);
    return cloneLobby(lobby);
  }

  fillOpenSeatsWithBots(lobbyId: string, botNamePrefix = "Bot Admiral"): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status === "lobby", "Bots can only be added before the match starts.");

    while (lobby.players.length < lobby.playerCount) {
      const botIndex = lobby.players.filter((player) => player.role === "bot").length + 1;
      lobby.players.push({
        playerId: createId("player"),
        playerName: `${botNamePrefix} ${botIndex}`,
        role: "bot",
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
    lobby.players = synchronizeLobbyPlayersToState(lobby.players, lobby.seats);
    lobby.hostPlayerId = lobby.players.find((player) => player.isHost)?.playerId ?? lobby.hostPlayerId;
    lobby.state = state;
    lobby.status = state.matchWinnerIds.length > 0 ? "finished" : "in_progress";
    return cloneLobby(lobby);
  }

  submitCommand(lobbyId: string, command: GameCommand): MultiplayerLobby {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(lobby.status !== "lobby", "Match has not started yet.");
    assert(lobby.state, "Match state is missing.");
    assert(
      lobby.players.some((player) => player.playerId === command.actorId),
      `Player ${command.actorId} is not seated in this lobby.`
    );

    lobby.state = applyCommand(lobby.state, command, this.rng);
    if (lobby.state.phase === "round_complete" || lobby.state.matchWinnerIds.length > 0) {
      lobby.status = "finished";
    }
    return cloneLobby(lobby);
  }

  getPlayerView(lobbyId: string, viewerPlayerId: PlayerId): MultiplayerPlayerView {
    const lobby = this.requireMutableLobby(lobbyId);
    assert(
      lobby.players.some((player) => player.playerId === viewerPlayerId),
      `Player ${viewerPlayerId} is not seated in this lobby.`
    );

    const viewerSeatId = seatIdForPlayer(lobby, viewerPlayerId);
    const seatLayout = buildClientSeatLayout(lobby.seats, viewerSeatId);

    return {
      lobbyId: lobby.lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status,
      viewerPlayerId,
      viewerSeatId,
      seatLayout,
      legalCommands: lobby.state ? listLegalCommands(lobby.state, viewerPlayerId) : [],
      gameState: lobby.state
        ? {
            phase: lobby.state.phase,
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
            players: buildVisiblePlayers(lobby, viewerPlayerId)
          }
        : null
    };
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
  seats: ServerSeatRecord[]
): MultiplayerPlayerRecord[] {
  return players.map((player) => {
    const updatedSeat = seats.find((seat) => seat.assignment?.isHost === player.isHost && seat.assignment?.playerName === player.playerName)
      ?? seats.find((seat) => seat.assignment?.playerName === player.playerName);

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
