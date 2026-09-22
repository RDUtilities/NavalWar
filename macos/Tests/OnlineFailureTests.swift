import Foundation

@main struct OnlineFailureTests {
    static func main() async throws {
        let server = URL(string: CommandLine.arguments[1])!
        func control(_ path: String) async throws -> String {
            let (data, _) = try await URLSession.shared.data(from: server.appendingPathComponent("test/\(path)"))
            return String(decoding: data, as: UTF8.self)
        }
        let connection = try OnlineSession(server: server)
        _ = try await connection.create(name: "Failure Test", playerCount: 2)
        _ = try await control("arm")
        let stale = Task { try await connection.refresh() }
        // The fixture signals when the pre-action snapshot has actually been captured.
        guard try await control("wait-held") == "held" else { throw NavalError(message: "Delayed refresh fixture did not start") }
        do {
            _ = try await connection.ready(true)
            throw NavalError(message: "Lost response was accepted")
        } catch let error as NavalError where error.message.hasPrefix("Connection interrupted.") { }
        _ = try await control("release")
        do {
            _ = try await stale.value
            throw NavalError(message: "Stale refresh was accepted after the lost action response")
        } catch let error as NavalError where error.message.hasPrefix("The match changed while refreshing.") { }
        do {
            _ = try await connection.start()
            throw NavalError(message: "Uncertain action did not require a fresh snapshot")
        } catch let error as NavalError where error.message.hasPrefix("Refresh the current online state") { }
        let recovered = try await connection.refresh()
        guard recovered.lobby.players.first?.isReady == true else { throw NavalError(message: "Recovery missed the accepted ready action") }
        let started = try await connection.start()
        guard started.view != nil else { throw NavalError(message: "Could not act after recovery") }
        let counts = try await control("counts")
        guard counts == "ready=1,start=1" else { throw NavalError(message: "Action replay or premature retry: \(counts)") }
        print("PASS: lost response does not replay an action; delayed pre-action snapshot is rejected; explicit fresh refresh restores accepted state before another action.")
    }
}
