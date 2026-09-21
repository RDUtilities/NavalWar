import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(await fs.readFile('macos/Tests/Fixtures/legacy-destroyer-save.json', 'utf8'));
const context = vm.createContext({});
vm.runInContext(await fs.readFile('macos/Resources/naval-engine.js', 'utf8'), context);
const send = request => JSON.parse(context.NavalWar.dispatch(JSON.stringify(request)));
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
assert.equal(hash(send({ type: 'restore', save: fixture.save })), fixture.expected.pending, 'Legacy pending position changed');
assert.deepEqual(send({ type: 'save' }).save, fixture.save, 'Loading inserted unrecorded actions');
assert.equal(hash(send({ type: 'command', command: fixture.selection })), fixture.expected.selected, 'Legacy chosen victims changed');
assert.equal(hash(send({ type: 'command', command: { type: 'end_turn', actorId: 'p1' } })), fixture.expected.advanced, 'Following legacy turn changed');
console.log('PASS: prior-build save restores exactly before and after manual Destroyer selection and advances to the identical following turn.');
