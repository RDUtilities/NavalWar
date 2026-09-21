import assert from "node:assert/strict";
import { InMemoryMultiplayerService } from "../dist/session.js";
import { chooseBotCommand } from "../dist/bots.js";
import { OfflineRandom } from "../dist/offline-session.js";
import { applyCommand, listLegalCommands } from "../dist/engine.js";
import { createInitialGameState } from "../dist/sample-data.js";
import { fullPlayDeck } from "../dist/cards.js";

const card = kind => structuredClone(fullPlayDeck.find(entry => entry.kind === kind));
const rng = new OfflineRandom(41);
const blocked = createInitialGameState(["Human", "Bot"], rng);
blocked.currentPlayerId = "p1";
blocked.openingTurnPendingPlayerIds = [];
blocked.hasDrawnThisTurn = true;
blocked.players[0].hand = [card("torpedo_boat"), card("salvo")];
blocked.players[1].fleetEffects = [{ kind: "smoke", ownerId: "p2", card: card("smoke") }];
assert.deepEqual(listLegalCommands(blocked, "p1"), ["end_turn"]);
const next = applyCommand(blocked, { type: "end_turn", actorId: "p1" }, rng);
assert.equal(next.currentPlayerId, "p2");
assert.deepEqual(next.players[0].hand, blocked.players[0].hand, "Unplayable mandatory card must remain in hand.");
const stillBlocked = structuredClone(blocked);
stillBlocked.hasDrawnThisTurn = false;
assert.deepEqual(listLegalCommands(stillBlocked, "p1"), ["end_turn"]);
assert.equal(applyCommand(stillBlocked, { type: "end_turn", actorId: "p1" }, rng).currentPlayerId, "p2");
const unblocked = structuredClone(blocked);
unblocked.players[1].fleetEffects = [];
assert.ok(listLegalCommands(unblocked, "p1").includes("play_torpedo_boat"));
assert.throws(() => applyCommand(unblocked, { type: "end_turn", actorId: "p1" }, rng));
const ordinary = structuredClone(blocked);
ordinary.players[0].hand = [card("salvo")];
assert.throws(() => applyCommand(ordinary, { type: "end_turn", actorId: "p1" }, rng), /must take an action/);
const discardable = structuredClone(blocked);
discardable.players[0].hand = [card("additional_damage")];
assert.ok(listLegalCommands(discardable, "p1").includes("discard_play_card"));
assert.throws(() => applyCommand(discardable, { type: "end_turn", actorId: "p1" }, rng), /must take an action/);

let commands = 0;
for (let i = 0; i < 6; i++) {
  const random = new OfflineRandom(7300 + i);
  const service = new InMemoryMultiplayerService(random);
  let lobby = service.createLobby({ hostName: "Test Admiral", playerCount: 2 + i % 3 });
  const token = lobby.players[0].sessionToken;
  service.setReady(lobby.lobbyId, token, true);
  lobby = service.startMatch(lobby.lobbyId);
  for (let step = 0; step < 2000 && lobby.state.phase === "normal"; step++) {
    const actor = lobby.players.find(player => player.playerId === lobby.state.currentPlayerId);
    assert.equal(actor.role, "human", "Server must finish bot continuation before returning.");
    const command = chooseBotCommand(lobby.state, actor.playerId, random);
    assert.ok(command, "Human simulation needs a legal command.");
    try { lobby = service.submitCommand(lobby.lobbyId, command, token); } catch (error) {
      console.error(JSON.stringify(service.getLobby(lobby.lobbyId).state)); throw error;
    }
    const view = service.getPlayerView(lobby.lobbyId, actor.playerId, token);
    assert.ok(view.gameState.players.filter(player => player.id !== actor.playerId).every(player => player.hand == null));
    for (const [index, event] of view.gameState.events.entries()) {
      const original = lobby.state.events[index];
      if (event.type === "card_drawn" && event.actorId !== actor.playerId) {
        const name = lobby.state.players.find(player => player.id === event.actorId).name;
        assert.equal(event.detail, `${name} drew a card.`, "Opponent draw kind leaked through the event log");
      } else assert.deepEqual(event, original, "Public or own events changed during filtering");
    }
    commands++;
  }
  assert.equal(lobby.state.phase, "round_complete");
}
console.log(`PASS: blocked mandatory-card regression plus 6 hosted-session matches (${commands} human commands) with extracted bots.`);
