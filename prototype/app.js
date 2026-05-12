const screens = [...document.querySelectorAll("[data-screen]")];
const screenButtons = [...document.querySelectorAll("[data-target-screen]")];
const rulesButtons = [...document.querySelectorAll("[data-open-rules]")];
const logButtons = [...document.querySelectorAll("[data-open-log]")];
const scoreButtons = [...document.querySelectorAll("[data-open-score]")];
const victoryButtons = [...document.querySelectorAll("[data-victory-pile]")];
const zoomOverlay = document.getElementById("card-zoom-overlay");
const zoomImage = document.getElementById("card-zoom-image");
const zoomCaption = document.getElementById("card-zoom-caption");
const zoomClose = document.getElementById("card-zoom-close");
const rulesOverlay = document.getElementById("rules-overlay");
const rulesClose = document.getElementById("rules-close");
const victoryOverlay = document.getElementById("victory-overlay");
const victoryClose = document.getElementById("victory-close");
const victoryGrid = document.getElementById("victory-grid");
const victoryTitle = document.getElementById("victory-title");
const salvoOverlay = document.getElementById("salvo-overlay");
const salvoClose = document.getElementById("salvo-close");
const salvoGrid = document.getElementById("salvo-grid");
const salvoTitle = document.getElementById("salvo-title");
const logOverlay = document.getElementById("log-overlay");
const logClose = document.getElementById("log-close");
const combatLogList = document.getElementById("combat-log-list");
const scoreOverlay = document.getElementById("score-overlay");
const scoreClose = document.getElementById("score-close");
const deckOverlay = document.getElementById("deck-overlay");
const deckClose = document.getElementById("deck-close");
const deckMeta = document.getElementById("deck-meta");
const deckPlayTitle = document.getElementById("deck-play-title");
const deckPlayTotal = document.getElementById("deck-play-total");
const deckPlayGrid = document.getElementById("deck-play-grid");
const deckShipTitle = document.getElementById("deck-ship-title");
const deckShipTotal = document.getElementById("deck-ship-total");
const deckShipGrid = document.getElementById("deck-ship-grid");
const diceBanner = document.getElementById("dice-banner");
const dieFace = document.getElementById("die-face");
const diceTitle = document.getElementById("dice-title");
const diceSubtitle = document.getElementById("dice-subtitle");
const diceOutcome = document.getElementById("dice-outcome");
const bottomPlayerMeta = document.getElementById("bottom-player-meta");
const bottomPlayerName = document.getElementById("bottom-player-name");
const topPlayerName = document.getElementById("top-player-name");
const leftPlayerName = document.getElementById("left-player-name");
const rightPlayerName = document.getElementById("right-player-name");
const turnSummaryTitle = document.getElementById("turn-summary-title");
const turnSummarySubtitle = document.getElementById("turn-summary-subtitle");
const turnSummaryOutcome = document.getElementById("turn-summary-outcome");
const topPlayerMeta = document.getElementById("top-player-meta");
const leftPlayerMeta = document.getElementById("left-player-meta");
const rightPlayerMeta = document.getElementById("right-player-meta");
const bottomHandCount = document.getElementById("bottom-hand-count");
const turnPill = document.getElementById("turn-pill");
const roundPill = document.getElementById("round-pill");
const formatPill = document.getElementById("format-pill");
const scoringHint = document.getElementById("scoring-hint");
const useAirStrikeButton = document.getElementById("use-airstrike-button");
const endTurnButton = document.getElementById("end-turn-button");
const targetBoardToggle = document.getElementById("target-board-toggle");
const dragModeToggle = document.getElementById("drag-mode-toggle");
const soundToggle = document.getElementById("sound-toggle");
const testSoundButton = document.getElementById("test-sound-button");
const audioStatusPill = document.getElementById("audio-status-pill");
const targetBoardSection = document.getElementById("target-board-section");
const bottomBattleZone = document.getElementById("bottom-battle-zone");
const quitGameButton = document.getElementById("quit-game-button");
const quitGameButtonMobile = document.getElementById("quit-game-button-mobile");
const scoreTitle = document.getElementById("score-title");
const scoreMeta = document.getElementById("score-meta");
const scoreTable = document.getElementById("score-table");
const playerNameInput = document.getElementById("player-name-input");
const playerCountSelect = document.getElementById("player-count-select");
const cardSetSelect = document.getElementById("card-set-select");
const humanSeatName = document.getElementById("human-seat-name");
const topSeatName = document.getElementById("top-seat-name");
const leftSeatName = document.getElementById("left-seat-name");
const rightSeatName = document.getElementById("right-seat-name");
const playersCountCopy = document.getElementById("players-count-copy");
const readyStateCopy = document.getElementById("ready-state-copy");
const lobbyJoinCode = document.getElementById("lobby-join-code");
const joinCodeInput = document.getElementById("join-code-input");
const hostLobbyButton = document.getElementById("host-lobby-button");
const joinLobbyButton = document.getElementById("join-lobby-button");
const startMatchButton = document.getElementById("start-match-button");
const readyToggleButton = document.getElementById("ready-toggle-button");
const setupModeSoloButton = document.getElementById("setup-mode-solo");
const setupModeMultiplayerButton = document.getElementById("setup-mode-multiplayer");
const copyJoinCodeButton = document.getElementById("copy-join-code-button");
const lobbyReadySummary = document.getElementById("lobby-ready-summary");
const lobbyReadyList = document.getElementById("lobby-ready-list");
const menuLobbyPanel = document.getElementById("menu-lobby-panel");
const cardSetDescription = document.getElementById("card-set-description");
const cardSetPlayCount = document.getElementById("card-set-play-count");
const cardSetShipCount = document.getElementById("card-set-ship-count");
const viewCardSetButton = document.getElementById("view-card-set-button");
const campaignTargetInput = document.getElementById("campaign-target-input");
const modeButtons = [...document.querySelectorAll("[data-mode-select]")];
const saveGameButton = document.getElementById("save-game-button");
const saveGameButtonMobile = document.getElementById("save-game-button-mobile");
const loadGameButton = document.getElementById("load-game-button");
const saveStatusCopy = document.getElementById("save-status-copy");
const menuLobbyDebug = document.getElementById("menu-lobby-debug");
const tableLobbyDebug = document.getElementById("table-lobby-debug");
const warTable = document.querySelector(".war-table");
let dragState = null;
let fleetDropPreview = null;
let dragPointer = null;
let dragTargetElement = null;
let isAnimating = false;
let dragPreviewGhost = null;
const IMMEDIATE_PLAY_KINDS = new Set([
  "minefield",
  "submarine",
  "torpedo_boat",
  "additional_damage",
  "additional_ship",
]);
const SHIP_CARD_BACK = "../assets/cards/ships/Modern/Cardback-Ship.png";
const SHIP_GUN_SIZE_BY_NAME = {
  "Yamato": '18"',
  "Nagato": '16"',
  "Haruna": '14"',
  "Scharnhorst": '11"',
  "Lutzow": '11"',
  "Graf Spee": '11"',
  "Gneisenau": '11"',
  "Warspite": '15"',
  "King George V": '14"',
  "Giulio Cesare": '12.6"',
  "Conte di Cavour": '12.6"',
  "Caio Duilio": '12.6"',
  "Roma": '15"',
  "Littorio": '15"',
  "Andrea Doria": '12.6"',
  "Vittorio Veneto": '15"',
  "Missouri": '16"',
  "Iowa": '16"',
  "South Dakota": '15"',
  "Texas": '14"',
  "Rodney": '16"',
};
const SHIP_DEAL_LIBRARY = [
  { ship: "Nelson", image: "../assets/cards/ships/Modern/Nelson-GB-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Shokaku", image: "../assets/cards/ships/Modern/Shokaku-Japan-AirCraftCarrier-3.png", hitPoints: 3, isCarrier: true },
  { ship: "King George V", image: "../assets/cards/ships/Modern/King GeorgeV-GB-9.png", hitPoints: 9, gunSize: '14"' },
  { ship: "Warspite", image: "../assets/cards/ships/Modern/Warspite-GB-5.png", hitPoints: 5, gunSize: '15"' },
  { ship: "South Dakota", image: "../assets/cards/ships/Modern/SouthDakota-US-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Valiant", image: "../assets/cards/ships/Modern/Valiant-GB-5.png", hitPoints: 5, gunSize: '15"' },
  { ship: "Littorio", image: "../assets/cards/ships/Modern/Littorio-Italy-9.png", hitPoints: 9, gunSize: '15"' },
  { ship: "New Jersey", image: "../assets/cards/ships/Modern/New Jersey-US-7.png", hitPoints: 7, gunSize: '16"' },
  { ship: "Vittorio Veneto", image: "../assets/cards/ships/Modern/VittorioVento-Italy-9.png", hitPoints: 9, gunSize: '15"' },
  { ship: "North Carolina", image: "../assets/cards/ships/Modern/NorthCarolina-US-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Maryland", image: "../assets/cards/ships/Modern/Maryland-US-5.png", hitPoints: 5, gunSize: '16"' },
  { ship: "Prince of Wales", image: "../assets/cards/ships/Modern/PrinceOfWales-GB-9.png", hitPoints: 9, gunSize: '14"' },
  { ship: "Nagato", image: "../assets/cards/ships/Modern/Nagato-Japan-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Hyuga", image: "../assets/cards/ships/Modern/Hyuga-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Scharnhorst", image: "../assets/cards/ships/Modern/Scharnhorst-Germany-5.png", hitPoints: 5, gunSize: '11"' },
  { ship: "Haruna", image: "../assets/cards/ships/Modern/Haruna-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Hiei", image: "../assets/cards/ships/Modern/Hiei-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Rodney", image: "../assets/cards/ships/Modern/Rodney-GB-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Enterprise", image: "../assets/cards/ships/Modern/Enterprise-US-3.png", hitPoints: 3, isCarrier: true },
  { ship: "West Virginia", image: "../assets/cards/ships/Modern/WestVirginia-US-5.png", hitPoints: 5, gunSize: '16"' },
  { ship: "Kirishima", image: "../assets/cards/ships/Modern/Kirishima-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Washington", image: "../assets/cards/ships/Modern/Washington-US-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Ise", image: "../assets/cards/ships/Modern/Ise-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Duke of York", image: "../assets/cards/ships/Modern/DukeofYork-GB-9.png", hitPoints: 9, gunSize: '14"' },
  { ship: "Musashi", image: "../assets/cards/ships/Modern/Musashi-Japan-9.png", hitPoints: 9, gunSize: '18"' },
  { ship: "Yamato", image: "../assets/cards/ships/Modern/Yamato-Japan-9.png", hitPoints: 9, gunSize: '18"' },
  { ship: "Andrea Doria", image: "../assets/cards/ships/Modern/Andrea Doria-Italy-4.png", hitPoints: 4, gunSize: '12.6"' },
  { ship: "Hood", image: "../assets/cards/ships/Modern/Hood-GB-5.png", hitPoints: 5, gunSize: '15"' },
  { ship: "Iowa", image: "../assets/cards/ships/Modern/Iowa-US-7.png", hitPoints: 7, gunSize: '16"' },
  { ship: "Lutzow", image: "../assets/cards/ships/Modern/Lutzow-Germany-3.png", hitPoints: 3, gunSize: '11"' },
  { ship: "Gneisenau", image: "../assets/cards/ships/Modern/Gneisenau-Germany-5.png", hitPoints: 5, gunSize: '11"' },
  { ship: "Repulse", image: "../assets/cards/ships/Modern/Repulse-GB-4.png", hitPoints: 4, gunSize: '15"' },
  { ship: "Missouri", image: "../assets/cards/ships/Modern/Missouri-US-7.png", hitPoints: 7, gunSize: '16"' },
  { ship: "Mississippi", image: "../assets/cards/ships/Modern/Mississippi-US-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Revenge", image: "../assets/cards/ships/Modern/Revenge-GB-4.png", hitPoints: 4, gunSize: '15"' },
  { ship: "Giulio Cesare", image: "../assets/cards/ships/Modern/Giulio Cesare-Italy-4.png", hitPoints: 4, gunSize: '12.6"' },
  { ship: "California", image: "../assets/cards/ships/Modern/California-US-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Ark Royal", image: "../assets/cards/ships/Modern/Ark Royal-GB-3.png", hitPoints: 3, isCarrier: true },
  { ship: "Pennsylvania", image: "../assets/cards/ships/Modern/Pennsylvania-US-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Conte di Cavour", image: "../assets/cards/ships/Modern/Conte di Cavour-Italy-4.png", hitPoints: 4, gunSize: '12.6"' },
  { ship: "Bismarck", image: "../assets/cards/ships/Modern/Bismarck-Germany-8.png", hitPoints: 8, gunSize: '15"' },
  { ship: "Tirpitz", image: "../assets/cards/ships/Modern/Tirpitz-Germany-8.png", hitPoints: 8, gunSize: '15"' },
  { ship: "Fuso", image: "../assets/cards/ships/Modern/Fuso-Japan-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Roma", image: "../assets/cards/ships/Modern/Roma-Italy-6.png", hitPoints: 6, gunSize: '15"' },
  { ship: "Caio Duilio", image: "../assets/cards/ships/Modern/Caio Duilio-Italy-4.png", hitPoints: 4, gunSize: '12.6"' },
  { ship: "Graf Spee", image: "../assets/cards/ships/Modern/Graf Spee-Germany-3.png", hitPoints: 3, gunSize: '11"' },
  { ship: "Ramillies", image: "../assets/cards/ships/Modern/Ramillies-GB-4.png", hitPoints: 4, gunSize: '15"' },
  { ship: "Akagi", image: "../assets/cards/ships/Modern/Akagi-Japan-3.png", hitPoints: 3, isCarrier: true },
  { ship: "Renown", image: "../assets/cards/ships/Modern/Renown-GB-4.png", hitPoints: 4, gunSize: '15"' },
  { ship: "Nevada", image: "../assets/cards/ships/Modern/Nevada-US-5.png", hitPoints: 5, gunSize: '14"' },
  { ship: "Texas", image: "../assets/cards/ships/Modern/Texas-US-4.png", hitPoints: 4, gunSize: '14"' },
  { ship: "Scheer", image: "../assets/cards/ships/Modern/Scheer-Germany-3.png", hitPoints: 3, gunSize: '11"' },
  { ship: "Mutsu", image: "../assets/cards/ships/Modern/Mutsu-Japan-9.png", hitPoints: 9, gunSize: '16"' },
  { ship: "Kongo", image: "../assets/cards/ships/Modern/Kongo-Japan-5.png", hitPoints: 5, gunSize: '14"' },
];
const SHIP_HIT_POINTS_BY_NAME = Object.fromEntries(
  SHIP_DEAL_LIBRARY.map((ship) => [ship.ship, ship.hitPoints])
);
const PLAY_DECK_DISTRIBUTION = [
  { label: 'Salvo 11" • 1', count: 8 },
  { label: 'Salvo 11" • 2', count: 2 },
  { label: 'Salvo 12.6" • 1', count: 4 },
  { label: 'Salvo 12.6" • 2', count: 5 },
  { label: 'Salvo 14" • 1', count: 10 },
  { label: 'Salvo 14" • 2', count: 9 },
  { label: 'Salvo 14" • 3', count: 2 },
  { label: 'Salvo 15" • 1', count: 2 },
  { label: 'Salvo 15" • 2', count: 5 },
  { label: 'Salvo 15" • 3', count: 4 },
  { label: 'Salvo 16" • 1', count: 4 },
  { label: 'Salvo 16" • 2', count: 4 },
  { label: 'Salvo 16" • 3', count: 4 },
  { label: 'Salvo 16" • 4', count: 3 },
  { label: 'Salvo 18" • 2', count: 3 },
  { label: 'Salvo 18" • 3', count: 2 },
  { label: 'Salvo 18" • 4', count: 2 },
  { label: "Additional Ship", count: 8 },
  { label: "Additional Damage • 1", count: 4 },
  { label: "Additional Damage • 2", count: 2 },
  { label: "Torpedo Boat", count: 1 },
  { label: "Destroyer Squadron", count: 2 },
  { label: "Smoke", count: 6 },
  { label: "Repair", count: 4 },
  { label: "Minefield • 1", count: 2 },
  { label: "Minefield • 2", count: 2 },
  { label: "Minesweeper", count: 2 },
  { label: "Submarine", count: 2 },
];
const CLASSIC_SET_ID = "classic";
const CLASSIC_PLAY_DECK_TOTAL = PLAY_DECK_DISTRIBUTION.reduce((sum, entry) => sum + entry.count, 0);
const CLASSIC_SHIP_DECK_TOTAL = SHIP_DEAL_LIBRARY.length;
const CLASSIC_SET_DEFINITION = `Classic Set includes the original full deck mix: ${CLASSIC_PLAY_DECK_TOTAL} play cards and ${CLASSIC_SHIP_DECK_TOTAL} ship cards.`;
const PLAY_CARD_DRAW_LIBRARY = [
  {
    kind: "salvo",
    label: 'Salvo 11" • 1',
    image: "../assets/cards/play/Modern/Salvo-11-1pts.png",
    dropMode: "enemy_ship",
    hits: 1,
    gunSize: '11"',
  },
  {
    kind: "salvo",
    label: 'Salvo 11" • 2',
    image: "../assets/cards/play/Modern/Salvo-11-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '11"',
  },
  {
    kind: "salvo",
    label: 'Salvo 12.6" • 1',
    image: "../assets/cards/play/Modern/Salvo-12_6-1pt.png",
    dropMode: "enemy_ship",
    hits: 1,
    gunSize: '12.6"',
  },
  {
    kind: "salvo",
    label: 'Salvo 12.6" • 2',
    image: "../assets/cards/play/Modern/Salvo-12_6-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '12.6"',
  },
  {
    kind: "salvo",
    label: 'Salvo 14" • 1',
    image: "../assets/cards/play/Modern/Salvo-14-1pts.png",
    dropMode: "enemy_ship",
    hits: 1,
    gunSize: '14"',
  },
  {
    kind: "salvo",
    label: 'Salvo 14" • 2',
    image: "../assets/cards/play/Modern/Salvo-14-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '14"',
  },
  {
    kind: "salvo",
    label: 'Salvo 14" • 3',
    image: "../assets/cards/play/Modern/Salvo-14-3pts.png",
    dropMode: "enemy_ship",
    hits: 3,
    gunSize: '14"',
  },
  {
    kind: "salvo",
    label: 'Salvo 15" • 1',
    image: "../assets/cards/play/Modern/Salvo-15-1pt.png",
    dropMode: "enemy_ship",
    hits: 1,
    gunSize: '15"',
  },
  {
    kind: "salvo",
    label: 'Salvo 15" • 2',
    image: "../assets/cards/play/Modern/Salvo-15-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '15"',
  },
  {
    kind: "salvo",
    label: 'Salvo 15" • 3',
    image: "../assets/cards/play/Modern/Salvo-15-3pts.png",
    dropMode: "enemy_ship",
    hits: 3,
    gunSize: '15"',
  },
  {
    kind: "salvo",
    label: 'Salvo 16" • 1',
    image: "../assets/cards/play/Modern/Salvo-16-1pts.png",
    dropMode: "enemy_ship",
    hits: 1,
    gunSize: '16"',
  },
  {
    kind: "salvo",
    label: 'Salvo 16" • 2',
    image: "../assets/cards/play/Modern/Salvo-16-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '16"',
  },
  {
    kind: "salvo",
    label: 'Salvo 16" • 3',
    image: "../assets/cards/play/Modern/Salvo-16-3pts.png",
    dropMode: "enemy_ship",
    hits: 3,
    gunSize: '16"',
  },
  {
    kind: "salvo",
    label: 'Salvo 16" • 4',
    image: "../assets/cards/play/Modern/Salvo-16-4pts.png",
    dropMode: "enemy_ship",
    hits: 4,
    gunSize: '16"',
  },
  {
    kind: "salvo",
    label: 'Salvo 18" • 2',
    image: "../assets/cards/play/Modern/Salvo-18-2pts.png",
    dropMode: "enemy_ship",
    hits: 2,
    gunSize: '18"',
  },
  {
    kind: "salvo",
    label: 'Salvo 18" • 3',
    image: "../assets/cards/play/Modern/Salvo-18-3pts.png",
    dropMode: "enemy_ship",
    hits: 3,
    gunSize: '18"',
  },
  {
    kind: "salvo",
    label: 'Salvo 18" • 4',
    image: "../assets/cards/play/Modern/Salvo-18-4pts.png",
    dropMode: "enemy_ship",
    hits: 4,
    gunSize: '18"',
  },
  {
    kind: "smoke",
    label: "Smoke",
    image: "../assets/cards/play/Modern/smoke-card.png",
    dropMode: "battle_zone",
  },
  {
    kind: "minefield",
    label: "Minefield • 1",
    image: "../assets/cards/play/Modern/Minefield-1hit.png",
    dropMode: "fleet_target",
    hits: 1,
  },
  {
    kind: "minefield",
    label: "Minefield • 2",
    image: "../assets/cards/play/Modern/Minefield-2hits.png",
    dropMode: "fleet_target",
    hits: 2,
  },
  {
    kind: "minesweeper",
    label: "Minesweeper",
    image: "../assets/cards/play/Modern/MineSweeper.png",
    dropMode: "fleet_target",
  },
  {
    kind: "repair",
    label: "Repair",
    image: "../assets/cards/play/Modern/Repair-card.png",
    dropMode: "own_ship",
  },
  {
    kind: "submarine",
    label: "Submarine",
    image: "../assets/cards/play/Modern/Submarine.png",
    dropMode: "enemy_ship",
  },
  {
    kind: "additional_damage",
    label: "Additional Damage • 1",
    image: "../assets/cards/play/Modern/Additional-Damnage-1pt.png",
    dropMode: "enemy_ship",
    hits: 1,
  },
  {
    kind: "additional_damage",
    label: "Additional Damage • 2",
    image: "../assets/cards/play/Modern/Additional-Damnage-2pt.png",
    dropMode: "enemy_ship",
    hits: 2,
  },
  {
    kind: "torpedo_boat",
    label: "Torpedo Boat",
    image: "../assets/cards/play/Modern/Torpedo-boat.png",
    dropMode: "enemy_ship",
  },
  {
    kind: "destroyer_squadron",
    label: "Destroyer Squadron",
    image: "../assets/cards/play/Modern/Destroyer-4hits.png",
    dropMode: "battle_zone",
  },
  {
    kind: "additional_ship",
    label: "Additional Ship",
    image: "../assets/cards/play/Modern/Additional-Ship.png",
    dropMode: "battle_zone",
  },
];
const SHIP_CARD_BY_NAME = new Map(
  SHIP_DEAL_LIBRARY.map((ship) => [ship.ship, ship])
);
const PLAY_CARD_BY_SIGNATURE = new Map(
  PLAY_CARD_DRAW_LIBRARY.map((card) => [cardSignature(card), card])
);

function cardSignature(card) {
  if (card.kind === "salvo") {
    return `salvo:${card.gunSize}:${card.hits}`;
  }
  if (card.kind === "additional_damage" || card.kind === "minefield") {
    return `${card.kind}:${card.hits}`;
  }
  return `${card.kind}`;
}

function serverCardToClientCard(serverCard) {
  const signature = cardSignature({
    kind: serverCard.kind,
    gunSize: serverCard.gunCaliber,
    hits: serverCard.hits,
  });
  const template = PLAY_CARD_BY_SIGNATURE.get(signature);
  if (template) {
    return {
      ...template,
      id: serverCard.id,
    };
  }
  return {
    id: serverCard.id,
    kind: serverCard.kind,
    label: serverCard.kind.replaceAll("_", " "),
    image: "../assets/cards/play/Modern/cardback-Play.png",
    dropMode: "enemy_ship",
  };
}
const smallSalvoAudio = new Audio("../assets/sound/Salvo-small.wav");
const bigSalvoAudio = new Audio("../assets/sound/Salvo-big.wav");
const shipSinkAudio = new Audio("../assets/sound/shipsink.wav");
const submarineAudio = new Audio("../assets/sound/submarine.wav");
const airStrikeAudio = new Audio("../assets/sound/AirStrike.wav");
const drawCardAudio = new Audio("../assets/sound/draw-card.wav");
const smokeAudio = new Audio("../assets/sound/smoke.wav");
const destroyersAudio = new Audio("../assets/sound/Destroyers.wav");
const additionalDamageAudio = new Audio("../assets/sound/AdditionalDamnage.wav");
const repairAudio = new Audio("../assets/sound/repairCard.wav");
const torpedoBoatAudio = new Audio("../assets/sound/TorpedoBoat.wav");
const invalidCardAudio = new Audio("../assets/sound/invalidcard.wav");
const minesweeperAudio = new Audio("../assets/sound/minesweeper.wav");
const minesAudio = new Audio("../assets/sound/mines.wav");
const diceAudio = new Audio("../assets/sound/Dice.wav");
const winnerAudio = new Audio("../assets/sound/WinnerSound.wav");
const AUDIO_PATH_BY_ELEMENT = new Map([
  [smallSalvoAudio, "../assets/sound/Salvo-small.wav"],
  [bigSalvoAudio, "../assets/sound/Salvo-big.wav"],
  [shipSinkAudio, "../assets/sound/shipsink.wav"],
  [submarineAudio, "../assets/sound/submarine.wav"],
  [airStrikeAudio, "../assets/sound/AirStrike.wav"],
  [drawCardAudio, "../assets/sound/draw-card.wav"],
  [smokeAudio, "../assets/sound/smoke.wav"],
  [destroyersAudio, "../assets/sound/Destroyers.wav"],
  [additionalDamageAudio, "../assets/sound/AdditionalDamnage.wav"],
  [repairAudio, "../assets/sound/repairCard.wav"],
  [torpedoBoatAudio, "../assets/sound/TorpedoBoat.wav"],
  [invalidCardAudio, "../assets/sound/invalidcard.wav"],
  [minesweeperAudio, "../assets/sound/minesweeper.wav"],
  [minesAudio, "../assets/sound/mines.wav"],
  [diceAudio, "../assets/sound/Dice.wav"],
  [winnerAudio, "../assets/sound/WinnerSound.wav"],
]);
const GAME_AUDIO_EFFECTS = [
  smallSalvoAudio,
  bigSalvoAudio,
  shipSinkAudio,
  submarineAudio,
  airStrikeAudio,
  drawCardAudio,
  smokeAudio,
  destroyersAudio,
  additionalDamageAudio,
  repairAudio,
  torpedoBoatAudio,
  invalidCardAudio,
  minesweeperAudio,
  minesAudio,
  diceAudio,
  winnerAudio,
];
let audioUnlocked = false;
let audioEnabled = true;
let audioContext = null;
let audioMasterGain = null;
const audioBufferCache = new Map();
const audioDiagnostics = {
  status: "not tested",
  lastError: null,
  lastEvent: null,
  lastTestAt: null,
  outputMode: "html",
  preferWebAudio: false,
};

GAME_AUDIO_EFFECTS.forEach((audio) => {
  audio.preload = "auto";
  audio.setAttribute("playsinline", "true");
  audio.load();
});
const targetingLine = document.createElementNS("http://www.w3.org/2000/svg", "svg");
targetingLine.setAttribute("class", "targeting-line");
targetingLine.setAttribute("width", String(window.innerWidth));
targetingLine.setAttribute("height", String(window.innerHeight));
targetingLine.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
const targetingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
targetingPath.setAttribute("class", "targeting-line-path");
targetingLine.appendChild(targetingPath);
const specialBanner = document.createElement("div");
specialBanner.className = "special-card-banner";
let specialBannerTimer = null;
let drawHighlightTimer = null;
if (document.body) {
  document.body.appendChild(targetingLine);
  document.body.appendChild(specialBanner);
} else {
  window.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(targetingLine);
    document.body.appendChild(specialBanner);
  });
}

const sampleState = {
  match: {
    mode: "skirmish",
    campaignTarget: 100,
    currentRound: 1,
    pendingNextRound: false,
    isCampaignOver: false,
    isRoundOver: false,
    winnerZone: null,
    roundEndReason: null,
    scoreRows: [
      { player: "Admiral Carter", playerZone: "bottom", rounds: [0, 0, 0], total: 0 },
      { player: "Admiral Tanaka", playerZone: "top", rounds: [0, 0, 0], total: 0 },
      { player: "Admiral Hale", playerZone: "left", rounds: [0, 0, 0], total: 0 },
      { player: "Admiral Rossi", playerZone: "right", rounds: [0, 0, 0], total: 0 },
    ],
  },
  fleets: {
    top: [
      {
        ship: "Yamato",
        image: "../assets/cards/ships/Modern/Yamato-Japan-9.png",
        damage: "5 / 9",
        isCarrier: false,
        gunSize: '18"',
      },
      {
        ship: "Nagato",
        image: "../assets/cards/ships/Modern/Nagato-Japan-9.png",
        damage: "8 / 9",
        isCarrier: false,
        gunSize: '16"',
        salvos: [
          { image: "../assets/cards/play/Modern/Salvo-14-1pts.png", label: '14" • 1' },
        ],
      },
      {
        ship: "Haruna",
        image: "../assets/cards/ships/Modern/Haruna-Japan-5.png",
        damage: "2 / 5",
        isCarrier: false,
        gunSize: '14"',
      },
      {
        ship: "Shokaku",
        image: "../assets/cards/ships/Modern/Shokaku-Japan-AirCraftCarrier-3.png",
        damage: "3 / 3",
        isCarrier: true,
      },
      {
        ship: "Kongo",
        image: "../assets/cards/ships/Modern/Cardback-Ship.png",
        damage: "5 / 5",
        isCarrier: false,
        sunk: true,
        originalImage: "../assets/cards/ships/Modern/Kongo-Japan-5.png",
      },
    ],
    left: [
      {
        ship: "Warspite",
        image: "../assets/cards/ships/Modern/Warspite-GB-5.png",
        damage: "4 / 5",
        isCarrier: false,
        gunSize: '15"',
        salvos: [
          { image: "../assets/cards/play/Modern/Salvo-11-1pts.png", label: '11" • 1' },
        ],
      },
      {
        ship: "King George V",
        image: "../assets/cards/ships/Modern/King GeorgeV-GB-9.png",
        damage: "9 / 9",
        isCarrier: false,
        gunSize: '14"',
      },
      {
        ship: "Ark Royal",
        image: "../assets/cards/ships/Modern/Ark Royal-GB-3.png",
        damage: "3 / 3",
        isCarrier: true,
      },
      {
        ship: "Ramillies",
        image: "../assets/cards/ships/Modern/Cardback-Ship.png",
        damage: "4 / 4",
        isCarrier: false,
        sunk: true,
        originalImage: "../assets/cards/ships/Modern/Ramillies-GB-4.png",
      },
    ],
    right: [
      {
        ship: "Roma",
        image: "../assets/cards/ships/Modern/Roma-Italy-6.png",
        damage: "6 / 6",
        isCarrier: false,
        gunSize: '15"',
      },
      {
        ship: "Littorio",
        image: "../assets/cards/ships/Modern/Littorio-Italy-9.png",
        damage: "6 / 9",
        isCarrier: false,
        gunSize: '15"',
        salvos: [
          { image: "../assets/cards/play/Modern/Salvo-16-3pts.png", label: '16" • 3' },
        ],
      },
      {
        ship: "Andrea Doria",
        image: "../assets/cards/ships/Modern/Andrea Doria-Italy-4.png",
        damage: "3 / 4",
        isCarrier: false,
        gunSize: '12.6"',
        salvos: [
          { image: "../assets/cards/play/Modern/Salvo-12_6-1pt.png", label: '12.6" • 1' },
        ],
      },
      {
        ship: "Vittorio Veneto",
        image: "../assets/cards/ships/Modern/VittorioVento-Italy-9.png",
        damage: "9 / 9",
        isCarrier: false,
        gunSize: '15"',
      },
    ],
    bottom: [
      {
        ship: "Missouri",
        image: "../assets/cards/ships/Modern/Missouri-US-7.png",
        damage: "5 / 7",
        isCarrier: false,
        gunSize: '16"',
      },
      {
        ship: "Iowa",
        image: "../assets/cards/ships/Modern/Iowa-US-7.png",
        damage: "7 / 7",
        isCarrier: false,
        gunSize: '16"',
      },
      {
        ship: "South Dakota",
        image: "../assets/cards/ships/Modern/SouthDakota-US-9.png",
        damage: "8 / 9",
        isCarrier: false,
        gunSize: '15"',
        salvos: [
          { image: "../assets/cards/play/Modern/Salvo-15-1pt.png", label: '15" • 1' },
        ],
      },
      {
        ship: "Enterprise",
        image: "../assets/cards/ships/Modern/Enterprise-US-3.png",
        damage: "3 / 3",
        isCarrier: true,
      },
      {
        ship: "Nevada",
        image: "../assets/cards/ships/Modern/Cardback-Ship.png",
        damage: "5 / 5",
        isCarrier: false,
        sunk: true,
        originalImage: "../assets/cards/ships/Modern/Nevada-US-5.png",
      },
    ],
  },
  hand: [
    {
      id: "hand-salvo-16-3",
      kind: "salvo",
      label: 'Salvo 16" • 3',
      image: "../assets/cards/play/Modern/Salvo-16-3pts.png",
      dropMode: "enemy_ship",
      hits: 3,
      gunSize: '16"',
    },
    {
      id: "hand-salvo-14-2",
      kind: "salvo",
      label: 'Salvo 14" • 2',
      image: "../assets/cards/play/Modern/Salvo-14-2pts.png",
      dropMode: "enemy_ship",
      hits: 2,
      gunSize: '14"',
    },
    {
      id: "hand-salvo-12_6-1",
      kind: "salvo",
      label: 'Salvo 12.6" • 1',
      image: "../assets/cards/play/Modern/Salvo-12_6-1pt.png",
      dropMode: "enemy_ship",
      hits: 1,
      gunSize: '12.6"',
    },
    {
      id: "hand-salvo-11-1",
      kind: "salvo",
      label: 'Salvo 11" • 1',
      image: "../assets/cards/play/Modern/Salvo-11-1pts.png",
      dropMode: "enemy_ship",
      hits: 1,
      gunSize: '11"',
    },
    {
      id: "hand-smoke",
      kind: "smoke",
      label: "Smoke",
      image: "../assets/cards/play/Modern/smoke-card.png",
      dropMode: "battle_zone",
    },
    {
      id: "hand-minefield-2",
      kind: "minefield",
      label: "Minefield • 2",
      image: "../assets/cards/play/Modern/Minefield-2hits.png",
      dropMode: "fleet_target",
      hits: 2,
    },
    {
      id: "hand-minesweeper",
      kind: "minesweeper",
      label: "Minesweeper",
      image: "../assets/cards/play/Modern/MineSweeper.png",
      dropMode: "fleet_target",
    },
    {
      id: "hand-destroyer",
      kind: "destroyer_squadron",
      label: "Destroyer Squadron",
      image: "../assets/cards/play/Modern/Destroyer-4hits.png",
      dropMode: "battle_zone",
    },
    {
      id: "hand-submarine",
      kind: "submarine",
      label: "Submarine",
      image: "../assets/cards/play/Modern/Submarine.png",
      dropMode: "enemy_ship",
    },
    {
      id: "hand-torpedo",
      kind: "torpedo_boat",
      label: "Torpedo Boat",
      image: "../assets/cards/play/Modern/Torpedo-Boat.png",
      dropMode: "enemy_ship",
    },
    {
      id: "hand-repair",
      kind: "repair",
      label: "Repair",
      image: "../assets/cards/play/Modern/Repair-card.png",
      dropMode: "own_ship",
    },
  ],
  effectsByFleet: {
    top: [
      {
        kind: "minefield",
        label: "Minefield",
        image: "../assets/cards/play/Modern/Minefield-2hits.png",
        hits: 2,
      },
    ],
    left: [
      {
        kind: "smoke",
        label: "Smoke",
        image: "../assets/cards/play/Modern/smoke-card.png",
      },
    ],
    right: [
      {
        label: "Submarine",
        image: "../assets/cards/play/Modern/Submarine.png",
      },
    ],
    bottom: [],
  },
  sharedStatusCards: [
    {
      label: "Open Water",
      image: "../assets/cards/play/Modern/cardback-Play.png",
    },
    {
      label: "Round Marker",
      image: "../assets/cards/play/Modern/cardback-Play.png",
    },
  ],
  drawPiles: [
    {
      label: "Play Deck",
      count: 72,
      image: "../assets/cards/play/Modern/cardback-Play.png",
    },
    {
      label: "Discard Pile",
      count: 14,
      image: "../assets/cards/play/Modern/MineSweeper.png",
      topCardLabel: "Top discard • Minesweeper",
    },
    {
      label: "Ship Deck",
      count: 31,
      image: "../assets/cards/ships/Modern/Cardback-Ship.png",
    },
  ],
  victoryPiles: {
    top: [
      { ship: "California", image: "../assets/cards/ships/Modern/California-US-5.png" },
      { ship: "Revenge", image: "../assets/cards/ships/Modern/Revenge-GB-4.png" },
    ],
    left: [{ ship: "Hyuga", image: "../assets/cards/ships/Modern/Hyuga-Japan-5.png" }],
    right: [],
    bottom: [
      { ship: "Littorio", image: "../assets/cards/ships/Modern/Littorio-Italy-9.png" },
      { ship: "Scharnhorst", image: "../assets/cards/ships/Modern/Scharnhorst-Germany-5.png" },
      { ship: "Nagato", image: "../assets/cards/ships/Modern/Nagato-Japan-9.png" },
    ],
  },
  combatLog: [
    "Admiral Carter draws a card.",
    "Additional Ship resolves immediately.",
    "South Dakota joins Admiral Carter's fleet from the ship deck.",
    "Admiral Rossi plays Submarine on Admiral Carter's fleet.",
    "Submarine roll: 5.",
    'Salvo 16" for 3 damage targets Littorio.',
    "Smoke now screens Admiral Hale's fleet.",
  ],
  turnState: {
    turnNumber: 4,
    phase: "draw",
    usedAirStrike: false,
    airStrikeMode: false,
    usedCarrierIndices: [],
    playedCard: false,
  },
  ui: {
    showTargetBoard: true,
    interactionMode: "select",
    highlightedDrawCardId: null,
    touchSelectedCardId: null,
  },
  tableConfig: {
    playerCount: 4,
    cardSet: CLASSIC_SET_ID,
  },
  pendingImpacts: [],
  playDeckQueue: [
    {
      id: "draw-additional-ship",
      kind: "additional_ship",
      label: "Additional Ship",
      image: "../assets/cards/play/Modern/Additional-Ship.png",
      dropMode: "battle_zone",
    },
    {
      id: "draw-salvo-15-2",
      kind: "salvo",
      label: 'Salvo 15" • 2',
      image: "../assets/cards/play/Modern/Salvo-15-2pts.png",
      dropMode: "enemy_ship",
      hits: 2,
      gunSize: '15"',
    },
    {
      id: "draw-smoke-2",
      kind: "smoke",
      label: "Smoke",
      image: "../assets/cards/play/Modern/smoke-card.png",
      dropMode: "battle_zone",
    },
  ],
  shipDeckQueue: [
    {
      ship: "Texas",
      image: "../assets/cards/ships/Modern/Texas-US-4.png",
      damage: "4 / 4",
      isCarrier: false,
      gunSize: '14"',
    },
    {
      ship: "Rodney",
      image: "../assets/cards/ships/Modern/Rodney-GB-9.png",
      damage: "9 / 9",
      isCarrier: false,
      gunSize: '16"',
    },
  ],
};
const appState = JSON.parse(JSON.stringify(sampleState));
let generatedPlayCardId = 1;
let generatedShipId = 1;
const PLAYER_ORDER = ["bottom", "left", "top", "right"];
const PLAYER_NAMES = {
  bottom: "Admiral Carter",
  left: "Admiral Hale",
  top: "Admiral Tanaka",
  right: "Admiral Rossi",
};
const PLAYER_NAME_NODES = {
  bottom: bottomPlayerName,
  left: leftPlayerName,
  top: topPlayerName,
  right: rightPlayerName,
};
const PLAYER_META_NODES = {
  bottom: bottomPlayerMeta,
  left: leftPlayerMeta,
  top: topPlayerMeta,
  right: rightPlayerMeta,
};
const PLAYER_ZONE_NODES = Object.fromEntries(
  PLAYER_ORDER.map((zone) => [zone, document.querySelector(`[data-player-zone="${zone}"]`)])
);
const ACTIVE_ZONE_LAYOUTS = {
  2: ["bottom", "top"],
  3: ["bottom", "left", "top"],
  4: ["bottom", "left", "top", "right"],
};
const BOT_TURN_DELAY_MS = 900;
const LOCAL_SAVE_KEY = "naval-war-prototype-save-v1";
const MULTIPLAYER_CLIENT_ID_KEY = "naval-war-client-id-v1";
const MULTIPLAYER_SESSION_KEY = "naval-war-session-v1";
const SERVER_API_BASE = `${window.location.origin}`;
const IS_TOUCH_DEVICE =
  (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
  navigator.maxTouchPoints > 0;
let botTurnTimer = null;
let humanTurnAdvanceTimer = null;
let diceBannerTimer = null;
let diceRollAnimationTimer = null;
let pendingDiceAdvanceDelay = 0;
let autosaveTimer = null;
let hasLaunchedMatch = false;
let serverPollTimer = null;
let autoEnterMatchInFlight = false;
let multiplayerSocket = null;
let realtimeEnabled = false;
let autoEndTurnInFlight = false;
let lastAutoEndTurnKey = null;
let lastServerCommandKey = null;
let lastServerCommandAt = 0;
let lastServerViewSignature = null;
let longPressTimer = null;
let longPressTarget = null;
let suppressClickUntil = 0;
appState.serverSession = {
  connected: false,
  lobbyId: null,
  viewerPlayerId: null,
  joinCode: null,
  isHost: false,
  status: "offline",
  localRoleByZone: { bottom: "human", left: "bot", top: "bot", right: "bot" },
  activeSides: ["bottom", "left", "top", "right"],
  localPlayerCount: 4,
  lastSyncAt: null,
  lastError: null,
  clientId: null,
  sessionToken: null,
  lobbyInfo: null,
  legalCommands: [],
  eventSoundLobbyId: null,
  eventSoundCount: 0,
  diceEventLobbyId: null,
  diceEventCount: 0,
  lastAnnouncedTurnKey: null,
};
appState.setupMode = "solo";

function createClientId() {
  return `client_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateClientId() {
  try {
    const existing = window.localStorage.getItem(MULTIPLAYER_CLIENT_ID_KEY);
    if (existing) {
      return existing;
    }
    const created = createClientId();
    window.localStorage.setItem(MULTIPLAYER_CLIENT_ID_KEY, created);
    return created;
  } catch (_) {
    return createClientId();
  }
}

function persistServerSessionSnapshot() {
  try {
    const session = appState.serverSession || {};
    if (!session.connected || !session.lobbyId || !session.viewerPlayerId || !session.joinCode) {
      window.localStorage.removeItem(MULTIPLAYER_SESSION_KEY);
      return;
    }
    window.localStorage.setItem(
      MULTIPLAYER_SESSION_KEY,
      JSON.stringify({
        lobbyId: session.lobbyId,
        joinCode: session.joinCode,
        viewerPlayerId: session.viewerPlayerId,
        sessionToken: session.sessionToken || null,
        isHost: Boolean(session.isHost),
        status: session.status || "lobby",
      })
    );
  } catch (_) {
    // Ignore session persistence errors.
  }
}

function hasSocketIoClient() {
  return typeof window !== "undefined" && typeof window.io === "function";
}

function isRealtimeSocketConnected() {
  return Boolean(multiplayerSocket?.connected);
}

function socketRequest(event, payload = {}, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    if (!multiplayerSocket || !multiplayerSocket.connected) {
      reject(new Error("Realtime socket is not connected."));
      return;
    }
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Socket request timed out: ${event}`));
    }, timeoutMs);
    multiplayerSocket.emit(event, payload, (response) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (!response?.ok) {
        reject(new Error(response?.error || `${event} failed.`));
        return;
      }
      resolve(response);
    });
  });
}

function bindRealtimeHandlers() {
  if (!multiplayerSocket) return;

  multiplayerSocket.on("lobby:state", (lobby) => {
    appState.serverSession.connected = true;
    appState.serverSession.lobbyInfo = lobby || null;
    if (lobby?.lobbyId) appState.serverSession.lobbyId = lobby.lobbyId;
    if (lobby?.joinCode) appState.serverSession.joinCode = lobby.joinCode;
    if (typeof lobby?.youAreHost === "boolean") appState.serverSession.isHost = lobby.youAreHost;
    if (lobby?.status) appState.serverSession.status = lobby.status;
    if (lobby?.viewerPlayerId) appState.serverSession.viewerPlayerId = lobby.viewerPlayerId;
    appState.serverSession.lastSyncAt = new Date().toISOString();
    appState.serverSession.lastError = null;
    syncLobbySeatPreview();
    renderPrototype();
  });

  multiplayerSocket.on("match:ready", (payload) => {
    if (payload?.status) {
      appState.serverSession.status = payload.status;
    }
    tryAutoEnterRunningMatchFromLobby();
  });

  multiplayerSocket.on("match:state", (payload) => {
    const view = payload?.view || null;
    if (!view) return;
    if (payload?.status) appState.serverSession.status = payload.status;
    if (payload?.joinCode) appState.serverSession.joinCode = payload.joinCode;
    if (payload?.lobbyId) appState.serverSession.lobbyId = payload.lobbyId;
    if (payload?.viewerPlayerId) appState.serverSession.viewerPlayerId = payload.viewerPlayerId;
    if (!shouldApplyServerView(view)) {
      appState.serverSession.lastSyncAt = new Date().toISOString();
      appState.serverSession.lastError = null;
      persistServerSessionSnapshot();
      return;
    }
    mapServerViewToLocalState(view);
    appState.serverSession.lastSyncAt = new Date().toISOString();
    appState.serverSession.lastError = null;
    persistServerSessionSnapshot();
    renderPrototype();
    if (document.querySelector("[data-screen='menu']")?.classList.contains("is-active")) {
      showScreen("table");
    }
    maybeAutoEndTurnForOpeningSpecialFlow();
  });

  multiplayerSocket.on("connect", () => {
    realtimeEnabled = true;
    if (appState.serverSession?.lobbyId && appState.serverSession?.sessionToken) {
      socketRequest("lobby:resume", {
        lobbyId: appState.serverSession.lobbyId,
        sessionToken: appState.serverSession.sessionToken,
      })
        .then((resumed) => {
          if (resumed?.viewerPlayerId) {
            appState.serverSession.viewerPlayerId = resumed.viewerPlayerId;
          }
          if (resumed?.sessionToken) {
            appState.serverSession.sessionToken = resumed.sessionToken;
          }
          appState.serverSession.connected = true;
          appState.serverSession.status = resumed?.status || appState.serverSession.status;
          appState.serverSession.lastError = null;
          persistServerSessionSnapshot();
          startServerPolling();
          if (appState.serverSession.status === "in_progress") {
            refreshServerViewAndRender();
          }
        })
        .catch(() => {
          startServerPolling();
        });
    }
  });

  multiplayerSocket.on("disconnect", () => {
    appState.serverSession.lastError = "Realtime disconnected.";
    syncLobbySeatPreview();
    renderPrototype();
    startServerPolling();
  });
}

function ensureRealtimeConnection() {
  if (!hasSocketIoClient() || window.location.protocol === "file:") {
    return false;
  }
  if (multiplayerSocket) {
    realtimeEnabled = true;
    return true;
  }
  multiplayerSocket = window.io(SERVER_API_BASE, {
    transports: ["websocket", "polling"],
    withCredentials: false,
  });
  bindRealtimeHandlers();
  realtimeEnabled = true;
  return true;
}

function showScreen(target) {
  if (target !== "table") {
    window.clearTimeout(botTurnTimer);
    window.clearTimeout(humanTurnAdvanceTimer);
    humanTurnAdvanceTimer = null;
    window.clearTimeout(diceBannerTimer);
    window.clearInterval(diceRollAnimationTimer);
    diceRollAnimationTimer = null;
    pendingDiceAdvanceDelay = 0;
    if (diceBanner) {
      diceBanner.hidden = true;
      diceBanner.classList.remove("is-visible", "is-rolling");
    }
  }
  updateSaveControls();
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === target);
  });
  if (appState.serverSession?.connected) {
    startServerPolling();
  } else {
    stopServerPolling();
  }
}

function setTurnSummary(title, subtitle, outcome) {
  appState.turnSummary = { title, subtitle, outcome };
  if (turnSummaryTitle) {
    turnSummaryTitle.textContent = title;
  }
  if (turnSummarySubtitle) {
    turnSummarySubtitle.textContent = subtitle;
  }
  if (turnSummaryOutcome) {
    turnSummaryOutcome.textContent = outcome;
  }
}

async function serverGet(path) {
  const response = await fetch(`${SERVER_API_BASE}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${path} failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function serverPost(path, body) {
  const response = await fetch(`${SERVER_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${path} failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function canUseServerApi() {
  if (window.location.protocol === "file:") {
    return false;
  }
  try {
    const health = await serverGet("/api/health");
    return Boolean(health?.ok);
  } catch {
    return false;
  }
}

function setServerSessionCore({ connected, lobbyId, viewerPlayerId, joinCode, status, isHost, playerCount, sessionToken }) {
  const isDifferentSession =
    appState.serverSession.lobbyId !== lobbyId ||
    appState.serverSession.viewerPlayerId !== viewerPlayerId ||
    appState.serverSession.sessionToken !== (sessionToken ?? null);
  appState.serverSession.connected = connected;
  appState.serverSession.lobbyId = lobbyId;
  appState.serverSession.viewerPlayerId = viewerPlayerId;
  appState.serverSession.joinCode = joinCode;
  appState.serverSession.status = status;
  appState.serverSession.isHost = isHost;
  appState.serverSession.sessionToken = sessionToken ?? null;
  appState.serverSession.lastSyncAt = new Date().toISOString();
  appState.serverSession.lastError = null;
  appState.serverSession.localPlayerCount = playerCount;
  if (Number.isFinite(Number(playerCount))) {
    appState.tableConfig.playerCount = Math.min(4, Math.max(2, Number(playerCount)));
  }
  if (isDifferentSession) {
    lastServerViewSignature = null;
    appState.serverSession.eventSoundLobbyId = null;
    appState.serverSession.eventSoundCount = 0;
    appState.serverSession.diceEventLobbyId = null;
    appState.serverSession.diceEventCount = 0;
    appState.serverSession.lastAnnouncedTurnKey = null;
  }
  if (!connected) {
    appState.serverSession.lobbyInfo = null;
    appState.serverSession.activeSides = ["bottom", "left", "top", "right"];
  }
  persistServerSessionSnapshot();
  if (connected) {
    startServerPolling();
  }
}

function setSetupMode(mode) {
  appState.setupMode = mode === "multiplayer" ? "multiplayer" : "solo";
  if (setupModeSoloButton) {
    setupModeSoloButton.classList.toggle("is-active", appState.setupMode === "solo");
  }
  if (setupModeMultiplayerButton) {
    setupModeMultiplayerButton.classList.toggle("is-active", appState.setupMode === "multiplayer");
  }
  syncLobbySeatPreview();
}

async function refreshLobbyInfo() {
  if (!appState.serverSession?.connected || !appState.serverSession?.lobbyId) {
    appState.serverSession.lobbyInfo = null;
    return null;
  }
  const lobby = await serverGet(`/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}`);
    appState.serverSession.lobbyInfo = lobby;
    appState.serverSession.status = lobby?.status || appState.serverSession.status;
    if (Number.isFinite(Number(lobby?.playerCount))) {
      appState.serverSession.localPlayerCount = Number(lobby.playerCount);
      appState.tableConfig.playerCount = Math.min(4, Math.max(2, Number(lobby.playerCount)));
    }
  return lobby;
}

async function hostLobbyFromSetup({ playerCount, matchMode, campaignTarget }) {
  ensureRealtimeConnection();
  if (isRealtimeSocketConnected()) {
    const created = await socketRequest("lobby:create", {
      hostName: getPlayerName("bottom"),
      playerCount,
      matchMode,
      campaignTargetScore: campaignTarget,
      preferredSeatId: 0,
      clientId: appState.serverSession.clientId,
    });
    const createdLobby = created?.lobby ?? created;
    setServerSessionCore({
      connected: true,
      lobbyId: createdLobby?.lobbyId ?? null,
      viewerPlayerId: created?.viewerPlayerId ?? createdLobby?.viewerPlayerId ?? null,
      joinCode: createdLobby?.joinCode ?? null,
      status: createdLobby?.status ?? "lobby",
      isHost: Boolean(createdLobby?.youAreHost ?? true),
      playerCount,
      sessionToken: created?.sessionToken ?? null,
    });
    appState.serverSession.lobbyInfo = createdLobby ?? null;
    syncLobbySeatPreview();
    return true;
  }
  if (!(await canUseServerApi())) {
    appState.serverSession.connected = false;
    appState.serverSession.status = "local_only";
    appState.serverSession.lastError = "Server API unavailable in this runtime.";
    return false;
  }

  const hostName = getPlayerName("bottom");
  const created = await serverPost("/api/lobbies", {
    hostName,
    playerCount,
    matchMode,
    campaignTargetScore: campaignTarget,
    preferredSeatId: 0,
    clientId: appState.serverSession.clientId,
  });
  const createdLobby = created?.lobby ?? created;
  const lobbyId = createdLobby?.lobbyId;
  if (!lobbyId) {
    throw new Error("Server did not return a lobbyId.");
  }
  const viewerPlayerId = created?.viewerPlayerId;
  if (!viewerPlayerId) {
    throw new Error("Server did not return a host player id.");
  }
  setServerSessionCore({
    connected: true,
    lobbyId,
    viewerPlayerId,
    joinCode: createdLobby?.joinCode ?? null,
    status: createdLobby?.status ?? "lobby",
    isHost: true,
    playerCount,
    sessionToken: created?.sessionToken ?? null,
  });
  syncLobbySeatPreview();
  return true;
}

async function joinLobbyFromCode(joinCode, { playerCount }) {
  ensureRealtimeConnection();
  if (isRealtimeSocketConnected()) {
    const joined = await socketRequest("lobby:join", {
      joinCode,
      playerName: getPlayerName("bottom"),
      role: "human",
      clientId: appState.serverSession.clientId,
    });
  const joinedLobby = joined?.lobby ?? joined;
  const serverPlayerCount = joinedLobby?.playerCount ?? playerCount;
  setServerSessionCore({
    connected: true,
    lobbyId: joinedLobby?.lobbyId ?? null,
    viewerPlayerId: joined?.viewerPlayerId ?? joinedLobby?.viewerPlayerId ?? null,
    joinCode: joinedLobby?.joinCode ?? joinCode,
    status: joinedLobby?.status ?? "lobby",
    isHost: Boolean(joinedLobby?.youAreHost ?? false),
    playerCount: serverPlayerCount,
    sessionToken: joined?.sessionToken ?? null,
  });
    appState.serverSession.lobbyInfo = joinedLobby ?? null;
    syncLobbySeatPreview();
    return true;
  }
  if (!(await canUseServerApi())) {
    appState.serverSession.connected = false;
    appState.serverSession.status = "local_only";
    appState.serverSession.lastError = "Server API unavailable in this runtime.";
    return false;
  }
  const joined = await serverPost(`/api/lobbies/by-code/${encodeURIComponent(joinCode)}/join`, {
    playerName: getPlayerName("bottom"),
    role: "human",
    clientId: appState.serverSession.clientId,
  });
  const joinedLobby = joined?.lobby ?? joined;
  const serverPlayerCount = joinedLobby?.playerCount ?? playerCount;
  const viewerPlayerId = joined?.viewerPlayerId;
  if (!viewerPlayerId) {
    throw new Error("Server did not return a joined player id.");
  }
  setServerSessionCore({
    connected: true,
    lobbyId: joinedLobby.lobbyId,
    viewerPlayerId,
    joinCode: joinedLobby.joinCode ?? joinCode,
    status: joinedLobby.status ?? "lobby",
    isHost: false,
    playerCount: serverPlayerCount,
    sessionToken: joined?.sessionToken ?? null,
  });
  syncLobbySeatPreview();
  return true;
}

async function startHostedMatchFromLobby() {
  if (!appState.serverSession?.lobbyId || !appState.serverSession?.isHost) {
    throw new Error("Only the host can start the match.");
  }
  ensureRealtimeConnection();
  if (isRealtimeSocketConnected()) {
    const started = await socketRequest("lobby:start", {});
    const lobby = started?.lobby ?? null;
    if (lobby?.status) appState.serverSession.status = lobby.status;
    if (lobby) appState.serverSession.lobbyInfo = lobby;
    persistServerSessionSnapshot();
    return true;
  }
  const lobbyId = encodeURIComponent(appState.serverSession.lobbyId);
  const lobbyInfo = await refreshLobbyInfo();
  if (lobbyInfo?.status === "in_progress") {
    appState.serverSession.status = "in_progress";
    persistServerSessionSnapshot();
    return true;
  }

  const openSeats = Math.max(0, Number(lobbyInfo?.playerCount || 0) - Number((lobbyInfo?.players || []).length));
  if (openSeats > 0) {
    try {
      await serverPost(`/api/lobbies/${lobbyId}/fill-bots`, {});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "");
      // If a parallel click/session already started the match, proceed to table instead of hard failing.
      if (!message.includes("Bots can only be added before the match starts")) {
        throw error;
      }
    }
  }

  const latestLobby = await refreshLobbyInfo();
  if (latestLobby?.status === "in_progress") {
    appState.serverSession.status = "in_progress";
    persistServerSessionSnapshot();
    return true;
  }

  const started = await serverPost(`/api/lobbies/${lobbyId}/start`, {});
  appState.serverSession.status = started?.status ?? "in_progress";
  persistServerSessionSnapshot();
  return true;
}

async function reconnectLobbySession(joinCode) {
  ensureRealtimeConnection();
  if (isRealtimeSocketConnected()) {
    if (!appState.serverSession?.lobbyId && !joinCode) {
      return false;
    }
    const resumed = await socketRequest("lobby:resume", {
      lobbyId: appState.serverSession.lobbyId,
      sessionToken: appState.serverSession.sessionToken,
    });
    if (!resumed?.lobbyId || !resumed?.viewerPlayerId) {
      return false;
    }
    setServerSessionCore({
      connected: true,
      lobbyId: resumed.lobbyId,
      viewerPlayerId: resumed.viewerPlayerId,
      joinCode: resumed.joinCode ?? joinCode,
      status: resumed.status ?? "lobby",
      isHost: Boolean(resumed.isHost),
      playerCount: resumed.playerCount ?? getConfiguredPlayerCount(),
      sessionToken: resumed.sessionToken ?? null,
    });
    return true;
  }
  if (!(await canUseServerApi())) {
    return false;
  }
  const response = await serverPost(`/api/lobbies/by-code/${encodeURIComponent(joinCode)}/reconnect`, {
    clientId: appState.serverSession.clientId,
  });
  if (!response?.lobbyId || !response?.viewerPlayerId) {
    return false;
  }
  setServerSessionCore({
    connected: true,
    lobbyId: response.lobbyId,
    viewerPlayerId: response.viewerPlayerId,
    joinCode: response.joinCode ?? joinCode,
    status: response.status ?? "lobby",
    isHost: Boolean(response.isHost),
    playerCount: response.playerCount ?? getConfiguredPlayerCount(),
    sessionToken: response.sessionToken ?? null,
  });
  return true;
}

async function restoreServerSessionFromStorage() {
  let snapshot = null;
  try {
    snapshot = JSON.parse(window.localStorage.getItem(MULTIPLAYER_SESSION_KEY) || "null");
  } catch (_) {
    snapshot = null;
  }
  if (!snapshot?.joinCode) {
    return false;
  }
  try {
    appState.serverSession.lobbyId = snapshot.lobbyId ?? appState.serverSession.lobbyId;
    appState.serverSession.sessionToken = snapshot.sessionToken ?? appState.serverSession.sessionToken;
    appState.serverSession.viewerPlayerId = snapshot.viewerPlayerId ?? appState.serverSession.viewerPlayerId;
    const reconnected = await reconnectLobbySession(snapshot.joinCode);
    if (!reconnected) {
      return false;
    }
    appState.serverSession.status = snapshot.status || appState.serverSession.status;
    syncLobbySeatPreview();
    return true;
  } catch (_) {
    return false;
  }
}

function getServerViewSignature(view) {
  const gameState = view?.gameState;
  if (!gameState) {
    return "";
  }

  return JSON.stringify({
    lobbyId: view.lobbyId,
    status: view.status,
    viewerPlayerId: view.viewerPlayerId,
    legalCommands: view.legalCommands || [],
    phase: gameState.phase,
    turnNumber: gameState.turnNumber,
    roundNumber: gameState.roundNumber,
    currentPlayerId: gameState.currentPlayerId,
    hasDrawnThisTurn: gameState.hasDrawnThisTurn,
    hasPerformedActionThisTurn: gameState.hasPerformedActionThisTurn,
    hasUsedCarrierStrikeThisTurn: gameState.hasUsedCarrierStrikeThisTurn,
    playDeckCount: gameState.playDeckCount,
    discardPileCount: gameState.discardPileCount,
    shipDeckCount: gameState.shipDeckCount,
    eventCount: (gameState.events || []).length,
    winnerIds: gameState.winnerIds || [],
    players: (gameState.players || []).map((player) => ({
      id: player.id,
      handCount: player.handCount,
      hand: (player.hand || []).map((card) => card.id),
      fleetEffects: (player.fleetEffects || []).map((effect) => `${effect.kind}:${effect.card?.id}:${effect.hits || ""}`),
      ships: (player.ships || []).map((ship) => ({
        id: ship.card.id,
        sunk: Boolean(ship.sunk),
        damage: (ship.damage || []).map((entry) => `${entry.type}:${entry.cardId}:${entry.ownerId}:${entry.hits}`),
        attachments: (ship.attachments || []).map((attachment) => attachment.card?.id),
      })),
    })),
    destroyerSquadrons: (gameState.destroyerSquadrons || []).map(
      (squadron) => `${squadron.id}:${squadron.ownerId}:${squadron.hitsTaken || 0}`
    ),
    pendingDestroyerAttack: gameState.pendingDestroyerAttack || null,
  });
}

function shouldApplyServerView(view, force = false) {
  if (force) {
    lastServerViewSignature = getServerViewSignature(view);
    return true;
  }
  const nextSignature = getServerViewSignature(view);
  if (nextSignature && nextSignature === lastServerViewSignature) {
    return false;
  }
  lastServerViewSignature = nextSignature;
  return true;
}

function announceServerTurnChange(gameState, playersBySide) {
  if (!appState.serverSession?.connected || gameState.phase === "round_complete") {
    return;
  }
  const currentPlayer = Object.values(playersBySide).find((player) => player?.id === gameState.currentPlayerId);
  if (!currentPlayer) {
    return;
  }
  const turnKey = `${gameState.roundNumber || 1}:${gameState.turnNumber}:${gameState.currentPlayerId}`;
  if (!appState.serverSession.lastAnnouncedTurnKey) {
    appState.serverSession.lastAnnouncedTurnKey = turnKey;
    return;
  }
  if (appState.serverSession.lastAnnouncedTurnKey === turnKey) {
    return;
  }
  appState.serverSession.lastAnnouncedTurnKey = turnKey;
  const phaseLabel = gameState.hasDrawnThisTurn || gameState.hasUsedCarrierStrikeThisTurn ? "play phase" : "draw phase";
  showTurnBanner(currentPlayer.name, phaseLabel);
}

function maybeRefreshServerTurnSummary(gameState, playersBySide) {
  const staleLobbyTitles = new Set(["Lobby Hosted", "Lobby Joined", "Starting Match"]);
  if (!staleLobbyTitles.has(appState.turnSummary?.title)) {
    return;
  }
  const currentPlayer = Object.values(playersBySide).find((player) => player?.id === gameState.currentPlayerId);
  const playerName = currentPlayer?.name || "Current player";
  const phaseLabel =
    gameState.phase === "round_complete"
      ? "Round complete"
      : gameState.hasDrawnThisTurn || gameState.hasUsedCarrierStrikeThisTurn
        ? "Play phase"
        : "Draw phase";
  setTurnSummary(
    `Turn ${gameState.turnNumber} • ${phaseLabel}`,
    `${playerName} is active.`,
    gameState.hasPerformedActionThisTurn ? "Waiting for turn completion." : "Choose the next legal action."
  );
}

function mapServerViewToLocalState(view) {
  const gameState = view?.gameState;
  if (!gameState) {
    return;
  }
  appState.serverSession.legalCommands = Array.isArray(view?.legalCommands) ? [...view.legalCommands] : [];
  appState.botHands = appState.botHands || { left: [], top: [], right: [] };
  const playersBySide = {};
  const rawPlayersBySide = {};
  appState.fleetsByZone = {};
  appState.effectsByFleet = { bottom: [], left: [], top: [], right: [] };
  appState.serverSession.localRoleByZone = { bottom: "empty", left: "empty", top: "empty", right: "empty" };
  gameState.players.forEach((player) => {
    const seatRecord = Object.values(view.seatLayout?.seatsBySide || {}).find((seat) => seat?.assignment?.playerId === player.id);
    if (seatRecord?.side) {
      rawPlayersBySide[seatRecord.side] = { player, role: seatRecord.role || "human" };
    }
  });

  const sideOrder = ["bottom", "left", "top", "right"];
  const viewerPlayerId = view?.viewerPlayerId || appState.serverSession?.viewerPlayerId || null;
  const viewerRawSide = Object.entries(rawPlayersBySide).find(([, entry]) => entry?.player?.id === viewerPlayerId)?.[0] || "bottom";
  const viewerRawIndex = Math.max(0, sideOrder.indexOf(viewerRawSide));
  const rotateToLocalBottom = (rawSide) => {
    const rawIndex = sideOrder.indexOf(rawSide);
    if (rawIndex < 0) return rawSide;
    const mappedIndex = (rawIndex - viewerRawIndex + sideOrder.length) % sideOrder.length;
    return sideOrder[mappedIndex];
  };

  Object.entries(rawPlayersBySide).forEach(([rawSide, entry]) => {
    const mappedSide = rotateToLocalBottom(rawSide);
    playersBySide[mappedSide] = entry.player;
    appState.fleetsByZone[mappedSide] = { playerId: entry.player.id, name: entry.player.name };
    appState.serverSession.localRoleByZone[mappedSide] = entry.role || "human";
  });
  appState.serverSession.activeSides = ["bottom", "left", "top", "right"].filter((side) => playersBySide[side]);
  if (!appState.serverSession.activeSides.includes("bottom")) {
    appState.serverSession.activeSides.unshift("bottom");
  }
  appState.tableConfig.playerCount = Math.min(4, Math.max(2, appState.serverSession.activeSides.length || gameState.players.length || appState.tableConfig.playerCount || 4));

  const sides = ["bottom", "left", "top", "right"];
  sides.forEach((side) => {
    const player = playersBySide[side];
    if (!player) {
      appState.fleets[side] = [];
      if (side !== "bottom") {
        appState.botHands[side] = [];
      }
      return;
    }
    PLAYER_NAMES[side] = player.name;
    const sideEffects = (player.fleetEffects || []).map((effect) => {
      const rendered = serverCardToClientCard(effect.card);
      return {
        id: effect.card.id,
        kind: effect.kind,
        label: rendered.label,
        image: rendered.image,
        hits: effect.hits,
      };
    });
    appState.effectsByFleet[side] = sideEffects;
    const ships = player.ships.map((ship) => {
      const template = SHIP_CARD_BY_NAME.get(ship.card.name);
      const originalImage = template?.image || SHIP_CARD_BACK;
      const isSunk = Boolean(ship.sunk);
      const damageTotal = ship.damage.reduce((sum, entry) => sum + Number(entry.hits || 0), 0);
      const remaining = Math.max(ship.card.hitNumber - damageTotal, 0);
      const salvos = (ship.attachments || []).map((attachment) => {
        const rendered = serverCardToClientCard(attachment.card);
        return {
          image: rendered.image,
          label: rendered.label,
        };
      });
      return {
        ship: ship.card.name,
        shipId: ship.card.id,
        image: isSunk ? SHIP_CARD_BACK : originalImage,
        originalImage,
        damage: `${remaining} / ${ship.card.hitNumber}`,
        sunk: isSunk,
        isCarrier: Boolean(ship.card.isCarrier),
        gunSize: ship.card.gunCaliber,
        salvos,
      };
    });
    ships.sort((a, b) => Number(a.isCarrier) - Number(b.isCarrier));
    appState.fleets[side] = ships;
    if (side === "bottom") {
      appState.hand = (player.hand || []).map((card) => serverCardToClientCard(card));
    } else {
      appState.botHands[side] = Array.from({ length: player.handCount || 0 }, (_, idx) => ({ id: `hidden-${side}-${idx}` }));
    }
  });

  (gameState.destroyerSquadrons || []).forEach((squadron) => {
    const ownerSide = Object.keys(playersBySide).find((side) => playersBySide[side]?.id === squadron.ownerId);
    if (!ownerSide) {
      return;
    }
    appState.effectsByFleet[ownerSide] = appState.effectsByFleet[ownerSide] || [];
    appState.effectsByFleet[ownerSide].push({
      id: squadron.id,
      kind: "destroyer_squadron",
      label: "Destroyer Squadron",
      image: "../assets/cards/play/Modern/Destroyer-4hits.png",
      damage: `${Math.max(4 - Number(squadron.hitsTaken || 0), 0)} / 4`,
      salvos: [],
    });
  });

  appState.turnState.currentZone =
    Object.keys(playersBySide).find((side) => playersBySide[side]?.id === gameState.currentPlayerId) || "bottom";
  appState.turnState.turnNumber = gameState.turnNumber;
  const legalCommandSet = new Set(view?.legalCommands || []);
  const hasPlayAction = [...legalCommandSet].some(
    (command) =>
      command === "discard_play_card" ||
      command === "resolve_destroyer_squadron_roll" ||
      command === "select_destroyer_squadron_targets" ||
      command.startsWith("play_")
  );
  const hasDrawAction = legalCommandSet.has("draw_card") || legalCommandSet.has("use_carrier_strike");
  const hasOnlyEndTurn = legalCommandSet.size === 1 && legalCommandSet.has("end_turn");
  const hasPendingServerAirStrikeSelection = Boolean(
    appState.turnState.airStrikeMode &&
      legalCommandSet.has("use_carrier_strike") &&
      gameState.currentPlayerId === viewerPlayerId &&
      !gameState.hasDrawnThisTurn &&
      !gameState.hasPerformedActionThisTurn
  );

  appState.turnState.phase = gameState.phase === "round_complete"
    ? "complete"
    : hasPendingServerAirStrikeSelection
    ? "play"
    : hasPlayAction
    ? "play"
    : hasDrawAction
    ? "draw"
    : gameState.hasPerformedActionThisTurn || hasOnlyEndTurn
    ? "complete"
    : gameState.hasDrawnThisTurn || gameState.hasUsedCarrierStrikeThisTurn
    ? "play"
    : "draw";
  appState.turnState.playedCard = Boolean(
    gameState.hasPerformedActionThisTurn && !hasServerMandatorySpecialResolutionPending()
  );
  appState.turnState.airStrikeMode = hasPendingServerAirStrikeSelection;
  appState.turnState.usedAirStrike = Boolean(gameState.hasUsedCarrierStrikeThisTurn);
  if (!hasPendingServerAirStrikeSelection && !gameState.hasUsedCarrierStrikeThisTurn) {
    appState.turnState.usedCarrierIndices = [];
  }
  appState.match.isRoundOver = gameState.phase === "round_complete";
  appState.match.roundEndReason = gameState.roundEndReason || null;
  appState.match.winnerZone =
    Object.keys(playersBySide).find((side) => gameState.winnerIds?.includes(playersBySide[side]?.id)) || null;
  appState.match.currentRound = gameState.roundNumber || 1;
  appState.match.mode = gameState.options?.matchMode || appState.match.mode;
  appState.match.campaignTarget = gameState.options?.campaignTargetScore || appState.match.campaignTarget;

  if (gameState.campaign?.totalScores) {
    appState.match.scoreRows = Object.entries(playersBySide).map(([side, player]) => ({
      player: player.name,
      playerZone: side,
      rounds: [],
      total: gameState.campaign.totalScores[player.id] || 0,
    }));
  } else {
    appState.match.scoreRows = Object.entries(playersBySide).map(([side, player]) => ({
      player: player.name,
      playerZone: side,
      rounds: [],
      total: 0,
    }));
  }

  playSoundsForServerEvents(gameState.events || []);
  maybeRefreshServerTurnSummary(gameState, playersBySide);
  announceServerTurnChange(gameState, playersBySide);

  appState.drawPiles = [
    {
      label: "Play Deck",
      count: gameState.playDeckCount,
      image: "../assets/cards/play/Modern/cardback-Play.png",
    },
    {
      label: "Discard Pile",
      count: gameState.discardPileCount,
      image: "../assets/cards/play/Modern/cardback-Play.png",
      topCardLabel: gameState.discardPileCount > 0 ? "Top discard from server state" : "Discard pile is empty",
    },
    {
      label: "Ship Deck",
      count: gameState.shipDeckCount,
      image: "../assets/cards/ships/Modern/Cardback-Ship.png",
    },
  ];

  const serverEvents = gameState.events || [];
  appState.combatLog = [...serverEvents].reverse().map((event) => `${event.type}: ${event.detail}`);
}

async function maybeAutoEndTurnForOpeningSpecialFlow() {
  if (autoEndTurnInFlight) return;
  if (!appState.serverSession?.connected) return;
  if (!isHumanTurn()) return;
  if (shouldRequireManualEndTurn()) return;
  const legal = Array.isArray(appState.serverSession.legalCommands) ? appState.serverSession.legalCommands : [];
  if (!(legal.length === 1 && legal[0] === "end_turn")) return;
  if (!appState.serverSession.viewerPlayerId) return;

  const key = `${appState.turnState.turnNumber}:${appState.serverSession.viewerPlayerId}:end_turn_only`;
  if (lastAutoEndTurnKey === key) return;
  lastAutoEndTurnKey = key;

  autoEndTurnInFlight = true;
  try {
    await submitServerCommand({
      type: "end_turn",
      actorId: appState.serverSession.viewerPlayerId,
    });
  } finally {
    autoEndTurnInFlight = false;
  }
}

async function refreshServerViewAndRender() {
  if (!appState.serverSession?.connected || !appState.serverSession.lobbyId || !appState.serverSession.viewerPlayerId) {
    return;
  }
  try {
    const viewPath = appState.serverSession.sessionToken
      ? `/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/view?sessionToken=${encodeURIComponent(appState.serverSession.sessionToken)}`
      : `/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/view?playerId=${encodeURIComponent(appState.serverSession.viewerPlayerId)}`;
    const view = await serverGet(viewPath);
    if (view?.viewerPlayerId) {
      appState.serverSession.viewerPlayerId = view.viewerPlayerId;
    }
    if (!shouldApplyServerView(view)) {
      appState.serverSession.status = view.status || appState.serverSession.status;
      appState.serverSession.lastSyncAt = new Date().toISOString();
      appState.serverSession.lastError = null;
      persistServerSessionSnapshot();
      return;
    }
    mapServerViewToLocalState(view);
    appState.serverSession.status = view.status || appState.serverSession.status;
    appState.serverSession.lastSyncAt = new Date().toISOString();
    appState.serverSession.lastError = null;
    persistServerSessionSnapshot();
    renderPrototype();
    maybeAutoEndTurnForOpeningSpecialFlow();
  } catch (error) {
    appState.serverSession.lastError = error instanceof Error ? error.message : "Server refresh failed.";
  }
}

async function tryAutoEnterRunningMatchFromLobby() {
  if (autoEnterMatchInFlight) {
    return false;
  }
  if (appState.setupMode !== "multiplayer") {
    return false;
  }
  if (!appState.serverSession?.connected || !appState.serverSession?.lobbyId) {
    return false;
  }
  if (document.querySelector("[data-screen='table']")?.classList.contains("is-active")) {
    return false;
  }

  autoEnterMatchInFlight = true;
  try {
    if (!appState.serverSession.viewerPlayerId && appState.serverSession.joinCode) {
      await reconnectLobbySession(appState.serverSession.joinCode);
    }

    if (appState.serverSession.sessionToken) {
      const resumed = await serverPost(`/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/resume`, {
        sessionToken: appState.serverSession.sessionToken,
      });
      if (resumed?.viewerPlayerId) {
        appState.serverSession.viewerPlayerId = resumed.viewerPlayerId;
      }
      if (resumed?.sessionToken) {
        appState.serverSession.sessionToken = resumed.sessionToken;
      }
    }

    const lobby = await refreshLobbyInfo();
    appState.serverSession.status = lobby?.status || appState.serverSession.status;
    if (appState.serverSession.status !== "in_progress") {
      return false;
    }

    const hasViewerSeat = (lobby?.players || []).some((player) => player.playerId === appState.serverSession.viewerPlayerId);
    if (!hasViewerSeat && appState.serverSession.joinCode) {
      const reconnected = await reconnectLobbySession(appState.serverSession.joinCode);
      if (!reconnected) {
        return false;
      }
      const refreshedLobby = await refreshLobbyInfo();
      if (!(refreshedLobby?.players || []).some((player) => player.playerId === appState.serverSession.viewerPlayerId)) {
        return false;
      }
    }

    await refreshServerViewAndRender();
    showScreen("table");
    appendLog(`Match started from lobby ${appState.serverSession.joinCode}.`);
    return true;
  } catch (error) {
    appState.serverSession.lastError = error instanceof Error ? error.message : "Auto-enter match failed.";
    return false;
  } finally {
    autoEnterMatchInFlight = false;
  }
}

function startServerPolling() {
  window.clearInterval(serverPollTimer);
  if (!appState.serverSession?.connected) {
    return;
  }
  serverPollTimer = window.setInterval(async () => {
    const menuActive = document.querySelector("[data-screen='menu']")?.classList.contains("is-active");
    if (menuActive) {
      try {
        await refreshLobbyInfo();
        syncLobbySeatPreview();
        if (appState.setupMode === "multiplayer" && appState.serverSession?.status === "in_progress") {
          await tryAutoEnterRunningMatchFromLobby();
        }
      } catch (error) {
        appState.serverSession.lastError = error instanceof Error ? error.message : "Lobby polling failed.";
      }
      return;
    }
    refreshServerViewAndRender();
  }, 1200);
}

function stopServerPolling() {
  window.clearInterval(serverPollTimer);
  serverPollTimer = null;
}

async function submitServerCommand(command) {
  if (!appState.serverSession?.connected || !appState.serverSession.lobbyId) {
    return false;
  }
  const commandKey = (() => {
    try {
      return JSON.stringify(command);
    } catch (_) {
      return String(command?.type || "unknown");
    }
  })();
  const now = Date.now();
  if (lastServerCommandKey === commandKey && now - lastServerCommandAt < 650) {
    return true;
  }
  lastServerCommandKey = commandKey;
  lastServerCommandAt = now;

  const originalHandCard =
    command?.cardId && Array.isArray(appState.hand)
      ? appState.hand.find((card) => card.id === command.cardId) || null
      : null;

  const commandMatchesCard = (candidate, source) => {
    if (!candidate || !source) return false;
    if (candidate.kind !== source.kind) return false;
    const sameHits = Number(candidate.hits ?? -1) === Number(source.hits ?? -1);
    const sameGun = String(candidate.gunSize ?? "") === String(source.gunSize ?? "");
    return sameHits && sameGun;
  };

  const tryCommand = async (payload) => {
    ensureRealtimeConnection();
    if (isRealtimeSocketConnected()) {
      await socketRequest("game:action", { command: payload });
      return true;
    }
    await serverPost(`/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/commands`, {
      ...payload,
      sessionToken: appState.serverSession.sessionToken ?? null,
    });
    await refreshServerViewAndRender();
    return true;
  };

  ensureRealtimeConnection();
  if (isRealtimeSocketConnected()) {
    try {
      await tryCommand(command);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const canRetryWithFreshCardId =
        Boolean(command?.cardId) &&
        Boolean(originalHandCard) &&
        /is not in .*hand/i.test(message);
      if (canRetryWithFreshCardId) {
        await refreshServerViewAndRender();
        const replacement = appState.hand.find((card) => commandMatchesCard(card, originalHandCard));
        if (replacement?.id && replacement.id !== command.cardId) {
          try {
            await tryCommand({ ...command, cardId: replacement.id });
            return true;
          } catch (retryError) {
            appendLog(`Server command failed: ${retryError instanceof Error ? retryError.message : "Unknown error"}`);
            renderPrototype();
            return false;
          }
        }
      }
      await refreshServerViewAndRender();
      if (/has already performed their draw/i.test(message) || /is not in .*hand/i.test(message)) {
        return true;
      }
      appendLog(`Server command failed: ${message}`);
      renderPrototype();
      return false;
    }
  }
  try {
    await tryCommand(command);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const canRetryWithFreshCardId =
      Boolean(command?.cardId) &&
      Boolean(originalHandCard) &&
      /is not in .*hand/i.test(message);
    if (canRetryWithFreshCardId) {
      await refreshServerViewAndRender();
      const replacement = appState.hand.find((card) => commandMatchesCard(card, originalHandCard));
      if (replacement?.id && replacement.id !== command.cardId) {
        try {
          await tryCommand({ ...command, cardId: replacement.id });
          return true;
        } catch (retryError) {
          appendLog(`Server command failed: ${retryError instanceof Error ? retryError.message : "Unknown error"}`);
          renderPrototype();
          return false;
        }
      }
    }
    await refreshServerViewAndRender();
    if (/has already performed their draw/i.test(message) || /is not in .*hand/i.test(message)) {
      return true;
    }
    appendLog(`Server command failed: ${message}`);
    renderPrototype();
    return false;
  }
}

function renderTurnSummary() {
  const summary = appState.turnSummary || {
    title: "Awaiting action",
    subtitle: "No action yet.",
    outcome: "One draw, one action, then the turn ends.",
  };
  if (turnSummaryTitle) {
    turnSummaryTitle.textContent = summary.title;
  }
  if (turnSummarySubtitle) {
    turnSummarySubtitle.textContent = summary.subtitle;
  }
  if (turnSummaryOutcome) {
    turnSummaryOutcome.textContent = summary.outcome;
  }
}

function consumeTurnAdvanceDelay(defaultDelayMs) {
  const delay = Math.max(defaultDelayMs, pendingDiceAdvanceDelay || 0);
  pendingDiceAdvanceDelay = 0;
  return delay;
}

function clearFleetDropPreview() {
  document
    .querySelectorAll(".ship-card.drop-preview-before, .ship-card.drop-preview-after")
    .forEach((node) => {
      node.classList.remove("drop-preview-before", "drop-preview-after");
    });
  fleetDropPreview = null;
}

function markRejectedHandCard(cardId) {
  if (!cardId) {
    return;
  }

  playInvalidCardSound();
  appState.ui.rejectedCardId = cardId;
  window.setTimeout(() => {
    if (appState.ui.rejectedCardId === cardId) {
      appState.ui.rejectedCardId = null;
      renderPrototype();
    }
  }, 520);
}

function normalizeBottomFleetOrder() {
  normalizeFleetOrder("bottom");
}

function getConfiguredPlayerCount() {
  return Math.min(4, Math.max(2, Number(appState.tableConfig?.playerCount || 4)));
}

function getActiveZones() {
  if (appState.serverSession?.connected) {
    const activeSides = Array.isArray(appState.serverSession.activeSides)
      ? appState.serverSession.activeSides.filter((zone) => PLAYER_ORDER.includes(zone))
      : [];
    if (activeSides.length) {
      return activeSides;
    }
  }
  return ACTIVE_ZONE_LAYOUTS[getConfiguredPlayerCount()] || ACTIVE_ZONE_LAYOUTS[4];
}

function isZoneActive(zone) {
  return getActiveZones().includes(zone);
}

function getBotZones() {
  return getActiveZones().filter((zone) => zone !== "bottom");
}

function getLayoutMode() {
  if (appState.serverSession?.connected) {
    const activeSides = getActiveZones();
    if (activeSides.length === 2) {
      return "duel";
    }
    if (activeSides.length === 3 && activeSides.includes("right") && !activeSides.includes("top")) {
      return "four-way";
    }
    if (activeSides.length === 3) {
      return "triangle";
    }
    return "four-way";
  }
  const playerCount = getConfiguredPlayerCount();
  if (playerCount === 2) {
    return "duel";
  }
  if (playerCount === 3) {
    return "triangle";
  }
  return "four-way";
}

function getCurrentCardSetId() {
  return appState.tableConfig?.cardSet || CLASSIC_SET_ID;
}

function getCurrentCardSetName() {
  return getCurrentCardSetId() === CLASSIC_SET_ID ? "Classic Set" : "Custom Set";
}

function getZoneRoleLabel(zone) {
  if (appState.serverSession?.connected) {
    const role = appState.serverSession.localRoleByZone?.[zone];
    if (role === "human") return "Human";
    if (role === "bot") return "Bot";
    return "Empty";
  }
  if (zone === "bottom") {
    return "Human";
  }
  return isZoneActive(zone) ? "Bot" : "Empty";
}

function normalizeFleetOrder(zone) {
  appState.fleets[zone].sort((a, b) => Number(a.isCarrier) - Number(b.isCarrier));
}

function getPlayerName(zone) {
  return PLAYER_NAMES[zone] || `Admiral ${zone}`;
}

function createFreshScoreRows() {
  return getActiveZones().map((zone) => ({
    player: getPlayerName(zone),
    playerZone: zone,
    rounds: [],
    total: 0,
  }));
}

function setHumanPlayerName(name) {
  const cleanedName = String(name || "").trim() || "Admiral Carter";
  PLAYER_NAMES.bottom = cleanedName;
  const scoreRow = appState.match.scoreRows.find((row) => row.playerZone === "bottom" || row.player === "Admiral Carter");
  if (scoreRow) {
    scoreRow.player = cleanedName;
    scoreRow.playerZone = "bottom";
  }
  if (humanSeatName) {
    humanSeatName.textContent = cleanedName;
  }
  if (bottomPlayerName) {
    bottomPlayerName.textContent = cleanedName;
  }
  syncLobbySeatPreview();
}

function syncLobbySeatPreview() {
  const playerCount = getConfiguredPlayerCount();
  const seatNames = {
    bottom: getPlayerName("bottom"),
    top: isZoneActive("top") ? getPlayerName("top") : "Empty",
    left: isZoneActive("left") ? getPlayerName("left") : "Empty",
    right: isZoneActive("right") ? getPlayerName("right") : "Empty",
  };
  if (humanSeatName) {
    humanSeatName.textContent = seatNames.bottom;
  }
  if (topSeatName) {
    topSeatName.textContent = seatNames.top;
  }
  if (leftSeatName) {
    leftSeatName.textContent = seatNames.left;
  }
  if (rightSeatName) {
    rightSeatName.textContent = seatNames.right;
  }
  if (playersCountCopy) {
    playersCountCopy.textContent = `${playerCount} seats`;
  }
  const lobbyInfo = appState.serverSession?.lobbyInfo;
  const humans = (lobbyInfo?.players || []).filter((player) => player.role === "human");
  const readyHumans = humans.filter((player) => player.isReady);
  if (readyStateCopy) {
    if (appState.setupMode === "solo") {
      readyStateCopy.textContent = "Solo quick start is enabled.";
    } else {
      readyStateCopy.textContent = appState.serverSession?.lobbyId
        ? appState.serverSession.isHost
          ? "Lobby hosted. Waiting for ready checks."
          : "Joined lobby. Waiting for host to start."
        : `No active lobby`;
    }
  }
  if (lobbyReadySummary) {
    lobbyReadySummary.textContent = `${readyHumans.length} / ${humans.length || 0} ready`;
  }
  if (lobbyReadyList) {
    lobbyReadyList.innerHTML = "";
    (lobbyInfo?.players || []).forEach((player) => {
      if (player.role !== "human") return;
      const item = document.createElement("div");
      item.className = "lobby-ready-item";
      const name = document.createElement("span");
      name.textContent = player.playerName;
      const check = document.createElement("span");
      check.className = "lobby-ready-check";
      check.textContent = player.isReady ? "✓ Ready" : "Not Ready";
      item.append(name, check);
      lobbyReadyList.appendChild(item);
    });
  }
  if (lobbyJoinCode) {
    lobbyJoinCode.textContent = appState.setupMode === "solo" ? "Not needed (Solo)" : appState.serverSession?.joinCode || "Not hosted yet";
  }
  if (hostLobbyButton) {
    hostLobbyButton.hidden = appState.setupMode !== "multiplayer";
  }
  if (joinLobbyButton) {
    joinLobbyButton.hidden = appState.setupMode !== "multiplayer";
  }
  if (copyJoinCodeButton) {
    copyJoinCodeButton.hidden = appState.setupMode !== "multiplayer";
  }
  if (joinCodeInput) {
    joinCodeInput.disabled = appState.setupMode !== "multiplayer";
  }
  if (menuLobbyPanel) {
    menuLobbyPanel.hidden = appState.setupMode !== "multiplayer";
  }
  if (menuLobbyDebug) {
    menuLobbyDebug.hidden = appState.setupMode !== "multiplayer";
  }
  if (startMatchButton) {
    const allHumansReady = humans.length > 0 && readyHumans.length === humans.length;
    const canHostStart = appState.serverSession?.isHost && appState.serverSession?.lobbyId && allHumansReady;
    const canJoinRunning = appState.serverSession?.connected && appState.serverSession?.status === "in_progress";
    if (appState.setupMode === "solo") {
      startMatchButton.disabled = false;
      startMatchButton.textContent = "Start Game";
    } else {
      startMatchButton.disabled = !(canHostStart || canJoinRunning);
      startMatchButton.textContent = appState.serverSession?.isHost ? "Start Match" : "Enter Match";
    }
  }
  if (readyToggleButton) {
    const sessionToken = appState.serverSession?.sessionToken;
    const currentHuman = (lobbyInfo?.players || []).find(
      (player) => player.role === "human" && player.playerId === appState.serverSession.viewerPlayerId
    );
    readyToggleButton.hidden = appState.setupMode !== "multiplayer";
    readyToggleButton.disabled = !(sessionToken && appState.serverSession?.lobbyId);
    readyToggleButton.textContent = currentHuman?.isReady ? "Unready" : "Ready";
  }
  if (cardSetSelect) {
    cardSetSelect.value = getCurrentCardSetId();
  }
  if (cardSetDescription) {
    cardSetDescription.textContent = CLASSIC_SET_DEFINITION;
  }
  if (cardSetPlayCount) {
    cardSetPlayCount.textContent = `${CLASSIC_PLAY_DECK_TOTAL} cards`;
  }
  if (cardSetShipCount) {
    cardSetShipCount.textContent = `${CLASSIC_SHIP_DECK_TOTAL} ships`;
  }
  renderLobbyDebugPanel();
}

function renderLobbyDebugPanel() {
  if (appState.setupMode !== "multiplayer") {
    if (menuLobbyDebug) {
      menuLobbyDebug.textContent = "";
    }
    if (tableLobbyDebug) {
      tableLobbyDebug.textContent = "";
    }
    return;
  }
  const session = appState.serverSession || {};
  const lines = [
    "Lobby Debug",
    `connected: ${Boolean(session.connected)}`,
    `status: ${session.status || "offline"}`,
    `isHost: ${Boolean(session.isHost)}`,
    `joinCode: ${session.joinCode || "-"}`,
    `lobbyId: ${session.lobbyId || "-"}`,
    `viewerPlayerId: ${session.viewerPlayerId || "-"}`,
    `sessionToken: ${session.sessionToken || "-"}`,
    `lastSyncAt: ${session.lastSyncAt || "-"}`,
    `lastError: ${session.lastError || "-"}`,
    `audioStatus: ${audioDiagnostics.status}`,
    `audioOutput: ${audioDiagnostics.outputMode || "-"}`,
    `audioLastEvent: ${audioDiagnostics.lastEvent || "-"}`,
    `audioLastError: ${audioDiagnostics.lastError || "-"}`,
  ];
  const text = lines.join("\n");
  if (menuLobbyDebug) {
    menuLobbyDebug.textContent = text;
  }
  if (tableLobbyDebug) {
    tableLobbyDebug.textContent = text;
  }
}

function safelyReadLocalSave() {
  try {
    const raw = window.localStorage.getItem(LOCAL_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function formatSavedAtLabel(savedAt) {
  if (!savedAt) {
    return "Unknown save time";
  }
  try {
    return new Date(savedAt).toLocaleString();
  } catch (_) {
    return String(savedAt);
  }
}

function updateSaveControls() {
  const saveData = safelyReadLocalSave();
  if (loadGameButton) {
    loadGameButton.disabled = !saveData;
  }
  if (saveStatusCopy) {
    saveStatusCopy.textContent = saveData
      ? `Saved game available • ${saveData.mode === "campaign" ? "Campaign" : "Skirmish"} • ${formatSavedAtLabel(saveData.savedAt)}`
      : "No saved game detected yet.";
  }
}

function buildSavableState() {
  const snapshot = JSON.parse(JSON.stringify(appState));
  snapshot.ui = {
    ...(snapshot.ui || {}),
    rejectedCardId: null,
    highlightedDrawCardId: null,
  };
  snapshot.pendingImpacts = [];
  return snapshot;
}

function saveCurrentGame({ autosave = false } = {}) {
  if (!hasLaunchedMatch) {
    return false;
  }
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    mode: appState.match.mode,
    playerNames: { ...PLAYER_NAMES },
    hasLaunchedMatch: true,
    state: buildSavableState(),
  };
  try {
    window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
    updateSaveControls();
    if (!autosave) {
      appendLog(`Game saved locally at ${formatSavedAtLabel(payload.savedAt)}.`);
      renderPrototype();
    }
    return true;
  } catch (_) {
    if (!autosave) {
      appendLog("Local save failed. Browser storage may be unavailable.");
      renderPrototype();
    }
    return false;
  }
}

function scheduleAutosave() {
  if (!hasLaunchedMatch) {
    return;
  }
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveCurrentGame({ autosave: true });
  }, 180);
}

function resetTransientUiState() {
  dragState = null;
  fleetDropPreview = null;
  dragPointer = null;
  dragTargetElement = null;
  isAnimating = false;
  window.clearTimeout(botTurnTimer);
  window.clearTimeout(autosaveTimer);
  window.clearTimeout(drawHighlightTimer);
  appState.ui = appState.ui || {};
  appState.ui.rejectedCardId = null;
  appState.ui.highlightedDrawCardId = null;
  appState.ui.touchSelectedCardId = null;
  appState.pendingImpacts = [];
  clearFleetDropPreview();
  clearTargetingLine();
  clearValidTargetHighlights();
  removeDragPreviewGhost();
  closeWinnerBanner();
  closeZoom();
  closeRules();
  closeVictoryPile();
  closeSalvoPile();
  closeCombatLog();
  closeScoreCard();
  closeDeckBrowser();
}

function loadSavedGame() {
  const saveData = safelyReadLocalSave();
  if (!saveData?.state) {
    updateSaveControls();
    return false;
  }

  Object.assign(PLAYER_NAMES, saveData.playerNames || {});
  const nextState = JSON.parse(JSON.stringify(saveData.state));
  Object.keys(appState).forEach((key) => {
    delete appState[key];
  });
  Object.assign(appState, nextState);
  hasLaunchedMatch = Boolean(saveData.hasLaunchedMatch);
  resetTransientUiState();
  if (playerNameInput) {
    playerNameInput.value = getPlayerName("bottom");
  }
  if (campaignTargetInput) {
    campaignTargetInput.value = String(appState.match.campaignTarget || 100);
  }
  if (playerCountSelect) {
    playerCountSelect.value = String(getConfiguredPlayerCount());
  }
  if (cardSetSelect) {
    cardSetSelect.value = getCurrentCardSetId();
  }
  setHumanPlayerName(getPlayerName("bottom"));
  setMatchMode(appState.match.mode);
  syncLobbySeatPreview();
  showScreen("table");
  renderPrototype();
  scheduleBotTurnIfNeeded();
  return true;
}

function setMatchMode(mode) {
  appState.match.mode = mode === "campaign" ? "campaign" : "skirmish";
  modeButtons.forEach((button) => {
    button.classList.toggle("mode-card-active", button.dataset.modeSelect === appState.match.mode);
  });
  if (campaignTargetInput) {
    campaignTargetInput.disabled = appState.match.mode !== "campaign";
  }
}

function getCurrentZone() {
  return appState.turnState.currentZone || "bottom";
}

function isHumanTurn() {
  return getCurrentZone() === "bottom";
}

function isDragInteractionEnabled() {
  return !IS_TOUCH_DEVICE && appState.ui.interactionMode === "drag";
}

function isSelectInteractionEnabled() {
  return IS_TOUCH_DEVICE || appState.ui.interactionMode !== "drag";
}

function isOpeningTurnWindow() {
  const activePlayers = getActiveZones().length;
  return appState.turnState.turnNumber <= activePlayers;
}

function shouldRequireManualEndTurn() {
  return !appState.match.isRoundOver && isHumanTurn() && isOpeningTurnWindow();
}

function hasServerMandatorySpecialResolutionPending() {
  const legal = Array.isArray(appState.serverSession?.legalCommands) ? appState.serverSession.legalCommands : [];
  if (!legal.length) {
    return false;
  }
  return legal.some(
    (command) =>
      command === "play_minefield" ||
      command === "play_submarine" ||
      command === "play_torpedo_boat" ||
      command === "play_additional_damage" ||
      command === "play_additional_ship"
  );
}

function getHandForZone(zone) {
  if (zone === "bottom") {
    return appState.hand;
  }
  appState.botHands = appState.botHands || { top: [], left: [], right: [] };
  appState.botHands[zone] = appState.botHands[zone] || [];
  return appState.botHands[zone];
}

function getAirStrikeHandCards() {
  if (!isHumanTurn() || !appState.turnState.airStrikeMode) {
    return [];
  }

  return getAvailableCarrierIndices()
    .filter(({ index }) => hasUnusedCarrier(index))
    .map(({ ship, index }) => ({
      id: `carrier-airstrike-${appState.turnState.turnNumber}-${index}`,
      kind: "carrier_airstrike",
      label: `${ship.ship} Air Strike`,
      image: ship.image,
      dropMode: "enemy_ship",
      fromIndex: index,
      isVirtual: true,
    }));
}

function getReadyDestroyerActivationCards() {
  const legal = Array.isArray(appState.serverSession?.legalCommands) ? appState.serverSession.legalCommands : [];
  if (!isHumanTurn() || !legal.includes("resolve_destroyer_squadron_roll")) {
    return [];
  }

  return (appState.effectsByFleet.bottom || [])
    .filter((effect) => effect.kind === "destroyer_squadron")
    .map((effect) => ({
      id: `destroyer-activation-${effect.id}`,
      kind: "destroyer_activation",
      label: "Activate Destroyer Squadron",
      image: effect.image,
      dropMode: "fleet_target",
      effectId: effect.id,
      isVirtual: true,
    }));
}

function getDisplayedHandCards() {
  return [...appState.hand, ...getAirStrikeHandCards(), ...getReadyDestroyerActivationCards()];
}

function getDisplayedHandCardById(cardId) {
  return getDisplayedHandCards().find((card) => card.id === cardId) || null;
}

function getNextZone(zone) {
  const activeZones = getActiveZones();
  const currentIndex = activeZones.indexOf(zone);
  for (let step = 1; step <= activeZones.length; step += 1) {
    const candidate = activeZones[(currentIndex + step) % activeZones.length];
    if (hasAfloatShips(candidate)) {
      return candidate;
    }
  }
  return zone;
}

function getEnemyZones(zone) {
  return getActiveZones().filter((candidate) => candidate !== zone && hasAfloatShips(candidate));
}

function hasAfloatShips(zone) {
  return (appState.fleets[zone] || []).some((ship) => !ship.sunk);
}

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createShipInstance(template) {
  return {
    ship: template.ship,
    image: template.image,
    damage: `${template.hitPoints} / ${template.hitPoints}`,
    isCarrier: Boolean(template.isCarrier),
    gunSize: template.gunSize,
  };
}

function createPlayCardInstance(template) {
  return {
    ...template,
    id: `deal-card-${generatedPlayCardId++}`,
  };
}

function buildPrototypePlayDeck() {
  const cardsByLabel = new Map(PLAY_CARD_DRAW_LIBRARY.map((card) => [card.label, card]));
  const weightedTemplates = PLAY_DECK_DISTRIBUTION.flatMap(({ label, count }) => {
    const template = cardsByLabel.get(label);
    return template ? Array.from({ length: count }, () => template) : [];
  });

  return shuffleArray(weightedTemplates).map((card) => createPlayCardInstance(card));
}

function dealPrototypeFleets() {
  const activeZones = getActiveZones();
  const seatOrder = shuffleArray([...activeZones]);
  const carriers = shuffleArray(SHIP_DEAL_LIBRARY.filter((ship) => ship.isCarrier));
  const nonCarriers = shuffleArray(SHIP_DEAL_LIBRARY.filter((ship) => !ship.isCarrier));
  const fleets = {
    top: [],
    left: [],
    right: [],
    bottom: [],
  };

  // Spread carriers across different fleets so the prototype starts in a believable state.
  carriers.forEach((carrier, index) => {
    const seat = seatOrder[index % seatOrder.length];
    fleets[seat].push(createShipInstance(carrier));
  });

  activeZones.forEach((seat) => {
    while (fleets[seat].length < 5 && nonCarriers.length > 0) {
      fleets[seat].push(createShipInstance(nonCarriers.shift()));
    }
  });

  appState.fleets.top = fleets.top;
  appState.fleets.left = fleets.left;
  appState.fleets.right = fleets.right;
  appState.fleets.bottom = fleets.bottom;
  appState.shipDeckQueue = nonCarriers.map(createShipInstance);
  activeZones.forEach((zone) => normalizeFleetOrder(zone));
}

function dealPrototypeHands() {
  const playDeck = buildPrototypePlayDeck();
  const drawHand = (count) => playDeck.splice(0, count).map((card) => ({ ...card }));
  appState.hand = drawHand(5);
  appState.botHands = {
    top: isZoneActive("top") ? drawHand(5) : [],
    left: isZoneActive("left") ? drawHand(5) : [],
    right: isZoneActive("right") ? drawHand(5) : [],
  };
  appState.playDeckQueue = playDeck;
}

function drawSetupReplacementCard() {
  replenishPlayDeckQueue();
  return appState.playDeckQueue.shift() || null;
}

function drawSetupShipCard() {
  return appState.shipDeckQueue.shift() || null;
}

function fastForwardOpeningSpecialCards(zone = "bottom") {
  const openingLogs = [];
  const discardedOpeningCards = [];
  const hand = getHandForZone(zone);
  const playerName = getPlayerName(zone);

  while (hand.some((card) => IMMEDIATE_PLAY_KINDS.has(card.kind))) {
    const specialIndex = hand.findIndex((card) => IMMEDIATE_PLAY_KINDS.has(card.kind));
    if (specialIndex === -1) {
      break;
    }

    const specialCard = hand.splice(specialIndex, 1)[0];
    discardedOpeningCards.push({ image: specialCard.image, label: specialCard.label });

    if (specialCard.kind === "additional_ship") {
      const newShip = drawSetupShipCard();
      if (newShip) {
        appState.fleets[zone].push(newShip);
        normalizeFleetOrder(zone);
        openingLogs.push(`${specialCard.label} resolves before the round and ${newShip.ship} joins ${playerName}'s fleet.`);
      } else {
        openingLogs.push(`${specialCard.label} is discarded during opening setup, but the ship deck is empty.`);
      }
    } else if (specialCard.kind === "additional_damage") {
      openingLogs.push(`${specialCard.label} is discarded during opening setup because there are no salvos on the table yet.`);
    } else {
      openingLogs.push(`${specialCard.label} is fast-forwarded through the opening special-card step and replaced before normal play begins.`);
    }

    const replacementCard = drawSetupReplacementCard();
    if (!replacementCard) {
      break;
    }
    hand.push(replacementCard);
  }

  if (discardedOpeningCards.length) {
    appState.pendingOpeningDiscard = [
      ...(appState.pendingOpeningDiscard || []),
      ...discardedOpeningCards,
    ];
  }

  return openingLogs;
}

function initializePrototypeMatch({ preserveScores = true } = {}) {
  dealPrototypeFleets();
  dealPrototypeHands();
  const openingSpecialLogs = getActiveZones().flatMap((zone) => fastForwardOpeningSpecialCards(zone));
  if (!preserveScores) {
    appState.match.scoreRows = createFreshScoreRows();
    appState.match.currentRound = 1;
  }
  appState.match.pendingNextRound = false;
  appState.match.isCampaignOver = false;
  appState.effectsByFleet.top = [];
  appState.effectsByFleet.left = [];
  appState.effectsByFleet.right = [];
  appState.effectsByFleet.bottom = [];
  appState.victoryPiles.top = [];
  appState.victoryPiles.left = [];
  appState.victoryPiles.right = [];
  appState.victoryPiles.bottom = [];
  appState.match.isRoundOver = false;
  appState.match.winnerZone = null;
  appState.match.roundEndReason = null;
  appState.drawPiles = [
    {
      label: "Play Deck",
      count: appState.playDeckQueue.length,
      image: "../assets/cards/play/Modern/cardback-Play.png",
    },
    {
      label: "Discard Pile",
      count: 0,
      image: "../assets/cards/play/Modern/cardback-Play.png",
      topCardLabel: "Discard pile is empty",
    },
    {
      label: "Ship Deck",
      count: appState.shipDeckQueue.length,
      image: "../assets/cards/ships/Modern/Cardback-Ship.png",
    },
  ];
  if (appState.pendingOpeningDiscard?.length) {
    addToDiscardPile(appState.pendingOpeningDiscard);
    delete appState.pendingOpeningDiscard;
  }
  appState.turnState.turnNumber = 1;
  appState.turnState.currentZone = "bottom";
  appState.turnState.phase = "draw";
  appState.turnState.usedAirStrike = false;
  appState.turnState.airStrikeMode = false;
  appState.turnState.usedCarrierIndices = [];
  appState.turnState.playedCard = false;
  appState.turnState.forcedCardId = null;
  appState.combatLog = [
    `Round ${appState.match.currentRound} begins.`,
    "Both decks are shuffled before the round begins.",
    "Each admiral is dealt 5 ships and 5 play cards.",
    ...openingSpecialLogs,
    openingSpecialLogs.length
      ? "Opening special cards are resolved and replaced before the normal draw phase begins."
      : "No opening special cards need to be resolved before normal play begins.",
    `${getPlayerName("bottom")} opens the round.`,
  ];
  setTurnSummary("Round begins", `${getPlayerName("bottom")} opens the round.`, "Opening specials are resolved before normal play begins.");
}

initializePrototypeMatch();
setMatchMode(appState.match.mode);
if (campaignTargetInput) {
  campaignTargetInput.value = String(appState.match.campaignTarget);
}
if (playerCountSelect) {
  playerCountSelect.value = String(getConfiguredPlayerCount());
}
if (cardSetSelect) {
  cardSetSelect.value = getCurrentCardSetId();
}
syncLobbySeatPreview();

function updateBottomStatus() {
  const handCount = appState.hand.length;
  const availableCarriers = getAvailableCarrierIndices();
  const usedCarrierCount = appState.turnState.usedCarrierIndices.length;
  const currentZone = getCurrentZone();
  const currentPlayerName = getPlayerName(currentZone);
  const airStrikeTag = appState.turnState.airStrikeMode
    ? ` • Air Strike Phase${availableCarriers.length ? ` • ${availableCarriers.length - usedCarrierCount}/${availableCarriers.length} carriers ready` : ""}`
    : appState.turnState.usedAirStrike
      ? " • Air Strike Used"
      : "";
  const forcedCard = getForcedImmediateCard();
  const forcedTag = forcedCard ? ` • Must play ${forcedCard.label}` : "";
  if (bottomPlayerName) {
    bottomPlayerName.textContent = getPlayerName("bottom");
  }
  const phaseLabel =
    appState.match.isRoundOver
      ? "Round Complete"
      : appState.turnState.phase === "draw"
      ? "Draw Phase"
      : appState.turnState.phase === "play"
        ? "Play Phase"
        : "Turn Complete";
  bottomPlayerMeta.textContent = `${isHumanTurn() ? "Human" : "Waiting"} • ${phaseLabel} • ${handCount} cards in hand${isHumanTurn() ? `${airStrikeTag}${forcedTag}` : ""}`;
  bottomHandCount.textContent = `${handCount} cards ready`;
  turnPill.textContent = appState.match.isRoundOver
    ? `${getPlayerName(appState.match.winnerZone)} Wins`
    : `Turn ${appState.turnState.turnNumber} • ${currentPlayerName} • ${phaseLabel}`;
  if (roundPill) {
    roundPill.textContent = appState.match.mode === "campaign" ? `Round ${appState.match.currentRound}` : "Single Round";
  }
  formatPill.textContent =
    appState.match.mode === "campaign"
      ? `Campaign • ${getCurrentCardSetName()} • Round ${appState.match.currentRound} • Target ${appState.match.campaignTarget}`
      : `Skirmish • ${getCurrentCardSetName()}`;
  if (appState.serverSession?.connected) {
    formatPill.textContent += " • Server Linked";
  }
  if (scoringHint) {
    scoringHint.textContent =
      appState.match.mode === "campaign"
        ? `Campaign: score captured ship hit points each round, first to ${appState.match.campaignTarget}.`
        : "Skirmish: last fleet afloat wins, or most captured ships if the play deck is exhausted.";
  }
  useAirStrikeButton.hidden =
    appState.match.isRoundOver || !isHumanTurn() || appState.turnState.phase !== "draw" || forcedCard !== null || availableCarriers.length === 0;
  useAirStrikeButton.disabled = useAirStrikeButton.hidden;
  const serverLegal = Array.isArray(appState.serverSession?.legalCommands) ? appState.serverSession.legalCommands : [];
  const canEndTurnNow = appState.serverSession?.connected
    ? serverLegal.includes("end_turn")
    : appState.turnState.phase === "complete";
  const showManualEndTurn = shouldRequireManualEndTurn() && canEndTurnNow;
  if (endTurnButton) {
    endTurnButton.hidden = !showManualEndTurn;
    endTurnButton.disabled = !showManualEndTurn;
  }
  ["top", "left", "right"].forEach((zone) => {
    const metaNode = PLAYER_META_NODES[zone];
    const nameNode = PLAYER_NAME_NODES[zone];
    if (!metaNode || !nameNode) {
      return;
    }
    nameNode.textContent = getPlayerName(zone);
    if (!isZoneActive(zone)) {
      metaNode.textContent = "Empty seat";
      return;
    }
    metaNode.textContent = `${getZoneRoleLabel(zone)}${currentZone === zone ? " • Current Turn" : ""} • ${appState.fleets[zone].filter((ship) => !ship.sunk).length} ships afloat • ${getHandForZone(zone).length} cards hidden`;
    if (!hasAfloatShips(zone)) {
      metaNode.textContent = `${getZoneRoleLabel(zone)} • Eliminated • 0 ships afloat • ${getHandForZone(zone).length} cards hidden`;
    }
  });
  if (!hasAfloatShips("bottom")) {
    bottomPlayerMeta.textContent = `Human • Eliminated • ${handCount} cards in hand`;
  }
  getBotZones().forEach((zone) => {
    const handBadge = document.querySelector(`[data-player-zone="${zone}"] .hand-count`);
    if (handBadge) {
      handBadge.textContent = String(getHandForZone(zone).length);
    }
  });
  targetBoardSection.hidden = !appState.ui.showTargetBoard;
  targetBoardToggle.checked = appState.ui.showTargetBoard;
  if (dragModeToggle) {
    dragModeToggle.checked = appState.ui.interactionMode === "drag";
  }
}

function renderScoreTable() {
  if (!scoreTable) {
    return;
  }

  const rows = [...appState.match.scoreRows];
  const campaignRoundCount = Math.max(appState.match.currentRound, ...rows.map((row) => row.rounds.length), 1);
  const roundHeaders =
    appState.match.mode === "campaign"
      ? [...Array.from({ length: campaignRoundCount }, (_, index) => `Round ${index + 1}`), "Total"]
      : ["Victory Pile", "Ships Afloat", "Status"];
  const leaderTotal =
    appState.match.mode === "campaign"
      ? Math.max(...rows.map((row) => row.total))
      : Math.max(scoreVictoryPile("bottom"), scoreVictoryPile("top"), scoreVictoryPile("left"), scoreVictoryPile("right"));

  scoreTitle.textContent =
    appState.match.mode === "campaign" ? "Campaign Score Card" : "Skirmish Standing";
  scoreMeta.textContent =
    appState.match.mode === "campaign"
      ? `First admiral to ${appState.match.campaignTarget} points wins the campaign.`
      : "Victory pile points are visible, but total elimination still decides the skirmish winner.";

  const thead =
    appState.match.mode === "campaign"
      ? `<thead><tr><th>Player</th>${roundHeaders.map((header) => `<th>${header}</th>`).join("")}</tr></thead>`
      : `<thead><tr><th>Player</th>${roundHeaders.map((header) => `<th>${header}</th>`).join("")}</tr></thead>`;

  const body = rows
    .map((row) => {
      if (appState.match.mode === "campaign") {
        const roundCells = Array.from({ length: campaignRoundCount }, (_, index) => `<td>${row.rounds[index] ?? "—"}</td>`).join("");
        return `<tr class="${row.total === leaderTotal && leaderTotal > 0 ? "score-row-leader" : ""}"><td>${row.player}</td>${roundCells}<td>${row.total}</td></tr>`;
      }

      const zone = row.playerZone || "right";
      const afloat = appState.fleets[zone].filter((ship) => !ship.sunk).length;
      const points = scoreVictoryPile(zone);
      return `<tr class="${points === leaderTotal && leaderTotal > 0 ? "score-row-leader" : ""}"><td>${row.player}</td><td>${points}</td><td>${afloat}</td><td>${afloat === 0 ? "Eliminated" : "Engaged"}</td></tr>`;
    })
    .join("");

  scoreTable.innerHTML = `${thead}<tbody>${body}</tbody>`;
}

function openScoreCard() {
  scoreOverlay.hidden = false;
}

function closeScoreCard() {
  scoreOverlay.hidden = true;
}

function openDeckBrowser() {
  renderDeckBrowser();
  deckOverlay.hidden = false;
}

function closeDeckBrowser() {
  deckOverlay.hidden = true;
}

function renderDeckBrowser() {
  if (!deckPlayGrid || !deckShipGrid) {
    return;
  }
  const cardsByLabel = new Map(PLAY_CARD_DRAW_LIBRARY.map((card) => [card.label, card]));
  if (deckMeta) {
    deckMeta.textContent = `${CLASSIC_PLAY_DECK_TOTAL} play cards • ${CLASSIC_SHIP_DECK_TOTAL} ships`;
  }
  if (deckPlayTitle) {
    deckPlayTitle.textContent = `${getCurrentCardSetName()} Play Deck`;
  }
  if (deckPlayTotal) {
    deckPlayTotal.textContent = `${CLASSIC_PLAY_DECK_TOTAL} cards`;
  }
  if (deckShipTitle) {
    deckShipTitle.textContent = `${getCurrentCardSetName()} Ship Deck`;
  }
  if (deckShipTotal) {
    deckShipTotal.textContent = `${CLASSIC_SHIP_DECK_TOTAL} ships`;
  }

  deckPlayGrid.innerHTML = "";
  PLAY_DECK_DISTRIBUTION.forEach(({ label, count }) => {
    const card = cardsByLabel.get(label);
    if (!card) {
      return;
    }
    const detailParts = [];
    if (card.kind === "salvo") {
      detailParts.push(`${card.gunSize} guns`);
      detailParts.push(`${card.hits} hit${card.hits === 1 ? "" : "s"}`);
    } else if (card.kind === "additional_damage" || card.kind === "minefield" || card.kind === "destroyer_squadron") {
      detailParts.push(`${card.hits} hit${card.hits === 1 ? "" : "s"}`);
    } else {
      detailParts.push(card.kind.replaceAll("_", " "));
    }
    deckPlayGrid.appendChild(
      createDeckReferenceCard({
        image: card.image,
        label,
        count: `x${count}`,
        detail: detailParts.join(" • "),
      })
    );
  });

  deckShipGrid.innerHTML = "";
  SHIP_DEAL_LIBRARY.forEach((ship) => {
    const detail = ship.isCarrier
      ? `Aircraft carrier • ${ship.hitPoints} HP`
      : `${ship.gunSize} guns • ${ship.hitPoints} HP`;
    deckShipGrid.appendChild(
      createDeckReferenceCard({
        image: ship.image,
        label: ship.ship,
        count: "x1",
        detail,
        cssClass: "deck-reference-card-ship",
      })
    );
  });
}

function showDiceBanner(state) {
  if (!diceBanner) {
    return;
  }
  window.clearTimeout(diceBannerTimer);
  window.clearInterval(diceRollAnimationTimer);
  diceRollAnimationTimer = null;

  diceTitle.textContent = state.title;
  diceSubtitle.textContent = state.subtitle;
  diceOutcome.textContent = state.outcome;
  diceBanner.hidden = false;
  diceBanner.classList.remove("is-visible", "is-rolling");

  if (typeof state.face === "number") {
    diceBanner.classList.add("is-rolling");
    let ticks = 0;
    dieFace.textContent = String(Math.floor(Math.random() * 6) + 1);
    diceRollAnimationTimer = window.setInterval(() => {
      ticks += 1;
      dieFace.textContent = String(Math.floor(Math.random() * 6) + 1);
      if (ticks >= 16) {
        window.clearInterval(diceRollAnimationTimer);
        diceRollAnimationTimer = null;
        dieFace.textContent = String(state.face);
        diceBanner.classList.remove("is-rolling");
        diceBanner.classList.add("is-visible");
      }
    }, 105);
  } else {
    dieFace.textContent = String(state.face);
    diceBanner.classList.add("is-visible");
  }

  diceBannerTimer = window.setTimeout(() => {
    diceBanner.classList.remove("is-visible", "is-rolling");
    diceBanner.hidden = true;
  }, typeof state.face === "number" ? 6200 : 3200);
}

function setDiceResolution(face, title, subtitle, outcome) {
  appState.diceState = { face, title, subtitle, outcome };
  setTurnSummary(title, subtitle, outcome);
  if (typeof face === "number") {
    appendLog(`Dice result: ${title} rolled ${face}. ${outcome}`);
    pendingDiceAdvanceDelay = Math.max(pendingDiceAdvanceDelay, 4200);
    showDiceBanner(appState.diceState);
  }
}

function rollD6() {
  playDiceSound();
  return Math.floor(Math.random() * 6) + 1;
}

function getRectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function updateTargetingLine() {
  if (
    !dragState ||
    !(
      dragState.type === "hand_card" ||
      (dragState.type === "fleet_ship" && dragState.isCarrier) ||
      (dragState.type === "battle_effect" && dragState.effectKind === "destroyer_squadron")
    )
  ) {
    targetingLine.classList.remove("is-visible");
    return;
  }

  const sourceCard =
    dragState.type === "hand_card"
      ? document.querySelector(`[data-card-id="${dragState.cardId}"]`)
      : dragState.type === "battle_effect"
        ? document.querySelector(`[data-effect-id="${dragState.effectId}"]`)
      : document.querySelector(
          `[data-zone="bottom"][data-ship-index="${dragState.fromIndex}"]`
        );
  if (!sourceCard) {
    targetingLine.classList.remove("is-visible");
    return;
  }

  const sourceCenter = getRectCenter(sourceCard.getBoundingClientRect());
  const targetCenter = dragTargetElement
    ? getRectCenter(dragTargetElement.getBoundingClientRect())
    : dragPointer;

  if (!targetCenter) {
    targetingLine.classList.remove("is-visible");
    return;
  }

  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;
  const distance = Math.hypot(deltaX, deltaY);
  const arcHeight = Math.max(40, Math.min(180, distance * 0.22));
  const controlX = sourceCenter.x + deltaX / 2;
  const controlY = Math.min(sourceCenter.y, targetCenter.y) - arcHeight;
  targetingLine.setAttribute("width", String(window.innerWidth));
  targetingLine.setAttribute("height", String(window.innerHeight));
  targetingLine.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
  targetingPath.setAttribute(
    "d",
    `M ${sourceCenter.x} ${sourceCenter.y} Q ${controlX} ${controlY} ${targetCenter.x} ${targetCenter.y}`
  );
  targetingLine.classList.add("is-visible");
}

function clearTargetingLine() {
  dragPointer = null;
  dragTargetElement = null;
  targetingLine.classList.remove("is-visible");
}

function removeDragPreviewGhost() {
  if (dragPreviewGhost) {
    dragPreviewGhost.remove();
    dragPreviewGhost = null;
  }
  document.body.classList.remove("is-dragging-hand-card");
}

function setCompactDragPreview(event, sourceCard, card = null) {
  removeDragPreviewGhost();
  dragPreviewGhost = document.createElement("article");
  dragPreviewGhost.className = "drag-preview-ghost";
  if (card?.kind === "carrier_airstrike") {
    dragPreviewGhost.classList.add("drag-preview-ghost-airstrike");
  }
  const image = document.createElement("img");
  image.src = card?.image || sourceCard.querySelector("img")?.src || "";
  image.alt = card?.label || sourceCard.dataset.zoomLabel || "Drag preview";
  dragPreviewGhost.appendChild(image);
  document.body.appendChild(dragPreviewGhost);
  const rect = sourceCard.getBoundingClientRect();
  const width = card?.kind === "carrier_airstrike" ? rect.width * 0.2 : rect.width * 0.25;
  const height = card?.kind === "carrier_airstrike" ? rect.height * 0.2 : rect.height * 0.25;
  event.dataTransfer.setDragImage(dragPreviewGhost, width, height);
  document.body.classList.add("is-dragging-hand-card");
}

function clearValidTargetHighlights() {
  document.querySelectorAll(".is-valid-target").forEach((node) => {
    node.classList.remove("is-valid-target");
  });
}

function clearTouchSelection() {
  appState.ui.touchSelectedCardId = null;
  clearValidTargetHighlights();
}

function highlightTouchTargetsForCard(card) {
  clearValidTargetHighlights();
  if (!card) {
    return;
  }
  if (card.kind === "carrier_airstrike") {
    appState.turnState.airStrikeMode = true;
  }
  const forcedCard = getForcedImmediateCard();
  if (forcedCard && forcedCard.id !== card.id) {
    return;
  }
  if (appState.turnState.airStrikeMode && card.kind !== "carrier_airstrike") {
    return;
  }
  if (card.kind === "destroyer_activation") {
    appState.turnState.airStrikeMode = false;
  }
  const candidates = [...document.querySelectorAll("[data-drop-type], [data-zone='bottom'][data-ship-index]")];
  candidates.forEach((node) => {
    if (canHandCardDropOnTarget(card, node)) {
      node.classList.add("is-valid-target");
    }
  });
}

function refreshSelectedTargetHighlights() {
  if (!isSelectInteractionEnabled() || !appState.ui.touchSelectedCardId) {
    return;
  }
  highlightTouchTargetsForCard(getDisplayedHandCardById(appState.ui.touchSelectedCardId));
}

function resolveHandCardDrop(card, dropTarget) {
  if (!card || !dropTarget || !canHandCardDropOnTarget(card, dropTarget)) {
    return false;
  }

  if (card.kind === "carrier_airstrike" && dropTarget.dataset.dropType === "enemy_ship") {
    resolveCarrierAirStrike(card.fromIndex, dropTarget.dataset.zone, Number(dropTarget.dataset.shipIndex));
    return true;
  }
  if (card.kind === "carrier_airstrike" && isDestroyerTarget(dropTarget)) {
    resolveCarrierAirStrikeOnDestroyer(card.fromIndex, dropTarget.dataset.zone, dropTarget.dataset.effectId);
    return true;
  }
  if (card.kind === "destroyer_activation" && dropTarget.dataset.dropType === "fleet_target") {
    resolveDestroyerSquadronStrike(card.effectId, dropTarget.dataset.zone);
    return true;
  }
  if (card.dropMode === "enemy_ship" && dropTarget.dataset.dropType === "enemy_ship") {
    attachCardToEnemyShip(card, dropTarget.dataset.zone, Number(dropTarget.dataset.shipIndex), dropTarget.dataset.shipId || null);
    return true;
  }
  if (card.dropMode === "enemy_ship" && isDestroyerTarget(dropTarget)) {
    resolveDestroyerTargetDamage(card, dropTarget.dataset.zone, dropTarget.dataset.effectId);
    return true;
  }
  if (card.dropMode === "battle_zone" && dropTarget.dataset.dropType === "battle_zone") {
    deployCenterCard(card);
    return true;
  }
  if (card.dropMode === "fleet_target" && dropTarget.dataset.zone) {
    playFleetTargetCard(card, dropTarget.dataset.zone);
    return true;
  }
  if (card.dropMode === "own_ship" && dropTarget.dataset.dropType === "own_ship") {
    playOwnShipCard(card, Number(dropTarget.dataset.shipIndex), dropTarget.dataset.shipId || null);
    return true;
  }
  if (dropTarget.dataset.dropType === "discard_action") {
    discardHandCardAsAction(card);
    return true;
  }

  return false;
}

function highlightValidTargets() {
  clearValidTargetHighlights();
  if (!dragState) {
    return;
  }

  if (dragState.type === "hand_card") {
    const card = getDisplayedHandCardById(dragState.cardId);
    if (!card) {
      return;
    }
    const forcedCard = getForcedImmediateCard();
    if (forcedCard && forcedCard.id !== card.id) {
      return;
    }

    if (appState.turnState.airStrikeMode && card.kind !== "carrier_airstrike") {
      return;
    }

    if (card.dropMode === "enemy_ship") {
      const validTargets = [...document.querySelectorAll("[data-drop-type='enemy_ship'], [data-drop-type='destroyer_target']")];
      validTargets.forEach((node) => {
        const zone = node.dataset.zone;
        const targetIndex = Number(node.dataset.shipIndex);
        if (
          isDestroyerTarget(node) &&
          ((card.kind === "salvo" && hasMatchingGunForSalvo(card)) || card.kind === "submarine" || card.kind === "torpedo_boat")
        ) {
          node.classList.add("is-valid-target");
        } else if (
            zone &&
            canTargetFleetWithAction(card.kind, zone) &&
            (card.kind !== "salvo" || !isCarrierScreened(zone, targetIndex)) &&
            (card.kind !== "additional_damage" || zone !== "bottom") &&
            (card.kind !== "additional_damage" || canAdditionalDamageTargetShip(zone, targetIndex))
          ) {
          node.classList.add("is-valid-target");
        }
      });
    } else if (card.dropMode === "fleet_target") {
      const validTargets = [...document.querySelectorAll("[data-drop-type='fleet_target']")];
      validTargets.forEach((node) => {
        const zone = node.dataset.zone;
        if (card.kind === "minefield" && zone === "bottom") {
          return;
        }
        if (card.kind === "destroyer_activation" && (zone === "bottom" || !canTargetFleetWithAction("destroyer_squadron", zone))) {
          return;
        }
        node.classList.add("is-valid-target");
      });
    } else if (card.dropMode === "own_ship") {
      const validTargets = [...document.querySelectorAll("[data-drop-type='own_ship']")];
      validTargets.forEach((node) => {
        node.classList.add("is-valid-target");
      });
    }

    if (canDiscardCardAsAction(card)) {
      const discardTargets = [...document.querySelectorAll("[data-drop-type='discard_action']")];
      discardTargets.forEach((node) => {
        node.classList.add("is-valid-target");
      });
    }
  }

  if (dragState.type === "battle_effect" && dragState.effectKind === "destroyer_squadron") {
    if (getForcedImmediateCard() || appState.turnState.airStrikeMode) {
      return;
    }
    const validTargets = [...document.querySelectorAll("[data-drop-type='enemy_ship']")];
    validTargets.forEach((node) => {
      const zone = node.dataset.zone;
      if (zone && canTargetFleetWithAction("destroyer_squadron", zone)) {
        node.classList.add("is-valid-target");
      }
    });
  }

  if (dragState.type === "fleet_ship" && dragState.isCarrier) {
    if (getForcedImmediateCard() || !appState.turnState.airStrikeMode || !hasUnusedCarrier(dragState.fromIndex)) {
      return;
    }
    const validTargets = [...document.querySelectorAll("[data-drop-type='enemy_ship'], [data-drop-type='destroyer_target']")];
    validTargets.forEach((node) => {
      const zone = node.dataset.zone;
      if (
        (!appState.serverSession?.connected && isDestroyerTarget(node)) ||
        (zone && canTargetFleetWithAction("carrier_airstrike", zone))
      ) {
        node.classList.add("is-valid-target");
      }
    });
  }
}

function triggerShipImpact(zone, index, sunk = false) {
  window.requestAnimationFrame(() => {
    const targets = [
      ...document.querySelectorAll(`[data-zone="${zone}"][data-ship-index="${index}"]`),
    ];
    const settleDelay = sunk ? 780 : 240;
    if (!targets.length) {
      if (sunk) {
        finalizeSunkShipVisual(zone, index);
      }
      return;
    }

    const impactClass = sunk ? "is-sinking-impact" : "is-impacting";
    targets.forEach((target) => target.classList.add(impactClass));
    window.setTimeout(() => {
      targets.forEach((target) => target.classList.remove(impactClass));
      if (sunk) {
        finalizeSunkShipVisual(zone, index);
      }
    }, settleDelay);
  });
}

function queueShipImpact(zone, index, sunk = false) {
  appState.pendingImpacts = appState.pendingImpacts || [];
  appState.pendingImpacts.push({ zone, index, sunk });
}

function flushPendingImpacts() {
  const pending = [...(appState.pendingImpacts || [])];
  appState.pendingImpacts = [];
  pending.forEach((impact) => {
    triggerShipImpact(impact.zone, impact.index, impact.sunk);
  });
}

function finalizeSunkShipVisual(zone, index) {
  const ship = appState.fleets[zone]?.[index];
  if (!ship?.sunk || !ship.isSinking) {
    return;
  }

  ship.isSinking = false;
  ship.image = SHIP_CARD_BACK;
  renderPrototype();
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function animateDrawToTray(imageSrc) {
  const deckCard = document.querySelector(".deck-pile-card[data-draw-deck='play']");
  const handTray = document.getElementById("player-hand");
  if (!deckCard || !handTray) {
    return;
  }

  const deckRect = deckCard.getBoundingClientRect();
  const trayRect = handTray.getBoundingClientRect();
  const clone = document.createElement("div");
  clone.className = "draw-animation-card";
  clone.style.left = `${deckRect.left}px`;
  clone.style.top = `${deckRect.top}px`;
  clone.style.width = `${deckRect.width}px`;
  clone.style.height = `${deckRect.height}px`;
  clone.innerHTML = `<img src="${imageSrc}" alt="Drawn card" />`;
  document.body.appendChild(clone);
  document.body.classList.add("is-animating");

  await new Promise((resolve) => requestAnimationFrame(resolve));

  const targetWidth = Math.min(320, trayRect.height * 1.5);
  const targetHeight = targetWidth / (320 / 213);
  clone.style.left = `${trayRect.left + 12}px`;
  clone.style.top = `${trayRect.top + 6}px`;
  clone.style.width = `${targetWidth}px`;
  clone.style.height = `${targetHeight}px`;
  clone.style.transform = "rotate(-4deg)";
  clone.style.opacity = "0.94";

  await wait(360);
  clone.style.opacity = "0";
  await wait(120);
  clone.remove();
  document.body.classList.remove("is-animating");
}

function showStatusBanner(labelText, title, subtitle = "", duration = 1400) {
  window.clearTimeout(specialBannerTimer);
  const label = document.createElement("p");
  label.className = "special-card-banner-label";
  label.textContent = labelText;
  const heading = document.createElement("h2");
  heading.textContent = title;
  const copy = document.createElement("span");
  copy.textContent = subtitle;
  specialBanner.replaceChildren(label, heading, copy);
  specialBanner.classList.remove("is-visible");
  void specialBanner.offsetWidth;
  specialBanner.classList.add("is-visible");
  specialBannerTimer = window.setTimeout(() => {
    specialBanner.classList.remove("is-visible");
  }, duration);
}

function showSpecialBanner(title, subtitle = "Special card resolved") {
  showStatusBanner("Special Card", title, subtitle, 1400);
}

function showTurnBanner(playerName, phaseLabel = "turn") {
  showStatusBanner("Next Turn", `${playerName}'s Turn`, `Ready for ${phaseLabel}.`, 1800);
}

function showWinnerBanner(title, subtitle, actions = []) {
  window.clearTimeout(specialBannerTimer);
  const label = document.createElement("p");
  label.className = "special-card-banner-label";
  label.textContent = "Round Complete";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const copy = document.createElement("span");
  copy.textContent = subtitle;
  const actionBar = document.createElement("div");
  actionBar.className = "special-card-banner-actions";
  const defaultCloseAction = {
    label: "Close",
    dataset: { dismissWinnerBanner: "true" },
  };
  [...actions, defaultCloseAction].forEach((action) => {
    const button = document.createElement("button");
    button.className = "special-card-banner-close";
    button.type = "button";
    Object.entries(action.dataset || {}).forEach(([key, value]) => {
      button.dataset[key] = value;
    });
    button.textContent = action.label;
    actionBar.appendChild(button);
  });
  specialBanner.replaceChildren(label, heading, copy, actionBar);
  specialBanner.classList.remove("is-visible", "is-winner");
  void specialBanner.offsetWidth;
  specialBanner.classList.add("is-visible", "is-winner");
}

function closeWinnerBanner() {
  window.clearTimeout(specialBannerTimer);
  specialBanner.classList.remove("is-visible", "is-winner");
}

function highlightDrawnCard(cardId) {
  window.clearTimeout(drawHighlightTimer);
  appState.ui.highlightedDrawCardId = cardId;
  drawHighlightTimer = window.setTimeout(() => {
    if (appState.ui.highlightedDrawCardId === cardId) {
      appState.ui.highlightedDrawCardId = null;
      renderPrototype();
    }
  }, 1800);
}

async function unlockGameAudio() {
  if (!audioEnabled) {
    setAudioStatus("off");
    return;
  }
  if (audioUnlocked) {
    return;
  }
  setAudioStatus("needs tap");
}

function playGameAudio(audio) {
  if (!audioEnabled) {
    setAudioStatus("off");
    return;
  }
  playAudioElement(audio, audio?.src?.split("/").pop() || "sound");
}

function playSalvoSoundFromDetail(detail) {
  const match = String(detail || "").match(/attached\s+([0-9.]+)"/i);
  const gunSize = match ? `${match[1]}"` : "";
  playGameAudio(gunSize === '11"' || gunSize === '12.6"' ? smallSalvoAudio : bigSalvoAudio);
}

function getRollFromEventDetail(detail) {
  const match = String(detail || "").match(/\brolled\s+([1-6])\b/i);
  return match ? Number(match[1]) : null;
}

function showDiceResolutionForServerEvent(event) {
  const roll = getRollFromEventDetail(event?.detail);
  if (typeof roll !== "number") {
    return;
  }

  let title = "Dice roll";
  let outcome = "Roll resolved.";
  switch (event.type) {
    case "submarine_roll":
      title = "Submarine attack roll";
      outcome = roll >= 5 ? "Hit confirmed on a 5 or 6." : "Attack missed.";
      break;
    case "torpedo_boat_roll":
      title = "Torpedo boat attack roll";
      outcome = roll === 6 ? "Hit confirmed on a 6." : "Attack missed.";
      break;
    case "carrier_roll":
      title = "Air strike roll";
      outcome = roll === 1 ? "Hit confirmed on a 1." : "Air strike missed.";
      break;
    case "destroyer_squadron_roll":
      title = "Destroyer attack roll";
      outcome = `${roll} ship${roll === 1 ? "" : "s"} selected for sinking.`;
      break;
  }

  appState.diceState = {
    face: roll,
    title,
    subtitle: event.detail || "Die rolled.",
    outcome,
  };
  setTurnSummary(title, event.detail || "Die rolled.", outcome);
  pendingDiceAdvanceDelay = Math.max(pendingDiceAdvanceDelay, 4200);
  showDiceBanner(appState.diceState);
}

function setAudioStatus(status, { ok = false, error = false, event = null } = {}) {
  audioDiagnostics.status = status;
  audioDiagnostics.lastEvent = event || audioDiagnostics.lastEvent;
  audioDiagnostics.lastError = error ? String(error) : null;
  if (audioStatusPill) {
    audioStatusPill.textContent = `Audio: ${status}`;
    audioStatusPill.classList.toggle("is-ok", Boolean(ok));
    audioStatusPill.classList.toggle("is-error", Boolean(error));
    audioStatusPill.title = error ? String(error) : "";
  }
  renderLobbyDebugPanel();
}

function getAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }
  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
}

function getAudioMasterGain() {
  const context = getAudioContext();
  if (!context) {
    return null;
  }
  if (!audioMasterGain) {
    audioMasterGain = context.createGain();
    audioMasterGain.gain.value = 1.65;
    audioMasterGain.connect(context.destination);
  }
  return audioMasterGain;
}

async function loadAudioBuffer(path) {
  const context = getAudioContext();
  if (!context) {
    throw new Error("Web Audio API is not available.");
  }
  if (audioBufferCache.has(path)) {
    return audioBufferCache.get(path);
  }
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Audio fetch failed ${response.status}: ${path}`);
  }
  const data = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(data.slice(0));
  audioBufferCache.set(path, buffer);
  return buffer;
}

async function playWebAudio(path, eventName = "sound") {
  const context = getAudioContext();
  if (!context) {
    throw new Error("Web Audio API is not available.");
  }
  if (context.state !== "running") {
    await context.resume();
  }
  const buffer = await loadAudioBuffer(path);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(getAudioMasterGain() || context.destination);
  source.start(0);
  audioUnlocked = true;
  audioDiagnostics.outputMode = "web";
  audioDiagnostics.preferWebAudio = true;
  setAudioStatus("playing web", { ok: true, event: eventName });
  return true;
}

async function playWebAudioTone(eventName = "tone-test") {
  const context = getAudioContext();
  if (!context) {
    throw new Error("Web Audio API is not available.");
  }
  if (context.state !== "running") {
    await context.resume();
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.34, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  oscillator.connect(gain);
  gain.connect(getAudioMasterGain() || context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.74);
  audioUnlocked = true;
  audioDiagnostics.outputMode = "web-tone";
  audioDiagnostics.preferWebAudio = true;
  setAudioStatus("tone playing", { ok: true, event: eventName });
  await new Promise((resolve) => {
    window.setTimeout(resolve, 760);
  });
  return true;
}

async function playAudioElement(audio, eventName = "sound") {
  if (!audioEnabled) {
    setAudioStatus("off", { event: eventName });
    return false;
  }
  const path = AUDIO_PATH_BY_ELEMENT.get(audio);
  if (path && audioDiagnostics.preferWebAudio) {
    try {
      return await playWebAudio(path, `${eventName}:web-preferred`);
    } catch (webAudioError) {
      const webAudioMessage = webAudioError instanceof Error ? `${webAudioError.name}: ${webAudioError.message}` : String(webAudioError);
      setAudioStatus("web blocked", { error: webAudioMessage, event: eventName });
    }
  }
  try {
    audio.pause();
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback?.then) {
      await playback;
    }
    audioUnlocked = true;
    audioDiagnostics.outputMode = "html";
    setAudioStatus("playing html", { ok: true, event: eventName });
    return true;
  } catch (error) {
    const htmlAudioError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (path) {
      try {
        return await playWebAudio(path, `${eventName}:web-audio`);
      } catch (webAudioError) {
        const webAudioMessage = webAudioError instanceof Error ? `${webAudioError.name}: ${webAudioError.message}` : String(webAudioError);
        audioUnlocked = false;
        setAudioStatus("blocked", { error: `HTMLAudio ${htmlAudioError}; WebAudio ${webAudioMessage}`, event: eventName });
        return false;
      }
    }
    audioUnlocked = false;
    setAudioStatus("blocked", { error: htmlAudioError, event: eventName });
    return false;
  }
}

function playSoundForServerEvent(event) {
  switch (event?.type) {
    case "salvo_fired":
    case "destroyer_squadron_hit":
      playSalvoSoundFromDetail(event.detail);
      break;
    case "ship_sunk":
    case "destroyer_squadron_sunk":
      playShipSinkSound();
      break;
    case "submarine_roll":
      playSubmarineSound();
      playDiceSound();
      break;
    case "torpedo_boat_roll":
      playTorpedoBoatSound();
      playDiceSound();
      break;
    case "carrier_roll":
      playAirStrikeSound();
      playDiceSound();
      break;
    case "destroyer_squadron_roll":
      playDiceSound();
      break;
    case "minefield_deployed":
      playMinesSound();
      break;
    case "minefield_cleared":
      playMinesweeperSound();
      break;
    case "smoke_deployed":
      playSmokeSound();
      break;
    case "destroyer_squadron_deployed":
      playDestroyersSound();
      break;
    case "additional_damage_played":
      playAdditionalDamageSound();
      break;
    case "ship_repaired":
      playRepairSound();
      break;
    case "card_drawn":
    case "additional_ship_drawn":
    case "ship_added":
      playDrawCardSound();
      break;
    case "campaign_won":
      playWinnerSound();
      break;
  }
}

function playSoundsForServerEvents(events) {
  if (!appState.serverSession?.connected || !Array.isArray(events)) {
    return;
  }
  const lobbyId = appState.serverSession.lobbyId || "local";
  if (appState.serverSession.eventSoundLobbyId !== lobbyId) {
    appState.serverSession.eventSoundLobbyId = lobbyId;
    appState.serverSession.eventSoundCount = events.length;
    return;
  }
  const previousCount = Math.min(appState.serverSession.eventSoundCount || 0, events.length);
  events.slice(previousCount).forEach((event) => {
    playSoundForServerEvent(event);
    showDiceResolutionForServerEvent(event);
  });
  appState.serverSession.eventSoundCount = events.length;
}

["pointerdown", "touchend", "click", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, unlockGameAudio, { once: true, passive: true });
});

function playSalvoHitSound(card) {
  const gunSize = normalizeGunSize(card?.gunSize || "");
  const audio = gunSize === '11"' || gunSize === '12.6"' ? smallSalvoAudio : bigSalvoAudio;
  playGameAudio(audio);
}

function playShipSinkSound() {
  playGameAudio(shipSinkAudio);
}

function playSubmarineSound() {
  playGameAudio(submarineAudio);
}

function playAirStrikeSound() {
  playGameAudio(airStrikeAudio);
}

function playDrawCardSound() {
  playGameAudio(drawCardAudio);
}

function playSmokeSound() {
  playGameAudio(smokeAudio);
}

function playDestroyersSound() {
  playGameAudio(destroyersAudio);
}

function playAdditionalDamageSound() {
  playGameAudio(additionalDamageAudio);
}

function playRepairSound() {
  playGameAudio(repairAudio);
}

function playTorpedoBoatSound() {
  playGameAudio(torpedoBoatAudio);
}

function playInvalidCardSound() {
  playGameAudio(invalidCardAudio);
}

function playMinesweeperSound() {
  playGameAudio(minesweeperAudio);
}

function playMinesSound() {
  playGameAudio(minesAudio);
}

function playDiceSound() {
  playGameAudio(diceAudio);
}

function playWinnerSound() {
  playGameAudio(winnerAudio);
}

function hasFleetSmoke(zone) {
  return (appState.effectsByFleet[zone] || []).some((effect) => {
    const label = (effect.label || "").toLowerCase();
    const kind = (effect.kind || "").toLowerCase();
    return label.includes("smoke") || kind === "smoke";
  });
}

function canTargetFleetWithAction(actionType, targetZone) {
  if (!hasFleetSmoke(targetZone)) {
    return true;
  }

  return actionType === "submarine" || actionType === "additional_damage";
}

function getDestroyerEffect(zone, effectId) {
  return (appState.effectsByFleet[zone] || []).find(
    (effect) => effect.id === effectId && effect.kind === "destroyer_squadron"
  );
}

function getDestroyerTargets(ownerZone) {
  return getActiveZones()
    .filter((zone) => zone !== ownerZone)
    .flatMap((zone) =>
      (appState.effectsByFleet[zone] || [])
        .filter((effect) => effect.kind === "destroyer_squadron")
        .map((effect) => ({ type: "destroyer", zone, effectId: effect.id, effect }))
    );
}

function isDestroyerTarget(dropTarget) {
  return dropTarget.dataset.dropType === "destroyer_target";
}

function normalizeGunSize(gunSize) {
  return String(gunSize || "")
    .replace(/\s+/g, "")
    .replace(/”/g, '"')
    .replace(/″/g, '"');
}

function getPlayDeckPile() {
  return appState.drawPiles.find((pile) => pile.label === "Play Deck");
}

function getShipDeckPile() {
  return appState.drawPiles.find((pile) => pile.label === "Ship Deck");
}

function scoreVictoryPile(zone) {
  return (appState.victoryPiles[zone] || []).reduce(
    (sum, ship) => sum + (SHIP_HIT_POINTS_BY_NAME[ship.ship] || 0),
    0
  );
}

function countVictoryShips(zone) {
  return (appState.victoryPiles[zone] || []).length;
}

function getRoundWinnerByVictoryPile() {
  return getActiveZones()
    .map((zone) => ({
      zone,
      capturedShips: countVictoryShips(zone),
      capturedPoints: scoreVictoryPile(zone),
      afloatShips: appState.fleets[zone].filter((ship) => !ship.sunk).length,
    }))
    .sort((a, b) =>
      b.capturedShips - a.capturedShips ||
      b.capturedPoints - a.capturedPoints ||
      b.afloatShips - a.afloatShips
    )[0];
}

function scoreCampaignRound() {
  appState.match.scoreRows.forEach((row) => {
    const zone = row.playerZone;
    const roundScore = scoreVictoryPile(zone);
    row.rounds[appState.match.currentRound - 1] = roundScore;
    row.total = row.rounds.reduce((sum, value) => sum + Number(value || 0), 0);
  });
}

function getCampaignLeader() {
  return [...appState.match.scoreRows]
    .sort((a, b) => b.total - a.total)[0];
}

function startNextCampaignRound() {
  if (!appState.match.pendingNextRound || appState.match.isCampaignOver) {
    return;
  }
  hasLaunchedMatch = true;
  appState.match.currentRound += 1;
  closeWinnerBanner();
  initializePrototypeMatch({ preserveScores: true });
  renderPrototype();
}

function prepareLocalPrototypeMatchFromSetup() {
  const selectedMode = appState.match.mode || "skirmish";
  const configuredTarget = Math.max(25, Number(campaignTargetInput?.value || appState.match.campaignTarget || 100));
  const playerCount = Math.min(4, Math.max(2, Number(playerCountSelect?.value || 4)));
  closeWinnerBanner();
  hasLaunchedMatch = true;
  appState.tableConfig.playerCount = playerCount;
  appState.match.mode = selectedMode;
  appState.match.campaignTarget = configuredTarget;
  appState.match.currentRound = 1;
  appState.match.scoreRows = createFreshScoreRows();
  initializePrototypeMatch({ preserveScores: true });
  return { selectedMode, configuredTarget, playerCount };
}

async function hostLobbyFromUi() {
  if (appState.setupMode !== "multiplayer") {
    appendLog("Switch to Multiplayer mode to host a lobby.");
    renderPrototype();
    return;
  }
  const { selectedMode, configuredTarget, playerCount } = prepareLocalPrototypeMatchFromSetup();
  try {
    const linked = await hostLobbyFromSetup({
      playerCount,
      matchMode: selectedMode,
      campaignTarget: configuredTarget,
    });
    if (linked) {
      await refreshLobbyInfo();
      appendLog(`Lobby hosted. Share join code ${appState.serverSession.joinCode}.`);
      setTurnSummary(
        "Lobby Hosted",
        "Waiting for players to join.",
        "Click Start Match when ready. Remaining seats will be filled with bots."
      );
    } else {
      appendLog("Running in local-only mode (server API unavailable).");
    }
  } catch (error) {
    appState.serverSession.connected = false;
    appState.serverSession.status = "local_only";
    appState.serverSession.lastError = error instanceof Error ? error.message : "Unknown host lobby error.";
    appendLog(`Host lobby failed. ${appState.serverSession.lastError}`);
  }
  renderPrototype();
}

async function joinLobbyFromUi() {
  if (appState.setupMode !== "multiplayer") {
    appendLog("Switch to Multiplayer mode to join a lobby.");
    renderPrototype();
    return;
  }
  const { playerCount } = prepareLocalPrototypeMatchFromSetup();
  const code = String(joinCodeInput?.value || "").trim();
  if (!code) {
    appendLog("Enter a join code first.");
    renderPrototype();
    return;
  }
  try {
    const linked = await joinLobbyFromCode(code, { playerCount });
    if (linked) {
      await refreshLobbyInfo();
      appendLog(`Joined lobby ${appState.serverSession.joinCode}. Waiting for host to start.`);
      setTurnSummary(
        "Lobby Joined",
        "You are connected to the host lobby.",
        "Wait for the host to click Start Match."
      );
    } else {
      appendLog("Join failed. Server API unavailable.");
    }
  } catch (error) {
    appState.serverSession.lastError = error instanceof Error ? error.message : "Unknown join lobby error.";
    appendLog(`Join failed. ${appState.serverSession.lastError}`);
  }
  renderPrototype();
}

async function toggleReadyFromUi() {
  if (appState.setupMode !== "multiplayer") {
    return;
  }
  if (!appState.serverSession?.lobbyId || !appState.serverSession?.sessionToken) {
    appendLog("Join or host a lobby first.");
    renderPrototype();
    return;
  }
  try {
    ensureRealtimeConnection();
    if (isRealtimeSocketConnected()) {
      const lobbyInfo = appState.serverSession.lobbyInfo || {};
      const me = (lobbyInfo?.players || []).find((player) => player.playerId === appState.serverSession.viewerPlayerId);
      const nextReady = !Boolean(me?.isReady);
      const response = await socketRequest("lobby:ready", { ready: nextReady });
      appState.serverSession.lobbyInfo = response?.lobby || appState.serverSession.lobbyInfo;
      appendLog(nextReady ? "You are marked Ready." : "You are marked Not Ready.");
      syncLobbySeatPreview();
      renderPrototype();
      return;
    }
    const lobbyInfo = appState.serverSession.lobbyInfo || (await refreshLobbyInfo());
    const me = (lobbyInfo?.players || []).find((player) => player.playerId === appState.serverSession.viewerPlayerId);
    const nextReady = !Boolean(me?.isReady);
    const updated = await serverPost(`/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/ready`, {
      sessionToken: appState.serverSession.sessionToken,
      ready: nextReady,
    });
    appState.serverSession.lobbyInfo = updated;
    appendLog(nextReady ? "You are marked Ready." : "You are marked Not Ready.");
  } catch (error) {
    appState.serverSession.lastError = error instanceof Error ? error.message : "Unknown ready-state error.";
    appendLog(`Ready toggle failed. ${appState.serverSession.lastError}`);
  }
  syncLobbySeatPreview();
  renderPrototype();
}

async function startHostedMatchFromUi() {
  if (appState.setupMode === "solo") {
    prepareLocalPrototypeMatchFromSetup();
    renderPrototype();
    showScreen("table");
    return;
  }
  if (!appState.serverSession?.lobbyId) {
    appendLog("Host or join a lobby first.");
    renderPrototype();
    return;
  }
  try {
    if (appState.serverSession.isHost) {
      const lobbyInfo = await refreshLobbyInfo();
      const humans = (lobbyInfo?.players || []).filter((player) => player.role === "human");
      if (!humans.length || !humans.every((player) => player.isReady)) {
        appendLog("All human players must be ready before the host can start.");
        renderPrototype();
        return;
      }
      await startHostedMatchFromLobby();
    } else {
      if (!appState.serverSession.viewerPlayerId && appState.serverSession.joinCode) {
        await reconnectLobbySession(appState.serverSession.joinCode);
      }
      if (appState.serverSession.sessionToken) {
        const resumed = await serverPost(`/api/lobbies/${encodeURIComponent(appState.serverSession.lobbyId)}/resume`, {
          sessionToken: appState.serverSession.sessionToken,
        });
        if (resumed?.viewerPlayerId) {
          appState.serverSession.viewerPlayerId = resumed.viewerPlayerId;
        }
        if (resumed?.sessionToken) {
          appState.serverSession.sessionToken = resumed.sessionToken;
        }
      }
      const lobby = await refreshLobbyInfo();
      appState.serverSession.status = lobby.status || appState.serverSession.status;
      if (appState.serverSession.status !== "in_progress") {
        appendLog("Host has not started the match yet.");
        renderPrototype();
        return;
      }
      const hasViewerSeat = (lobby.players || []).some((player) => player.playerId === appState.serverSession.viewerPlayerId);
      if (!hasViewerSeat) {
        if (appState.serverSession.joinCode) {
          const reconnected = await reconnectLobbySession(appState.serverSession.joinCode);
          if (!reconnected) {
            appendLog("Enter match failed: your player session is no longer seated in this lobby.");
            renderPrototype();
            return;
          }
        } else {
          appendLog("Enter match failed: no active viewer session is associated with this lobby.");
          renderPrototype();
          return;
        }
      }
      if (!(lobby.players || []).some((player) => player.playerId === appState.serverSession.viewerPlayerId)) {
        appendLog("Enter match failed: this session is not seated in the running match.");
        renderPrototype();
        return;
      }
    }
    await refreshServerViewAndRender();
    startServerPolling();
    showScreen("table");
    appendLog(`Match started from lobby ${appState.serverSession.joinCode}.`);
  } catch (error) {
    appState.serverSession.lastError = error instanceof Error ? error.message : "Unknown start match error.";
    appendLog(`Start match failed. ${appState.serverSession.lastError}`);
  }
  renderPrototype();
}

function quitCurrentGame() {
  window.clearTimeout(botTurnTimer);
  window.clearTimeout(humanTurnAdvanceTimer);
  humanTurnAdvanceTimer = null;
  closeWinnerBanner();
  closeZoom();
  closeRules();
  closeVictoryPile();
  closeSalvoPile();
  closeCombatLog();
  closeScoreCard();
  showScreen("menu");
}

function maybeEndRound(reason = "fleet_elimination") {
  if (appState.match.isRoundOver) {
    return true;
  }

  const survivingZones = getActiveZones().filter((zone) => hasAfloatShips(zone));
  let winner = null;
  let subtitle = "";

  if (survivingZones.length <= 1) {
    const winnerZone = survivingZones[0] || getRoundWinnerByVictoryPile().zone;
    winner = {
      zone: winnerZone,
      capturedShips: countVictoryShips(winnerZone),
      capturedPoints: scoreVictoryPile(winnerZone),
    };
    subtitle = `${getPlayerName(winnerZone)} is the last admiral with ships afloat.`;
  } else if (reason === "deck_empty") {
    winner = getRoundWinnerByVictoryPile();
    subtitle = `Play deck is empty. ${getPlayerName(winner.zone)} wins with ${winner.capturedShips} captured ship${winner.capturedShips === 1 ? "" : "s"}.`;
  } else {
    return false;
  }

  appState.match.isRoundOver = true;
  appState.match.winnerZone = winner.zone;
  appState.match.roundEndReason = reason;
  appState.turnState.phase = "complete";
  appState.turnState.playedCard = true;
  window.clearTimeout(botTurnTimer);
  window.clearTimeout(humanTurnAdvanceTimer);
  humanTurnAdvanceTimer = null;
  let bannerTitle = `${getPlayerName(winner.zone)} Wins`;
  let bannerSubtitle = subtitle;
  let bannerActions = [];

  if (appState.match.mode === "campaign") {
    scoreCampaignRound();
    const campaignLeader = getCampaignLeader();
    if (campaignLeader && campaignLeader.total >= appState.match.campaignTarget) {
      appState.match.isCampaignOver = true;
      bannerTitle = `${campaignLeader.player} Wins Campaign`;
      bannerSubtitle = `${campaignLeader.player} reaches ${campaignLeader.total} points and wins the campaign. Round points come from captured ship hit points.`;
    } else {
      appState.match.pendingNextRound = true;
      bannerTitle = `${getPlayerName(winner.zone)} Wins Round ${appState.match.currentRound}`;
      bannerSubtitle = `${subtitle} Campaign scores are updated from captured ship hit points. Start the next round when ready.`;
      bannerActions = [{ label: "Start Next Round", dataset: { nextCampaignRound: "true" } }];
    }
  } else {
    bannerSubtitle = `${bannerSubtitle} Skirmish win condition: eliminate all rival fleets, or lead in captured ships when the play deck is empty.`;
  }

  appendLog(`${bannerTitle}. ${bannerSubtitle}`);
  showWinnerBanner(bannerTitle, bannerSubtitle, bannerActions);
  playWinnerSound();
  setDiceResolution("—", "Round complete", bannerTitle, bannerSubtitle);
  return true;
}

function addFleetEffect(zone, effect) {
  appState.effectsByFleet[zone] = appState.effectsByFleet[zone] || [];
  appState.effectsByFleet[zone].push(effect);
}

function cloneDrawCard(template) {
  const nextId = `generated-draw-${generatedPlayCardId++}`;
  return {
    ...template,
    id: nextId,
  };
}

function cloneShipCard(template) {
  generatedShipId += 1;
  return {
    ...template,
  };
}

function replenishPlayDeckQueue() {
  if (appState.playDeckQueue.length > 0) {
    return;
  }
}

function completeActionForTurn(logEntry) {
  if (appState.match.isRoundOver) {
    return;
  }
  appState.turnState.playedCard = true;
  appState.turnState.phase = "complete";
  appState.turnState.forcedCardId = null;
  appState.turnState.airStrikeMode = false;
  appState.turnState.usedCarrierIndices = [];
  if (logEntry) {
    appendLog(logEntry);
  }
}

function finalizeHumanTurn(logEntry, delayMs = 650) {
  completeActionForTurn(logEntry);
  renderPrototype();
  if (shouldRequireManualEndTurn()) {
    setDiceResolution(
      "—",
      "Opening turn action complete",
      "Click End Turn to pass to the next player.",
      "Opening-round turns require a manual end-turn confirmation."
    );
    return;
  }
  window.clearTimeout(humanTurnAdvanceTimer);
  if (appState.match.isRoundOver) {
    return;
  }
  humanTurnAdvanceTimer = window.setTimeout(() => {
    humanTurnAdvanceTimer = null;
    startNextTurn();
  }, consumeTurnAdvanceDelay(delayMs));
}

function startNextTurn() {
  if (appState.match.isRoundOver || maybeEndRound()) {
    renderPrototype();
    return;
  }
  const nextZone = getNextZone(getCurrentZone());
  appState.turnState.turnNumber += 1;
  appState.turnState.currentZone = nextZone;
  const expiringSmoke = (appState.effectsByFleet[nextZone] || []).filter((effect) => effect.kind === "smoke");
  if (expiringSmoke.length) {
    appState.effectsByFleet[nextZone] = appState.effectsByFleet[nextZone].filter(
      (effect) => effect.kind !== "smoke"
    );
    addToDiscardPile(expiringSmoke.map((effect) => ({ image: effect.image, label: effect.label })));
    appendLog(`Smoke screen expires in front of ${getPlayerName(nextZone)}'s fleet.`);
  }
  appState.turnState.phase = "draw";
  appState.turnState.usedAirStrike = false;
  appState.turnState.airStrikeMode = false;
  appState.turnState.usedCarrierIndices = [];
  appState.turnState.playedCard = false;
  appState.turnState.forcedCardId = null;
  setDiceResolution("—", "Awaiting action", `${getPlayerName(nextZone)} begins the turn.`, "One draw, one action, then the turn ends.");
  renderPrototype();
  scheduleBotTurnIfNeeded();
}

function getForcedImmediateCard() {
  const forcedId = appState.turnState.forcedCardId;
  if (forcedId) {
    const forcedCard = appState.hand.find((card) => card.id === forcedId);
    if (forcedCard) {
      return forcedCard;
    }
  }

  return appState.hand.find((card) => IMMEDIATE_PLAY_KINDS.has(card.kind)) || null;
}

function hasAnyImmediateCardInHand() {
  return appState.hand.some((card) => IMMEDIATE_PLAY_KINDS.has(card.kind));
}

function isCardPlayableNow(card) {
  if (appState.match.isRoundOver || !isHumanTurn() || appState.turnState.phase !== "play") {
    return false;
  }

  if (IMMEDIATE_PLAY_KINDS.has(card.kind)) {
    return false;
  }

  if (hasAnyImmediateCardInHand()) {
    return false;
  }

  if (appState.turnState.airStrikeMode) {
    return card.kind === "carrier_airstrike";
  }

  if (card.kind === "destroyer_activation") {
    const legal = Array.isArray(appState.serverSession?.legalCommands) ? appState.serverSession.legalCommands : [];
    return legal.includes("resolve_destroyer_squadron_roll");
  }

  if (appState.turnState.playedCard) {
    return false;
  }

  switch (card.kind) {
    case "salvo":
      return hasMatchingGunForSalvo(card) && getLegalShipTargetsForAction("bottom", "salvo").length > 0;
    case "repair":
      return getBotRepairTarget("bottom") >= 0;
    case "minesweeper":
      return Boolean(getBotMinesweeperTarget("bottom"));
    case "smoke":
      return !hasFleetSmoke("bottom");
    case "destroyer_squadron":
      return true;
    case "carrier_airstrike":
      return true;
    case "destroyer_activation":
      return true;
    default:
      return false;
  }
}

function hasAdditionalDamageTargets() {
  return getEnemyZones("bottom").some((zone) =>
    appState.fleets[zone].some((ship) => !ship.sunk && Array.isArray(ship.salvos) && ship.salvos.length > 0)
  );
}

function canAdditionalDamageTargetShip(zone, targetIndex) {
  const ship = appState.fleets[zone]?.[targetIndex];
  return Boolean(ship && !ship.sunk && Array.isArray(ship.salvos) && ship.salvos.length > 0);
}

function canDiscardCardAsAction(card) {
  if (!card) {
    return false;
  }
  if (card.kind === "additional_ship") {
    return true;
  }
  if (appState.serverSession?.connected) {
    const legal = Array.isArray(appState.serverSession.legalCommands) ? appState.serverSession.legalCommands : [];
    if (legal.includes("discard_play_card") && (card.kind === "additional_damage" || card.kind === "minefield")) {
      return true;
    }
  }
  return !IMMEDIATE_PLAY_KINDS.has(card.kind);
}

function isCarrierScreened(zone, targetIndex) {
  const fleet = appState.fleets[zone] || [];
  const ship = fleet[targetIndex];
  if (!ship?.isCarrier || ship.sunk) {
    return false;
  }

  return fleet.some((fleetShip, index) => index !== targetIndex && !fleetShip.sunk && !fleetShip.isCarrier);
}

function canHandCardDropOnTarget(card, dropTarget) {
  if (dropTarget.dataset.dropType === "discard_action") {
    return canDiscardCardAsAction(card);
  }

  if (card.kind === "carrier_airstrike") {
    if (dropTarget.dataset.dropType === "enemy_ship") {
      const zone = dropTarget.dataset.zone;
      return Boolean(
        zone &&
          canTargetFleetWithAction("carrier_airstrike", zone)
      );
    }
    if (isDestroyerTarget(dropTarget)) {
      return !appState.serverSession?.connected;
    }
    return false;
  }

  if (card.kind === "destroyer_activation") {
    const zone = dropTarget.dataset.zone;
    return Boolean(
      dropTarget.dataset.dropType === "fleet_target" &&
        zone &&
        zone !== "bottom" &&
        canTargetFleetWithAction("destroyer_squadron", zone)
    );
  }

  if (card.dropMode === "enemy_ship" && dropTarget.dataset.dropType === "enemy_ship") {
    const zone = dropTarget.dataset.zone;
    const targetIndex = Number(dropTarget.dataset.shipIndex);
    if (card.kind === "salvo" && isCarrierScreened(zone, targetIndex)) {
      return false;
    }
    if (card.kind === "additional_damage") {
      return zone !== "bottom" && canAdditionalDamageTargetShip(zone, targetIndex);
    }
    return true;
  }

  if (card.dropMode === "enemy_ship" && isDestroyerTarget(dropTarget)) {
    return (
      (card.kind === "salvo" && hasMatchingGunForSalvo(card)) ||
      card.kind === "submarine" ||
      card.kind === "torpedo_boat"
    );
  }

  if (card.dropMode === "battle_zone" && dropTarget.dataset.dropType === "battle_zone") {
    return true;
  }

  if (card.dropMode === "fleet_target" && dropTarget.dataset.zone) {
    return !(card.kind === "minefield" && dropTarget.dataset.zone === "bottom");
  }

  if (card.dropMode === "own_ship" && dropTarget.dataset.dropType === "own_ship") {
    return true;
  }

  return false;
}

function getAvailableCarrierIndices() {
  return appState.fleets.bottom
    .map((ship, index) => ({ ship, index }))
    .filter(({ ship }) => ship.isCarrier && !ship.sunk);
}

function hasUnusedCarrier(index) {
  return !appState.turnState.usedCarrierIndices.includes(index);
}

function startAirStrikePhase() {
  if (appState.turnState.phase !== "draw") {
    appendLog("Air strikes must be chosen at the start of the turn before drawing.");
    renderPrototype();
    return;
  }

  if (getForcedImmediateCard()) {
    appendLog("A mandatory special card must be resolved before choosing air strikes.");
    renderPrototype();
    return;
  }

  const carriers = getAvailableCarrierIndices();
  if (!carriers.length) {
    appendLog("No afloat carriers are available for an air strike.");
    renderPrototype();
    return;
  }
  if (appState.serverSession?.connected) {
    const legal = Array.isArray(appState.serverSession.legalCommands) ? appState.serverSession.legalCommands : [];
    if (!legal.includes("use_carrier_strike")) {
      appendLog("Air strikes are not available from the server for this turn.");
      refreshServerViewAndRender();
      renderPrototype();
      return;
    }
  }

  appState.turnState.phase = "play";
  appState.turnState.airStrikeMode = true;
  appState.turnState.usedAirStrike = true;
  appState.turnState.usedCarrierIndices = [];
  setDiceResolution(
    "—",
    "Air strike phase",
    "Draw is skipped for this turn.",
    `Use any of your ${carriers.length} afloat carrier${carriers.length === 1 ? "" : "s"} to launch strikes. The turn ends automatically after the last available strike.`
  );
  appendLog(`${getPlayerName("bottom")} skips the draw and commits the carriers to air strikes.`);
  renderPrototype();
}

function ensureForcedCard(card) {
  const forcedCard = getForcedImmediateCard();
  if (!forcedCard || forcedCard.id === card.id) {
    return true;
  }

  appendLog(`${forcedCard.label} must be played before ${card.label}.`);
  setDiceResolution(
    "—",
    "Forced play pending",
    `${forcedCard.label} must be resolved immediately this turn.`,
    "Mandatory special cards take the turn's play before any optional card."
  );
  renderPrototype();
  return false;
}

function drawShipFromDeck() {
  const shipDeckPile = getShipDeckPile();
  if (!shipDeckPile || shipDeckPile.count <= 0 || appState.shipDeckQueue.length === 0) {
    appendLog("Ship deck is empty. Additional Ship cannot add a new vessel.");
    return null;
  }

  shipDeckPile.count -= 1;
  return appState.shipDeckQueue.shift();
}

async function drawPlayCardForTurn() {
  if (appState.match.isRoundOver) {
    return;
  }
  if (!isHumanTurn()) {
    return;
  }
  if (appState.turnState.phase !== "draw") {
    appendLog("You can only draw at the start of the turn.");
    renderPrototype();
    return;
  }

  if (isAnimating) {
    return;
  }

  if (appState.serverSession?.connected) {
    const legal = Array.isArray(appState.serverSession.legalCommands) ? appState.serverSession.legalCommands : [];
    if (!legal.includes("draw_card")) {
      await refreshServerViewAndRender();
      renderPrototype();
      return;
    }
    const ok = await submitServerCommand({
      type: "draw_card",
      actorId: appState.serverSession.viewerPlayerId,
    });
    if (!ok) {
      renderPrototype();
      return;
    }
    return;
  }

  replenishPlayDeckQueue();
  const playDeckPile = getPlayDeckPile();
  if (!playDeckPile || playDeckPile.count <= 0 || appState.playDeckQueue.length === 0) {
    appendLog("Play deck is empty. The round ends immediately.");
    maybeEndRound("deck_empty");
    renderPrototype();
    return;
  }

  const drawnCard = appState.playDeckQueue.shift();
  isAnimating = true;
  playDrawCardSound();
  await animateDrawToTray(drawnCard.image);
  playDeckPile.count -= 1;
  appendLog(`${getPlayerName("bottom")} draws ${drawnCard.label}.`);

  if (drawnCard.kind === "additional_damage" && !hasAdditionalDamageTargets()) {
    addToDiscardPile([{ image: drawnCard.image, label: drawnCard.label }]);
    appendLog("Additional Damage has no salvo to build on, so it is discarded and replaced immediately.");
    setDiceResolution(
      "—",
      "Additional Damage discarded",
      "No attached salvos are available anywhere on the table.",
      "A replacement play card is drawn immediately."
    );
    isAnimating = false;
    renderPrototype();
    await drawPlayCardForTurn();
    return;
  } else {
    appState.hand.push(drawnCard);
    highlightDrawnCard(drawnCard.id);
    if (IMMEDIATE_PLAY_KINDS.has(drawnCard.kind)) {
      appState.turnState.forcedCardId = drawnCard.id;
      setDiceResolution(
        "—",
        "Immediate play required",
        `${drawnCard.label} must be played immediately.`,
        "This special card takes the play phase and ends the turn after it resolves."
      );
    } else {
      setDiceResolution("—", "Draw phase complete", `${drawnCard.label} is added to ${getPlayerName("bottom")}'s hand.`, "Choose one play for the turn.");
    }
  }

  if (appState.turnState.phase !== "complete") {
    appState.turnState.phase = "play";
  }
  isAnimating = false;
  renderPrototype();
}

function drawPlayCardFromDeck() {
  replenishPlayDeckQueue();
  const playDeckPile = getPlayDeckPile();
  if (!playDeckPile || playDeckPile.count <= 0 || appState.playDeckQueue.length === 0) {
    maybeEndRound("deck_empty");
    return null;
  }

  playDeckPile.count -= 1;
  return appState.playDeckQueue.shift();
}

function removeCardFromHandForZone(zone, card) {
  const hand = getHandForZone(zone);
  const index = hand.findIndex((handCard) => handCard.id === card.id);
  if (index >= 0) {
    hand.splice(index, 1);
  }
}

function discardCardForZone(zone, card) {
  removeCardFromHandForZone(zone, card);
  addToDiscardPile([{ image: card.image, label: card.label }]);
}

function botHasMatchingGunForSalvo(zone, card) {
  const desiredGunSize = normalizeGunSize(card.gunSize);
  return appState.fleets[zone].some((ship) => {
    const { remaining } = parseDamage(ship.damage);
    const shipGunSize = normalizeGunSize(ship.gunSize || SHIP_GUN_SIZE_BY_NAME[ship.ship]);
    return !ship.sunk && !ship.isCarrier && remaining > 0 && shipGunSize === desiredGunSize;
  });
}

function getLegalShipTargetsForAction(ownerZone, actionKind) {
  const shipTargets = getEnemyZones(ownerZone).flatMap((zone) =>
    appState.fleets[zone]
      .map((ship, index) => ({ zone, index, ship }))
      .filter(({ zone: targetZone, index, ship }) => {
        if (ship.sunk) {
          return false;
        }
        if (actionKind === "salvo" && isCarrierScreened(targetZone, index)) {
          return false;
        }
        return canTargetFleetWithAction(actionKind, targetZone);
      })
  );
  const destroyerTargets = actionKind === "additional_damage" ? [] : getDestroyerTargets(ownerZone);
  return [...destroyerTargets, ...shipTargets];
}

function getWeakestTarget(targets) {
  return targets
    .slice()
    .sort((a, b) => parseDamage((a.ship || a.effect).damage).remaining - parseDamage((b.ship || b.effect).damage).remaining)[0] || null;
}

function getBotSalvoPlay(zone, hand) {
  return hand
    .filter((card) => card.kind === "salvo" && botHasMatchingGunForSalvo(zone, card))
    .map((card) => ({ card, target: getWeakestTarget(getLegalShipTargetsForAction(zone, "salvo")) }))
    .find((play) => play.target);
}

function getBotAdditionalDamageTarget(zone) {
  return getEnemyZones(zone)
    .flatMap((targetZone) =>
      appState.fleets[targetZone]
        .map((ship, index) => ({ zone: targetZone, index, ship }))
        .filter(({ ship }) => !ship.sunk && ship.salvos?.length)
    )[0] || null;
}

function getBotMinefieldTarget(zone) {
  return getEnemyZones(zone)
    .map((targetZone) => ({
      zone: targetZone,
      afloat: appState.fleets[targetZone].filter((ship) => !ship.sunk).length,
      hasMinefield: (appState.effectsByFleet[targetZone] || []).some((effect) => effect.kind === "minefield"),
    }))
    .filter((target) => target.afloat > 0 && !target.hasMinefield)
    .sort((a, b) => b.afloat - a.afloat)[0]?.zone || null;
}

function getBotMinesweeperTarget(zone) {
  return getActiveZones().find((targetZone) =>
    (appState.effectsByFleet[targetZone] || []).some((effect) => effect.kind === "minefield")
  ) || null;
}

function getBotRepairTarget(zone) {
  return appState.fleets[zone].findIndex((ship) => !ship.sunk && ship.salvos?.length);
}

function discardDestroyerEffect(zone, effect) {
  const attachedSalvos = (effect.salvos || []).map((salvo) => ({ image: salvo.image, label: salvo.label }));
  appState.effectsByFleet[zone] = (appState.effectsByFleet[zone] || []).filter((entry) => entry.id !== effect.id);
  addToDiscardPile([
    ...attachedSalvos,
    { image: effect.image, label: effect.label },
  ]);
}

function damageDestroyerEffect(zone, effectId, hits, sourceLabel) {
  const effect = getDestroyerEffect(zone, effectId);
  if (!effect) {
    return false;
  }

  const { remaining, total } = parseDamage(effect.damage || "4 / 4");
  const nextRemaining = Math.max(remaining - hits, 0);
  effect.damage = formatDamage(nextRemaining, total);
  appendLog(`${sourceLabel} hits ${getPlayerName(zone)}'s Destroyer Squadron for ${hits}.`);
  if (nextRemaining === 0) {
    discardDestroyerEffect(zone, effect);
    playShipSinkSound();
    showSpecialBanner("Destroyers Sunk", `${getPlayerName(zone)}'s Destroyer Squadron is destroyed before it can attack.`);
    appendLog(`${getPlayerName(zone)}'s Destroyer Squadron is sunk and discarded.`);
    return true;
  }
  return false;
}

function resolveDestroyerTargetDamage(card, targetZone, effectId) {
  if (appState.serverSession?.connected) {
    if (card.kind === "salvo") {
      submitServerCommand({
        type: "attack_destroyer_squadron",
        actorId: appState.serverSession.viewerPlayerId,
        cardId: card.id,
        targetDestroyerId: effectId,
      });
      return;
    }
    appendLog(`Server currently supports salvo attacks against Destroyer Squadron only.`);
    renderPrototype();
    return;
  }
  const effect = getDestroyerEffect(targetZone, effectId);
  if (!effect) {
    markRejectedHandCard(card.id);
    appendLog("That Destroyer Squadron is no longer in the battle zone.");
    renderPrototype();
    return;
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.airStrikeMode || appState.turnState.phase !== "play" || appState.turnState.playedCard) {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot attack the Destroyer Squadron right now.`);
    renderPrototype();
    return;
  }
  if (card.kind === "salvo" && !hasMatchingGunForSalvo(card)) {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot be played because ${getPlayerName("bottom")} has no matching ${card.gunSize} ships afloat.`);
    renderPrototype();
    return;
  }
  if (card.kind !== "salvo" && card.kind !== "submarine" && card.kind !== "torpedo_boat") {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot target a Destroyer Squadron.`);
    renderPrototype();
    return;
  }

  removeHandCard(card.id);
  if (card.kind === "salvo") {
    effect.salvos = effect.salvos || [];
    effect.salvos.push({ image: card.image, label: card.label });
    playSalvoHitSound(card);
    damageDestroyerEffect(targetZone, effectId, card.hits, card.label);
  } else {
    const roll = rollD6();
    const sunk = card.kind === "submarine" ? roll >= 5 : roll === 6;
    if (card.kind === "submarine") {
      playSubmarineSound();
    } else {
      playTorpedoBoatSound();
    }
    addToDiscardPile([{ image: card.image, label: card.label }]);
    setDiceResolution(
      roll,
      `${card.label} attack roll`,
      `${getPlayerName("bottom")} attacks ${getPlayerName(targetZone)}'s Destroyer Squadron.`,
      sunk ? "The Destroyer Squadron is sunk." : "The Destroyer Squadron survives."
    );
    appendLog(`${getPlayerName("bottom")} rolls ${roll} with ${card.label} against ${getPlayerName(targetZone)}'s Destroyer Squadron.`);
    if (sunk) {
      discardDestroyerEffect(targetZone, effect);
      playShipSinkSound();
      showSpecialBanner("Destroyers Sunk", `${getPlayerName(targetZone)}'s Destroyer Squadron is destroyed.`);
    }
  }
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after attacking Destroyer Squadron.`);
}

function resolveBotDamageCard(ownerZone, card, target) {
  if (target.type === "destroyer") {
    removeCardFromHandForZone(ownerZone, card);
    const effect = getDestroyerEffect(target.zone, target.effectId);
    if (!effect) {
      return;
    }
    effect.salvos = effect.salvos || [];
    effect.salvos.push({ image: card.image, label: card.label });
    if (card.kind === "salvo") {
      playSalvoHitSound(card);
    }
    damageDestroyerEffect(target.zone, target.effectId, card.hits, card.label);
    return;
  }

  const ship = appState.fleets[target.zone][target.index];
  ship.salvos = ship.salvos || [];
  ship.salvos.push({ image: card.image, label: card.label });
  removeCardFromHandForZone(ownerZone, card);
  if (card.kind === "additional_damage") {
    showSpecialBanner("Additional Damage", `${getPlayerName(ownerZone)} reinforces damage on ${ship.ship}.`);
    playAdditionalDamageSound();
  }

  const { remaining, total } = parseDamage(ship.damage);
  const nextRemaining = Math.max(remaining - card.hits, 0);
  ship.damage = formatDamage(nextRemaining, total);
  if (card.kind === "salvo") {
    playSalvoHitSound(card);
  }
  appendLog(`${getPlayerName(ownerZone)} plays ${card.label} on ${ship.ship} for ${card.hits} damage.`);
  if (nextRemaining === 0) {
    addToDiscardPile([{ image: card.image, label: card.label }]);
    sinkFleetShip(target.zone, target.index, ownerZone);
    queueShipImpact(target.zone, target.index, true);
    maybeEndRound();
  }
}

function resolveBotShipAttack(ownerZone, card, target) {
  if (target.type === "destroyer") {
    const effect = getDestroyerEffect(target.zone, target.effectId);
    if (!effect) {
      return;
    }
    const roll = rollD6();
    const isSubmarine = card.kind === "submarine";
    const sunk = isSubmarine ? roll >= 5 : roll === 6;
    if (isSubmarine) {
      playSubmarineSound();
    } else {
      playTorpedoBoatSound();
    }
    discardCardForZone(ownerZone, card);
    showSpecialBanner(card.label, `${getPlayerName(ownerZone)} targets ${getPlayerName(target.zone)}'s Destroyer Squadron.`);
    setDiceResolution(
      roll,
      `${card.label} attack roll`,
      `${getPlayerName(ownerZone)} attacks a Destroyer Squadron.`,
      sunk ? "The Destroyer Squadron is sunk." : "The Destroyer Squadron survives."
    );
    appendLog(`${getPlayerName(ownerZone)} rolls ${roll} with ${card.label} against ${getPlayerName(target.zone)}'s Destroyer Squadron.`);
    if (sunk) {
      discardDestroyerEffect(target.zone, effect);
      playShipSinkSound();
    }
    return;
  }

  const ship = appState.fleets[target.zone][target.index];
  const roll = rollD6();
  const isSubmarine = card.kind === "submarine";
  const sunk = isSubmarine ? roll >= 5 : roll === 6;
  if (isSubmarine) {
    playSubmarineSound();
  } else {
    playTorpedoBoatSound();
  }
  discardCardForZone(ownerZone, card);
  showSpecialBanner(card.label, `${getPlayerName(ownerZone)} targets ${ship.ship}.`);
  setDiceResolution(
    roll,
    `${card.label} attack roll`,
    `${getPlayerName(ownerZone)} attacks ${ship.ship}.`,
    sunk ? `${ship.ship} is sunk.` : `${ship.ship} survives the attack.`
  );
  appendLog(`${getPlayerName(ownerZone)} rolls ${roll} with ${card.label} against ${ship.ship}.`);
  if (sunk) {
    sinkFleetShip(target.zone, target.index, ownerZone);
    queueShipImpact(target.zone, target.index, true);
    maybeEndRound();
  }
}

function resolveBotFleetCard(ownerZone, card, targetZone) {
  if (card.kind === "minefield") {
    removeCardFromHandForZone(ownerZone, card);
    const effect = {
      id: card.id,
      kind: "minefield",
      label: card.label,
      image: card.image,
      hits: card.hits,
    };
    addFleetEffect(targetZone, effect);
    showSpecialBanner(card.label, `${getPlayerName(ownerZone)} mines ${getPlayerName(targetZone)}'s fleet.`);
    playMinesSound();
    appendLog(`${getPlayerName(ownerZone)} places ${card.label} in front of ${getPlayerName(targetZone)}.`);
    applyMinefieldDamageToFleet(targetZone, effect, ownerZone);
    maybeEndRound();
    return;
  }

  if (card.kind === "minesweeper") {
    const minefields = (appState.effectsByFleet[targetZone] || []).filter((effect) => effect.kind === "minefield");
    appState.effectsByFleet[targetZone] = (appState.effectsByFleet[targetZone] || []).filter(
      (effect) => effect.kind !== "minefield"
    );
    discardCardForZone(ownerZone, card);
    addToDiscardPile(minefields.map((effect) => ({ image: effect.image, label: effect.label })));
    showSpecialBanner("Minesweeper", `${getPlayerName(ownerZone)} clears mines from ${getPlayerName(targetZone)}.`);
    playMinesweeperSound();
    appendLog(`${getPlayerName(ownerZone)} clears minefields from ${getPlayerName(targetZone)}.`);
  }
}

function resolveBotBattleZoneCard(ownerZone, card) {
  removeCardFromHandForZone(ownerZone, card);
  appState.effectsByFleet[ownerZone].push({
    id: card.id,
    kind: card.kind,
    label: card.label,
    image: card.image,
    damage: card.kind === "destroyer_squadron" ? "4 / 4" : undefined,
    salvos: card.kind === "destroyer_squadron" ? [] : undefined,
    expiresOnTurn: undefined,
  });
  if (card.kind === "smoke") {
    showSpecialBanner("Smoke Screen", `${getPlayerName(ownerZone)} screens their fleet.`);
    playSmokeSound();
  } else if (card.kind === "destroyer_squadron") {
    showSpecialBanner("Destroyer Squadron", `${getPlayerName(ownerZone)} sends destroyers to the battle zone.`);
    playDestroyersSound();
  }
  appendLog(`${getPlayerName(ownerZone)} deploys ${card.label}.`);
}

function getBotReadyDestroyer(ownerZone) {
  return (appState.effectsByFleet[ownerZone] || []).find((effect) => effect.kind === "destroyer_squadron");
}

function resolveBotDestroyerSquadronStrike(ownerZone, effect) {
  const targetZone = getEnemyZones(ownerZone)
    .filter((zone) => !hasFleetSmoke(zone))
    .sort((a, b) => appState.fleets[b].filter((ship) => !ship.sunk).length - appState.fleets[a].filter((ship) => !ship.sunk).length)[0];
  if (!targetZone) {
    return false;
  }

  const roll = rollD6();
  const shipsToSink = getFirstAfloatShips(targetZone, roll);
  discardDestroyerEffect(ownerZone, effect);
  setDiceResolution(
    roll,
    "Destroyer squadron attack roll",
    `${getPlayerName(ownerZone)} sends destroyers against ${getPlayerName(targetZone)}.`,
    shipsToSink.length
      ? `${shipsToSink.length} ship${shipsToSink.length === 1 ? "" : "s"} selected to sink.`
      : "No ships remain afloat in the targeted fleet."
  );
  appendLog(`${getPlayerName(ownerZone)} activates Destroyer Squadron and rolls ${roll} against ${getPlayerName(targetZone)}.`);
  shipsToSink.forEach(({ index }) => {
    sinkFleetShip(targetZone, index, ownerZone);
    queueShipImpact(targetZone, index, true);
  });
  maybeEndRound();
  return true;
}

function resolveBotRepair(ownerZone, card, targetIndex) {
  const ship = appState.fleets[ownerZone][targetIndex];
  const clearedSalvo = ship.salvos?.shift();
  addToDiscardPile([
    ...(clearedSalvo ? [{ image: clearedSalvo.image, label: clearedSalvo.label }] : []),
    { image: card.image, label: card.label },
  ]);
  removeCardFromHandForZone(ownerZone, card);
  showSpecialBanner("Repair", `${getPlayerName(ownerZone)} repairs ${ship.ship}.`);
  playRepairSound();
  appendLog(`${getPlayerName(ownerZone)} repairs ${ship.ship} and removes one attached salvo.`);
}

function resolveBotAdditionalShip(ownerZone, card) {
  discardCardForZone(ownerZone, card);
  playDrawCardSound();
  const newShip = drawShipFromDeck();
  if (newShip) {
    appState.fleets[ownerZone].push(newShip);
    normalizeFleetOrder(ownerZone);
    showSpecialBanner("Additional Ship", `${getPlayerName(ownerZone)} draws ${newShip.ship}.`);
    appendLog(`${newShip.ship} joins ${getPlayerName(ownerZone)}'s fleet from the ship deck.`);
  } else {
    appendLog(`${getPlayerName(ownerZone)} resolves Additional Ship, but the ship deck is empty.`);
  }
}

function resolveBotCard(ownerZone, card) {
  if (card.kind === "additional_ship") {
    resolveBotAdditionalShip(ownerZone, card);
    return true;
  }

  if (card.kind === "additional_damage") {
    const target = getBotAdditionalDamageTarget(ownerZone);
    if (!target) {
      discardCardForZone(ownerZone, card);
      appendLog(`${getPlayerName(ownerZone)} discards Additional Damage because no salvo stacks are available.`);
      return true;
    }
    resolveBotDamageCard(ownerZone, card, target);
    return true;
  }

  if (card.kind === "minefield") {
    const targetZone = getBotMinefieldTarget(ownerZone);
    if (!targetZone) {
      discardCardForZone(ownerZone, card);
      appendLog(`${getPlayerName(ownerZone)} discards ${card.label}; no legal minefield target is available.`);
      return true;
    }
    resolveBotFleetCard(ownerZone, card, targetZone);
    return true;
  }

  if (card.kind === "submarine" || card.kind === "torpedo_boat") {
    const target = getWeakestTarget(getLegalShipTargetsForAction(ownerZone, card.kind));
    if (!target) {
      return false;
    }
    resolveBotShipAttack(ownerZone, card, target);
    return true;
  }

  if (card.kind === "salvo") {
    const target = getWeakestTarget(getLegalShipTargetsForAction(ownerZone, "salvo"));
    if (!target || !botHasMatchingGunForSalvo(ownerZone, card)) {
      return false;
    }
    resolveBotDamageCard(ownerZone, card, target);
    return true;
  }

  if (card.kind === "repair") {
    const targetIndex = getBotRepairTarget(ownerZone);
    if (targetIndex < 0) {
      return false;
    }
    resolveBotRepair(ownerZone, card, targetIndex);
    return true;
  }

  if (card.kind === "minesweeper") {
    const targetZone = getBotMinesweeperTarget(ownerZone);
    if (!targetZone) {
      return false;
    }
    resolveBotFleetCard(ownerZone, card, targetZone);
    return true;
  }

  if (card.kind === "smoke" && !hasFleetSmoke(ownerZone)) {
    resolveBotBattleZoneCard(ownerZone, card);
    return true;
  }

  if (card.kind === "destroyer_squadron") {
    resolveBotBattleZoneCard(ownerZone, card);
    return true;
  }

  return false;
}

async function runBotTurn(zone) {
  if (appState.match.isRoundOver || isAnimating || getCurrentZone() !== zone || zone === "bottom") {
    return;
  }

  await new Promise((resolve) => window.setTimeout(resolve, BOT_TURN_DELAY_MS));
  if (getCurrentZone() !== zone || appState.turnState.phase !== "draw") {
    return;
  }

  const playerName = getPlayerName(zone);
  const hand = getHandForZone(zone);
  const drawnCard = drawPlayCardFromDeck();
  if (!drawnCard) {
    appendLog(`${playerName} cannot draw because the play deck is empty.`);
    renderPrototype();
    return;
  }

  playDrawCardSound();
  hand.push(drawnCard);
  appendLog(`${playerName} draws a play card.`);
  appState.turnState.phase = "play";
  renderPrototype();

  await new Promise((resolve) => window.setTimeout(resolve, BOT_TURN_DELAY_MS));
  const readyDestroyer = getBotReadyDestroyer(zone);
  if (readyDestroyer && resolveBotDestroyerSquadronStrike(zone, readyDestroyer)) {
    completeActionForTurn(`${playerName}'s turn ends after activating Destroyer Squadron.`);
    if (maybeEndRound()) {
      renderPrototype();
      return;
    }
    renderPrototype();
    await new Promise((resolve) => window.setTimeout(resolve, consumeTurnAdvanceDelay(BOT_TURN_DELAY_MS)));
    startNextTurn();
    return;
  }

  const forcedCard = hand.find((card) => IMMEDIATE_PLAY_KINDS.has(card.kind));
  const salvoPlay = getBotSalvoPlay(zone, hand);
  const chosenCard =
    forcedCard ||
    salvoPlay?.card ||
    hand.find((card) => resolveBotCard(zone, card));

  if (chosenCard && forcedCard !== chosenCard && chosenCard !== salvoPlay?.card) {
    // The finder above already resolved that card.
  } else if (salvoPlay) {
    resolveBotDamageCard(zone, salvoPlay.card, salvoPlay.target);
  } else if (forcedCard) {
    resolveBotCard(zone, forcedCard);
  } else if (hand.length) {
    const discard = hand[0];
    discardCardForZone(zone, discard);
    appendLog(`${playerName} discards a card as their action.`);
  }

  completeActionForTurn(`${playerName}'s turn ends.`);
  if (maybeEndRound()) {
    renderPrototype();
    return;
  }
  renderPrototype();
  await new Promise((resolve) => window.setTimeout(resolve, consumeTurnAdvanceDelay(BOT_TURN_DELAY_MS)));
  startNextTurn();
}

function scheduleBotTurnIfNeeded() {
  if (appState.serverSession?.connected) {
    return;
  }
  window.clearTimeout(botTurnTimer);
  if (appState.match.isRoundOver) {
    return;
  }
  const zone = getCurrentZone();
  if (getBotZones().includes(zone)) {
    botTurnTimer = window.setTimeout(() => runBotTurn(zone), BOT_TURN_DELAY_MS);
  }
}

function hasMatchingGunForSalvo(card) {
  const desiredGunSize = normalizeGunSize(card.gunSize);
  return appState.fleets.bottom.some((ship) => {
    const { remaining } = parseDamage(ship.damage);
    const shipGunSize = normalizeGunSize(ship.gunSize || SHIP_GUN_SIZE_BY_NAME[ship.ship]);
    if (ship.sunk || ship.isCarrier || remaining <= 0) {
      return false;
    }
    return shipGunSize === desiredGunSize;
  });
}

function applyMinefieldDamageToFleet(zone, effect, ownerZone = "bottom") {
  const hits = Number(effect.hits || 0);
  if (hits <= 0) {
    return;
  }

  appState.fleets[zone].forEach((ship, index) => {
    if (ship.sunk) {
      return;
    }

    const { remaining, total } = parseDamage(ship.damage);
    const nextRemaining = Math.max(remaining - hits, 0);
    ship.damage = formatDamage(nextRemaining, total);
    appendLog(`${effect.label} deals ${hits} damage to ${ship.ship}.`);
    if (nextRemaining === 0) {
      sinkFleetShip(zone, index, ownerZone);
      queueShipImpact(zone, index, true);
    }
  });
}

function createShipCard(ship, zone, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "ship-card";
  wrapper.dataset.zoomSrc = ship.sunk ? ship.originalImage || ship.image : ship.image;
  wrapper.dataset.zoomLabel = `${ship.ship} • Damage ${ship.damage}${ship.sunk ? " • Sunk" : ""}`;
  wrapper.dataset.zone = zone;
  wrapper.dataset.shipIndex = String(index);
  if (ship.shipId) {
    wrapper.dataset.shipId = ship.shipId;
  }
  if (!ship.sunk) {
    wrapper.dataset.dropType = zone === "bottom" ? "own_ship" : "enemy_ship";
  }
  if (ship.sunk) wrapper.classList.add("is-sunk");
  if (ship.isSinking) wrapper.classList.add("is-sinking-transition");
  if (zone === "bottom" && !ship.sunk) {
    wrapper.draggable = isDragInteractionEnabled();
    wrapper.dataset.dragType = "fleet_ship";
    wrapper.dataset.isCarrier = String(ship.isCarrier);
  }

  const image = document.createElement("img");
  image.src = ship.image;
  image.alt = ship.ship;
  wrapper.appendChild(image);

  const meta = document.createElement("div");
  meta.className = "ship-card-meta";

  const name = document.createElement("span");
  name.className = "ship-card-label";
  name.textContent = ship.ship;

  const damage = document.createElement("span");
  damage.className = "damage-chip";
  damage.textContent = ship.damage;

  meta.append(name, damage);
  wrapper.appendChild(meta);

  if (ship.salvos?.length) {
    const salvoStack = document.createElement("div");
    salvoStack.className = "salvo-stack";
    salvoStack.dataset.salvoShip = ship.ship;
    salvoStack.dataset.salvos = JSON.stringify(ship.salvos);

    ship.salvos.slice(0, 3).forEach((salvo, index) => {
      const chip = document.createElement("div");
      chip.className = "salvo-chip";
      chip.style.setProperty("--salvo-tilt", `${(index - 1) * 5}deg`);

      const image = document.createElement("img");
      image.src = salvo.image;
      image.alt = salvo.label;
      chip.appendChild(image);
      salvoStack.appendChild(chip);
    });

    if (ship.salvos.length > 3) {
      const overflow = document.createElement("div");
      overflow.className = "salvo-overflow";
      overflow.textContent = `+${ship.salvos.length - 3}`;
      salvoStack.appendChild(overflow);
    }

    wrapper.appendChild(salvoStack);
  }

  return wrapper;
}

function createPlayCard(card, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "play-card";
  wrapper.dataset.zoomSrc = card.image;
  wrapper.dataset.zoomLabel = card.label;
  wrapper.dataset.cardId = card.id;
  wrapper.dataset.dragType = "hand_card";
  wrapper.dataset.dropMode = card.dropMode;
  wrapper.draggable = isDragInteractionEnabled();
  if (IMMEDIATE_PLAY_KINDS.has(card.kind)) {
    wrapper.classList.add("is-forced-special");
  }
  if (isCardPlayableNow(card)) {
    wrapper.classList.add("is-playable-card");
  }
  if (appState.ui.rejectedCardId === card.id) {
    wrapper.classList.add("is-rejected-play");
  }
  if (appState.ui.highlightedDrawCardId === card.id) {
    wrapper.classList.add("is-new-draw");
  }
  if (appState.ui.touchSelectedCardId === card.id) {
    wrapper.classList.add("is-touch-selected");
  }
  const image = document.createElement("img");
  image.src = card.image;
  image.alt = card.label;
  wrapper.appendChild(image);
  return wrapper;
}

function createLabeledPlayCard(src, label) {
  const wrapper = document.createElement("article");
  wrapper.className = "play-card";
  wrapper.dataset.zoomSrc = src;
  wrapper.dataset.zoomLabel = label;

  const image = document.createElement("img");
  image.src = src;
  image.alt = label;
  wrapper.appendChild(image);
  return wrapper;
}

function createDeckReferenceCard({ image, label, count, detail, cssClass = "" }) {
  const wrapper = document.createElement("article");
  wrapper.className = `deck-reference-card ${cssClass}`.trim();
  wrapper.dataset.zoomSrc = image;
  wrapper.dataset.zoomLabel = label;

  const imageShell = document.createElement("div");
  imageShell.className = "deck-reference-image";

  const cardImage = document.createElement("img");
  cardImage.src = image;
  cardImage.alt = label;
  imageShell.appendChild(cardImage);

  const copy = document.createElement("div");
  copy.className = "deck-reference-copy";

  const title = document.createElement("p");
  title.className = "deck-reference-title";
  title.textContent = label;

  const meta = document.createElement("span");
  meta.className = "deck-reference-detail";
  meta.textContent = detail;

  const countBadge = document.createElement("strong");
  countBadge.className = "deck-reference-count";
  countBadge.textContent = count;

  copy.append(title, meta, countBadge);
  wrapper.append(imageShell, copy);
  return wrapper;
}

function createEffectCard(effect, zone) {
  const stack = document.createElement("div");
  stack.className = "effect-stack";

  const card = document.createElement("article");
  card.className = "effect-card";
  card.dataset.zoomSrc = effect.image;
  card.dataset.zoomLabel = effect.label;
  card.dataset.zone = zone;
  if (effect.kind === "minefield" || effect.kind === "smoke") {
    card.dataset.dropType = "fleet_target";
  }
  if (effect.kind === "destroyer_squadron") {
    card.dataset.dropType = zone === "bottom" ? "own_destroyer" : "destroyer_target";
    card.dataset.effectId = effect.id;
    card.dataset.effectKind = effect.kind;
  }
  if (zone === "bottom" && effect.kind === "destroyer_squadron") {
    card.draggable = isDragInteractionEnabled();
    card.dataset.dragType = "battle_effect";
  }

  const image = document.createElement("img");
  image.src = effect.image;
  image.alt = effect.label;
  card.appendChild(image);

  const label = document.createElement("p");
  label.className = "effect-stack-label";
  label.textContent = effect.kind === "destroyer_squadron" ? `${effect.label} • ${effect.damage || "4 / 4"}` : effect.label;

  stack.append(card, label);
  return stack;
}

function createDeckPile(pile) {
  const stack = document.createElement("div");
  stack.className = "deck-pile";

  const card = document.createElement("div");
  card.className = "deck-pile-card";
  card.dataset.zoomSrc = pile.image;
  card.dataset.zoomLabel = pile.topCardLabel || `${pile.label} • ${pile.count} left`;

  if (pile.label === "Discard Pile") {
    card.classList.add("discard-pile-card");
    card.dataset.dropType = "discard_action";
  }

  if (pile.label === "Play Deck" && appState.turnState.phase === "draw") {
    card.classList.add("is-drawable");
    card.dataset.drawDeck = "play";
  }

  const image = document.createElement("img");
  image.src = pile.image;
  image.alt = pile.label;
  card.appendChild(image);

  const label = document.createElement("p");
  label.className = "effect-stack-label";
  label.textContent = pile.label;

  const count = document.createElement("div");
  count.className = "pile-count";
  count.textContent =
    pile.label === "Discard Pile" ? `${pile.count} cards` : `${pile.count} left`;

  stack.append(card, label, count);
  return stack;
}

function createVictoryCard(ship) {
  const wrapper = document.createElement("article");
  wrapper.className = "ship-card";
  wrapper.dataset.zoomSrc = ship.image;
  wrapper.dataset.zoomLabel = ship.ship;

  const image = document.createElement("img");
  image.src = ship.image;
  image.alt = ship.ship;
  wrapper.appendChild(image);

  const meta = document.createElement("div");
  meta.className = "ship-card-meta";

  const name = document.createElement("span");
  name.className = "ship-card-label";
  name.textContent = ship.ship;
  meta.appendChild(name);
  wrapper.appendChild(meta);
  return wrapper;
}

function createTargetShipCard(ship, zone, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "target-ship-card";
  wrapper.dataset.zoomSrc = ship.sunk ? ship.originalImage || ship.image : ship.image;
  wrapper.dataset.zoomLabel = `${ship.ship} • Damage ${ship.damage}${ship.sunk ? " • Sunk" : ""}`;
  wrapper.dataset.zone = zone;
  wrapper.dataset.shipIndex = String(index);
  wrapper.dataset.dropType = ship.sunk ? "" : "enemy_ship";
  if (ship.sunk) {
    wrapper.classList.add("is-sunk");
  }

  const image = document.createElement("img");
  image.src = ship.image;
  image.alt = ship.ship;
  wrapper.appendChild(image);

  const meta = document.createElement("div");
  meta.className = "target-ship-meta";

  const name = document.createElement("span");
  name.className = "target-ship-name";
  name.textContent = ship.ship;

  const hp = document.createElement("span");
  hp.className = "target-ship-hp";
  hp.textContent = ship.damage;

  meta.append(name, hp);
  wrapper.appendChild(meta);

  if (ship.salvos?.length) {
    const salvoStack = document.createElement("div");
    salvoStack.className = "target-salvo-stack";
    salvoStack.dataset.salvoShip = ship.ship;
    salvoStack.dataset.salvos = JSON.stringify(ship.salvos);

    ship.salvos.slice(0, 3).forEach((salvo, salvoIndex) => {
      const chip = document.createElement("div");
      chip.className = "target-salvo-chip";
      chip.style.setProperty("--target-salvo-tilt", `${(salvoIndex - 1) * 6}deg`);

      const salvoImage = document.createElement("img");
      salvoImage.src = salvo.image;
      salvoImage.alt = salvo.label;
      chip.appendChild(salvoImage);
      salvoStack.appendChild(chip);
    });

    if (ship.salvos.length > 3) {
      const overflow = document.createElement("div");
      overflow.className = "target-salvo-overflow";
      overflow.textContent = `+${ship.salvos.length - 3}`;
      salvoStack.appendChild(overflow);
    }

    wrapper.appendChild(salvoStack);
  }
  return wrapper;
}

function createTargetEffectsRow(zone) {
  const effects = appState.effectsByFleet[zone] || [];
  const row = document.createElement("div");
  row.className = "target-effects-row";

  if (!effects.length) {
    const empty = document.createElement("span");
    empty.className = "target-effects-empty";
    empty.textContent = "No active effects";
    row.appendChild(empty);
    return row;
  }

  effects.forEach((effect) => {
    const chip = document.createElement("div");
    chip.className = "target-effect-chip";
    chip.dataset.zoomSrc = effect.image;
    chip.dataset.zoomLabel = effect.label;
    chip.dataset.zone = zone;
    if (effect.kind === "destroyer_squadron") {
      chip.dataset.dropType = zone === "bottom" ? "own_destroyer" : "destroyer_target";
      chip.dataset.effectId = effect.id;
      chip.dataset.effectKind = effect.kind;
    }

    const image = document.createElement("img");
    image.src = effect.image;
    image.alt = effect.label;

    const label = document.createElement("span");
    label.textContent = effect.kind === "destroyer_squadron" ? `${effect.label} • ${effect.damage || "4 / 4"}` : effect.label;

    chip.append(image, label);
    row.appendChild(chip);
  });

  return row;
}

function createTargetColumn(zone, title) {
  const fleet = appState.fleets[zone];
  const column = document.createElement("section");
  column.className = "target-board-column";
  column.dataset.zone = zone;
  column.dataset.dropType = "fleet_target";

  const header = document.createElement("div");
  header.className = "target-column-header";

  const heading = document.createElement("p");
  heading.className = "target-column-title";
  heading.textContent = title;

  const count = document.createElement("span");
  count.className = "target-column-count";
  count.textContent = `${fleet.filter((ship) => !ship.sunk).length} afloat`;

  header.append(heading, count);

  const effects = createTargetEffectsRow(zone);

  const list = document.createElement("div");
  list.className = "target-ship-list";
  fleet.forEach((ship, index) => {
    list.appendChild(createTargetShipCard(ship, zone, index));
  });

  column.append(header, effects, list);
  return column;
}

function createMiniBattleZoneDrop() {
  const wrapper = document.createElement("div");
  wrapper.className = "mini-battle-zone-drop";
  wrapper.dataset.dropType = "battle_zone";

  const heading = document.createElement("p");
  heading.className = "target-column-title";
  heading.textContent = "Mini Battle Zone";

  const copy = document.createElement("span");
  copy.className = "target-column-count";
  copy.textContent = "Drop Smoke or Destroyers here";

  const lane = document.createElement("div");
  lane.className = "mini-battle-zone-lane";
  lane.dataset.dropType = "battle_zone";

  if ((appState.effectsByFleet.bottom || []).length) {
    appState.effectsByFleet.bottom.forEach((effect) => {
      lane.appendChild(createEffectCard(effect, "bottom"));
    });
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "mini-battle-zone-placeholder";
    placeholder.textContent = "Battle-zone cards you deploy appear here.";
    lane.appendChild(placeholder);
  }

  wrapper.append(heading, copy, lane);
  return wrapper;
}

function renderPrototype() {
  renderLobbyDebugPanel();
  normalizeBottomFleetOrder();
  updateVictoryPileButtons();
  updateBottomStatus();
  renderTurnSummary();
  renderScoreTable();
  const layoutMode = getLayoutMode();
  warTable.classList.remove("layout-duel", "layout-triangle", "layout-four-way");
  warTable.classList.add(`layout-${layoutMode}`);
  PLAYER_ORDER.forEach((zone) => {
    const node = PLAYER_ZONE_NODES[zone];
    if (node) {
      node.classList.toggle("is-inactive", !isZoneActive(zone));
      node.dataset.zone = zone;
      node.dataset.dropType = isZoneActive(zone) ? "fleet_target" : "";
    }
  });
  if (appState.match.isRoundOver) {
    document.body.classList.add("is-round-over");
  } else {
    document.body.classList.remove("is-round-over");
  }
  const targets = {
    top: document.getElementById("fleet-top"),
    left: document.getElementById("fleet-left"),
    right: document.getElementById("fleet-right"),
    bottom: document.getElementById("fleet-bottom"),
  };

  Object.entries(targets).forEach(([zone, node]) => {
    node.innerHTML = "";
    appState.fleets[zone].forEach((ship, index) => node.appendChild(createShipCard(ship, zone, index)));
  });

  const hand = document.getElementById("player-hand");
  hand.innerHTML = "";
  getDisplayedHandCards().forEach((card, index) => hand.appendChild(createPlayCard(card, index)));

  const targetBoard = document.getElementById("target-board");
  targetBoard.innerHTML = "";
  if (appState.ui.showTargetBoard) {
    getBotZones().forEach((zone) => {
      targetBoard.appendChild(createTargetColumn(zone, getPlayerName(zone)));
    });
  }

  const bottomDrawDeck = document.getElementById("bottom-draw-deck");
  bottomDrawDeck.innerHTML = "";
  const playDeck = getPlayDeckPile();
  const discardPile = getDiscardPile();
  if (appState.ui.showTargetBoard) {
    if (playDeck) {
      bottomDrawDeck.appendChild(createDeckPile(playDeck));
    }
    if (discardPile) {
      bottomDrawDeck.appendChild(createDeckPile(discardPile));
    }
  }
  if (bottomBattleZone) {
    bottomBattleZone.innerHTML = "";
    if (appState.ui.showTargetBoard) {
      bottomBattleZone.appendChild(createMiniBattleZoneDrop());
    }
  }
  getActiveZones().forEach((zone) => {
    const node = document.getElementById(`effects-${zone}`);
    node.innerHTML = "";
    node.dataset.dropType = zone === "bottom" ? "battle_zone" : "";
    appState.effectsByFleet[zone].forEach((effect) => {
      node.appendChild(createEffectCard(effect, zone));
    });
  });

  const drawPiles = document.getElementById("draw-piles");
  drawPiles.innerHTML = "";
  appState.drawPiles.forEach((pile) => drawPiles.appendChild(createDeckPile(pile)));
  refreshSelectedTargetHighlights();
  flushPendingImpacts();
  scheduleAutosave();
}

function openZoom(src, label) {
  zoomImage.src = src;
  zoomImage.alt = label;
  zoomCaption.textContent = label;
  zoomOverlay.hidden = false;
}

function closeZoom() {
  zoomOverlay.hidden = true;
  zoomImage.src = "";
  zoomImage.alt = "";
  zoomCaption.textContent = "";
}

function openRules() {
  rulesOverlay.hidden = false;
}

function closeRules() {
  rulesOverlay.hidden = true;
}

function openVictoryPile(zone) {
  const pile = appState.victoryPiles[zone] || [];
  victoryTitle.textContent = `${zone.charAt(0).toUpperCase() + zone.slice(1)} Victory Pile`;
  victoryGrid.innerHTML = "";
  if (pile.length === 0) {
    const empty = document.createElement("p");
    empty.className = "menu-copy";
    empty.textContent = "No sunk ships collected yet.";
    victoryGrid.appendChild(empty);
  } else {
    pile.forEach((ship) => victoryGrid.appendChild(createVictoryCard(ship)));
  }
  victoryOverlay.hidden = false;
}

function closeVictoryPile() {
  victoryOverlay.hidden = true;
}

function openSalvoPile(shipName, salvos) {
  salvoTitle.textContent = `${shipName} Attached Salvos`;
  salvoGrid.innerHTML = "";
  salvos.forEach((salvo) => {
    salvoGrid.appendChild(createLabeledPlayCard(salvo.image, `${shipName} • ${salvo.label}`));
  });
  salvoOverlay.hidden = false;
}

function closeSalvoPile() {
  salvoOverlay.hidden = true;
}

function openCombatLog() {
  combatLogList.innerHTML = "";
  const orderedEntries = [...appState.combatLog].reverse();
  orderedEntries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${entry}`;
    combatLogList.appendChild(item);
  });
  logOverlay.hidden = false;
}

function closeCombatLog() {
  logOverlay.hidden = true;
}

function formatLogTimestamp(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function appendLog(entry) {
  appState.combatLog.unshift(`${formatLogTimestamp()} • ${entry}`);
}

function parseDamage(damageText) {
  const [remaining, total] = damageText.split("/").map((part) => Number(part.trim()));
  return { remaining, total };
}

function formatDamage(remaining, total) {
  return `${Math.max(remaining, 0)} / ${total}`;
}

function getDiscardPile() {
  return appState.drawPiles.find((pile) => pile.label === "Discard Pile");
}

function addToDiscardPile(cards) {
  const discardPile = getDiscardPile();
  if (!discardPile || cards.length === 0) {
    return;
  }

  discardPile.count += cards.length;
  const topCard = cards[cards.length - 1];
  discardPile.image = topCard.image;
  discardPile.topCardLabel = `Top discard • ${topCard.label}`;
  const cardLabels = cards.map((card) => card.label).join(", ");
  appendLog(`Discard pile receives ${cards.length} card${cards.length === 1 ? "" : "s"}: ${cardLabels}.`);
}

function discardHandCard(card) {
  removeHandCard(card.id);
  addToDiscardPile([{ image: card.image, label: card.label }]);
}

function getFirstAfloatShips(zone, count) {
  return appState.fleets[zone]
    .map((ship, index) => ({ ship, index }))
    .filter(({ ship }) => !ship.sunk)
    .slice(0, count);
}

function removeBattleEffect(effectId) {
  appState.effectsByFleet.bottom = appState.effectsByFleet.bottom.filter((effect) => effect.id !== effectId);
}

function updateVictoryPileButtons() {
  document.querySelectorAll("[data-victory-pile]").forEach((button) => {
    const zone = button.dataset.victoryPile;
    const pile = appState.victoryPiles[zone] || [];
    button.textContent = `Victory Pile: ${pile.length}`;
    button.hidden = !isZoneActive(zone);
  });
}

function removeHandCard(cardId) {
  const index = appState.hand.findIndex((card) => card.id === cardId);
  if (index >= 0) {
    appState.hand.splice(index, 1);
  }
}

function resolveSubmarineStrike(card, targetZone, targetIndex) {
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.airStrikeMode) {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot be played after committing this turn to air strikes.`);
    setDiceResolution("—", "Air strike phase active", "Carrier operations replace the normal draw-and-play sequence.", "End the turn after your air strikes instead of playing a hand card.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog("Submarine can only be played during the play phase.");
    renderPrototype();
    return;
  }
  const ship = appState.fleets[targetZone][targetIndex];
  const roll = rollD6();
  const sunk = roll >= 5;
  playSubmarineSound();
  showSpecialBanner("Submarine", `${ship.ship} is targeted by a submarine attack.`);
  discardHandCard(card);
  setDiceResolution(
    roll,
    "Submarine attack roll",
    `${getPlayerName("bottom")} targets ${ship.ship} in ${getPlayerName(targetZone)}'s fleet.`,
    sunk ? `${ship.ship} is sunk on a roll of ${roll}.` : `${ship.ship} survives. Submarines only sink on a 5 or 6.`
  );
  appendLog(`Submarine rolls ${roll} against ${ship.ship}.`);
  if (sunk) {
    sinkFleetShip(targetZone, targetIndex);
    queueShipImpact(targetZone, targetIndex, true);
    maybeEndRound();
  }
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after the submarine attack.`);
}

function resolveTorpedoBoatStrike(card, targetZone, targetIndex) {
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.airStrikeMode) {
    appendLog(`${card.label} cannot be deployed after committing this turn to air strikes.`);
    setDiceResolution("—", "Air strike phase active", "Carrier operations replace the normal draw-and-play sequence.", "End the turn after your air strikes instead of playing a hand card.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog("Torpedo Boat can only be played during the play phase.");
    renderPrototype();
    return;
  }
  const ship = appState.fleets[targetZone][targetIndex];
  const roll = rollD6();
  const sunk = roll === 6;
  showSpecialBanner("Torpedo Boat", `${ship.ship} is targeted by a torpedo run.`);
  playTorpedoBoatSound();
  discardHandCard(card);
  setDiceResolution(
    roll,
    "Torpedo boat attack roll",
    `${getPlayerName("bottom")} launches a torpedo boat attack on ${ship.ship}.`,
    sunk ? `${ship.ship} is sunk by a perfect 6.` : `${ship.ship} survives. Torpedo boats only sink on a 6.`
  );
  appendLog(`Torpedo Boat rolls ${roll} against ${ship.ship}.`);
  if (sunk) {
    sinkFleetShip(targetZone, targetIndex);
    queueShipImpact(targetZone, targetIndex, true);
    maybeEndRound();
  }
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after the torpedo boat attack.`);
}

function resolveCarrierAirStrike(fromIndex, targetZone, targetIndex) {
  if (appState.serverSession?.connected) {
    const carrierShipId = appState.fleets.bottom?.[fromIndex]?.shipId;
    const targetShipId = appState.fleets[targetZone]?.[targetIndex]?.shipId;
    const targetPlayerId = appState.fleetsByZone?.[targetZone]?.playerId;
    if (!carrierShipId || !targetShipId || !targetPlayerId) {
      appendLog("Server air strike blocked: missing target mapping.");
      renderPrototype();
      return;
    }
    submitServerCommand({
      type: "use_carrier_strike",
      actorId: appState.serverSession.viewerPlayerId,
      strikes: [{ carrierShipId, targetPlayerId, targetShipId }],
    });
    return;
  }
  const forcedCard = getForcedImmediateCard();
  if (forcedCard) {
    appendLog(`${forcedCard.label} must be played before launching an air strike.`);
    setDiceResolution("—", "Forced play pending", `${forcedCard.label} is waiting in hand.`, "Air strikes cannot bypass mandatory special cards.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play" || !appState.turnState.airStrikeMode) {
    appendLog("Carrier air strikes are only available after you choose Air Strike instead of drawing.");
    renderPrototype();
    return;
  }
  const carrier = appState.fleets.bottom[fromIndex];
  if (!carrier?.isCarrier || carrier.sunk) {
    return;
  }
  if (!hasUnusedCarrier(fromIndex)) {
    appendLog(`${carrier.ship} has already launched its air strike this turn.`);
    renderPrototype();
    return;
  }
  const ship = appState.fleets[targetZone][targetIndex];
  if (!canTargetFleetWithAction("carrier_airstrike", targetZone)) {
    appendLog(`${carrier.ship} cannot launch an air strike through smoke screening ${ship.ship}'s fleet.`);
    setDiceResolution("—", "Carrier air strike blocked", `${carrier.ship} lines up a strike on ${ship.ship}.`, "Smoke blocks air strikes on that fleet.");
    renderPrototype();
    return;
  }
  const roll = rollD6();
  const sunk = roll === 1;
  playAirStrikeSound();
  appState.turnState.usedCarrierIndices.push(fromIndex);
  setDiceResolution(
    roll,
    "Carrier air strike roll",
    `${carrier.ship} launches an air strike against ${ship.ship}.`,
    sunk ? `${ship.ship} is sunk by the air strike.` : `${ship.ship} weathers the strike. Only a 1 sinks the target.`
  );
  appendLog(`${carrier.ship} rolls ${roll} on an air strike against ${ship.ship}.`);
  if (sunk) {
    sinkFleetShip(targetZone, targetIndex);
    queueShipImpact(targetZone, targetIndex, true);
    maybeEndRound();
  }
  const carriers = getAvailableCarrierIndices();
  const remainingStrikes = carriers.filter(({ index }) => hasUnusedCarrier(index)).length;
  appendLog(
    remainingStrikes
      ? `${remainingStrikes} carrier air strike${remainingStrikes === 1 ? "" : "s"} remain this turn.`
      : "All available carrier air strikes have been used this turn."
  );
  if (!remainingStrikes) {
    finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after completing the air strikes.`);
    return;
  }
  renderPrototype();
}

function resolveCarrierAirStrikeOnDestroyer(fromIndex, targetZone, effectId) {
  const forcedCard = getForcedImmediateCard();
  if (forcedCard) {
    appendLog(`${forcedCard.label} must be played before launching an air strike.`);
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play" || !appState.turnState.airStrikeMode) {
    appendLog("Carrier air strikes are only available after you choose Air Strike instead of drawing.");
    renderPrototype();
    return;
  }
  const carrier = appState.fleets.bottom[fromIndex];
  const effect = getDestroyerEffect(targetZone, effectId);
  if (!carrier?.isCarrier || carrier.sunk || !effect) {
    return;
  }
  if (!hasUnusedCarrier(fromIndex)) {
    appendLog(`${carrier.ship} has already launched its air strike this turn.`);
    renderPrototype();
    return;
  }

  const roll = rollD6();
  const sunk = roll === 1;
  playAirStrikeSound();
  appState.turnState.usedCarrierIndices.push(fromIndex);
  setDiceResolution(
    roll,
    "Carrier air strike roll",
    `${carrier.ship} launches an air strike against ${getPlayerName(targetZone)}'s Destroyer Squadron.`,
    sunk ? "The Destroyer Squadron is sunk by the air strike." : "The Destroyer Squadron survives. Only a 1 sinks the target."
  );
  appendLog(`${carrier.ship} rolls ${roll} on an air strike against ${getPlayerName(targetZone)}'s Destroyer Squadron.`);
  if (sunk) {
    discardDestroyerEffect(targetZone, effect);
    playShipSinkSound();
    showSpecialBanner("Destroyers Sunk", `${getPlayerName(targetZone)}'s Destroyer Squadron is destroyed.`);
  }
  const carriers = getAvailableCarrierIndices();
  const remainingStrikes = carriers.filter(({ index }) => hasUnusedCarrier(index)).length;
  appendLog(
    remainingStrikes
      ? `${remainingStrikes} carrier air strike${remainingStrikes === 1 ? "" : "s"} remain this turn.`
      : "All available carrier air strikes have been used this turn."
  );
  if (!remainingStrikes) {
    finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after completing the air strikes.`);
    return;
  }
  renderPrototype();
}

function resolveDestroyerSquadronStrike(effectId, targetZone) {
  if (appState.serverSession?.connected) {
    const targetPlayerId = appState.fleetsByZone?.[targetZone]?.playerId;
    if (!targetPlayerId) {
      appendLog("Server destroyer strike blocked: missing target player.");
      renderPrototype();
      return;
    }
    submitServerCommand({
      type: "resolve_destroyer_squadron_roll",
      actorId: appState.serverSession.viewerPlayerId,
      destroyerId: effectId,
      targetPlayerId,
    });
    return;
  }
  const forcedCard = getForcedImmediateCard();
  if (forcedCard) {
    appendLog(`${forcedCard.label} must be played before activating Destroyer Squadron.`);
    setDiceResolution("—", "Forced play pending", `${forcedCard.label} is waiting in hand.`, "Mandatory special cards must be resolved before other actions.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play" || appState.turnState.playedCard) {
    appendLog("Destroyer Squadron can only be activated as the turn's single play-phase action.");
    renderPrototype();
    return;
  }
  if (!canTargetFleetWithAction("destroyer_squadron", targetZone)) {
    appendLog(`Destroyer Squadron cannot attack the ${targetZone} fleet while smoke is active.`);
    setDiceResolution("—", "Destroyer squadron blocked", `${getPlayerName("bottom")} tries to send destroyers against the ${targetZone} fleet.`, "Smoke blocks the destroyer squadron attack.");
    renderPrototype();
    return;
  }
  const roll = rollD6();
  const shipsToSink = getFirstAfloatShips(targetZone, roll);
  removeBattleEffect(effectId);
  addToDiscardPile([
    {
      image: "../assets/cards/play/Modern/Destroyer-4hits.png",
      label: "Destroyer Squadron",
    },
  ]);
  setDiceResolution(
    roll,
    "Destroyer squadron attack roll",
    `${getPlayerName("bottom")} sends the destroyers against the ${targetZone} fleet.`,
    shipsToSink.length
      ? `Prototype auto-selects ${shipsToSink.length} ship(s) to sink from that fleet.`
      : "No ships remain afloat in the targeted fleet."
  );
  appendLog(`Destroyer Squadron rolls ${roll} against the ${targetZone} fleet.`);
  shipsToSink.forEach(({ index }) => {
    sinkFleetShip(targetZone, index);
    queueShipImpact(targetZone, index, true);
  });
  maybeEndRound();
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after the destroyer squadron attack.`);
}

function moveBottomFleetShip(fromIndex, toIndex) {
  const fleet = appState.fleets.bottom;
  const [ship] = fleet.splice(fromIndex, 1);
  fleet.splice(toIndex, 0, ship);
  normalizeBottomFleetOrder();
  appendLog(`${getPlayerName("bottom")} rearranges the fleet order.`);
  renderPrototype();
}

function sinkFleetShip(zone, targetIndex, winnerZone = "bottom") {
  const ship = appState.fleets[zone][targetIndex];
  if (!ship || ship.sunk) {
    return;
  }
  const originalImage = ship.originalImage || ship.image;
  const attachedSalvos = (ship.salvos || []).map((salvo) => ({
    image: salvo.image,
    label: salvo.label,
  }));

  if (attachedSalvos.length) {
    addToDiscardPile(attachedSalvos);
  }

  ship.salvos = [];
  ship.sunk = true;
  ship.isSinking = true;
  ship.originalImage = originalImage;
  ship.image = originalImage;

  const { total } = parseDamage(ship.damage);
  ship.damage = formatDamage(0, total);

  appState.victoryPiles[winnerZone].push({
    ship: ship.ship,
    image: originalImage,
  });

  playShipSinkSound();
  appendLog(`${ship.ship} is sunk and moved to ${getPlayerName(winnerZone)}'s Victory Pile.`);
}

async function attachCardToEnemyShip(card, targetZone, targetIndex, targetShipIdOverride = null) {
  if (appState.serverSession?.connected) {
    const targetShip =
      targetShipIdOverride ||
      appState.fleets[targetZone]?.[targetIndex]?.shipId ||
      null;
    const targetPlayerId = appState.fleetsByZone?.[targetZone]?.playerId || null;
    if (!targetShip || !targetPlayerId) {
      appendLog(`Server play blocked: target mapping missing for ${card.label}.`);
      renderPrototype();
      return;
    }
    const commandByKind = {
      salvo: "play_salvo",
      additional_damage: "play_additional_damage",
      submarine: "play_submarine",
      torpedo_boat: "play_torpedo_boat",
    };
    const commandType = commandByKind[card.kind];
    if (!commandType) {
      appendLog(`Server play blocked: ${card.label} target command is not supported yet.`);
      renderPrototype();
      return;
    }
    await submitServerCommand({
      type: commandType,
      actorId: appState.serverSession.viewerPlayerId,
      cardId: card.id,
      targetPlayerId,
      targetShipId: targetShip,
    });
    return;
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.airStrikeMode) {
    appendLog(`${card.label} cannot be played after committing this turn to air strikes.`);
    setDiceResolution("—", "Air strike phase active", "Carrier operations replace the normal draw-and-play sequence.", "End the turn after your air strikes instead of playing a hand card.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play") {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} can only be played during the play phase.`);
    renderPrototype();
    return;
  }

  if (appState.turnState.playedCard) {
    markRejectedHandCard(card.id);
    appendLog(`Only one card can be played each turn. ${card.label} stays in hand.`);
    renderPrototype();
    return;
  }

  if (card.kind === "submarine") {
    resolveSubmarineStrike(card, targetZone, targetIndex);
    return;
  }

  if (card.kind === "torpedo_boat") {
    if (!canTargetFleetWithAction("torpedo_boat", targetZone)) {
      const ship = appState.fleets[targetZone][targetIndex];
      markRejectedHandCard(card.id);
      appendLog(`Torpedo Boat cannot target ${ship.ship} because smoke is screening that fleet.`);
      setDiceResolution("—", "Torpedo attack blocked", `${getPlayerName("bottom")} lines up a torpedo run on ${ship.ship}.`, "Smoke blocks torpedo boat attacks on that fleet.");
      renderPrototype();
      return;
    }
    resolveTorpedoBoatStrike(card, targetZone, targetIndex);
    return;
  }

  if (!canTargetFleetWithAction(card.kind, targetZone)) {
    const ship = appState.fleets[targetZone][targetIndex];
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot target ${ship.ship} because smoke is screening that fleet.`);
    setDiceResolution("—", "Attack blocked by smoke", `${getPlayerName("bottom")} attempts to target ${ship.ship}.`, "Only submarines and Additional Damage can attack through smoke.");
    renderPrototype();
    return;
  }

  if (card.kind === "salvo" && !hasMatchingGunForSalvo(card)) {
    markRejectedHandCard(card.id);
    appendLog(`${card.label} cannot be played because ${getPlayerName("bottom")} has no matching ${card.gunSize} ships afloat.`);
    setDiceResolution("—", "Salvo unavailable", `${card.label} needs a matching gun caliber in the fleet.`, `No afloat ${card.gunSize} ships are available to fire that salvo.`);
    renderPrototype();
    return;
  }

  const ship = appState.fleets[targetZone][targetIndex];
  if (card.kind === "salvo" && isCarrierScreened(targetZone, targetIndex)) {
    markRejectedHandCard(card.id);
    appendLog(`${ship.ship} cannot be targeted by salvo while other ships in that fleet are still afloat.`);
    setDiceResolution(
      "—",
      "Carrier screened",
      `${ship.ship} is protected by the rest of its fleet.`,
      "Sink every non-carrier ship in that fleet before targeting the carrier with salvos."
    );
    renderPrototype();
    return;
  }
  if (card.kind === "additional_damage" && !canAdditionalDamageTargetShip(targetZone, targetIndex)) {
    markRejectedHandCard(card.id);
    appendLog(`Additional Damage needs an existing salvo stack on ${ship.ship} before it can be played.`);
    setDiceResolution(
      "—",
      "Additional Damage unavailable",
      `${ship.ship} has no salvo stack to reinforce.`,
      "Play Additional Damage on a ship that already has one or more attached salvos."
    );
    renderPrototype();
    return;
  }
  if (card.kind === "additional_damage" && targetZone === "bottom") {
    markRejectedHandCard(card.id);
    appendLog("Additional Damage cannot target your own ships.");
    setDiceResolution(
      "—",
      "Additional Damage unavailable",
      "Additional Damage can only be played on an opponent ship with an existing salvo stack.",
      "Choose an enemy ship that already has one or more attached salvos."
    );
    renderPrototype();
    return;
  }
  ship.salvos = ship.salvos || [];
  ship.salvos.push({ image: card.image, label: card.label });
  if (card.kind === "additional_damage") {
    showSpecialBanner("Additional Damage", `${ship.ship} takes extra damage from an existing salvo stack.`);
    playAdditionalDamageSound();
  }
  removeHandCard(card.id);

  if (typeof card.hits === "number") {
    const { remaining, total } = parseDamage(ship.damage);
    const nextRemaining = Math.max(remaining - card.hits, 0);
    ship.damage = formatDamage(nextRemaining, total);
    if (card.kind === "salvo") {
      playSalvoHitSound(card);
    }

    if (nextRemaining === 0) {
      addToDiscardPile([{ image: card.image, label: card.label }]);
      sinkFleetShip(targetZone, targetIndex);
      queueShipImpact(targetZone, targetIndex, true);
      maybeEndRound();
      finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after playing ${card.label}.`);
      return;
    } else {
      appendLog(`${card.label} hits ${ship.ship} for ${card.hits}.`);
    }
  } else {
    appendLog(`${card.label} is assigned to ${ship.ship}.`);
  }

  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after playing ${card.label}.`);
  if (card.kind === "salvo") {
    queueShipImpact(targetZone, targetIndex, false);
  }
}

async function deployCenterCard(card) {
  if (appState.serverSession?.connected) {
    const commandMap = {
      smoke: "play_smoke",
      destroyer_squadron: "play_destroyer_squadron",
      additional_ship: "play_additional_ship",
    };
    const type = commandMap[card.kind];
    if (!type) {
      appendLog(`Server deployment unsupported for ${card.label}.`);
      renderPrototype();
      return;
    }
    await submitServerCommand({
      type,
      actorId: appState.serverSession.viewerPlayerId,
      cardId: card.id,
    });
    return;
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.airStrikeMode) {
    appendLog("Repair cannot be played after committing this turn to air strikes.");
    setDiceResolution("—", "Air strike phase active", "Carrier operations replace the normal draw-and-play sequence.", "End the turn after your air strikes instead of playing a hand card.");
    renderPrototype();
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog(`${card.label} can only be deployed during the play phase.`);
    renderPrototype();
    return;
  }

  if (appState.turnState.playedCard) {
    appendLog(`Only one card can be played each turn. ${card.label} stays in hand.`);
    renderPrototype();
    return;
  }
  if (card.kind === "additional_ship") {
    resolveAdditionalShipCard(card);
    return;
  }
  appState.effectsByFleet.bottom.push({
    id: card.id,
    kind: card.kind,
    label: card.label,
    image: card.image,
    damage: card.kind === "destroyer_squadron" ? "4 / 4" : undefined,
    salvos: card.kind === "destroyer_squadron" ? [] : undefined,
    expiresOnTurn: undefined,
  });
  if (card.kind === "smoke") {
    playSmokeSound();
    showSpecialBanner("Smoke Screen", `${getPlayerName("bottom")}'s fleet is screened from most attacks.`);
  }
  if (card.kind === "destroyer_squadron") {
    playDestroyersSound();
    showSpecialBanner("Destroyer Squadron", "Destroyers are deployed into the battle zone.");
  }
  removeHandCard(card.id);
  appendLog(`${card.label} is deployed to the battle zone for ${getPlayerName("bottom")}.`);
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after deploying ${card.label}.`);
}

async function playFleetTargetCard(card, targetZone) {
  if (appState.serverSession?.connected) {
    const targetPlayerId = appState.fleetsByZone?.[targetZone]?.playerId || null;
    if (!targetPlayerId) {
      appendLog(`Server play blocked: missing fleet target for ${card.label}.`);
      renderPrototype();
      return;
    }
    if (card.kind === "minefield") {
      await submitServerCommand({
        type: "play_minefield",
        actorId: appState.serverSession.viewerPlayerId,
        cardId: card.id,
        targetPlayerId,
      });
      return;
    }
    if (card.kind === "minesweeper") {
      await submitServerCommand({
        type: "play_minesweeper",
        actorId: appState.serverSession.viewerPlayerId,
        cardId: card.id,
        targetPlayerId,
      });
      return;
    }
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog(`${card.label} can only be played during the play phase.`);
    renderPrototype();
    return;
  }

  if (appState.turnState.playedCard) {
    appendLog(`Only one card can be played each turn. ${card.label} stays in hand.`);
    renderPrototype();
    return;
  }

  if (card.kind === "minefield") {
    if (targetZone === "bottom") {
      appendLog(`Minefield cannot be played on ${getPlayerName("bottom")}'s own fleet.`);
      renderPrototype();
      return;
    }
    removeHandCard(card.id);
    const effect = {
      id: card.id,
      kind: "minefield",
      label: card.label,
      image: card.image,
      hits: card.hits,
    };
    addFleetEffect(targetZone, effect);
    showSpecialBanner(card.label, `Minefield is placed in front of the ${targetZone} fleet.`);
    playMinesSound();
    appendLog(`${card.label} is placed in front of the ${targetZone} fleet.`);
    applyMinefieldDamageToFleet(targetZone, effect);
    maybeEndRound();
    finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after deploying ${card.label}.`);
    return;
  }

  if (card.kind === "minesweeper") {
    const minefields = (appState.effectsByFleet[targetZone] || []).filter((effect) => effect.kind === "minefield");
    if (!minefields.length) {
      appendLog(`Minesweeper finds no minefields in front of the ${targetZone} fleet.`);
      renderPrototype();
      return;
    }

    appState.effectsByFleet[targetZone] = (appState.effectsByFleet[targetZone] || []).filter(
      (effect) => effect.kind !== "minefield"
    );
    removeHandCard(card.id);
    addToDiscardPile([
      ...minefields.map((effect) => ({ image: effect.image, label: effect.label })),
      { image: card.image, label: card.label },
    ]);
    showSpecialBanner("Minesweeper", `Minefields are cleared from the ${targetZone} fleet.`);
    playMinesweeperSound();
    appendLog(`Minesweeper clears the minefields in front of the ${targetZone} fleet.`);
    finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after sweeping the mines.`);
  }
}

async function repairOwnShip(card, targetIndex, targetShipIdOverride = null) {
  if (appState.serverSession?.connected) {
    const targetShipId = targetShipIdOverride || appState.fleets.bottom?.[targetIndex]?.shipId;
    if (!targetShipId) {
      appendLog("Server repair blocked: missing target ship id.");
      renderPrototype();
      return;
    }
    await submitServerCommand({
      type: "play_repair",
      actorId: appState.serverSession.viewerPlayerId,
      cardId: card.id,
      targetShipId,
    });
    return;
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog("Repair can only be played during the play phase.");
    renderPrototype();
    return;
  }

  if (appState.turnState.playedCard) {
    appendLog("Only one card can be played each turn. Repair stays in hand.");
    renderPrototype();
    return;
  }
  const ship = appState.fleets.bottom[targetIndex];
  if (!ship.salvos?.length) {
    appendLog(`Repair was dragged to ${ship.ship}, but there was no attached damage to clear.`);
    return;
  }
  const clearedSalvo = ship.salvos.shift();
  addToDiscardPile([
    ...(clearedSalvo ? [{ image: clearedSalvo.image, label: clearedSalvo.label }] : []),
    { image: card.image, label: card.label },
  ]);
  removeHandCard(card.id);
  showSpecialBanner("Repair", `${ship.ship} removes one attached salvo.`);
  playRepairSound();
  appendLog(`${ship.ship} is repaired and one attached salvo is cleared.`);
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after the repair.`);
}

async function resolveAdditionalShipCard(card) {
  if (appState.serverSession?.connected) {
    await submitServerCommand({
      type: "play_additional_ship",
      actorId: appState.serverSession.viewerPlayerId,
      cardId: card.id,
    });
    return;
  }
  if (!ensureForcedCard(card)) {
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog("Additional Ship can only be resolved during the play phase.");
    renderPrototype();
    return;
  }
  if (appState.turnState.playedCard) {
    appendLog("Only one card can be played each turn. Additional Ship stays in hand.");
    renderPrototype();
    return;
  }

  removeHandCard(card.id);
  addToDiscardPile([{ image: card.image, label: card.label }]);
  playDrawCardSound();
  const newShip = drawShipFromDeck();
  if (newShip) {
    appState.fleets.bottom.push(newShip);
    normalizeBottomFleetOrder();
    showSpecialBanner("Additional Ship", `${newShip.ship} is drawn from the ship deck.`);
    appendLog(`${newShip.ship} joins ${getPlayerName("bottom")}'s fleet from the ship deck.`);
    setDiceResolution(
      "—",
      "Additional Ship resolved",
      `${card.label} is discarded immediately.`,
      `${newShip.ship} is added to ${getPlayerName("bottom")}'s fleet.`
    );
  } else {
    appendLog("The ship deck is empty, so Additional Ship cannot add a new vessel.");
  }
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after resolving Additional Ship.`);
}

function playOwnShipCard(card, targetIndex, targetShipIdOverride = null) {
  if (card.kind === "additional_ship") {
    resolveAdditionalShipCard(card);
    return;
  }

  repairOwnShip(card, targetIndex, targetShipIdOverride);
}

async function discardHandCardAsAction(card) {
  if (card.kind === "additional_ship") {
    resolveAdditionalShipCard(card);
    return;
  }
  if (appState.serverSession?.connected) {
    await submitServerCommand({
      type: "discard_play_card",
      actorId: appState.serverSession.viewerPlayerId,
      cardId: card.id,
    });
    return;
  }
  if (appState.turnState.phase !== "play") {
    appendLog(`${card.label} can only be discarded during the play phase.`);
    renderPrototype();
    return;
  }
  if (appState.turnState.playedCard) {
    appendLog(`Only one action can be taken each turn. ${card.label} stays in hand.`);
    renderPrototype();
    return;
  }
  if (ensureForcedCard(card) === false || IMMEDIATE_PLAY_KINDS.has(card.kind)) {
    appendLog(`${card.label} must be played, not discarded.`);
    renderPrototype();
    return;
  }

  discardHandCard(card);
  appendLog(`${card.label} is discarded as ${getPlayerName("bottom")}'s action for the turn.`);
  finalizeHumanTurn(`${getPlayerName("bottom")}'s turn ends after discarding a play card.`);
}

screenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.targetScreen);
  });
});

if (hostLobbyButton) {
  hostLobbyButton.addEventListener("click", async () => {
    if (playerNameInput) {
      setHumanPlayerName(playerNameInput.value);
    }
    await hostLobbyFromUi();
  });
}

if (joinLobbyButton) {
  joinLobbyButton.addEventListener("click", async () => {
    if (playerNameInput) {
      setHumanPlayerName(playerNameInput.value);
    }
    await joinLobbyFromUi();
  });
}

if (startMatchButton) {
  startMatchButton.addEventListener("click", async () => {
    await startHostedMatchFromUi();
  });
}

if (readyToggleButton) {
  readyToggleButton.addEventListener("click", async () => {
    await toggleReadyFromUi();
  });
}

if (setupModeSoloButton) {
  setupModeSoloButton.addEventListener("click", () => {
    setSetupMode("solo");
    renderPrototype();
  });
}

if (setupModeMultiplayerButton) {
  setupModeMultiplayerButton.addEventListener("click", () => {
    setSetupMode("multiplayer");
    renderPrototype();
  });
}

if (copyJoinCodeButton) {
  copyJoinCodeButton.addEventListener("click", async () => {
    const code = appState.serverSession?.joinCode;
    if (!code) {
      appendLog("No join code to copy yet. Host a lobby first.");
      renderPrototype();
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      appendLog(`Join code ${code} copied to clipboard.`);
    } catch {
      appendLog(`Unable to copy automatically. Join code: ${code}`);
    }
    renderPrototype();
  });
}

if (playerNameInput) {
  playerNameInput.addEventListener("input", () => {
    setHumanPlayerName(playerNameInput.value);
    renderPrototype();
  });
}

if (playerCountSelect) {
  playerCountSelect.addEventListener("change", () => {
    appState.tableConfig.playerCount = Math.min(4, Math.max(2, Number(playerCountSelect.value || 4)));
    syncLobbySeatPreview();
    renderPrototype();
  });
}

if (cardSetSelect) {
  cardSetSelect.addEventListener("change", () => {
    appState.tableConfig.cardSet = cardSetSelect.value || CLASSIC_SET_ID;
    syncLobbySeatPreview();
    renderDeckBrowser();
    renderPrototype();
  });
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMatchMode(button.dataset.modeSelect);
  });
});

rulesButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openRules();
  });
});

logButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openCombatLog();
  });
});

scoreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openScoreCard();
  });
});

targetBoardToggle.addEventListener("change", () => {
  appState.ui.showTargetBoard = targetBoardToggle.checked;
  renderPrototype();
});

if (dragModeToggle) {
  dragModeToggle.addEventListener("change", () => {
    appState.ui.interactionMode = dragModeToggle.checked ? "drag" : "select";
    clearTouchSelection();
    clearTargetingLine();
    renderPrototype();
  });
}

if (soundToggle) {
  audioEnabled = soundToggle.checked;
  soundToggle.addEventListener("change", () => {
    audioEnabled = soundToggle.checked;
    if (audioEnabled) {
      setAudioStatus("tap Test Sound", { event: "sound-toggle" });
    }
    if (!audioEnabled) {
      setAudioStatus("off", { event: "sound-toggle" });
    }
  });
}

if (testSoundButton) {
  testSoundButton.addEventListener("click", async () => {
    audioEnabled = true;
    if (soundToggle) {
      soundToggle.checked = true;
    }
    audioDiagnostics.lastTestAt = new Date().toISOString();
    setAudioStatus("testing", { event: "manual-test" });
    let ok = false;
    try {
      await playWebAudioTone("manual-test:tone");
      ok = await playWebAudio("../assets/sound/draw-card.wav", "manual-test:web-audio");
    } catch (webAudioError) {
      setAudioStatus("web blocked", {
        error: webAudioError instanceof Error ? `${webAudioError.name}: ${webAudioError.message}` : String(webAudioError),
        event: "manual-test:web-audio",
      });
      ok = await playAudioElement(drawCardAudio, "manual-test:draw-card.wav");
    }
    if (ok) {
      appendLog("Audio test succeeded.");
    } else {
      appendLog(`Audio test failed: ${audioDiagnostics.lastError || "browser blocked playback"}`);
    }
    renderPrototype();
  });
}

useAirStrikeButton.addEventListener("click", () => {
  if (!isHumanTurn()) {
    return;
  }
  startAirStrikePhase();
});

if (endTurnButton) {
  endTurnButton.addEventListener("click", async () => {
    if (!shouldRequireManualEndTurn() || !isHumanTurn()) {
      return;
    }
    if (appState.serverSession?.connected) {
      await submitServerCommand({
        type: "end_turn",
        actorId: appState.serverSession.viewerPlayerId,
      });
      return;
    }
    startNextTurn();
  });
}

if (quitGameButton) {
  quitGameButton.addEventListener("click", () => {
    quitCurrentGame();
  });
}

if (quitGameButtonMobile) {
  quitGameButtonMobile.addEventListener("click", () => {
    quitCurrentGame();
  });
}

if (saveGameButton) {
  saveGameButton.addEventListener("click", () => {
    saveCurrentGame();
  });
}

if (saveGameButtonMobile) {
  saveGameButtonMobile.addEventListener("click", () => {
    saveCurrentGame();
  });
}

if (loadGameButton) {
  loadGameButton.addEventListener("click", () => {
    loadSavedGame();
  });
}

if (viewCardSetButton) {
  viewCardSetButton.addEventListener("click", () => {
    openDeckBrowser();
  });
}

victoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openVictoryPile(button.dataset.victoryPile);
  });
});

document.addEventListener("contextmenu", (event) => {
  const zoomTarget = event.target.closest("[data-zoom-src]");
  if (!zoomTarget) {
    return;
  }
  event.preventDefault();
  openZoom(zoomTarget.dataset.zoomSrc, zoomTarget.dataset.zoomLabel || "Card detail");
});

document.addEventListener("pointerdown", (event) => {
  if (!IS_TOUCH_DEVICE || event.pointerType !== "touch") {
    return;
  }
  const zoomTarget = event.target.closest("[data-zoom-src]");
  if (!zoomTarget) {
    return;
  }
  longPressTarget = zoomTarget;
  window.clearTimeout(longPressTimer);
  longPressTimer = window.setTimeout(() => {
    if (!longPressTarget) return;
    openZoom(longPressTarget.dataset.zoomSrc, longPressTarget.dataset.zoomLabel || "Card detail");
    suppressClickUntil = Date.now() + 700;
    longPressTarget = null;
  }, 520);
});

document.addEventListener("pointerup", () => {
  window.clearTimeout(longPressTimer);
  longPressTarget = null;
});

document.addEventListener("pointercancel", () => {
  window.clearTimeout(longPressTimer);
  longPressTarget = null;
});

document.addEventListener("click", (event) => {
  if (Date.now() < suppressClickUntil) {
    return;
  }
  if (event.target.closest("[data-next-campaign-round]")) {
    startNextCampaignRound();
    return;
  }

  if (event.target.closest("[data-dismiss-winner-banner]")) {
    closeWinnerBanner();
    return;
  }

  const drawDeckTarget = event.target.closest("[data-draw-deck='play']");
  if (drawDeckTarget) {
    if (!isHumanTurn()) {
      return;
    }
    drawPlayCardForTurn();
    return;
  }

  const salvoTarget = event.target.closest("[data-salvos]");
  if (salvoTarget) {
    openSalvoPile(
      salvoTarget.dataset.salvoShip || "Ship",
      JSON.parse(salvoTarget.dataset.salvos || "[]")
    );
    return;
  }

  if (event.target === zoomOverlay) {
    closeZoom();
    return;
  }

  if (event.target === rulesOverlay) {
    closeRules();
    return;
  }

  if (event.target === victoryOverlay) {
    closeVictoryPile();
    return;
  }

  if (event.target === salvoOverlay) {
    closeSalvoPile();
    return;
  }

  if (event.target === logOverlay) {
    closeCombatLog();
    return;
  }

  if (event.target === scoreOverlay) {
    closeScoreCard();
    return;
  }

  if (event.target === deckOverlay) {
    closeDeckBrowser();
  }
});

zoomClose.addEventListener("click", closeZoom);
rulesClose.addEventListener("click", closeRules);
victoryClose.addEventListener("click", closeVictoryPile);
salvoClose.addEventListener("click", closeSalvoPile);
logClose.addEventListener("click", closeCombatLog);
scoreClose.addEventListener("click", closeScoreCard);
deckClose.addEventListener("click", closeDeckBrowser);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !zoomOverlay.hidden) {
    closeZoom();
    return;
  }

  if (event.key === "Escape" && !rulesOverlay.hidden) {
    closeRules();
    return;
  }

  if (event.key === "Escape" && !victoryOverlay.hidden) {
    closeVictoryPile();
    return;
  }

  if (event.key === "Escape" && !salvoOverlay.hidden) {
    closeSalvoPile();
    return;
  }

  if (event.key === "Escape" && !logOverlay.hidden) {
    closeCombatLog();
    return;
  }

  if (event.key === "Escape" && !scoreOverlay.hidden) {
    closeScoreCard();
    return;
  }

  if (event.key === "Escape" && !deckOverlay.hidden) {
    closeDeckBrowser();
  }
});

document.addEventListener("dragstart", (event) => {
  const target = event.target.closest("[data-drag-type]");
  if (!target) return;
  if (!isDragInteractionEnabled()) {
    event.preventDefault();
    return;
  }
  if (!isHumanTurn()) {
    event.preventDefault();
    return;
  }

  if (target.dataset.dragType === "fleet_ship") {
    dragState = {
      type: "fleet_ship",
      fromIndex: Number(target.dataset.shipIndex),
      isCarrier: target.dataset.isCarrier === "true",
    };
    highlightValidTargets();
  } else if (target.dataset.dragType === "hand_card") {
    const draggedCard = getDisplayedHandCardById(target.dataset.cardId);
    if (event.dataTransfer) {
      setCompactDragPreview(event, target, draggedCard);
    }
    dragState = {
      type: "hand_card",
      cardId: target.dataset.cardId,
      dropMode: target.dataset.dropMode,
    };
    dragPointer = {
      x: event.clientX || target.getBoundingClientRect().right,
      y: event.clientY || target.getBoundingClientRect().top,
    };
    highlightValidTargets();
    updateTargetingLine();
  } else if (target.dataset.dragType === "battle_effect") {
    dragState = {
      type: "battle_effect",
      effectId: target.dataset.effectId,
      effectKind: target.dataset.effectKind,
    };
    highlightValidTargets();
  }
});

document.addEventListener("dragover", (event) => {
  const dropTarget = event.target.closest("[data-drop-type], [data-zone='bottom'][data-ship-index]");
  dragPointer = { x: event.clientX, y: event.clientY };
  dragTargetElement = null;
  const draggedHandCard =
    dragState?.type === "hand_card"
      ? getDisplayedHandCardById(dragState.cardId)
      : null;
  if (dragState && dragState.type === "fleet_ship" && dragState.isCarrier) {
    updateTargetingLine();
  }
  if (!dropTarget || !dragState) return;

  if (
    (dragState.type === "fleet_ship" && dropTarget.dataset.zone === "bottom") ||
    (dragState.type === "fleet_ship" &&
      dragState.isCarrier &&
      appState.turnState.phase === "play" &&
      appState.turnState.airStrikeMode &&
      !getForcedImmediateCard() &&
      hasUnusedCarrier(dragState.fromIndex) &&
      (dropTarget.dataset.dropType === "enemy_ship" || dropTarget.dataset.dropType === "destroyer_target") &&
      ((!appState.serverSession?.connected && isDestroyerTarget(dropTarget)) ||
        canTargetFleetWithAction("carrier_airstrike", dropTarget.dataset.zone))) ||
    (dragState.type === "hand_card" &&
      draggedHandCard &&
      appState.turnState.phase === "play" &&
      !appState.turnState.playedCard &&
      (!appState.turnState.airStrikeMode || draggedHandCard.kind === "carrier_airstrike") &&
      (!getForcedImmediateCard() || getForcedImmediateCard()?.id === dragState.cardId) &&
      canHandCardDropOnTarget(draggedHandCard, dropTarget)) ||
    (dragState.type === "battle_effect" &&
      dragState.effectKind === "destroyer_squadron" &&
      appState.turnState.phase === "play" &&
      !appState.turnState.playedCard &&
      !appState.turnState.airStrikeMode &&
      !getForcedImmediateCard() &&
      dropTarget.dataset.dropType === "enemy_ship" &&
      canTargetFleetWithAction("destroyer_squadron", dropTarget.dataset.zone))
  ) {
    event.preventDefault();

    if (dragState.type === "fleet_ship" && dropTarget.dataset.zone === "bottom") {
      clearFleetDropPreview();
      const rect = dropTarget.getBoundingClientRect();
      const before = event.clientX < rect.left + rect.width / 2;
      dropTarget.classList.add(before ? "drop-preview-before" : "drop-preview-after");
      fleetDropPreview = {
        targetIndex: Number(dropTarget.dataset.shipIndex),
        before,
      };
    }

    if (dragState.type === "hand_card" || dragState.type === "battle_effect") {
      dragTargetElement = dropTarget;
      updateTargetingLine();
    }

    if (dragState.type === "fleet_ship" && dragState.isCarrier) {
      dragTargetElement = dropTarget;
      updateTargetingLine();
    }
  }
});

document.addEventListener("drop", (event) => {
  const dropTarget = event.target.closest("[data-drop-type], [data-zone='bottom'][data-ship-index]");
  if (!dropTarget || !dragState) return;
  event.preventDefault();

  if (dragState.type === "fleet_ship" && dropTarget.dataset.zone === "bottom") {
    const targetIndex = fleetDropPreview?.targetIndex ?? Number(dropTarget.dataset.shipIndex);
    const before = fleetDropPreview?.before ?? true;
    let insertIndex = targetIndex;
    if (!before) {
      insertIndex = targetIndex + 1;
    }
    if (dragState.fromIndex < targetIndex && before) {
      insertIndex -= 1;
    }
    if (dragState.fromIndex < targetIndex && !before) {
      insertIndex = targetIndex;
    }
    moveBottomFleetShip(dragState.fromIndex, insertIndex);
  }

  if (
    dragState.type === "fleet_ship" &&
    dragState.isCarrier &&
    (dropTarget.dataset.dropType === "enemy_ship" || dropTarget.dataset.dropType === "destroyer_target")
  ) {
    if (isDestroyerTarget(dropTarget)) {
      if (appState.serverSession?.connected) {
        markRejectedHandCard(`carrier-airstrike-${dragState.fromIndex}`);
        dragState = null;
        return;
      }
      resolveCarrierAirStrikeOnDestroyer(dragState.fromIndex, dropTarget.dataset.zone, dropTarget.dataset.effectId);
    } else {
      resolveCarrierAirStrike(dragState.fromIndex, dropTarget.dataset.zone, Number(dropTarget.dataset.shipIndex));
    }
  }

  if (dragState.type === "hand_card") {
    const card = getDisplayedHandCardById(dragState.cardId);
    if (!card) {
      dragState = null;
      return;
    }
    resolveHandCardDrop(card, dropTarget);
  }

  if (
    dragState.type === "battle_effect" &&
    dragState.effectKind === "destroyer_squadron" &&
    dropTarget.dataset.dropType === "enemy_ship"
  ) {
    resolveDestroyerSquadronStrike(dragState.effectId, dropTarget.dataset.zone);
  }

  clearFleetDropPreview();
  clearTargetingLine();
  removeDragPreviewGhost();
  dragState = null;
});

document.addEventListener("dragend", () => {
  if (dragState?.type === "hand_card") {
    markRejectedHandCard(dragState.cardId);
    renderPrototype();
  }
  clearFleetDropPreview();
  clearTargetingLine();
  clearValidTargetHighlights();
  removeDragPreviewGhost();
  dragState = null;
});

document.addEventListener("click", (event) => {
  if (Date.now() < suppressClickUntil) {
    return;
  }
  if (!isSelectInteractionEnabled() || appState.match.isRoundOver || !isHumanTurn() || appState.turnState.phase !== "play") {
    return;
  }

  const cardNode = event.target.closest("[data-drag-type='hand_card']");
  if (cardNode) {
    const card = getDisplayedHandCardById(cardNode.dataset.cardId);
    if (!card) {
      return;
    }
    if (appState.ui.touchSelectedCardId === card.id) {
      clearTouchSelection();
      renderPrototype();
      return;
    }
    if (!isCardPlayableNow(card) && !IMMEDIATE_PLAY_KINDS.has(card.kind)) {
      markRejectedHandCard(card.id);
      renderPrototype();
      return;
    }
    appState.ui.touchSelectedCardId = card.id;
    renderPrototype();
    return;
  }

  const targetNode = event.target.closest("[data-drop-type], [data-zone='bottom'][data-ship-index]");
  if (targetNode && appState.ui.touchSelectedCardId) {
    const selectedCard = getDisplayedHandCardById(appState.ui.touchSelectedCardId);
    const played = resolveHandCardDrop(selectedCard, targetNode);
    clearTouchSelection();
    if (!played && selectedCard?.id) {
      markRejectedHandCard(selectedCard.id);
    }
    renderPrototype();
    return;
  }

  if (appState.ui.touchSelectedCardId) {
    clearTouchSelection();
    renderPrototype();
  }
});
appState.serverSession.clientId = getOrCreateClientId();
setSetupMode(appState.setupMode || "solo");
renderPrototype();
restoreServerSessionFromStorage().then(async (restored) => {
  if (restored && appState.serverSession?.status === "in_progress") {
    setSetupMode("multiplayer");
    await refreshServerViewAndRender();
    showScreen("table");
    return;
  }
  renderPrototype();
  showScreen("splash");
}).catch(() => {
  renderPrototype();
  showScreen("splash");
});
