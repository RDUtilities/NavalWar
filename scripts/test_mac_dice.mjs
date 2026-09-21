import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {macToolchainEnvironment} from './mac_toolchain.mjs';
import {applyCommand} from '../dist/engine.js';
import {fullPlayDeck, fullShipDeck} from '../dist/cards.js';
import {OfflineSession, OfflineRandom} from '../dist/offline-session.js';
const setup = {playerNames:['Admiral','Opponent'],humanPlayerId:'p1',seed:91,mode:'skirmish',campaignTargetScore:100};
const carrier = fullShipDeck.find(c=>c.isCarrier);
const ships = fullShipDeck.filter(c=>!c.isCarrier).slice(0,3);
const ship = card => ({card,damage:[],attachments:[],sunk:false});
const view = state => {const s=new OfflineSession(setup);s.state=state;return s.view();};
const fixtures=[];
for(const kind of ['carrier','submarine','torpedo_boat','destroyer_squadron']) for(let roll=1;roll<=6;roll++) {
 const s=new OfflineSession(setup).state;
 s.openingTurnPendingPlayerIds=[];s.currentPlayerId='p1';s.turnNumber=10;s.hasDrawnThisTurn=true;
 s.players.forEach(p=>{p.hand=[];p.fleetEffects=[];});s.players[0].ships=[ship(carrier),ship(ships[0])];s.players[1].ships=[ship(ships[1]),ship(ships[2])];
 let command;
 if(kind==='carrier'){s.hasDrawnThisTurn=false;command={type:'use_carrier_strike',actorId:'p1',strikes:[{carrierShipId:carrier.id,targetPlayerId:'p2',targetShipId:ships[1].id}]};}
 else if(kind==='destroyer_squadron'){s.hasDrawnThisTurn=false;s.destroyerSquadrons=[{id:'ready',ownerId:'p1',card:fullPlayDeck.find(c=>c.kind===kind),deployedTurn:1,hitsTaken:0}];command={type:'resolve_destroyer_squadron_roll',actorId:'p1',destroyerId:'ready',targetPlayerId:'p2'};}
 else {const card=fullPlayDeck.find(c=>c.kind===kind);s.players[0].hand=[card];command={type:`play_${kind}`,actorId:'p1',cardId:card.id,targetPlayerId:'p2',targetShipId:ships[1].id};}
 const rng=new OfflineRandom(91);let calls=0;rng.rollDie=()=>{calls++;return roll;};
 const next=applyCommand(s,command,rng);const event=next.events.findLast(e=>e.type.endsWith('_roll'));
 assert.equal(calls,1);assert.equal(event.dieRoll,roll);
 if(kind==='destroyer_squadron') assert.equal(next.pendingDestroyerAttack.shipsToSink,Math.min(roll,2));
 else assert.equal(next.players[1].ships[0].sunk,kind==='carrier'?roll===1:kind==='submarine'?roll>=5:roll===6);
 fixtures.push({kind,roll,before:view(s),after:view(next),event});
}
await fs.writeFile('macos/build/dice-fixtures.json',JSON.stringify(fixtures));
const sources=(await fs.readdir('macos/Sources')).filter(f=>f.endsWith('.swift')&&f!=='NavalWarApp.swift').map(f=>`macos/Sources/${f}`);
execFileSync('xcrun',['swiftc','-swift-version','5','-parse-as-library',...sources,'macos/Tests/DiceTests.swift','-framework','SwiftUI','-framework','SpriteKit','-framework','JavaScriptCore','-framework','AppKit','-o','macos/build/DiceTests'],{stdio:'inherit',env:macToolchainEnvironment()});
execFileSync('macos/build/DiceTests',[],{stdio:'inherit'});
