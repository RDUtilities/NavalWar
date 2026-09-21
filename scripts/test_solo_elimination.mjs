import assert from 'node:assert/strict';
import { OfflineSession, OfflineRandom } from '../dist/offline-session.js';
import { applyCommand, completeSoloRoundIfEliminated } from '../dist/engine.js';
import { fullPlayDeck } from '../dist/cards.js';

for (const players of [2, 3, 4]) for (const mode of ['skirmish', 'campaign']) {
  const setup = {playerNames:['Human','Bot A','Bot B','Bot C'].slice(0,players), humanPlayerId:'p1', seed:42, mode, campaignTargetScore:100};
  const session = new OfflineSession(setup);
  const state = session.state;
  state.openingTurnPendingPlayerIds = [];
  state.currentPlayerId = 'p2'; state.hasDrawnThisTurn = true;
  for (const player of state.players) player.hand = [];
  const submarine = structuredClone(fullPlayDeck.find(card => card.kind === 'submarine'));
  state.players[1].hand = [submarine];
  state.players[0].ships.slice(1).forEach(ship => { ship.sunk = true; });
  const command = {type:'play_submarine', actorId:'p2', cardId:submarine.id, targetPlayerId:'p1', targetShipId:state.players[0].ships[0].card.id};
  const rng = new OfflineRandom(42); rng.rollDie = () => 6;
  const multiplayer = applyCommand(structuredClone(state), command, rng);
  assert.equal(multiplayer.players[0].eliminated, true);
  assert.equal(multiplayer.phase, players === 2 ? 'round_complete' : 'normal', 'Multiplayer ended while opponents remained');
  if (players > 2) {
    const continued = applyCommand(multiplayer, {type:'end_turn',actorId:'p2'}, rng);
    assert.equal(continued.currentPlayerId, 'p3');
    assert.equal(continued.phase, 'normal');
    assert.equal(completeSoloRoundIfEliminated(multiplayer, 'p3'), multiplayer, 'Eliminating a bot ended a living human round');
  }
  session.rng.rollDie = () => 6;
  session.applyWithAutomaticSelection(command);
  const final = session.view();
  assert.equal(final.gameState.phase, 'round_complete');
  assert.equal(final.isBotTurn, false);
  assert.deepEqual(final.actions, []);
  assert.ok(!final.gameState.winnerIds.includes('p1'));
  assert.throws(() => session.botStep(), /round has ended/);
  assert.equal(completeSoloRoundIfEliminated(session.state, 'p1'), session.state, 'Repeated completion must be idempotent');
  if (mode === 'campaign') {
    assert.equal(session.state.campaign.scoreHistory.length, 1);
    const score = session.state.campaign.totalScores.p2;
    assert.equal(score, state.players[0].ships[0].card.hitNumber);
    delete session.rng.rollDie; // Restore real dice for next round initiative tie-breaking.
    session.nextRound();
    assert.equal(session.state.roundNumber, 2);
    assert.equal(session.view().humanPlayerId, 'p1');
    assert.equal(session.state.players[0].eliminated, false);
    assert.equal(session.state.campaign.totalScores.p2, score);
  }
}
console.log('PASS: 2/3/4-player solo elimination stops bots; multiplayer continues; bot elimination alone does not end solo; campaign scores once and starts next round.');
