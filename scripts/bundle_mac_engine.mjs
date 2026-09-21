import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testing = process.argv.includes("--tests");
const output = path.join(root, testing ? "macos/build/naval-engine-tests.js" : "macos/Resources/naval-engine.js");
const names = ["types", "cards", "engine", "sample-data", "bots", "action-options", "visibility", "offline-session", "mac-bridge"];
const modules = [];
for (const name of names) {
  const source = await fs.readFile(path.join(root, "src", `${name}.ts`), "utf8");
  const result = ts.transpileModule(source, {
    fileName: `${name}.ts`, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true }
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: value => value, getCurrentDirectory: () => root, getNewLine: () => "\n"
  }));
  modules.push(`${JSON.stringify(`./${name}.js`)}: function(module, exports, require) {\n${result.outputText}\n}`);
}
const bundle = `// Generated from src/ by scripts/bundle_mac_engine.mjs. Do not edit.\n` +
`(function(global) {\n"use strict";\nconst modules = {\n${modules.join(",\n")}\n};\n` +
`const cache = Object.create(null);\nfunction load(id) {\n` +
`if (!Object.prototype.hasOwnProperty.call(modules, id)) throw new Error("Unbundled module: " + id);\n` +
`if (!cache[id]) { const module = { exports: {} }; cache[id] = module; modules[id](module, module.exports, load); }\n` +
`return cache[id].exports;\n}\n` +
`global.NavalWar = Object.freeze({ dispatch: load("./mac-bridge.js").dispatch });\n` +
(testing ? `global.NavalWarRules = { dispatch: function(json) {
const request = JSON.parse(json);
const rng = new (load("./offline-session.js").OfflineRandom)(request.seed);
try {
 const state = load("./engine.js").applyCommand(request.state, request.command, rng);
 return JSON.stringify({ok:true, state, randomState:rng.state});
} catch (error) { return JSON.stringify({ok:false,error:error.message}); }
} };\n` : "") + `})(globalThis);\n`;
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, bundle);
console.log(`Bundled ${names.length} modules (${Buffer.byteLength(bundle)} bytes) for JavaScriptCore.`);
