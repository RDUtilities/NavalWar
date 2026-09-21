import SwiftUI
import AppKit

@MainActor final class GameModel: ObservableObject {
    @Published var view: GameView?
    @Published var busy = false
    @Published var error: String?
    @Published var selectedCard: String?
    @Published var showAirStrikes = false
    @Published var strikes: [String: Strike] = [:]
    @Published var destroyerTargets: Set<String> = []
    @Published var inspectedCard: PlayCard?
    @Published var inspectedShip: Ship?
    @Published var saved = false
    @Published var inMenu = true
    @Published var sound = true { didSet { if !sound { playingSounds.forEach { $0.stop() }; playingSounds = []; audioGeneration = UUID() } } }
    private var audioGeneration = UUID()
    @Published var combatEffects: [String: CombatEffect] = [:]
    private let engine: OfflineEngine = {
        let directory = ProcessInfo.processInfo.environment["NAVAL_WAR_TEST_SAVE_DIR"].map { URL(fileURLWithPath: $0, isDirectory: true) }
        return OfflineEngine(saveDirectory: directory)
    }()
    @Published var onlineSnapshot: OnlineSnapshot?
    @Published var onlineConnected = false
    @Published var hasSavedOnline = OnlineIdentityStore().exists()
    private var online: OnlineSession?
    private var pollTask: Task<Void, Never>?
    private var sessionGeneration = UUID()
    private let identityStore = OnlineIdentityStore()
    var isOnline: Bool { online != nil }
    var canInteract: Bool { !busy && (!isOnline || (onlineConnected && view?.gameState.currentPlayerId == view?.humanPlayerId)) }
    private var playingSounds: [NSSound] = []
    var canResume: Bool { FileManager.default.fileExists(atPath: engine.saveURL.path) }
    var actions: [ActionOption] {
        guard let view, !isOnline || onlineConnected else { return [] }
        let ready = view.actions.filter { ["resolve_destroyer_squadron_roll", "discard_destroyer_squadron"].contains($0.command.type) }
        if !ready.isEmpty { return ready }
        if showAirStrikes { return view.actions.filter { $0.command.type == "use_carrier_strike" } }
        if let selectedCard { return view.actions.filter { $0.command.cardId == selectedCard } }
        return view.actions.filter { ["resolve_destroyer_squadron_roll", "discard_destroyer_squadron"].contains($0.command.type) }
    }
    var instruction: String {
        guard let view else { return "Welcome aboard, Admiral." }
        if view.gameState.phase == "round_complete" {
            let winners = view.gameState.players.filter { view.gameState.winnerIds.contains($0.id) }.map(\.name).joined(separator: " & ")
            return winners.isEmpty ? "Round complete" : "\(winners) wins the round"
        }
        if isOnline && !onlineConnected { return "Connection interrupted. Reconnect to continue this match." }
        if isOnline && view.gameState.currentPlayerId != view.humanPlayerId {
            return "Waiting for \(view.gameState.players.first { $0.id == view.gameState.currentPlayerId }?.name ?? "opponent")…"
        }
        if busy || view.isBotTurn { return "\(view.gameState.players.first { $0.id == view.gameState.currentPlayerId }?.name ?? "Opponent") is taking a turn…" }
        if let pending = view.gameState.pendingDestroyerAttack { return "Choose \(pending.shipsToSink) enemy ships for your Destroyer Squadron." }
        if showAirStrikes { return "Assign targets, then launch your air strikes." }
        if view.legalCommands.contains("resolve_destroyer_squadron_roll") { return "Destroyers ready: click a highlighted enemy fleet to attack before drawing." }
        if view.legalCommands.contains("discard_destroyer_squadron") { return "Smoke blocks every enemy fleet. Discard the blocked Destroyer Squadron to continue." }
        if let card = view.human.hand.first(where: { $0.id == selectedCard }), card.kind == "destroyer_squadron" {
            return "Play Destroyer Squadron below to deploy it into the battle zone. It attacks on your next turn."
        }
        if selectedCard != nil {
            if actions.contains(where: { $0.command.targetPlayerId != nil && $0.command.targetShipId == nil }) { return "Click the highlighted enemy fleet button or any afloat ship in that fleet." }
            return "Choose a highlighted ship or an action below."
        }
        if view.gameState.openingTurnPendingPlayerIds.contains(view.humanPlayerId) { return "Opening orders: resolve special cards, then end your turn." }
        if view.legalCommands.contains("resolve_destroyer_squadron_roll") || view.legalCommands.contains("discard_destroyer_squadron") { return "Your Destroyer Squadron is ready. Resolve it before drawing." }
        if view.legalCommands.contains("draw_card") { return "Draw a card or launch a carrier air strike." }
        if view.legalCommands == ["end_turn"] { return "Your action is complete, or a mandatory attack is blocked. End your turn." }
        return "Select a card to play or discard."
    }

    func start(name: String, players: Int, mode: String) {
        detachOnline()
        let names = [name.trimmingCharacters(in: .whitespaces).isEmpty ? "Admiral" : String(name.prefix(80)), "Admiral North", "Admiral East", "Admiral West"]
        let setup: [String: Any] = ["playerNames": Array(names.prefix(players)), "humanPlayerId": "p1", "seed": UInt32.random(in: 0...UInt32.max), "mode": mode, "campaignTargetScore": 100]
        run(["type": "new", "setup": setup])
    }
    func resume() {
        guard !busy else { return }
        detachOnline()
        busy = true; error = nil
        Task {
            do {
                view = try await engine.restore(); inMenu = false; saved = true; clearSelection()
                try await pumpBots()
            } catch { self.error = error.localizedDescription }
            busy = false
        }
    }
    func run(_ request: [String: Any]) {
        guard !busy else { return }
        if isOnline {
            if request["type"] as? String == "view" { reconnectOnline() }
            else if request["type"] as? String == "next_round" { onlineAction { try await $0.nextRound() } }
            else { error = "This online action is not available yet." }
            return
        }
        busy = true; error = nil; saved = false
        Task {
            do {
                let next = try await engine.send(request)
                update(next); inMenu = false; saved = true; clearSelection()
                try await pumpBots()
            } catch {
                self.error = error.localizedDescription; playSounds(["invalidcard"])
                if let current = try? await engine.send(["type": "view"], persist: false) { view = current }
            }
            busy = false
        }
    }
    private func pumpBots() async throws {
        var steps = 0
        while view?.isBotTurn == true {
            guard steps < 2000 else { throw NavalError(message: "Bot play paused. Save your game and report this position.") }
            try await Task.sleep(nanoseconds: 450_000_000)
            update(try await engine.send(["type": "bot_step"]))
            saved = true; steps += 1
        }
    }
    func update(_ next: GameView) {
        let previousCount = view?.gameState.events.count ?? 0
        let sameRound = view?.gameState.roundNumber == next.gameState.roundNumber
        let events = Array(next.gameState.events.dropFirst(sameRound ? previousCount : 0))
        if sameRound, let previous = view?.gameState {
            for player in next.gameState.players {
                for ship in player.ships {
                    guard let old = previous.players.first(where: { $0.id == player.id })?.ships.first(where: { $0.id == ship.id }), !old.sunk else { continue }
                    if ship.sunk || ship.remaining < old.remaining {
                        let attachment = ship.attachments.last(where: { item in !old.attachments.contains(where: { $0.card.id == item.card.id }) })?.card
                        let effect = CombatEffect(sinking: ship.sunk, salvo: attachment)
                        combatEffects[ship.id] = effect
                        Task { [weak self] in
                            try? await Task.sleep(nanoseconds: 1_800_000_000)
                            if self?.combatEffects[ship.id]?.id == effect.id { self?.combatEffects[ship.id] = nil }
                        }
                    }
                }
            }
        } else { combatEffects = [:] }
        let completedRound = view != nil && view?.gameState.phase != "round_complete" && next.gameState.phase == "round_complete"
        let hadPreviousView = view != nil
        view = next
        guard hadPreviousView, sound else { return }
        playSounds(GameAudio.cues(events: events, completedRound: completedRound))
    }
    func playSounds(_ filenames: [String]) {
        guard sound else { return }
        let generation = audioGeneration
        Task { [weak self] in
            for (index, filename) in filenames.enumerated() {
                if index > 0 { try? await Task.sleep(nanoseconds: 180_000_000) }
                guard let self, self.sound, self.audioGeneration == generation else { return }
                guard let url = Bundle.main.resourceURL?.appendingPathComponent("Audio/\(filename).wav"), let audio = NSSound(contentsOf: url, byReference: false) else {
                    self.error = "Could not load sound: \(filename)"; continue
                }
                self.playingSounds.removeAll { !$0.isPlaying }
                self.playingSounds.append(audio)
                if !audio.play() { self.error = "Could not play sound: \(filename)" }
            }
        }
    }
    func clearSelection() { selectedCard = nil; showAirStrikes = false; strikes = [:]; destroyerTargets = [] }
    func choose(_ card: PlayCard) {
        showAirStrikes = false; strikes = [:]
        if view?.legalCommands.contains("resolve_destroyer_squadron_roll") == true || view?.legalCommands.contains("discard_destroyer_squadron") == true { selectedCard = nil; return }
        selectedCard = selectedCard == card.id ? nil : card.id
        if selectedCard != nil && actions.isEmpty { playSounds(["invalidcard"]) }
    }
    func perform(_ option: ActionOption) {
        if let strike = option.command.strikes?.first { strikes[strike.carrierShipId] = strike; return }
        send(option.command)
    }
    func send(_ command: Command) {
        if isOnline { onlineAction { try await $0.command(command) } }
        else { run(["type": "command", "command": command.dictionary]) }
    }
    func simple(_ type: String) { guard let view else { return }; send(Command(type: type, actorId: view.humanPlayerId)) }
    func launch() {
        guard let view, !strikes.isEmpty else { return }
        send(Command(type: "use_carrier_strike", actorId: view.humanPlayerId, strikes: strikes.keys.sorted().compactMap { strikes[$0] }))
    }
    func confirmDestroyer() {
        guard let view, let pending = view.gameState.pendingDestroyerAttack, destroyerTargets.count == pending.shipsToSink else { return }
        send(Command(type: "select_destroyer_squadron_targets", actorId: view.humanPlayerId, destroyerId: pending.destroyerId, targetShipIds: destroyerTargets.sorted()))
    }
    func target(_ ship: Ship, player: Player) {
        guard let view, canInteract else { return }
        if let pending = view.gameState.pendingDestroyerAttack, player.id == pending.targetPlayerId, !ship.sunk {
            if destroyerTargets.contains(ship.id) { destroyerTargets.remove(ship.id) }
            else if destroyerTargets.count < pending.shipsToSink { destroyerTargets.insert(ship.id) }
            return
        }
        if !ship.sunk, let option = fleetAction(player) { perform(option); return }
        let options = actions.filter { $0.command.targetShipId == ship.id && ($0.command.targetPlayerId == nil || $0.command.targetPlayerId == player.id) }
        if options.count == 1 { perform(options[0]) } else { inspectedShip = ship }
    }
    func isTarget(_ ship: Ship, player: Player) -> Bool {
        guard canInteract else { return false }
        if let pending = view?.gameState.pendingDestroyerAttack { return player.id == pending.targetPlayerId && !ship.sunk }
        if !ship.sunk && fleetAction(player) != nil { return true }
        return actions.contains { $0.command.targetShipId == ship.id && ($0.command.targetPlayerId == nil || $0.command.targetPlayerId == player.id) }
    }
    func fleetTargetLabel(_ player: Player) -> String {
        if actions.contains(where: { $0.command.type == "resolve_destroyer_squadron_roll" }) { return "Attack \(player.name) with Destroyers" }
        if let card = view?.human.hand.first(where: { $0.id == selectedCard }) { return "Play \(card.title) on \(player.name)" }
        return "Attack \(player.name)'s fleet"
    }
    func fleetAction(_ player: Player) -> ActionOption? {
        guard canInteract else { return nil }
        let matches = actions.filter { $0.command.targetPlayerId == player.id && $0.command.targetShipId == nil && $0.command.strikes == nil }
        // Multiple ready squadrons can legally attack the same fleet; resolve one at a time.
        if let ready = matches.first(where: { $0.command.type == "resolve_destroyer_squadron_roll" }) { return ready }
        return matches.count == 1 ? matches[0] : nil
    }
    func returnToMenu() {
        guard !busy else { return }
        pollTask?.cancel(); pollTask = nil
        audioGeneration = UUID(); playingSounds.forEach { $0.stop() }; playingSounds = []
        inMenu = true
    }
    private func detachOnline() {
        sessionGeneration = UUID(); pollTask?.cancel(); pollTask = nil
        online = nil; onlineSnapshot = nil; onlineConnected = false
        view = nil; combatEffects = [:]; audioGeneration = UUID()
        clearSelection()
    }
    func connectOnline(server: String, name: String, players: Int, mode: String, code: String? = nil) {
        guard !busy else { return }
        guard let url = URL(string: server.trimmingCharacters(in: .whitespacesAndNewlines)) else { error = "Enter a valid server address."; return }
        detachOnline(); busy = true; error = nil
        Task {
            do {
                let connection = try OnlineSession(server: url); online = connection
                let snapshot: OnlineSnapshot
                if let code { snapshot = try await connection.join(code: code, name: name) }
                else { snapshot = try await connection.create(name: name, playerCount: players, mode: mode) }
                if let credential = await connection.credentials() { try identityStore.save(credential); hasSavedOnline = true }
                acceptOnline(snapshot); inMenu = false
            } catch {
                // A lobby can have been created even if its following snapshot failed.
                if let credential = await online?.credentials() {
                    do { try identityStore.save(credential); hasSavedOnline = true } catch { }
                }
                self.error = error.localizedDescription; onlineConnected = false
            }
            busy = false
            if onlineConnected { startPolling() }
        }
    }
    func resumeOnline() {
        guard !busy else { return }
        detachOnline(); busy = true; error = nil
        Task {
            do {
                let credential = try identityStore.load()
                let connection = try OnlineSession(server: credential.server)
                online = connection
                acceptOnline(try await connection.resume(credential)); inMenu = false
            } catch { self.error = error.localizedDescription; onlineConnected = false }
            busy = false
            if onlineConnected { startPolling() }
        }
    }
    func reconnectOnline() {
        guard !busy, let online else { return }
        busy = true; error = nil; pollTask?.cancel()
        Task {
            do { acceptOnline(try await online.refresh()); inMenu = false }
            catch { self.error = error.localizedDescription; onlineConnected = false }
            busy = false
            if onlineConnected { startPolling() }
        }
    }
    func setOnlineReady(_ ready: Bool) { onlineAction { try await $0.ready(ready) } }
    func startOnlineMatch() { onlineAction { try await $0.start() } }
    func forgetOnline() {
        guard !busy else { return }
        do { try identityStore.clear(); hasSavedOnline = false; detachOnline(); view = nil; error = nil; inMenu = true }
        catch { self.error = error.localizedDescription }
    }
    private func onlineAction(_ action: @escaping (OnlineSession) async throws -> OnlineSnapshot) {
        guard !busy, onlineConnected, let online else { return }
        busy = true; error = nil; pollTask?.cancel(); pollTask = nil
        Task {
            do { acceptOnline(try await action(online)); clearSelection() }
            catch { self.error = error.localizedDescription; onlineConnected = false; playSounds(["invalidcard"]) }
            busy = false
            if onlineConnected { startPolling() }
        }
    }
    private func acceptOnline(_ snapshot: OnlineSnapshot) {
        let previous = view?.gameState
        onlineSnapshot = snapshot; onlineConnected = true; saved = true
        if let next = snapshot.view {
            if previous?.turnNumber != next.gameState.turnNumber || previous?.roundNumber != next.gameState.roundNumber || previous?.events.count != next.gameState.events.count { clearSelection() }
            update(next)
        } else { view = nil }
    }
    private func startPolling() {
        pollTask?.cancel()
        let generation = sessionGeneration
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 1_000_000_000) } catch { return }
                guard let self, self.sessionGeneration == generation, !self.inMenu, let connection = self.online else { return }
                if self.busy { continue }
                do {
                    let snapshot = try await connection.refresh()
                    guard !Task.isCancelled, self.sessionGeneration == generation else { return }
                    self.acceptOnline(snapshot)
                } catch {
                    guard !Task.isCancelled, self.sessionGeneration == generation else { return }
                    self.onlineConnected = false; self.error = error.localizedDescription
                    return
                }
            }
        }
    }

}
