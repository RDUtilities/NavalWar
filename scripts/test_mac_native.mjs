import { execFileSync } from 'node:child_process';
import { macToolchainEnvironment } from './mac_toolchain.mjs';
const env = macToolchainEnvironment();
function run(command,args) { execFileSync(command,args,{stdio:'inherit',env}); }
run('npm',['run','test:mac-engine']);
run('node',['scripts/test_mac_legacy_save.mjs']);
run('node',['scripts/test_mac_presentation.mjs']);
run('node',['scripts/bundle_mac_engine.mjs','--tests']);
run('node',['scripts/test_mac_rules.mjs']);
run('xcrun',['swift','macos/Tests/EngineParity.swift','macos/Resources/naval-engine.js','macos/build/parity-fixture.json']);
run('xcrun',['swift','macos/Tests/EngineParity.swift','macos/build/naval-engine-tests.js','macos/build/rules-fixture.json','--rules']);
run('node',['scripts/test_shared_bots.mjs']);
run('node',['scripts/build_mac_app.mjs']);
run('xcrun',['swiftc','-swift-version','5','-parse-as-library','macos/Sources/Models.swift','macos/Sources/OfflineEngine.swift','macos/Tests/OfflineAppTests.swift','-framework','JavaScriptCore','-framework','AppKit','-o','macos/build/OfflineAppTests']);
run('/usr/bin/sandbox-exec',['-p','(version 1) (allow default) (deny network*)','macos/build/OfflineAppTests','macos/build/Naval War.app/Contents/Resources','macos/build/parity-fixture.json','macos/build/native-verification.json']);
