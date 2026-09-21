import { applyCommand, listLegalCommands } from "./engine.js";
import type { GameCommand, GameState, PlayCard, RandomSource } from "./types.js";

export interface ActionOption {
  id: string;
  label: string;
  command: GameCommand;
}

/** Presentation choices are validated by the real engine, without consuming match randomness. */
export function actionOptions(state: GameState, actorId: string): ActionOption[] {
  const legal = listLegalCommands(state, actorId);
  const actor = state.players.find(player => player.id === actorId)!;
  const result: ActionOption[] = [];
  const preview: RandomSource = {
    rollDie: () => 2,
    drawPlayCard: deck => { if (!deck[0]) throw new Error("Empty deck"); return { card: deck[0], deck: deck.slice(1) }; },
    drawShipCard: deck => { if (!deck[0]) throw new Error("Empty deck"); return { card: deck[0], deck: deck.slice(1) }; },
    shufflePlayDeck: deck => [...deck], shuffleShipDeck: deck => [...deck]
  };
  function add(command: GameCommand, label: string) {
    if (!legal.includes(command.type)) return;
    try {
      applyCommand(state, command, preview);
      result.push({ id: JSON.stringify(command), label, command });
    } catch { /* Illegal candidate: do not present it as a valid target. */ }
  }
  add({ type: "draw_card", actorId }, "Draw a card");
  add({ type: "end_turn", actorId }, "End turn");
  for (const card of actor.hand) {
    add({ type: "discard_play_card", actorId, cardId: card.id }, "Discard this card");
    const type = `play_${card.kind}` as GameCommand["type"];
    if (!legal.includes(type)) continue;
    const base = { type, actorId, cardId: card.id };
    if (["smoke", "additional_ship", "destroyer_squadron"].includes(card.kind)) {
      add(base as GameCommand, `Play ${cardName(card)}`);
    } else if (["minefield", "minesweeper"].includes(card.kind)) {
      for (const player of state.players) if (!player.eliminated)
        add({ ...base, targetPlayerId: player.id } as GameCommand, `${player.name}'s fleet`);
    } else {
      for (const player of state.players) for (const ship of player.ships) if (!ship.sunk)
        add({ ...base, targetPlayerId: player.id, targetShipId: ship.card.id } as GameCommand, `${ship.card.name} · ${player.name}`);
    }
    if (card.kind === "salvo") for (const squadron of state.destroyerSquadrons)
      add({ type: "attack_destroyer_squadron", actorId, cardId: card.id, targetDestroyerId: squadron.id }, "Attack enemy Destroyer Squadron");
  }
  // A salvo may have only a squadron target and no legal ship attack.
  if (legal.includes("attack_destroyer_squadron")) for (const card of actor.hand.filter(card => card.kind === "salvo"))
    for (const squadron of state.destroyerSquadrons) {
      const command: GameCommand = { type: "attack_destroyer_squadron", actorId, cardId: card.id, targetDestroyerId: squadron.id };
      if (!result.some(entry => entry.id === JSON.stringify(command))) add(command, "Attack enemy Destroyer Squadron");
    }
  for (const squadron of state.destroyerSquadrons.filter(entry => entry.ownerId === actorId)) {
    add({ type: "discard_destroyer_squadron", actorId, destroyerId: squadron.id }, "Discard blocked Destroyer Squadron");
    for (const player of state.players) if (player.id !== actorId && !player.eliminated)
      add({ type: "resolve_destroyer_squadron_roll", actorId, destroyerId: squadron.id, targetPlayerId: player.id }, `Destroyer attack · ${player.name}`);
  }
  if (legal.includes("use_carrier_strike")) for (const carrier of actor.ships.filter(ship => ship.card.isCarrier && !ship.sunk))
    for (const player of state.players) if (player.id !== actorId) for (const ship of player.ships) if (!ship.sunk)
      add({ type: "use_carrier_strike", actorId, strikes: [{ carrierShipId: carrier.card.id, targetPlayerId: player.id, targetShipId: ship.card.id }] }, `${carrier.card.name} → ${ship.card.name}`);
  return result;
}

export function cardName(card: PlayCard): string {
  if (card.kind === "salvo") return `Salvo ${card.gunCaliber} · ${card.hits}`;
  return card.kind.split("_").map(word => word[0]!.toUpperCase() + word.slice(1)).join(" ");
}
