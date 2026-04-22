import { fullPlayDeck, fullShipDeck } from "./cards.js";
import type {
  CampaignState,
  GameOptions,
  GameState,
  PlayCard,
  PlayerState,
  RandomSource,
  ShipCard,
  ShipInstance
} from "./types.js";

function cloneShip(card: ShipCard): ShipInstance {
  return { card, damage: [], attachments: [], sunk: false };
}

function drawManyPlayCards(deck: PlayCard[], count: number, rng: RandomSource) {
  let nextDeck = [...deck];
  const cards: PlayCard[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = rng.drawPlayCard(nextDeck);
    cards.push(result.card);
    nextDeck = result.deck;
  }
  return { cards, deck: nextDeck };
}

function drawManyShips(deck: ShipCard[], count: number, rng: RandomSource) {
  let nextDeck = [...deck];
  const ships: ShipInstance[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = rng.drawShipCard(nextDeck);
    ships.push(cloneShip(result.card));
    nextDeck = result.deck;
  }
  return { ships, deck: nextDeck };
}

export class DeterministicRandom implements RandomSource {
  private dieResults: number[];

  constructor(dieResults: number[] = [1, 3, 5, 2, 6, 4]) {
    this.dieResults = [...dieResults];
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
    return [...deck];
  }

  shuffleShipDeck(deck: ShipCard[]) {
    return [...deck];
  }

  rollDie() {
    const next = this.dieResults.shift();
    if (!next) {
      throw new Error("No die results remaining in deterministic RNG.");
    }
    this.dieResults.push(next);
    return next;
  }
}

function createCampaignState(playerNames: string[], targetScore: number): CampaignState {
  return {
    targetScore,
    totalScores: Object.fromEntries(playerNames.map((_, index) => [`p${index + 1}`, 0])),
    scoreHistory: [],
    tieBreakerRound: false
  };
}

function createPlayersForRound(
  playerNames: string[],
  shipDeck: ShipCard[],
  playDeck: PlayCard[],
  options: GameOptions,
  rng: RandomSource
) {
  let nextShipDeck = [...shipDeck];
  let nextPlayDeck = [...playDeck];
  const players: PlayerState[] = playerNames.map((name, index) => {
    const shipDraw = drawManyShips(nextShipDeck, options.startingShipCount, rng);
    nextShipDeck = shipDraw.deck;
    const handDraw = drawManyPlayCards(nextPlayDeck, options.startingHandSize, rng);
    nextPlayDeck = handDraw.deck;

    return {
      id: `p${index + 1}`,
      name,
      ships: shipDraw.ships,
      hand: handDraw.cards,
      victoryPile: [],
      eliminated: false,
      fleetEffects: []
    };
  });

  return { players, shipDeck: nextShipDeck, playDeck: nextPlayDeck };
}

export function createInitialGameState(
  playerNames: string[] = ["Admiral North", "Admiral South"],
  rng: RandomSource = new DeterministicRandom(),
  options: Partial<GameOptions> = {}
): GameState {
  const resolvedOptions: GameOptions = {
    maxHandSize: options.maxHandSize ?? 5,
    startingShipCount: options.startingShipCount ?? 5,
    startingHandSize: options.startingHandSize ?? 5,
    matchMode: options.matchMode ?? "skirmish",
    campaignTargetScore: options.campaignTargetScore ?? 100
  };

  const shuffledShipDeck = rng.shuffleShipDeck(fullShipDeck);
  const shuffledPlayDeck = rng.shufflePlayDeck(fullPlayDeck);
  const roundSetup = createPlayersForRound(playerNames, shuffledShipDeck, shuffledPlayDeck, resolvedOptions, rng);

  return {
    phase: "normal",
    roundNumber: 1,
    turnNumber: 1,
    currentPlayerId: roundSetup.players[0]?.id ?? "p1",
    hasDrawnThisTurn: false,
    hasUsedCarrierStrikeThisTurn: false,
    hasPerformedActionThisTurn: false,
    players: roundSetup.players,
    playDeck: roundSetup.playDeck,
    discardPile: [],
    shipDeck: roundSetup.shipDeck,
    destroyerSquadrons: [],
    pendingDestroyerAttack: null,
    openingTurnPendingPlayerIds: roundSetup.players.map((player) => player.id),
    events: [],
    winnerIds: [],
    matchWinnerIds: [],
    roundEndReason: null,
    campaign:
      resolvedOptions.matchMode === "campaign"
        ? createCampaignState(playerNames, resolvedOptions.campaignTargetScore)
        : null,
    options: resolvedOptions
  };
}

export function createNextRoundState(state: GameState, rng: RandomSource): GameState {
  const playerNames = state.players.map((player) => player.name);
  const shuffledShipDeck = rng.shuffleShipDeck(fullShipDeck);
  const shuffledPlayDeck = rng.shufflePlayDeck(fullPlayDeck);
  const roundSetup = createPlayersForRound(playerNames, shuffledShipDeck, shuffledPlayDeck, state.options, rng);

  return {
    phase: "normal",
    roundNumber: state.roundNumber + 1,
    turnNumber: 1,
    currentPlayerId: roundSetup.players[0]?.id ?? "p1",
    hasDrawnThisTurn: false,
    hasUsedCarrierStrikeThisTurn: false,
    hasPerformedActionThisTurn: false,
    players: roundSetup.players,
    playDeck: roundSetup.playDeck,
    discardPile: [],
    shipDeck: roundSetup.shipDeck,
    destroyerSquadrons: [],
    pendingDestroyerAttack: null,
    openingTurnPendingPlayerIds: roundSetup.players.map((player) => player.id),
    events: [],
    winnerIds: [],
    matchWinnerIds: [...state.matchWinnerIds],
    roundEndReason: null,
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
      : null,
    options: state.options
  };
}

export function createSampleState(options: Partial<GameOptions> = {}): GameState {
  return createInitialGameState(["Admiral North", "Admiral South"], new DeterministicRandom(), options);
}
