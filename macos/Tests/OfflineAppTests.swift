import Foundation
import AppKit

@main struct OfflineAppTests {
    static func main() async throws {
        let args = CommandLine.arguments
        guard args.count == 4 else { throw NavalError(message: "Pass resources, transcript and evidence output paths.") }
        let resources = URL(fileURLWithPath: args[1])
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent("naval-war-verification-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: directory) }
        var engine = OfflineEngine(resources: resources, saveDirectory: directory)
        let fixtures = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: args[2]))) as! [[String: Any]]
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        var restores = 0
        var finishedRounds = 0
        var lastPhase = ""
        for (index, fixture) in fixtures.enumerated() {
            let request = fixture["request"] as! [String: Any]
            let expectedData = try JSONSerialization.data(withJSONObject: fixture["response"]!)
            let expected = try JSONDecoder().decode(EngineReply.self, from: expectedData).view!
            let actual = try await engine.send(request)
            guard try encoder.encode(actual) == encoder.encode(expected) else { throw NavalError(message: "Packaged engine mismatch at request \(index)") }
            if actual.gameState.phase == "round_complete" && lastPhase != "round_complete" { finishedRounds += 1 }
            lastPhase = actual.gameState.phase
            if index % 47 == 0 {
                let before = try Data(contentsOf: engine.saveURL)
                engine = OfflineEngine(resources: resources, saveDirectory: directory)
                let restored = try await engine.restore()
                guard try encoder.encode(actual) == encoder.encode(restored) else { throw NavalError(message: "Saved position changed on reload at \(index)") }
                guard try Data(contentsOf: engine.saveURL) == before else { throw NavalError(message: "Restore modified the save file") }
                restores += 1
            }
        }
        guard finishedRounds >= 2 else { throw NavalError(message: "Transcript did not complete enough rounds") }
        let art = try JSONDecoder().decode([String: String].self, from: Data(contentsOf: resources.appendingPathComponent("artwork.json")))
        for (key, file) in art {
            guard let image = NSImage(contentsOf: resources.appendingPathComponent(file)), image.size.width > 0, image.size.height > 0 else {
                throw NavalError(message: "Artwork cannot be decoded: \(key)")
            }
            if key.hasPrefix("zoom:") {
                let tableKey = String(key.dropFirst(5))
                guard let tableFile = art[tableKey], let table = NSImage(contentsOf: resources.appendingPathComponent(tableFile)),
                      image.size.width >= table.size.width * 2, image.size.height >= table.size.height * 2 else {
                    throw NavalError(message: "Inspection artwork is not Retina resolution: \(key)")
                }
            }
        }
        guard art.keys.filter({ $0.hasPrefix("zoom:") }).count == art.keys.filter({ !["logo", "table"].contains($0) && !$0.hasPrefix("zoom:") }).count else {
            throw NavalError(message: "Some cards lack high-resolution inspection artwork")
        }
        // Malformed saved games must not replace the current engine session.
        let previous = try await engine.send(["type":"view"], persist: false)
        try Data("{broken".utf8).write(to: engine.saveURL, options: .atomic)
        do { _ = try await engine.restore(); throw NavalError(message: "Invalid save unexpectedly loaded") }
        catch let error as NavalError where error.message == "Invalid save unexpectedly loaded" { throw error }
        catch { }
        let after = try await engine.send(["type":"view"], persist: false)
        guard try encoder.encode(previous) == encoder.encode(after) else { throw NavalError(message: "Invalid restore replaced the match") }
        let report: [String: Any] = ["passed":true,"requests":fixtures.count,"completedRounds":finishedRounds,"saveReloads":restores,"artworkDecoded":art.count,"networkPolicy":"deny network* via sandbox-exec","timestamp":ISO8601DateFormatter().string(from:Date())]
        try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted,.sortedKeys]).write(to: URL(fileURLWithPath: args[3]), options: .atomic)
        print("PASS: packaged resources, \(fixtures.count) native requests, \(finishedRounds) completed rounds, \(restores) exact save reloads, \(art.count) decoded artwork entries. Network denied.")
    }
}
