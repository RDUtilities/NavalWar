import SwiftUI
import SpriteKit
import AppKit

@main struct NavalWarApp: App {
    @StateObject private var game = GameModel()
    var body: some Scene {
        WindowGroup("Naval War") {
            ContentView().environmentObject(game)
                .frame(minWidth: 1080, minHeight: 760)
                .preferredColorScheme(.dark)
        }
        .defaultSize(width: 1340, height: 900)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Return to Menu") { game.returnToMenu() }.disabled(game.busy)
            }
            CommandGroup(after: .saveItem) {
                Button("Save Game") { game.run(["type": "view"]) }
                    .keyboardShortcut("s").disabled(game.view == nil || game.busy || game.isOnline)
            }
        }
    }
}
private let gold = Color(red: 0.86, green: 0.70, blue: 0.40)
private let navy = Color(red: 0.035, green: 0.065, blue: 0.09)

struct ContentView: View {
    @EnvironmentObject var game: GameModel
    @State private var scene = TableScene(size: CGSize(width: 1340, height: 900))
    var body: some View {
        ZStack {
            SpriteView(scene: scene).ignoresSafeArea().allowsHitTesting(false).onAppear { scene.scaleMode = .resizeFill }
            if game.inMenu { WelcomeView() } else if game.isOnline && game.view == nil { OnlineLobbyView() } else { WarTableView() }
        }
        .tint(gold)
        .sheet(item: $game.inspectedCard) { card in
            VStack(spacing: 16) {
                Text(card.title).font(.title2.bold())
                CardArt(key: Artwork.shared.key(card), detailed: true).frame(width: 720, height: 480)
                Button("Close") { game.inspectedCard = nil }.keyboardShortcut(.cancelAction)
            }.padding(24)
        }
        .sheet(item: $game.inspectedShip) { ship in
            VStack(spacing: 16) {
                Text(ship.card.name).font(.title2.bold())
                CardArt(key: ship.card.id, detailed: true).frame(width: 720, height: 480)
                Text("\(ship.card.faction) · \(ship.sunk ? "Sunk" : "\(ship.remaining) of \(ship.card.hitNumber) hit points remaining")")
                Button("Close") { game.inspectedShip = nil }.keyboardShortcut(.cancelAction)
            }.padding(24)
        }
    }
}
struct WelcomeView: View {
    @EnvironmentObject var game: GameModel
    @State private var name = "Admiral"
    @State private var players = 2
    @State private var mode = "skirmish"
    @State private var confirmNew = false
    @State private var onlineTab = false
    var body: some View {
        HStack(spacing: 70) {
            VStack(alignment: .leading, spacing: 22) {
                Text("THE ADMIRAL'S TABLE").font(.caption.weight(.semibold)).tracking(5).foregroundStyle(gold)
                CardArt(key: "logo").frame(width: 420, height: 235)
                Text("Command your fleet.\nOutplay your rivals.").font(.system(size: 36, weight: .semibold, design: .serif))
                Text("The classic naval card game, at home on your Mac.")
                    .foregroundStyle(.secondary)
                Label("Offline play · All artwork included", systemImage: "checkmark.seal").foregroundStyle(gold)
            }
            VStack(alignment: .leading, spacing: 22) {
                Text("Set sail").font(.largeTitle.weight(.semibold))
                Picker("Play mode", selection: $onlineTab) { Text("Solo").tag(false); Text("Online").tag(true) }.pickerStyle(.segmented).disabled(game.busy)
                if onlineTab { OnlineSetupView() } else {
                Text("SOLO COMMAND").font(.caption).tracking(3).foregroundStyle(gold)
                TextField("Your name", text: $name).textFieldStyle(.roundedBorder)
                Picker("Fleet commanders", selection: $players) {
                    Text("You + 1 bot").tag(2); Text("You + 2 bots").tag(3); Text("You + 3 bots").tag(4)
                }
                Picker("Game mode", selection: $mode) {
                    Text("Skirmish").tag("skirmish"); Text("Campaign").tag("campaign")
                }.pickerStyle(.segmented)
                Text(mode == "skirmish" ? "One decisive battle. Most captured ships wins when the deck runs out." : "Multiple battles. First to 100 captured hit points wins.")
                    .font(.callout).foregroundStyle(.secondary).frame(height: 48, alignment: .topLeading)
                Button {
                    if game.canResume { confirmNew = true } else { game.start(name: name, players: players, mode: mode) }
                } label: { Label("Start a new game", systemImage: "flag.fill").frame(maxWidth: .infinity).padding(9) }
                .buttonStyle(.borderedProminent).disabled(game.busy)
                if game.canResume {
                    Button { game.resume() } label: { Label("Resume saved game", systemImage: "arrow.clockwise").frame(maxWidth: .infinity).padding(7) }
                    .disabled(game.busy)
                }
                }
                if game.busy { ProgressView("Preparing your fleet…") }
                if let error = game.error { Text(error).foregroundStyle(.orange).font(.callout).textSelection(.enabled) }
                Divider()
                Text("Your game saves automatically after every action.").font(.caption).foregroundStyle(.secondary)
            }
            .padding(30).frame(width: 360).background(navy.opacity(0.94), in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(gold.opacity(0.25)))
        }.padding(40)
        .confirmationDialog("Starting a new game replaces the current autosave.", isPresented: $confirmNew) {
            Button("Start New Game", role: .destructive) { game.start(name: name, players: players, mode: mode) }
            Button("Cancel", role: .cancel) {}
        }
    }
}
struct WarTableView: View {
    @EnvironmentObject var game: GameModel
    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().overlay(gold.opacity(0.3))
            HStack(alignment: .top, spacing: 0) {
                CommandPanel().frame(width: 270)
                Divider()
                if let view = game.view {
                    VStack(spacing: 8) {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(view.gameState.players.filter { $0.id != view.humanPlayerId }) { player in FleetView(player: player) }
                            }.padding(16)
                        }
                        battleZone(view).padding(.horizontal, 16)
                        FleetView(player: view.human).padding(.horizontal, 16)
                        hand(view)
                    }
                }
            }
        }
    }
    private var header: some View {
        HStack(spacing: 24) {
            Text("NAVAL WAR").font(.system(size: 22, weight: .bold, design: .serif)).tracking(3).foregroundStyle(gold)
            Text(game.view?.gameState.options.matchMode.capitalized ?? "Skirmish").foregroundStyle(.secondary)
            Spacer()
            if let state = game.view?.gameState { Text("ROUND \(state.roundNumber)  /  TURN \(state.turnNumber)").font(.caption.monospaced()).tracking(1) }
            Toggle(isOn: $game.sound) { Image(systemName: game.sound ? "speaker.wave.2" : "speaker.slash") }.toggleStyle(.button).help("Sound effects")
            Label(game.isOnline ? (game.onlineConnected ? "Online" : "Disconnected") : (game.saved ? "Saved" : "Saving…"), systemImage: game.isOnline ? "network" : "checkmark.circle").font(.caption).foregroundStyle(.secondary)
            if game.isOnline && !game.onlineConnected { Button("Reconnect") { game.reconnectOnline() }.disabled(game.busy) }
            Button("Menu") { game.returnToMenu() }.disabled(game.busy)
        }.padding(.horizontal, 22).padding(.vertical, 16).background(navy.opacity(0.9))
    }
    private func battleZone(_ view: GameView) -> some View {
        HStack(spacing: 18) {
            Label("BATTLE ZONE", systemImage: "scope").font(.caption.weight(.semibold)).tracking(2).foregroundStyle(gold)
            Spacer()
            Text("\(view.gameState.playDeckCount) play cards · \(view.gameState.shipDeckCount) reserve ships").font(.caption).foregroundStyle(.secondary)
            ForEach(view.gameState.destroyerSquadrons) { squadron in
                Label("Destroyers · \(4 - squadron.hitsTaken) HP", systemImage: "shield.lefthalf.filled").font(.caption)
            }
            if let discarded = view.gameState.discardPile.last {
                Button { game.inspectedCard = discarded } label: {
                    VStack(spacing: 2) { CardArt(key: Artwork.shared.key(discarded)).frame(width: 74, height: 49); Text("Discard").font(.system(size: 9)) }
                }.buttonStyle(.plain)
            }
        }.padding(12).frame(minHeight: 60).background(.black.opacity(0.18), in: RoundedRectangle(cornerRadius: 10))
    }
    private func hand(_ view: GameView) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack { Text("YOUR HAND").font(.caption.weight(.semibold)).tracking(2).foregroundStyle(gold); Text("\(view.human.handCount) cards").font(.caption).foregroundStyle(.secondary); Spacer(); Text("Select a card · Right-click to inspect").font(.caption).foregroundStyle(.secondary) }
            ScrollView(.horizontal) {
                HStack(spacing: 10) {
                    ForEach(view.human.hand) { card in
                        Button { game.choose(card) } label: {
                            VStack(spacing: 5) {
                                CardArt(key: Artwork.shared.key(card)).frame(width: 150, height: 100)
                                    .overlay(RoundedRectangle(cornerRadius: 7).stroke(game.selectedCard == card.id ? gold : .clear, lineWidth: 3))
                                Text(card.title).font(.caption).lineLimit(1)
                            }.padding(4).background(game.selectedCard == card.id ? gold.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: 10))
                        }.buttonStyle(.plain).disabled(!game.canInteract || view.isBotTurn || view.gameState.phase != "normal")
                        .accessibilityLabel("Select \(card.title)")
                        .contextMenu { Button("Inspect card") { game.inspectedCard = card } }
                    }
                }.padding(.vertical, 4)
            }.frame(height: 146)
        }.padding(.horizontal, 18).padding(.top, 10).padding(.bottom, 12).background(navy.opacity(0.95))
    }
}
struct FleetView: View {
    @EnvironmentObject var game: GameModel
    let player: Player
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle().fill(game.view?.gameState.currentPlayerId == player.id ? gold : .gray.opacity(0.3)).frame(width: 7, height: 7)
                Text(player.name.uppercased()).font(.caption.weight(.bold)).tracking(2)
                if player.id == game.view?.humanPlayerId { Text("YOU").font(.system(size: 9, weight: .bold)).padding(4).background(gold.opacity(0.2), in: Capsule()) }
                Spacer()
                Text("\(player.afloat) afloat · \(player.victoryPile.count) captured").font(.caption).foregroundStyle(.secondary)
                if let score = game.view?.gameState.campaign?.totalScores[player.id] { Text("\(score) points").font(.caption).foregroundStyle(gold) }
                ForEach(Array(player.fleetEffects.enumerated()), id: \.offset) { _, effect in Text(effect.kind.uppercased()).font(.system(size: 9, weight: .bold)).foregroundStyle(.orange) }
            }
            ScrollView(.horizontal) {
                HStack(spacing: 9) {
                    ForEach(player.ships.sorted { !$0.card.isCarrier && $1.card.isCarrier }) { ship in
                        Button { game.target(ship, player: player) } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                ZStack {
                                    CardArt(key: ship.sunk ? "shipBack" : ship.card.id).frame(width: 146, height: 98).opacity(ship.sunk ? 0.38 : 1)
                                    if ship.sunk { Text("SUNK").font(.headline).tracking(3).foregroundStyle(.white) }
                                }
                                .overlay(RoundedRectangle(cornerRadius: 7).stroke(game.destroyerTargets.contains(ship.id) ? Color.green : (game.isTarget(ship, player: player) ? gold : Color.white.opacity(0.1)), lineWidth: game.isTarget(ship, player: player) ? 3 : 1))
                                HStack { Text(ship.card.name).font(.caption.weight(.semibold)).lineLimit(1); Spacer(); Text(ship.sunk ? "—" : "\(ship.remaining)/\(ship.card.hitNumber)").font(.caption.monospacedDigit()).foregroundStyle(ship.remaining < ship.card.hitNumber ? .orange : .secondary) }
                                if ship.card.isCarrier { Text("CARRIER · REAR LINE").font(.system(size: 8)).tracking(1).foregroundStyle(gold) }
                            }.frame(width: 146).padding(3)
                        }.buttonStyle(.plain)
                        .accessibilityLabel("\(player.name), \(ship.card.name), \(ship.sunk ? "sunk" : "\(ship.remaining) hit points")")
                        .contextMenu { Button("Inspect ship") { game.inspectedShip = ship } }
                    }
                }.padding(4)
            }
        }.padding(12).background(navy.opacity(player.id == game.view?.humanPlayerId ? 0.8 : 0.5), in: RoundedRectangle(cornerRadius: 12))
    }
}
struct CommandPanel: View {
    @EnvironmentObject var game: GameModel
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("COMMAND").font(.caption).tracking(3).foregroundStyle(gold)
                Text(game.instruction).font(.system(size: 20, weight: .medium, design: .serif)).fixedSize(horizontal: false, vertical: true)
                if let error = game.error { Text(error).foregroundStyle(.orange).font(.callout).textSelection(.enabled) }
                if game.busy { ProgressView().controlSize(.small) }
                if game.isOnline && !game.onlineConnected { Button("Reconnect to match") { game.reconnectOnline() }.disabled(game.busy) }
                if let view = game.view {
                    if view.gameState.phase == "round_complete" { results(view) }
                    else {
                        normalActions(view)
                        if let pending = view.gameState.pendingDestroyerAttack, pending.ownerId == view.humanPlayerId {
                            Text("\(game.destroyerTargets.count) of \(pending.shipsToSink) ships selected").font(.callout)
                            Button("Confirm targets") { game.confirmDestroyer() }.disabled(!game.canInteract || game.destroyerTargets.count != pending.shipsToSink)
                        }
                        ForEach(game.actions) { option in
                            Button { game.perform(option) } label: {
                                HStack {
                                    Text(option.label).multilineTextAlignment(.leading)
                                    Spacer(minLength: 0)
                                    if let strike = option.command.strikes?.first, game.strikes[strike.carrierShipId] == strike { Image(systemName: "checkmark.circle.fill") }
                                }.frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 4)
                            }.disabled(!game.canInteract)
                        }
                        if game.showAirStrikes {
                            Button("Launch \(game.strikes.count) air strike(s)") { game.launch() }.buttonStyle(.borderedProminent).disabled(!game.canInteract || game.strikes.isEmpty)
                        }
                        if let card = view.human.hand.first(where: { $0.id == game.selectedCard }) {
                            Button("Inspect \(card.title)") { game.inspectedCard = card }.font(.caption)
                            if game.actions.isEmpty { Text("This card cannot be played during this phase. Resolve the required action first.").font(.caption).foregroundStyle(.secondary) }
                        }
                        if game.selectedCard != nil || game.showAirStrikes { Button("Clear selection") { game.clearSelection() }.font(.caption) }
                    }
                    Divider()
                    Text("CAPTAIN'S LOG").font(.caption).tracking(2).foregroundStyle(gold)
                    ForEach(Array(view.gameState.events.suffix(7).reversed().enumerated()), id: \.offset) { _, event in
                        Text(event.detail).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }
                }
            }.padding(20)
        }.background(navy.opacity(0.88))
    }
    @ViewBuilder private func normalActions(_ view: GameView) -> some View {
        if view.legalCommands.contains("draw_card") {
            Button { game.simple("draw_card") } label: { Label("Draw a card", systemImage: "rectangle.stack.badge.plus").frame(maxWidth: .infinity) }.buttonStyle(.borderedProminent).disabled(!game.canInteract)
        }
        if view.actions.contains(where: { $0.command.type == "use_carrier_strike" }) {
            Button("Carrier air strikes") { game.selectedCard = nil; game.showAirStrikes.toggle() }.disabled(!game.canInteract)
        }
        if view.legalCommands.contains("end_turn") { Button("End turn") { game.simple("end_turn") }.buttonStyle(.borderedProminent).disabled(!game.canInteract) }
        if view.isBotTurn && !game.busy { Button("Continue bot turns") { game.run(["type": "view"]) } }
    }
    private func results(_ view: GameView) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "flag.checkered").font(.largeTitle).foregroundStyle(gold)
            ForEach(view.gameState.players) { player in
                Text("\(player.name): \(player.victoryPile.count) ships / \(player.victoryPile.reduce(0) { $0 + $1.hitNumber }) points").font(.callout)
            }
            if view.gameState.options.matchMode == "campaign" && view.gameState.matchWinnerIds.isEmpty {
                if !game.isOnline || game.onlineSnapshot?.isHost == true {
                    Button("Next round") { game.run(["type": "next_round"]) }.buttonStyle(.borderedProminent).disabled(game.busy || (game.isOnline && !game.onlineConnected))
                } else { Text("Waiting for the host to start the next round.").font(.caption) }
            } else { Button("Return to menu") { game.returnToMenu() }.buttonStyle(.borderedProminent) }
        }
    }
}
