import Foundation
import JavaScriptCore

// Run after npm run test:mac-engine:
// swift macos/Tests/EngineParity.swift macos/Resources/naval-engine.js macos/build/parity-fixture.json
let arguments = CommandLine.arguments
guard arguments.count >= 3, let context = JSContext() else {
    fatalError("Supply the engine bundle and parity fixture paths.")
}
var exception: String?
context.exceptionHandler = { _, value in exception = value?.toString() }
let source = try String(contentsOfFile: arguments[1], encoding: .utf8)
context.evaluateScript(source)
if let exception { fatalError(exception) }
guard let bridge = context.objectForKeyedSubscript(arguments.count > 3 ? "NavalWarRules" : "NavalWar") else { fatalError("Bridge missing") }
let data = try Data(contentsOf: URL(fileURLWithPath: arguments[2]))
guard let fixtures = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { fatalError("Invalid fixtures") }
for (index, fixture) in fixtures.enumerated() {
    let request = try JSONSerialization.data(withJSONObject: fixture["request"]!, options: [.sortedKeys])
    guard let json = String(data: request, encoding: .utf8),
          let response = bridge.invokeMethod("dispatch", withArguments: [json])?.toString(),
          let actualData = response.data(using: .utf8) else { fatalError("Missing response at \(index)") }
    if let exception { fatalError(exception) }
    let actual = try JSONSerialization.jsonObject(with: actualData) as! NSDictionary
    let expected = fixture["response"] as! NSDictionary
    guard actual.isEqual(expected) else {
        fputs("Parity mismatch at action \(index)\n", stderr)
        exit(1)
    }
}
print("PASS: JavaScriptCore matched Node across \(fixtures.count) recorded requests.")
