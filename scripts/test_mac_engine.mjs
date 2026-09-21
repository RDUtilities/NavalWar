import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { OfflineSession, OfflineRandom } from "../dist/offline-session.js";
import { automaticDestroyerSelection, chooseBotCommand } from "../dist/bots.js";
import { applyCommand, completeSoloRoundIfEliminated } from "../dist/engine.js";
import { createInitialGameState, createNextRoundState } from "../dist/sample-data.js";

const bundle = await fs.readFile(new URL("../macos/Resources/naval-engine.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(bundle, context, { timeout: 5000 });
assert.equal(context.process, undefined);
assert.equal(context.require, undefined);
const send = request => JSON.parse(context.NavalWar.dispatch(JSON.stringify(request)));
const expectedView = session => JSON.parse(JSON.stringify(session.view()));
let steps = 0;
let rounds = 0;
const covered = new Set();
const fixture = [];

function check(request, expected) {
  const actual = send(request);
  assert.deepEqual(actual, expected);
  if (actual.view) {
    const { gameState, humanPlayerId } = actual.view;
    for (const event of gameState.events.filter(event => event.type === "card_drawn" && event.actorId !== humanPlayerId)) {
      const name = gameState.players.find(player => player.id === event.actorId).name;
      assert.equal(event.detail, `${name} drew a card.`, "Offline view revealed an opponent's hidden draw");
    }
  }
  // Record exact responses for the separate native JavaScriptCore parity runner.
  return actual;
}

for (let game = 0; game < 12; game++) {
  const setup = {
    playerNames: ["Admiral", "Bot North", "Bot East", "Bot West"].slice(0, 2 + game % 3),
    humanPlayerId: "p1", seed: 9300 + game,
    mode: game < 6 ? "skirmish" : "campaign", campaignTargetScore: 100
  };
  let session = new OfflineSession(setup);
  const rng = new OfflineRandom(setup.seed);
  let state = createInitialGameState(setup.playerNames, rng, { matchMode: setup.mode, campaignTargetScore: setup.campaignTargetScore });
  const initial = { type: "new", setup };
  check(initial, { ok: true, view: expectedView(session) });
  if (game === 0 || game === 6) fixture.push({ request: initial, response: send({ type: "view" }) });
  let finished = false;
  for (let i = 0; i < 6000; i++) {
    if (state.phase === "round_complete") {
      const endedSave = session.save();
      session = OfflineSession.restore(endedSave);
      assert.deepEqual(session.state, state, "Completed-round restore changed scores or outcome");
      check({ type: "restore", save: endedSave }, { ok: true, view: expectedView(session) });
      rounds++;
      if (setup.mode === "skirmish" || state.matchWinnerIds.length) { finished = true; break; }
      state = createNextRoundState(state, rng);
      session.nextRound();
      check({ type: "next_round" }, { ok: true, view: expectedView(session) });
      if (game === 6) fixture.push({ request: { type: "next_round" }, response: send({ type: "view" }) });
      continue;
    }
    const selection = new OfflineRandom((setup.seed + session.save().history.length) >>> 0);
    const command = chooseBotCommand(state, state.currentPlayerId, rng, length => Math.floor(selection.next() * length));
    assert.ok(command, `No action for game ${game}, step ${i}`);
    covered.add(command.type);
    try { state = applyCommand(state, command, rng); } catch (error) {
      console.error(JSON.stringify({ game, step: i, command, state }, null, 2)); throw error;
    }
    const automaticSelection = automaticDestroyerSelection(state, command.actorId);
    if (automaticSelection) {
      const pending = state.pendingDestroyerAttack;
      const expectedIds = state.players.find(player => player.id === pending.targetPlayerId).ships.filter(ship => !ship.sunk).slice(0, pending.shipsToSink).map(ship => ship.card.id);
      assert.deepEqual(automaticSelection.targetShipIds, expectedIds, "Destroyer victims differ from hosted fleet order");
      state = applyCommand(state, automaticSelection, rng);
      covered.add(automaticSelection.type);
    }
    state = completeSoloRoundIfEliminated(state, setup.humanPlayerId);
    const request = command.actorId === setup.humanPlayerId ? { type: "command", command } : { type: "bot_step" };
    if (request.type === "command") session.command(command); else session.botStep();
    check(request, { ok: true, view: expectedView(session) });
    assert.deepEqual(session.state, state, "Offline session diverged from authoritative engine.");
    assert.equal(session.state.pendingDestroyerAttack, null, "Offline game paused for manual Destroyer victims");
    if (game === 0 || game === 6) fixture.push({ request, response: send({ type: "view" }) });
    steps++;

    if (i % 71 === 0) {
      const saved = send({ type: "save" }).save;
      assert.deepEqual(saved, session.save());
      session = OfflineSession.restore(saved);
      check({ type: "restore", save: saved }, { ok: true, view: expectedView(session) });
      assert.deepEqual(session.state, state, "Save replay changed the game state.");
      assert.equal(session.rng.state, rng.state, "Save replay changed subsequent randomness.");
      const before = send({ type: "view" });
      assert.equal(send({ type: "restore", save: { ...saved, rulesVersion: "future" } }).ok, false);
      assert.equal(send({ type: "command", command: { type: "draw_card", actorId: "intruder" } }).ok, false);
      assert.equal(send({ type: "restore", save: { ...saved, history: [ { type: "unknown" } ] } }).ok, false);
      assert.deepEqual(send({ type: "view" }), before, "Rejected operation replaced the current game.");
      assert.deepEqual(send({ type: "save" }).save, saved);
    }
  }
  assert.ok(finished, `Game ${game} failed to finish.`);
}
assert.ok(rounds > 12, "Campaign tests never reached a later round.");
assert.equal(JSON.parse(context.NavalWar.dispatch("not json")).ok, false);
for (const action of ["draw_card", "end_turn", "play_salvo", "play_additional_ship", "play_repair", "resolve_destroyer_squadron_roll"])
  assert.ok(covered.has(action), `Missing coverage for ${action}`);
await fs.mkdir(new URL("../macos/build/", import.meta.url), { recursive: true });
await fs.writeFile(new URL("../macos/build/parity-fixture.json", import.meta.url), JSON.stringify(fixture));
console.log(`PASS: 12 matches, ${rounds} rounds, ${steps} actions; Node/bundle parity, bot turns, campaign progression, exact save replay and rejection atomicity.`);
console.log(`Action coverage: ${[...covered].sort().join(", ")}`);
console.log("Native JavaScriptCore parity is a separate required check; this test uses a browser-free Node VM.");
