import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the browser's actual controller functions without its rendering shell.
// Transport/game legality is separately exercised by test:mac-online.
const source = await fs.readFile('prototype/app.js', 'utf8');
const parsed = ts.createSourceFile('app.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const names = ['maybeShowServerWinnerBanner', 'startNextCampaignRound'];
const functions = parsed.statements.filter(s => ts.isFunctionDeclaration(s) && names.includes(s.name?.text));
assert.equal(functions.length, names.length);
let banner, closes = 0, posts = [], refreshes = 0, localStarts = 0, release;
const state = { setupMode: 'multiplayer', match: { pendingNextRound: true, isCampaignOver: false, currentRound: 1 },
  serverSession: { lobbyId: 'test-lobby', sessionToken: 'test-token', isHost: true, connected: true } };
const context = vm.createContext({ appState: state, hasLaunchedMatch: false,
  closeWinnerBanner: () => closes++, showWinnerBanner: (...args) => { banner = args; }, playWinnerSound() {},
  serverPost: async (...args) => { posts.push(args); await new Promise(resolve => { release = resolve; }); },
  refreshServerViewAndRender: async () => { refreshes++; }, appendLog() {}, renderPrototype() {},
  initializePrototypeMatch: () => localStarts++,
});
vm.runInContext('let nextCampaignRoundInFlight = false;\n' + functions.map(s => s.getText(parsed)).join('\n'), context);
const players = { bottom: { id: 'p1', name: 'Mac Admiral' }, top: { id: 'p2', name: 'Browser Admiral' } };
const completed = { phase: 'round_complete', roundNumber: 1, winnerIds: ['p1'], matchWinnerIds: [], options: { matchMode: 'campaign' } };
context.maybeShowServerWinnerBanner(completed, players);
assert.equal(banner[2][0].dataset.nextCampaignRound, 'true');
assert.match(banner[0], /Round 1/);
const pending = context.startNextCampaignRound();
await context.startNextCampaignRound();
assert.equal(posts.length, 1, 'Double click sent duplicate round requests');
assert.equal(posts[0][0], '/api/lobbies/test-lobby/next-round');
assert.equal(posts[0][1].sessionToken, 'test-token');
release(); await pending;
assert.equal(localStarts, 0, 'Online round must never reinitialize a local game');
assert.equal(refreshes, 1);
context.maybeShowServerWinnerBanner({ ...completed, phase: 'normal', roundNumber: 2 }, players);
assert.equal(closes, 1, 'Previous round banner remained open');
state.serverSession.isHost = false;
context.maybeShowServerWinnerBanner({ ...completed, roundNumber: 2 }, players);
assert.equal(banner[2].length, 0);
assert.match(banner[1], /Waiting for the host/);
await context.startNextCampaignRound();
assert.equal(posts.length, 1, 'Guest sent next-round request');
context.maybeShowServerWinnerBanner({ ...completed, roundNumber: 3, winnerIds: ['p1','p2'], matchWinnerIds: ['p1','p2'] }, players);
assert.match(banner[0], /Mac Admiral & Browser Admiral Wins Campaign/);
assert.equal(banner[2].length, 0);
context.maybeShowServerWinnerBanner({ ...completed, roundNumber: 4, matchWinnerIds: ['p1'], options: { matchMode: 'skirmish' } }, players);
assert.doesNotMatch(banner[0], /Campaign/);
state.setupMode = 'solo';
await context.startNextCampaignRound();
assert.equal(localStarts, 1);
assert.equal(state.match.currentRound, 2);
console.log('PASS: browser Campaign host/guest controls, authenticated next-round request, duplicate-click gate, server refresh, tied winners, stale-banner cleanup and solo isolation.');
