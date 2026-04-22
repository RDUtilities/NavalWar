import type {
  CanonicalSeatAssignment,
  ClientSeatLayout,
  ClientSeatView,
  LobbySeatConfig,
  LobbySetup,
  SeatId,
  SeatReservation,
  ServerSeatRecord,
  TableSide,
  ResponsiveTableLayout
} from "./types.js";

export const CANONICAL_SEAT_ORDER: SeatId[] = [0, 1, 2, 3];
export const CANONICAL_TABLE_SIDES: TableSide[] = ["bottom", "left", "top", "right"];

const LAYOUT_SEATS: Record<Exclude<ResponsiveTableLayout, "solo">, SeatId[]> = {
  duel: [0, 2],
  triangle: [0, 1, 2],
  four_way: [0, 1, 2, 3]
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function tableSideForSeat(seatId: SeatId): TableSide {
  const side = CANONICAL_TABLE_SIDES[seatId];
  assert(side, `Seat ${seatId} does not map to a table side.`);
  return side;
}

export function layoutModeForPlayerCount(playerCount: number): ResponsiveTableLayout {
  assert(Number.isInteger(playerCount), "Player count must be an integer.");
  assert(playerCount >= 1 && playerCount <= 4, "Player count must be between 1 and 4.");

  if (playerCount === 1) {
    return "solo";
  }
  if (playerCount === 2) {
    return "duel";
  }
  if (playerCount === 3) {
    return "triangle";
  }
  return "four_way";
}

export function occupiedSeatIdsForPlayerCount(playerCount: number): SeatId[] {
  const mode = layoutModeForPlayerCount(playerCount);
  if (mode === "solo") {
    return [0];
  }
  return [...LAYOUT_SEATS[mode]];
}

export function createLobbySetup(playerCount: 1 | 2 | 3 | 4): LobbySetup {
  const occupiedSeatIds = new Set<SeatId>(occupiedSeatIdsForPlayerCount(playerCount));
  const seats: LobbySeatConfig[] = CANONICAL_SEAT_ORDER.map((seatId) => ({
    seatId,
    role: occupiedSeatIds.has(seatId) ? "empty" : "empty",
    playerId: null,
    playerName: null,
    isHost: false,
    isLocalPlayer: false
  }));

  return { playerCount, seats };
}

export function assignServerSeats(
  reservations: SeatReservation[],
  playerCount: 1 | 2 | 3 | 4
): ServerSeatRecord[] {
  const occupiedSeatIds = occupiedSeatIdsForPlayerCount(playerCount);
  const occupiedSeatSet = new Set<SeatId>(occupiedSeatIds);
  assert(
    reservations.length <= occupiedSeatIds.length,
    `Too many players for a ${playerCount}-player table.`
  );

  const preferredSeatOwners = new Map<SeatId, SeatReservation>();
  for (const reservation of reservations) {
    if (reservation.preferredSeatId == null) {
      continue;
    }
    assert(
      occupiedSeatSet.has(reservation.preferredSeatId),
      `Seat ${reservation.preferredSeatId} is not available in a ${playerCount}-player layout.`
    );
    assert(
      !preferredSeatOwners.has(reservation.preferredSeatId),
      `Seat ${reservation.preferredSeatId} was requested more than once.`
    );
    preferredSeatOwners.set(reservation.preferredSeatId, reservation);
  }

  const assignedReservations = new Set<SeatReservation>();
  const assignments: CanonicalSeatAssignment[] = [];

  for (const seatId of occupiedSeatIds) {
    const reservation = preferredSeatOwners.get(seatId);
    if (!reservation) {
      continue;
    }
    assignments.push({
      seatId,
      tableSide: tableSideForSeat(seatId),
      playerId: reservation.playerId,
      playerName: reservation.playerName,
      role: reservation.role,
      isHost: reservation.isHost ?? false,
      isLocalPlayer: reservation.isLocalPlayer ?? false
    });
    assignedReservations.add(reservation);
  }

  const remainingReservations = reservations.filter((reservation) => !assignedReservations.has(reservation));
  const remainingSeatIds = occupiedSeatIds.filter((seatId) => !preferredSeatOwners.has(seatId));

  remainingReservations.forEach((reservation, index) => {
    const seatId = remainingSeatIds[index];
    assert(seatId != null, "A remaining player could not be assigned a seat.");
    assignments.push({
      seatId,
      tableSide: tableSideForSeat(seatId),
      playerId: reservation.playerId,
      playerName: reservation.playerName,
      role: reservation.role,
      isHost: reservation.isHost ?? false,
      isLocalPlayer: reservation.isLocalPlayer ?? false
    });
  });

  const assignmentBySeat = new Map(assignments.map((assignment) => [assignment.seatId, assignment] as const));

  return CANONICAL_SEAT_ORDER.map((seatId) => {
    const assignment = assignmentBySeat.get(seatId) ?? null;
    const isSeatInLayout = occupiedSeatSet.has(seatId);

    return {
      seatId,
      tableSide: tableSideForSeat(seatId),
      role: assignment?.role ?? (isSeatInLayout ? "empty" : "empty"),
      assignment
    };
  });
}

export function rotateSeatToViewerSide(viewerSeatId: SeatId, targetSeatId: SeatId): TableSide {
  const viewerIndex = CANONICAL_SEAT_ORDER.indexOf(viewerSeatId);
  const targetIndex = CANONICAL_SEAT_ORDER.indexOf(targetSeatId);
  assert(viewerIndex >= 0 && targetIndex >= 0, "Seat rotation requires canonical seat ids.");
  const offset = (targetIndex - viewerIndex + CANONICAL_SEAT_ORDER.length) % CANONICAL_SEAT_ORDER.length;
  return CANONICAL_TABLE_SIDES[offset]!;
}

export function buildClientSeatLayout(
  seatRecords: ServerSeatRecord[],
  viewerSeatId: SeatId | null
): ClientSeatLayout {
  const occupiedSeatCount = seatRecords.filter((record) => record.assignment).length;
  const mode = layoutModeForPlayerCount(Math.max(1, occupiedSeatCount));

  const emptyView = (side: TableSide): ClientSeatView => ({
    side,
    seatId: null,
    role: "empty",
    assignment: null
  });

  const seatsBySide: Record<TableSide, ClientSeatView> = {
    bottom: emptyView("bottom"),
    left: emptyView("left"),
    top: emptyView("top"),
    right: emptyView("right")
  };

  const effectiveViewerSeatId =
    viewerSeatId ??
    seatRecords.find((record) => record.assignment?.isLocalPlayer)?.seatId ??
    seatRecords.find((record) => record.assignment)?.seatId ??
    null;

  const visibleSeatRecords = seatRecords.filter((record) => record.assignment);
  if (effectiveViewerSeatId == null) {
    return {
      viewerSeatId: null,
      mode,
      seatsBySide,
      visibleSeats: [],
      emptySides: CANONICAL_TABLE_SIDES
    };
  }

  for (const record of visibleSeatRecords) {
    const side = rotateSeatToViewerSide(effectiveViewerSeatId, record.seatId);
    seatsBySide[side] = {
      side,
      seatId: record.seatId,
      role: record.role,
      assignment: record.assignment
    };
  }

  const visibleSeats = CANONICAL_TABLE_SIDES.map((side) => seatsBySide[side]).filter(
    (seat): seat is ClientSeatView => seat.assignment !== null
  );
  const emptySides = CANONICAL_TABLE_SIDES.filter((side) => seatsBySide[side].assignment === null);

  return {
    viewerSeatId: effectiveViewerSeatId,
    mode,
    seatsBySide,
    visibleSeats,
    emptySides
  };
}
