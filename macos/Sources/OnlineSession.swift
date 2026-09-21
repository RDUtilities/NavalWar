import Foundation

struct OnlineLobbyPlayer: Codable, Identifiable {
    let playerId: String
    let playerName: String
    let role: String
    let isReady: Bool
    let isHost: Bool
    var id: String { playerId }
}
struct OnlineLobby: Codable {
    let lobbyId: String
    let joinCode: String
    let status: String
    let playerCount: Int
    let matchMode: String
    let hostPlayerId: String
    let players: [OnlineLobbyPlayer]
}
struct OnlineIdentity: Codable {
    let server: URL
    let lobbyId: String
    let sessionToken: String
}
struct OnlineSnapshot: Decodable {
    let protocolVersion: Int
    let viewerPlayerId: String
    let lobby: OnlineLobby
    let view: GameView?
    var isHost: Bool { lobby.hostPlayerId == viewerPlayerId }
}
private struct JoinReply: Decodable {
    let lobby: OnlineLobby
    let sessionToken: String
}
private struct HealthReply: Decodable { let nativeProtocolVersion: Int? }
private struct ServerRejection: Decodable { let error: String?; let detail: String? }

// Credentials must never follow an HTTP redirect to another endpoint.
private final class NoRedirects: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

/// Transport only: the server decides legality, randomness, turns and bot moves.
/// Mutations are never automatically retried after an uncertain network result.
actor OnlineSession {
    private let server: URL
    private let transport: URLSession
    private var identity: OnlineIdentity?
    private var mutationInFlight = false
    private var uncertainMutation = false
    private var mutationRevision: UInt64 = 0

    init(server: URL) throws {
        guard let parts = URLComponents(url: server, resolvingAgainstBaseURL: false),
              let host = parts.host, parts.user == nil, parts.password == nil,
              parts.query == nil, parts.fragment == nil,
              parts.path.isEmpty || parts.path == "/",
              parts.scheme == "https" || (parts.scheme == "http" && ["localhost", "127.0.0.1", "[::1]", "::1"].contains(host)) else {
            throw NavalError(message: "Use an HTTPS game server, or HTTP on localhost for testing.")
        }
        self.server = server
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 30
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        transport = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: [String: Any]? = nil,
                                       authenticated: Bool = false, as type: T.Type) async throws -> T {
        var request = URLRequest(url: server.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if authenticated {
            guard let identity else { throw NavalError(message: "Join an online lobby first.") }
            request.setValue("Bearer \(identity.sessionToken)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await transport.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw NavalError(message: "Invalid server response.") }
        guard (200..<300).contains(response.statusCode) else {
            let rejection = try? JSONDecoder().decode(ServerRejection.self, from: data)
            throw NavalError(message: rejection?.detail ?? rejection?.error ?? "The server rejected this request (\(response.statusCode)).")
        }
        guard data.count <= 16 * 1024 * 1024 else { throw NavalError(message: "Server response is too large.") }
        return try JSONDecoder().decode(type, from: data)
    }

    func checkCompatibility() async throws {
        let health = try await request("api/health", as: HealthReply.self)
        guard health.nativeProtocolVersion == 1 else {
            throw NavalError(message: "This server needs the native-client update before the Mac app can join. Offline play remains available.")
        }
    }

    func create(name: String, playerCount: Int, mode: String = "skirmish") async throws -> OnlineSnapshot {
        guard identity == nil, !mutationInFlight else { throw NavalError(message: "An online session is already active.") }
        guard (2...4).contains(playerCount), ["skirmish", "campaign"].contains(mode) else { throw NavalError(message: "Invalid match setup.") }
        mutationInFlight = true; defer { mutationInFlight = false }
        try await checkCompatibility()
        let joined = try await request("api/lobbies", method: "POST", body: ["hostName": name, "playerCount": playerCount,
            "matchMode": mode, "clientId": UUID().uuidString], as: JoinReply.self)
        identity = OnlineIdentity(server: server, lobbyId: joined.lobby.lobbyId, sessionToken: joined.sessionToken)
        return try await fetchSnapshot()
    }

    func join(code: String, name: String) async throws -> OnlineSnapshot {
        guard identity == nil, !mutationInFlight else { throw NavalError(message: "An online session is already active.") }
        let normalized = code.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard normalized.count == 6, normalized.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber) }) else {
            throw NavalError(message: "Enter the six-character lobby code.")
        }
        mutationInFlight = true; defer { mutationInFlight = false }
        try await checkCompatibility()
        let joined = try await request("api/lobbies/by-code/\(normalized)/join", method: "POST", body: ["playerName": name,
            "clientId": UUID().uuidString], as: JoinReply.self)
        identity = OnlineIdentity(server: server, lobbyId: joined.lobby.lobbyId, sessionToken: joined.sessionToken)
        return try await fetchSnapshot()
    }

    func credentials() -> OnlineIdentity? { identity }

    func resume(_ saved: OnlineIdentity) async throws -> OnlineSnapshot {
        guard identity == nil, !mutationInFlight, saved.server == server else { throw NavalError(message: "Saved session does not match this server.") }
        mutationInFlight = true; defer { mutationInFlight = false }
        try await checkCompatibility()
        identity = saved
        do { return try await fetchSnapshot() }
        catch { identity = nil; throw error }
    }

    func refresh() async throws -> OnlineSnapshot {
        guard !mutationInFlight else { throw NavalError(message: "Wait for the current online request to finish.") }
        return try await fetchSnapshot()
    }

    private func fetchSnapshot() async throws -> OnlineSnapshot {
        guard let identity else { throw NavalError(message: "Join an online lobby first.") }
        let revision = mutationRevision
        let snapshot = try await request("api/lobbies/\(identity.lobbyId)/native-view", authenticated: true, as: OnlineSnapshot.self)
        try Task.checkCancellation()
        guard revision == mutationRevision else {
            throw NavalError(message: "The match changed while refreshing. Reconnect to get its current state.")
        }
        guard snapshot.protocolVersion == 1, snapshot.lobby.lobbyId == identity.lobbyId else {
            throw NavalError(message: "The server returned an incompatible session.")
        }
        uncertainMutation = false
        return snapshot
    }

    private func mutate(_ action: String, body: [String: Any]) async throws -> OnlineSnapshot {
        guard let identity, !mutationInFlight, !uncertainMutation else {
            throw NavalError(message: "Refresh the current online state before sending another action.")
        }
        mutationInFlight = true; defer { mutationInFlight = false }
        mutationRevision &+= 1
        uncertainMutation = true
        do {
            var payload = body
            // Existing browser-compatible routes still accept this field for ready/resume.
            payload["sessionToken"] = identity.sessionToken
            _ = try await request("api/lobbies/\(identity.lobbyId)/\(action)", method: "POST", body: payload,
                                  authenticated: true, as: OnlineLobby.self)
            return try await fetchSnapshot()
        } catch let error as NavalError { uncertainMutation = true; throw error }
        catch {
            uncertainMutation = true
            throw NavalError(message: "Connection interrupted. Refresh the match before acting again; your previous action may already have reached the server.")
        }
    }

    func ready(_ ready: Bool) async throws -> OnlineSnapshot { try await mutate("ready", body: ["ready": ready]) }
    func start() async throws -> OnlineSnapshot { try await mutate("start", body: [:]) }
    func nextRound() async throws -> OnlineSnapshot { try await mutate("next-round", body: [:]) }
    func command(_ command: Command) async throws -> OnlineSnapshot { try await mutate("commands", body: command.dictionary) }
}
