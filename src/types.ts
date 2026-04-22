export type PlayerId = string;
export type TeamId = string;
export type ShipId = string;
export type CardId = string;
export type SeatId = 0 | 1 | 2 | 3;

export type GunCaliber = '11"' | '12.6"' | '14"' | '15"' | '16"' | '18"';
export type SalvoHits = 1 | 2 | 3 | 4;
export type CardZone = "play_deck" | "player_hand" | "fleet_attachment" | "discard_pile";
export type FleetEffectKind = "smoke" | "minefield" | "submarine" | "destroyer_squadron" | "torpedo_boat";
export type GameMode = "skirmish" | "campaign";
export type RoundEndReason = "elimination" | "play_deck_empty";
export type SeatRole = "human" | "bot" | "empty";
export type TableSide = "bottom" | "left" | "top" | "right";
export type ResponsiveTableLayout = "solo" | "duel" | "triangle" | "four_way";

export type Phase = "normal" | "round_complete";

export interface ShipCard {
  id: ShipId;
  name: string;
  hitNumber: number;
  gunCaliber?: GunCaliber;
  isCarrier: boolean;
  faction: string;
}

export interface SalvoCard {
  id: CardId;
  kind: "salvo";
  gunCaliber: GunCaliber;
  hits: SalvoHits;
}

export interface SmokeCard {
  id: CardId;
  kind: "smoke";
}

export interface MinefieldCard {
  id: CardId;
  kind: "minefield";
  hits: 1 | 2;
}

export interface AdditionalShipCard {
  id: CardId;
  kind: "additional_ship";
}

export interface SubmarineCard {
  id: CardId;
  kind: "submarine";
}

export interface TorpedoBoatCard {
  id: CardId;
  kind: "torpedo_boat";
}

export interface AdditionalDamageCard {
  id: CardId;
  kind: "additional_damage";
  hits: 1 | 2;
}

export interface RepairCard {
  id: CardId;
  kind: "repair";
}

export interface MinesweeperCard {
  id: CardId;
  kind: "minesweeper";
}

export interface DestroyerSquadronCard {
  id: CardId;
  kind: "destroyer_squadron";
  hits: 4;
}

export type PlayCard =
  | SalvoCard
  | SmokeCard
  | MinefieldCard
  | AdditionalShipCard
  | SubmarineCard
  | TorpedoBoatCard
  | AdditionalDamageCard
  | RepairCard
  | MinesweeperCard
  | DestroyerSquadronCard;

export interface DamageSource {
  type: "salvo" | "additional_damage" | "carrier_strike" | "minefield";
  cardId: CardId;
  ownerId: PlayerId;
  hits: number;
}

export interface FleetAttachment {
  card: PlayCard;
  source: DamageSource;
}

export interface FleetEffect {
  kind: FleetEffectKind;
  ownerId: PlayerId;
  card: PlayCard;
  hits?: number;
}

export interface ShipInstance {
  card: ShipCard;
  damage: DamageSource[];
  attachments: FleetAttachment[];
  sunk: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  teamId?: TeamId;
  ships: ShipInstance[];
  hand: PlayCard[];
  victoryPile: ShipCard[];
  eliminated: boolean;
  fleetEffects: FleetEffect[];
}

export interface GameOptions {
  maxHandSize: number;
  startingShipCount: number;
  startingHandSize: number;
  matchMode: GameMode;
  campaignTargetScore: number;
}

export interface LobbySeatConfig {
  seatId: SeatId;
  role: SeatRole;
  playerId: PlayerId | null;
  playerName: string | null;
  isHost: boolean;
  isLocalPlayer: boolean;
}

export interface LobbySetup {
  playerCount: 1 | 2 | 3 | 4;
  seats: LobbySeatConfig[];
}

export interface SeatReservation {
  playerId: PlayerId;
  playerName: string;
  role: Exclude<SeatRole, "empty">;
  preferredSeatId?: SeatId | null;
  isHost?: boolean;
  isLocalPlayer?: boolean;
}

export interface CanonicalSeatAssignment {
  seatId: SeatId;
  tableSide: TableSide;
  playerId: PlayerId;
  playerName: string;
  role: Exclude<SeatRole, "empty">;
  isHost: boolean;
  isLocalPlayer: boolean;
}

export interface ServerSeatRecord {
  seatId: SeatId;
  tableSide: TableSide;
  role: SeatRole;
  assignment: CanonicalSeatAssignment | null;
}

export interface ClientSeatView {
  side: TableSide;
  seatId: SeatId | null;
  role: SeatRole;
  assignment: CanonicalSeatAssignment | null;
}

export interface ClientSeatLayout {
  viewerSeatId: SeatId | null;
  mode: ResponsiveTableLayout;
  seatsBySide: Record<TableSide, ClientSeatView>;
  visibleSeats: ClientSeatView[];
  emptySides: TableSide[];
}

export interface EventRecord {
  type: string;
  actorId: PlayerId;
  detail: string;
}

export interface PendingDestroyerSquadron {
  id: CardId;
  ownerId: PlayerId;
  card: DestroyerSquadronCard;
  deployedTurn: number;
  hitsTaken: number;
}

export interface PendingDestroyerAttackSelection {
  destroyerId: CardId;
  ownerId: PlayerId;
  targetPlayerId: PlayerId;
  shipsToSink: number;
}

export interface CampaignRoundScore {
  roundNumber: number;
  scores: Record<PlayerId, number>;
}

export interface CampaignState {
  targetScore: number;
  totalScores: Record<PlayerId, number>;
  scoreHistory: CampaignRoundScore[];
  tieBreakerRound: boolean;
}

export interface GameState {
  phase: Phase;
  roundNumber: number;
  turnNumber: number;
  currentPlayerId: PlayerId;
  hasDrawnThisTurn: boolean;
  hasUsedCarrierStrikeThisTurn: boolean;
  hasPerformedActionThisTurn: boolean;
  players: PlayerState[];
  playDeck: PlayCard[];
  discardPile: PlayCard[];
  shipDeck: ShipCard[];
  destroyerSquadrons: PendingDestroyerSquadron[];
  pendingDestroyerAttack: PendingDestroyerAttackSelection | null;
  openingTurnPendingPlayerIds: PlayerId[];
  events: EventRecord[];
  winnerIds: PlayerId[];
  matchWinnerIds: PlayerId[];
  roundEndReason: RoundEndReason | null;
  campaign: CampaignState | null;
  options: GameOptions;
}

export interface DrawCardCommand {
  type: "draw_card";
  actorId: PlayerId;
}

export interface PlaySalvoCommand {
  type: "play_salvo";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
  targetShipId: ShipId;
}

export interface PlayAdditionalDamageCommand {
  type: "play_additional_damage";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
  targetShipId: ShipId;
}

export interface PlaySmokeCommand {
  type: "play_smoke";
  actorId: PlayerId;
  cardId: CardId;
}

export interface PlayMinefieldCommand {
  type: "play_minefield";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
}

export interface PlayAdditionalShipCommand {
  type: "play_additional_ship";
  actorId: PlayerId;
  cardId: CardId;
}

export interface PlayMinesweeperCommand {
  type: "play_minesweeper";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
}

export interface PlayRepairCommand {
  type: "play_repair";
  actorId: PlayerId;
  cardId: CardId;
  targetShipId: ShipId;
}

export interface PlaySubmarineCommand {
  type: "play_submarine";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
  targetShipId: ShipId;
}

export interface PlayTorpedoBoatCommand {
  type: "play_torpedo_boat";
  actorId: PlayerId;
  cardId: CardId;
  targetPlayerId: PlayerId;
  targetShipId: ShipId;
}

export interface PlayDestroyerSquadronCommand {
  type: "play_destroyer_squadron";
  actorId: PlayerId;
  cardId: CardId;
}

export interface AttackDestroyerSquadronCommand {
  type: "attack_destroyer_squadron";
  actorId: PlayerId;
  cardId: CardId;
  targetDestroyerId: CardId;
}

export interface ResolveDestroyerSquadronRollCommand {
  type: "resolve_destroyer_squadron_roll";
  actorId: PlayerId;
  destroyerId: CardId;
  targetPlayerId: PlayerId;
}

export interface SelectDestroyerSquadronTargetsCommand {
  type: "select_destroyer_squadron_targets";
  actorId: PlayerId;
  destroyerId: CardId;
  targetShipIds: ShipId[];
}

export interface UseCarrierStrikeCommand {
  type: "use_carrier_strike";
  actorId: PlayerId;
  strikes: Array<{
    carrierShipId: ShipId;
    targetPlayerId: PlayerId;
    targetShipId: ShipId;
  }>;
}

export interface EndTurnCommand {
  type: "end_turn";
  actorId: PlayerId;
}

export interface DiscardPlayCardCommand {
  type: "discard_play_card";
  actorId: PlayerId;
  cardId: CardId;
}

export type GameCommand =
  | DrawCardCommand
  | PlaySalvoCommand
  | PlayAdditionalDamageCommand
  | PlaySmokeCommand
  | PlayMinefieldCommand
  | PlayAdditionalShipCommand
  | PlayMinesweeperCommand
  | PlayRepairCommand
  | PlaySubmarineCommand
  | PlayTorpedoBoatCommand
  | PlayDestroyerSquadronCommand
  | AttackDestroyerSquadronCommand
  | ResolveDestroyerSquadronRollCommand
  | SelectDestroyerSquadronTargetsCommand
  | UseCarrierStrikeCommand
  | DiscardPlayCardCommand
  | EndTurnCommand;

export interface RandomSource {
  drawPlayCard(deck: PlayCard[]): { card: PlayCard; deck: PlayCard[] };
  drawShipCard(deck: ShipCard[]): { card: ShipCard; deck: ShipCard[] };
  shufflePlayDeck(deck: PlayCard[]): PlayCard[];
  shuffleShipDeck(deck: ShipCard[]): ShipCard[];
  rollDie(): number;
}
