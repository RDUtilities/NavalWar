import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { macToolchainEnvironment } from './mac_toolchain.mjs';
import { onlineFailureProxy } from './online_failure_proxy.mjs';
import { verifySocketInterop } from './test_socket_interop.mjs';
const env=macToolchainEnvironment();
execFileSync('npm',['run','build'],{stdio:'inherit',env});
execFileSync(process.execPath,['scripts/test_browser_campaign.mjs'],{stdio:'inherit',env});
execFileSync('xcrun',['swiftc','-swift-version','5','-parse-as-library','macos/Sources/Models.swift','macos/Sources/OfflineEngine.swift','macos/Sources/OnlineSession.swift','macos/Tests/OnlineTransportTests.swift','-framework','JavaScriptCore','-o','macos/build/OnlineTransportTests'],{stdio:'inherit',env});
execFileSync('xcrun',['swiftc','-swift-version','5','-parse-as-library','macos/Sources/Models.swift','macos/Sources/OfflineEngine.swift','macos/Sources/OnlineSession.swift','macos/Tests/OnlineFailureTests.swift','-framework','JavaScriptCore','-o','macos/build/OnlineFailureTests'],{stdio:'inherit',env});
const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
const base=`http://127.0.0.1:${port}`;
async function request(route,body,token){const response=await fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}
function publicLobby(lobby){assert.ok(!('state' in lobby));for(const player of lobby.players){assert.ok(!('sessionToken'in player));assert.ok(!('clientId'in player));}}
let nativeLog='';let failureLog='';let commands=0;
try {
 for(let i=0;i<100;i++){try{const health=await request('/api/health');if(health.body.ok)break;}catch{}if(server.exitCode!==null)throw Error(serverLog);await new Promise(r=>setTimeout(r,100));}
 const host=(await request('/api/lobbies',{hostName:'Browser Host',playerCount:2,clientId:crypto.randomUUID()})).body;
 const guest=(await request(`/api/lobbies/by-code/${host.lobby.joinCode}/join`,{playerName:'Browser Guest',clientId:crypto.randomUUID()})).body;
 publicLobby(host.lobby);publicLobby(guest.lobby);
 const lobbyId=host.lobby.lobbyId;
 assert.equal((await request(`/api/lobbies/${lobbyId}/start`,{})).status,400);
 assert.equal((await request(`/api/lobbies/${lobbyId}/fill-bots`,{},guest.sessionToken)).status,400);
 assert.equal((await request(`/api/lobbies/${lobbyId}/start`,{},guest.sessionToken)).status,400);
 await request(`/api/lobbies/${lobbyId}/ready`,{sessionToken:host.sessionToken,ready:true});
 await request(`/api/lobbies/${lobbyId}/ready`,{sessionToken:guest.sessionToken,ready:true});
 const started=await request(`/api/lobbies/${lobbyId}/start`,{sessionToken:host.sessionToken});assert.equal(started.status,200);publicLobby(started.body);
 publicLobby((await request(`/api/lobbies/${lobbyId}`)).body);
 publicLobby((await request(`/api/lobbies/by-code/${host.lobby.joinCode}`)).body);
 assert.equal((await request(`/api/lobbies/${lobbyId}/view?playerId=p1`)).status,400);
 assert.equal((await request(`/api/lobbies/${lobbyId}/native-view`)).status,400);
 assert.equal((await request(`/api/lobbies/${lobbyId}/commands`,{type:'end_turn',actorId:'p1'})).status,400);
 let finished=false;
 for(let i=0;i<2000;i++){
  const views=await Promise.all([host,guest].map(client=>request(`/api/lobbies/${lobbyId}/view?sessionToken=${client.sessionToken}`)));
  views.forEach(({status,body:view})=>{assert.equal(status,200);view.gameState.players.filter(p=>p.id!==view.viewerPlayerId).forEach(p=>assert.equal(p.hand,null));});
  const state=views[0].body.gameState;if(state.phase==='round_complete'){finished=true;break;}
  const index=views.findIndex(v=>v.body.viewerPlayerId===state.currentPlayerId);assert.ok(index>=0);
  const view=views[index].body;let command;
  if(state.pendingDestroyerAttack){const p=state.pendingDestroyerAttack;command={type:'select_destroyer_squadron_targets',actorId:view.viewerPlayerId,destroyerId:p.destroyerId,targetShipIds:state.players.find(v=>v.id===p.targetPlayerId).ships.filter(s=>!s.sunk).slice(0,p.shipsToSink).map(s=>s.card.id)};}
  else command=(view.actions.find(a=>a.command.type==='draw_card')??view.actions.find(a=>!['discard_play_card','end_turn','use_carrier_strike'].includes(a.command.type))??view.actions[0])?.command;
  assert.ok(command);const result=await request(`/api/lobbies/${lobbyId}/commands`,{...command,sessionToken:[host,guest][index].sessionToken});assert.equal(result.status,200,JSON.stringify(result.body));publicLobby(result.body);commands++;
 }
 assert.ok(finished,'Browser-protocol match did not finish');
 const socketResult = await verifySocketInterop(base); console.log(socketResult);
 const native=spawn('macos/build/OnlineTransportTests',[base],{env,stdio:['ignore','pipe','pipe']});native.stdout.on('data',d=>nativeLog+=d);native.stderr.on('data',d=>nativeLog+=d);
 const [code]=await once(native,'exit');assert.equal(code,0,nativeLog);console.log(nativeLog.trim());
 const proxy=await onlineFailureProxy(base);
 try {
  const failure=spawn('macos/build/OnlineFailureTests',[proxy.url],{env,stdio:['ignore','pipe','pipe']});
  failure.stdout.on('data',d=>failureLog+=d);failure.stderr.on('data',d=>failureLog+=d);
  const timeout=setTimeout(()=>failure.kill('SIGTERM'),30000);
  try { const [result]=await once(failure,'exit');assert.equal(result,0,failureLog); }
  finally { clearTimeout(timeout); }
  console.log(failureLog.trim());
 } finally { await proxy.close(); }
 await fs.writeFile('macos/build/online-transport-verification.json',JSON.stringify({passed:true,socketResult,browserProtocolCommands:commands,nativeResult:nativeLog.trim(),failureRecovery:failureLog.trim(),security:['private state and reconnect identifiers omitted from public lobbies','session tokens required for game views and commands','host required for starting/filling','hidden opponent hands filtered'],scope:'local HTTP API and native transport; no browser GUI or hosted test',timestamp:new Date().toISOString()},null,2));
 console.log(`PASS: browser-compatible HTTP match (${commands} commands), lobby privacy, token checks and host-only controls.`);
} finally {server.kill('SIGTERM');await once(server,'exit');}
