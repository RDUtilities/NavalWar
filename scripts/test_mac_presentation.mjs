import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { macToolchainEnvironment } from './mac_toolchain.mjs';
const context = vm.createContext({});
vm.runInContext(await fs.readFile('macos/Resources/naval-engine.js', 'utf8'), context);
const send = request => { const reply = JSON.parse(context.NavalWar.dispatch(JSON.stringify(request))); assert(reply.ok, reply.error); return reply; };
const transcript = JSON.parse(await fs.readFile('macos/build/parity-fixture.json', 'utf8'));
const fixtures = {};
let previous;
for (const {request} of transcript) {
  const save = previous ? send({type:'save'}).save : null;
  const next = send(request).view;
  if (previous && previous.gameState.roundNumber === next.gameState.roundNumber) {
    const kind = request.command?.type;
    if (kind === 'resolve_destroyer_squadron_roll' && !fixtures.destroyer) fixtures.destroyer = {before:previous, after:next, command:request.command, save};
    if (kind === 'play_destroyer_squadron' && !fixtures.deployment) fixtures.deployment = {before:previous, after:next, command:request.command, save};
    if (kind === 'play_minefield' && !fixtures.mines) fixtures.mines = {before:previous, after:next, command:request.command, save};
    if (kind === 'play_salvo') {
      const ship = next.gameState.players.flatMap(p=>p.ships).find(s=>s.card.id===request.command.targetShipId);
      const key = ship.sunk ? 'sinking' : 'salvo';
      if (!fixtures[key]) fixtures[key] = {before:previous, after:next, command:request.command, save};
    }
  }
  previous = next;
  if (Object.keys(fixtures).length === 5) break;
}
assert.equal(Object.keys(fixtures).length,5,'Need actual legal mine, salvo, sinking and Destroyer positions');
await fs.writeFile('macos/build/presentation-fixtures.json',JSON.stringify(fixtures));
for (const [key, fixture] of Object.entries(fixtures)) {
  await fs.mkdir(`macos/build/presentation-${key}`,{recursive:true});
  await fs.writeFile(`macos/build/presentation-${key}/offline-autosave.json`,JSON.stringify(fixture.save));
}
const sources = (await fs.readdir('macos/Sources')).filter(f=>f.endsWith('.swift') && f!=='NavalWarApp.swift').map(f=>`macos/Sources/${f}`);
execFileSync('xcrun',['swiftc','-swift-version','5','-parse-as-library',...sources,'macos/Tests/PresentationTests.swift','-framework','SwiftUI','-framework','SpriteKit','-framework','JavaScriptCore','-framework','AppKit','-o','macos/build/PresentationTests'],{stdio:'inherit',env:macToolchainEnvironment()});
execFileSync('macos/build/PresentationTests',[],{stdio:'inherit'});
