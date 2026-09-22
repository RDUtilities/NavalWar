import Foundation

@main struct OnlineTransportTests {
    static func main() async throws {
        let server = URL(string: CommandLine.arguments[1])!
        var host = try OnlineSession(server: server)
        var guest = try OnlineSession(server: server)
        let initial = try await host.create(name: "Native Host", playerCount: 3, mode: "campaign")
        let code = initial.lobby.joinCode
        let joined = try await guest.join(code: code, name: "Native Guest")
        guard joined.lobby.players.count == 2, !joined.isHost, initial.isHost else { throw NavalError(message: "Lobby identity mismatch") }
        _ = try await host.ready(true)
        _ = try await guest.ready(true)
        do { _ = try await guest.start(); throw NavalError(message: "Guest was allowed to start the match") }
        catch let error as NavalError where error.message == "Guest was allowed to start the match" { throw error }
        catch { _ = try await guest.refresh() }
        var snapshot = try await host.start()
        let original = snapshot.view!
        guard original.gameState.players.count == 3 else { throw NavalError(message: "Bot seat was not filled") }
        var commands = 0
        var reconnects = 0
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        while snapshot.view!.gameState.phase == "normal" && commands < 2500 {
            let hostState = try await host.refresh()
            let guestState = try await guest.refresh()
            guard let hv = hostState.view, let gv = guestState.view,
                  hv.gameState.turnNumber == gv.gameState.turnNumber,
                  hv.humanPlayerId != gv.humanPlayerId else { throw NavalError(message: "Player state diverged") }
            for view in [hv,gv] {
                guard view.gameState.players.filter({$0.id != view.humanPlayerId}).allSatisfy({$0.hand.isEmpty}) else { throw NavalError(message: "Opponent hand leaked") }
                guard view.actions.allSatisfy({$0.command.actorId == view.humanPlayerId}) else { throw NavalError(message: "Wrong player's legal actions leaked") }
            }
            let activeHost = hv.gameState.currentPlayerId == hv.humanPlayerId
            let active = activeHost ? hv : gv
            let connection = activeHost ? host : guest
            if let pending = active.gameState.pendingDestroyerAttack {
                let targets = active.gameState.players.first {$0.id == pending.targetPlayerId}!.ships.filter{!$0.sunk}.prefix(pending.shipsToSink).map(\.id)
                snapshot = try await connection.command(Command(type:"select_destroyer_squadron_targets",actorId:active.humanPlayerId,destroyerId:pending.destroyerId,targetShipIds:targets))
            } else {
                let actions = active.actions
                // Resolve specials/attacks, draw before carrier fallback, then discard/end.
                let option = actions.first { $0.command.type == "draw_card" }
                    ?? actions.first { !["discard_play_card","end_turn","use_carrier_strike"].contains($0.command.type) }
                    ?? actions.first
                guard let option else { throw NavalError(message: "No legal action at turn \(active.gameState.turnNumber)") }
                snapshot = try await connection.command(option.command)
            }
            commands += 1
            if commands % 31 == 0 {
                let hostIdentity = await host.credentials()!
                let guestIdentity = await guest.credentials()!
                let before = try await host.refresh()
                host = try OnlineSession(server:server)
                guest = try OnlineSession(server:server)
                let after = try await host.resume(hostIdentity)
                _ = try await guest.resume(guestIdentity)
                guard try encoder.encode(before.view) == encoder.encode(after.view) else { throw NavalError(message: "Reconnect changed state") }
                reconnects += 1
            }
        }
        guard snapshot.view!.gameState.phase == "round_complete" else { throw NavalError(message: "Online match did not finish") }
        do { _ = try await guest.nextRound(); throw NavalError(message: "Guest advanced the Campaign") }
        catch let error as NavalError where error.message == "Guest advanced the Campaign" { throw error }
        catch { _ = try await guest.refresh() }
        let previousRound = snapshot.view!.gameState.roundNumber
        let nextRound = try await host.nextRound()
        guard nextRound.view!.gameState.roundNumber == previousRound + 1 else { throw NavalError(message: "Campaign round did not advance") }
        do { _ = try await host.nextRound(); throw NavalError(message: "Active Campaign round was skipped") }
        catch let error as NavalError where error.message == "Active Campaign round was skipped" { throw error }
        catch { _ = try await host.refresh() }
        do { _ = try OnlineSession(server:URL(string:"http://example.com")!); throw NavalError(message:"Insecure remote server accepted") }
        catch let error as NavalError where error.message == "Insecure remote server accepted" { throw error }
        catch { }
        print("PASS: native online lobby, ready/host gates, complete 3-player match with a server bot (\(commands) human actions), \(reconnects) fresh-client reconnects, filtered hands, and host-only Campaign progression.")
    }
}
