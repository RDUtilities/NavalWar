import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Same Socket.IO client bundle served to the browser, running without a browser UI.
const { io } = require('../node_modules/socket.io/client-dist/socket.io.js');

export async function verifySocketInterop(base) {
  const clients = [0,1].map(() => io(base, { transports: ['websocket'], autoConnect: false, reconnection: false }));
  const [host, guest] = clients;
  const ack = (socket, event, payload = {}) => new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (error, response) => error ? reject(error) : resolve(response));
  });
  const nextView = socket => new Promise((resolve, reject) => {
    const listener = packet => { clearTimeout(timeout); resolve(packet.view); };
    const timeout = setTimeout(() => { socket.off('match:state', listener); reject(new Error('Missing match broadcast')); }, 5000);
    socket.once('match:state', listener);
  });
  const request = async (path, token, body) => {
    const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${token}`
    }, ...(body ? { body: JSON.stringify({ ...body, sessionToken: token }) } : {}) });
    const value = await response.json(); assert.equal(response.status, 200, JSON.stringify(value)); return value;
  };
  function visible(view) {
    for (const player of view.gameState.players) if (player.id !== view.viewerPlayerId) assert.equal(player.hand, null);
    for (const event of view.gameState.events) if (event.type === 'card_drawn' && event.actorId !== view.viewerPlayerId) {
      const name = view.gameState.players.find(player => player.id === event.actorId).name;
      assert.equal(event.detail, `${name} drew a card.`);
    }
  }
  try {
    await Promise.all(clients.map(socket => new Promise((resolve,reject) => {
      socket.once('connect',resolve); socket.once('connect_error',reject); socket.connect();
    })));
    const created = await ack(host, 'lobby:create', { hostName: 'Socket Host', playerCount: 3, clientId: crypto.randomUUID() });
    assert.equal(created.ok, true); assert.ok(!('state' in created.lobby));
    const joined = await ack(guest, 'lobby:join', { playerName: 'Socket Guest', joinCode: created.lobby.joinCode, clientId: crypto.randomUUID() });
    assert.equal(joined.ok, true);
    assert.equal((await ack(guest, 'lobby:start')).ok, false, 'Socket guest started host match');
    assert.equal((await ack(host, 'lobby:ready', { ready: true })).ok, true);
    assert.equal((await ack(guest, 'lobby:ready', { ready: true })).ok, true);
    const initial = Promise.all(clients.map(nextView)); initial.catch(() => {});
    assert.equal((await ack(host, 'lobby:start')).ok, true);
    let [hv, gv] = await initial;
    const prefix = `/api/lobbies/${created.lobby.lobbyId}`;
    let commands = 0;
    while (hv.gameState.phase === 'normal' && commands < 2500) {
      visible(hv); visible(gv);
      assert.equal(hv.gameState.turnNumber, gv.gameState.turnNumber);
      const native = await request(`${prefix}/native-view`, joined.sessionToken);
      assert.equal(native.view.gameState.turnNumber, gv.gameState.turnNumber);
      assert.deepEqual(native.view.gameState.events, gv.gameState.events, 'Native and socket guest logs differ');
      const activeHost = hv.gameState.currentPlayerId === hv.viewerPlayerId;
      const view = activeHost ? hv : gv;
      const option = view.actions.find(a => a.command.type === 'draw_card')
        ?? view.actions.find(a => !['discard_play_card','end_turn','use_carrier_strike'].includes(a.command.type)) ?? view.actions[0];
      assert.ok(option, 'Human has no legal action');
      const updates = Promise.all(clients.map(nextView)); updates.catch(() => {});
      if (activeHost) assert.equal((await ack(host, 'game:action', { command: option.command })).ok, true);
      else await request(`${prefix}/commands`, joined.sessionToken, option.command);
      [hv, gv] = await updates;
      commands++;
    }
    assert.equal(hv.gameState.phase, 'round_complete'); visible(hv); visible(gv);
    return `PASS: mixed Socket.IO/HTTP match completed ${commands} commands with a server bot; both sockets received updates, native snapshots matched, hidden draws stayed private, and socket host gates held.`;
  } finally { clients.forEach(socket => socket.disconnect()); }
}
