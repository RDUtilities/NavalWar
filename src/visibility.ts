import type { EventRecord, GameState, PlayerId } from "./types.js";

/** Ordinary draws remain private until played. Mandatory special draws are public. */
export function visibleEvents(state: GameState, viewerId: PlayerId): EventRecord[] {
  return state.events.map(event => {
    if (event.type !== "card_drawn" || event.actorId === viewerId) return { ...event };
    const name = state.players.find(player => player.id === event.actorId)?.name ?? "An opponent";
    return { ...event, detail: `${name} drew a card.` };
  });
}
