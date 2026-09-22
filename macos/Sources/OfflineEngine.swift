import Foundation
import JavaScriptCore

struct NavalError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

// All JavaScriptCore operations and save-file writes run on this queue, never the UI thread.
final class OfflineEngine: @unchecked Sendable {
    private let queue = DispatchQueue(label: "local.navalwar.engine", qos: .userInitiated)
    private var context: JSContext?
    private let resources: URL
    let saveURL: URL

    init(resources: URL = Bundle.main.resourceURL!, saveDirectory: URL? = nil) {
        self.resources = resources
        let directory = saveDirectory ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Naval War", isDirectory: true)
        saveURL = directory.appendingPathComponent("offline-autosave.json")
    }

    private func dispatch(_ data: Data) throws -> Data {
        if context == nil {
            guard let next = JSContext() else { throw NavalError(message: "Cannot start the game engine.") }
            let source = try String(contentsOf: resources.appendingPathComponent("naval-engine.js"), encoding: .utf8)
            next.evaluateScript(source)
            if let error = next.exception { throw NavalError(message: error.toString()) }
            context = next
        }
        guard let context else { throw NavalError(message: "Game engine unavailable.") }
        context.exception = nil
        let response = context.objectForKeyedSubscript("NavalWar")?.invokeMethod("dispatch", withArguments: [String(decoding: data, as: UTF8.self)])
        if let error = context.exception { throw NavalError(message: error.toString()) }
        guard let json = response?.toString(), let result = json.data(using: .utf8) else {
            throw NavalError(message: "The game engine did not respond.")
        }
        let reply = try JSONDecoder().decode(EngineReply.self, from: result)
        guard reply.ok else { throw NavalError(message: reply.error ?? "That action is not available.") }
        return result
    }

    func send(_ request: [String: Any], persist: Bool = true) async throws -> GameView {
        let data = try JSONSerialization.data(withJSONObject: request)
        return try await withCheckedThrowingContinuation { continuation in
            queue.async {
                do {
                    let result = try self.dispatch(data)
                    guard let view = try JSONDecoder().decode(EngineReply.self, from: result).view else {
                        throw NavalError(message: "Game state missing.")
                    }
                    if persist { try self.writeSave() }
                    continuation.resume(returning: view)
                } catch { continuation.resume(throwing: error) }
            }
        }
    }

    private func writeSave() throws {
        let response = try dispatch(Data("{\"type\":\"save\"}".utf8))
        guard let object = try JSONSerialization.jsonObject(with: response) as? [String: Any], let save = object["save"] else {
            throw NavalError(message: "Could not prepare the saved game.")
        }
        let data = try JSONSerialization.data(withJSONObject: save, options: [.sortedKeys])
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: saveURL, options: .atomic)
    }

    func restore() async throws -> GameView {
        return try await withCheckedThrowingContinuation { continuation in
            queue.async {
                do {
                    let data = try Data(contentsOf: self.saveURL)
                    guard data.count <= 32 * 1024 * 1024 else { throw NavalError(message: "Saved game is too large.") }
                    let save = try JSONSerialization.jsonObject(with: data)
                    let request = try JSONSerialization.data(withJSONObject: ["type": "restore", "save": save])
                    let result = try self.dispatch(request)
                    guard let view = try JSONDecoder().decode(EngineReply.self, from: result).view else { throw NavalError(message: "Invalid saved game.") }
                    continuation.resume(returning: view)
                } catch { continuation.resume(throwing: error) }
            }
        }
    }
}
